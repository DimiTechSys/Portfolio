import type { SupabaseClient, User } from '@supabase/supabase-js'
import { postInviteComplete } from '@/lib/invite/post-invite-complete'
import { skippedInviteCompleteIsError } from '@/lib/invite/skipped-invite-is-error'

export function getInvitationToken(user: User): string | undefined {
  return typeof user.user_metadata?.invitation_token === 'string'
    ? user.user_metadata.invitation_token
    : undefined
}

/**
 * Finalise l'invitation uniquement quand un token est présent (invité).
 * Les connexions titulaire/adjoint déjà rattachés évitent un aller-retour API inutile.
 */
export async function finalizeLoginInvite(
  supabase: SupabaseClient,
  user: User
): Promise<{ error?: string }> {
  const invitationToken = getInvitationToken(user)
  if (!invitationToken?.trim()) {
    return {}
  }

  const res = await postInviteComplete({ token: invitationToken })
  let payload: { error?: string; skipped?: boolean }
  try {
    payload = (await res.json()) as { error?: string; skipped?: boolean }
  } catch {
    return { error: 'Réponse serveur invalide.' }
  }

  if (!res.ok) {
    return { error: payload.error ?? "Impossible de finaliser l'invitation." }
  }

  if (payload.skipped) {
    const isInviteError = await skippedInviteCompleteIsError(
      supabase,
      user.id,
      invitationToken
    )
    if (isInviteError) {
      return {
        error:
          'Aucune invitation en attente pour ce compte. Contactez votre titulaire.',
      }
    }
  }

  return {}
}
