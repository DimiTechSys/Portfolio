// POST /api/legal/erase
//
// Implémente le droit à l'effacement RGPD (art. 17). Anonymise le profil
// utilisateur (les colonnes identifiantes) tout en préservant les références
// historiques (tâches créées, audit log, etc.) qui restent sous la
// responsabilité de la pharmacie.
//
// L'« effacement » est donc une anonymisation contrôlée plutôt qu'une
// suppression intégrale. C'est conforme à la doctrine CNIL pour les SaaS B2B
// où des contraintes contractuelles ou de traçabilité légitime empêchent la
// suppression brute, dès lors que la personne ne peut plus être identifiée.
//
// Autorisation :
//   - User authentifié peut s'effacer lui-même (corps vide, ou `targetUserId`
//     = son propre id)
//   - Un `titulaire` peut effacer un membre de SA pharmacie en passant
//     `{ targetUserId: "<uuid>" }`
//   - Tout autre cas → 403
//
// Effets :
//   1. Anonymisation du profil : first_name/last_name → "Utilisateur supprimé"
//      / display_name idem / avatar_url → NULL
//   2. Auth Supabase : update de l'email vers un sentinel `erased+<uuid>@deleted.local`
//      (libère l'email original pour ré-inscription si désiré) + ban_duration
//      très long (1000 ans) pour révoquer définitivement l'accès
//   3. Toutes les sessions actives de l'utilisateur sont invalidées
//
// Body : { targetUserId?: string }
// Réponse : 200 { success: true, erased_user_id } | 4xx { error }

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { legalRateLimit } from '@/lib/rate-limit/upstash'

export const runtime = 'nodejs'

const ANONYMOUS_FIRST_NAME = 'Utilisateur'
const ANONYMOUS_LAST_NAME = 'supprimé'
const ANONYMOUS_DISPLAY_NAME = 'Utilisateur supprimé'
// Ban duration en secondes, ~1000 ans (effectivement permanent)
const BAN_DURATION_SECONDS = 1000 * 365 * 24 * 60 * 60

export async function POST(request: Request) {
  // 1. Auth
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  // L4 : limite l'exercice du droit à l'effacement (5/h par utilisateur).
  const { success } = await legalRateLimit.limit(user.id)
  if (!success) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 })
  }

  // 2. Parse body
  let body: { targetUserId?: string } = {}
  try {
    body = await request.json()
  } catch {
    // Pas de body = self-erase
  }
  const targetUserId = body.targetUserId ?? user.id
  const isSelfErase = targetUserId === user.id

  // 3. Autorisation pour effacer quelqu'un d'autre (titulaire only, même pharma)
  if (!isSelfErase) {
    const { data: callerProfile } = await supabase
      .from('profiles')
      .select('role, pharmacy_id')
      .eq('id', user.id)
      .maybeSingle()

    if (callerProfile?.role !== 'titulaire' || !callerProfile.pharmacy_id) {
      return NextResponse.json({ error: 'titulaire_only' }, { status: 403 })
    }

    const { data: targetProfile } = await supabase
      .from('profiles')
      .select('pharmacy_id, role')
      .eq('id', targetUserId)
      .maybeSingle()

    if (!targetProfile) {
      return NextResponse.json({ error: 'target_not_found' }, { status: 404 })
    }

    if (targetProfile.pharmacy_id !== callerProfile.pharmacy_id) {
      return NextResponse.json({ error: 'different_pharmacy' }, { status: 403 })
    }

    // Un titulaire ne peut pas effacer un autre titulaire (la pharmacie doit
    // toujours avoir un responsable). Pour transférer la responsabilité,
    // c'est un flow séparé (out of scope ici).
    if (targetProfile.role === 'titulaire' && targetProfile.pharmacy_id) {
      return NextResponse.json(
        { error: 'cannot_erase_titulaire' },
        { status: 409 },
      )
    }
  }

  // 4. Service client pour bypass RLS (anonymize cross-user) + admin auth
  const admin = createServiceClient()
  if (!admin) {
    return NextResponse.json({ error: 'service_unavailable' }, { status: 503 })
  }

  // 5. Anonymise les colonnes identifiantes du profil. On garde role,
  //    pharmacy_id, created_at intacts (traçabilité métier : les rows liées
  //    tasks/orders/etc. continuent de pointer vers ce profile.id).
  const { error: profileErr } = await admin
    .from('profiles')
    .update({
      first_name: ANONYMOUS_FIRST_NAME,
      last_name: ANONYMOUS_LAST_NAME,
      display_name: ANONYMOUS_DISPLAY_NAME,
      avatar_url: null,
    })
    .eq('id', targetUserId)

  if (profileErr) {
    console.error('[legal/erase] profile update failed', {
      target: targetUserId,
      message: profileErr.message,
    })
    return NextResponse.json({ error: 'erase_failed' }, { status: 500 })
  }

  // 6. Côté Auth Supabase : on neutralise l'email + ban permanent. L'email
  //    original devient disponible pour ré-inscription. L'ancien compte ne
  //    peut plus se connecter.
  const sentinelEmail = `erased+${targetUserId}@deleted.local`
  const { error: authErr } = await admin.auth.admin.updateUserById(targetUserId, {
    email: sentinelEmail,
    email_confirm: true,
    ban_duration: `${BAN_DURATION_SECONDS}s`,
    user_metadata: {},
    app_metadata: {},
  })

  if (authErr) {
    // Le profil est déjà anonymisé. On log mais on ne rollback pas (on
    // préfère un état partiellement effacé plutôt que de remettre des
    // données identifiantes en place).
    console.error('[legal/erase] auth update failed', {
      target: targetUserId,
      message: authErr.message,
    })
    return NextResponse.json(
      { error: 'auth_update_failed', profile_anonymized: true },
      { status: 500 },
    )
  }

  // 7. Audit : on log l'opération dans le journal d'audit (P2-16) côté
  //    appelant. La row audit_log conserve un pointeur vers l'ancien user_id
  //    (qui pointe maintenant vers un profil anonymisé), c'est OK pour la
  //    traçabilité métier.
  if (!isSelfErase) {
    // Service client pour bypass RLS (le caller est titulaire, son JWT pourrait
    // suffire mais on force pour cohérence avec les autres écritures admin).
    await admin.from('audit_log').insert({
      user_id: user.id,
      pharmacy_id: (
        await admin
          .from('profiles')
          .select('pharmacy_id')
          .eq('id', user.id)
          .maybeSingle()
      ).data?.pharmacy_id,
      action: 'erase_member',
      target_type: 'profile',
      target_id: targetUserId,
      metadata: { reason: 'rgpd_art_17' },
    })
  }

  return NextResponse.json({
    success: true,
    erased_user_id: targetUserId,
    self_erase: isSelfErase,
  })
}
