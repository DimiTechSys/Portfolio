import type { SupabaseClient } from '@supabase/supabase-js'
import { hashInvitationToken } from '@/lib/invite/hash-token'

/**
 * H4 : applique une invitation au profil de l'utilisateur authentifié.
 *
 * Centralise la logique dupliquée entre /api/auth/callback et /api/invite/complete.
 * L'invitation est TOUJOURS revalidée côté serveur (hash du token + e-mail == session
 * + non expirée + non acceptée) AVANT toute écriture, et le `role` / `pharmacy_id`
 * sont dérivés de la ligne `invitations` en base — jamais de `user_metadata`, qui est
 * modifiable par le client. Les écritures `profiles.role` / `profiles.pharmacy_id`
 * passent par le client service (un trigger bloque ces colonnes hors service_role).
 *
 * Résolution de l'invitation :
 *  1. par `token` (hash SHA-256) si fourni et toujours valide ;
 *  2. sinon, fallback sur la dernière invitation en attente pour l'e-mail de la session
 *     (cas des métadonnées JWT vides après lien implicite), si `allowEmailFallback`.
 */

type ServiceClient = SupabaseClient

type Names = { first_name?: string; last_name?: string }

type InvitationRow = {
  id: string
  email: string
  pharmacy_id: string
  role: string
  expires_at: string
  accepted_at: string | null
}

export type ApplyInvitationResult =
  | { ok: true; pharmacy_id: string; role: string }
  | { ok: true; skipped: true }
  | { ok: false; status: number; error: string }

export async function applyInvitationToProfile(params: {
  admin: ServiceClient
  user: { id: string; email: string }
  token?: string | null
  names?: Names
  /** Autorise la recherche d'invitation en attente par e-mail si le token ne matche pas. */
  allowEmailFallback?: boolean
}): Promise<ApplyInvitationResult> {
  const { admin, user, names, allowEmailFallback = false } = params
  const token = typeof params.token === 'string' ? params.token.trim() : ''
  const emailNormalized = user.email.trim().toLowerCase()
  const nowMs = Date.now()

  let invite: InvitationRow | null = null

  if (token) {
    const { data, error } = await admin
      .from('invitations')
      .select('id, email, pharmacy_id, role, expires_at, accepted_at')
      .eq('token_hash', hashInvitationToken(token))
      .maybeSingle()
    if (error) {
      // L9 : ne pas renvoyer le message Postgres brut (fingerprinting schéma).
      console.error('[applyInvitationToProfile] lookup by token_hash failed', {
        code: error.code,
        message: error.message,
      })
      return { ok: false, status: 500, error: 'Invitation introuvable.' }
    }
    // Token issu de métadonnées obsolètes (déjà acceptée / expirée) → on l'ignore
    // pour retomber sur la recherche par e-mail.
    if (data && !data.accepted_at && new Date(data.expires_at).getTime() > nowMs) {
      invite = data
    }
  }

  if (!invite && allowEmailFallback) {
    const { data: rows, error } = await admin
      .from('invitations')
      .select('id, email, pharmacy_id, role, expires_at, accepted_at')
      .eq('email', emailNormalized)
      .is('accepted_at', null)
      .gt('expires_at', new Date(nowMs).toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
    if (error) {
      console.error('[applyInvitationToProfile] email fallback lookup failed', {
        code: error.code,
        message: error.message,
      })
      return { ok: false, status: 500, error: 'Recherche d’invitation impossible.' }
    }
    invite = rows?.[0] ?? null
  }

  if (!invite) {
    return { ok: true, skipped: true }
  }

  // Revalidation systématique avant écriture (le token a pu être deviné / l'e-mail diverger).
  if (invite.accepted_at) {
    return { ok: false, status: 410, error: 'Invitation déjà utilisée.' }
  }
  if (new Date(invite.expires_at).getTime() <= nowMs) {
    return { ok: false, status: 410, error: 'Invitation expirée.' }
  }
  if (invite.email.trim().toLowerCase() !== emailNormalized) {
    return {
      ok: false,
      status: 403,
      error: 'Cette invitation ne correspond pas à votre compte.',
    }
  }

  const fn = typeof names?.first_name === 'string' ? names.first_name.trim() : ''
  const ln = typeof names?.last_name === 'string' ? names.last_name.trim() : ''
  const hasNames = Boolean(fn && ln)

  // role / pharmacy_id dérivés EXCLUSIVEMENT de la ligne invitation en base.
  const profilePatch: Record<string, string | null> = {
    pharmacy_id: invite.pharmacy_id,
    role: invite.role,
  }
  if (hasNames) {
    profilePatch.first_name = fn
    profilePatch.last_name = ln
    profilePatch.display_name = `${fn} ${ln}`
  }

  const { data: existingRow } = await admin
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .maybeSingle()

  if (existingRow) {
    const { error: profileError } = await admin
      .from('profiles')
      .update(profilePatch)
      .eq('id', user.id)
    if (profileError) {
      console.error('[applyInvitationToProfile] profile update failed', {
        code: profileError.code,
        message: profileError.message,
      })
      return {
        ok: false,
        status: 500,
        error: 'Mise à jour du profil impossible.',
      }
    }
  } else {
    const { error: insertError } = await admin
      .from('profiles')
      .insert({ id: user.id, ...profilePatch })
    if (insertError) {
      console.error('[applyInvitationToProfile] profile insert failed', {
        code: insertError.code,
        message: insertError.message,
      })
      return {
        ok: false,
        status: 500,
        error: 'Création du profil impossible.',
      }
    }
  }

  // Marque l'invitation acceptée (idempotent via .is('accepted_at', null)).
  const { error: acceptError } = await admin
    .from('invitations')
    .update({ accepted_at: new Date().toISOString() })
    .eq('id', invite.id)
    .is('accepted_at', null)
  if (acceptError) {
    console.error('[applyInvitationToProfile] mark accepted failed', {
      code: acceptError.code,
      message: acceptError.message,
    })
    return {
      ok: false,
      status: 500,
      error: 'Impossible de finaliser l’invitation.',
    }
  }

  return { ok: true, pharmacy_id: invite.pharmacy_id, role: invite.role }
}
