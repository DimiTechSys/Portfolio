import { NextResponse } from 'next/server'
import { createClientForRouteHandler } from '@/lib/supabase/route-handler-client'
import { createServiceClient } from '@/lib/supabase/service'
import { applyInvitationToProfile } from '@/lib/invite/apply-invitation-to-profile'
import { getPostHogClient } from '@/lib/posthog-server'
import { apiError } from '@/lib/api/error-response'

type Body = {
  /** UUID invitation ; optionnel si les métadonnées JWT ne contiennent pas `invitation_token` (ex. après setSession). */
  token?: string
  first_name?: string
  last_name?: string
}

/**
 * Après OTP / magic link : rattache le profil à l’officine et marque l’invitation acceptée.
 * Utilise la clé service pour `invitations` (RLS réservé au titulaire).
 *
 * Si `token` est absent ou ne correspond à aucune ligne, on cherche une invitation **en attente**
 * pour l’e-mail de la session (même flux que les métadonnées JWT parfois vides après lien implicite).
 *
 * H4 : la validation + l'écriture role/pharmacy_id sont déléguées à
 * applyInvitationToProfile() (role dérivé de la DB, jamais des user_metadata).
 */
export async function POST(request: Request) {
  let body: Body
  try {
    body = (await request.json()) as Body
  } catch {
    return NextResponse.json({ error: 'Corps invalide.' }, { status: 400 })
  }

  const token = typeof body.token === 'string' ? body.token.trim() : ''

  const supabase = await createClientForRouteHandler(request)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user?.email) {
    return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
  }

  const fromBodyFn = typeof body.first_name === 'string' ? body.first_name.trim() : ''
  const fromBodyLn = typeof body.last_name === 'string' ? body.last_name.trim() : ''
  const fromMetaFn =
    typeof user.user_metadata?.first_name === 'string'
      ? user.user_metadata.first_name.trim()
      : ''
  const fromMetaLn =
    typeof user.user_metadata?.last_name === 'string'
      ? user.user_metadata.last_name.trim()
      : ''
  const fn = fromBodyFn || fromMetaFn
  const ln = fromBodyLn || fromMetaLn
  const hasNames = Boolean(fn && ln)

  const admin = createServiceClient()
  if (!admin) {
    return NextResponse.json(
      {
        error:
          'Configuration serveur : ajoutez SUPABASE_SERVICE_ROLE_KEY pour finaliser l’invitation.',
      },
      { status: 503 }
    )
  }

  const result = await applyInvitationToProfile({
    admin,
    user: { id: user.id, email: user.email },
    token,
    names: { first_name: fn, last_name: ln },
    allowEmailFallback: true,
  })

  if (!result.ok) {
    // L9 : les états 4xx d'invitation (déjà utilisée, expirée, mauvais compte)
    // portent un libellé FR fixe et sûr → renvoyés tels quels. Les 5xx peuvent
    // contenir un message Postgres brut (échec profil/insert) → on masque.
    if (result.status >= 500) {
      return apiError(
        '[invite/complete]',
        result.error,
        'Impossible de finaliser l’invitation.',
        result.status
      )
    }
    return NextResponse.json({ error: result.error }, { status: result.status })
  }

  if ('skipped' in result) {
    return NextResponse.json({ ok: true, skipped: true as const })
  }

  if (hasNames) {
    await supabase.auth.updateUser({
      data: { profile_complete: true },
    })
  }

  const posthog = getPostHogClient()
  posthog.identify({
    distinctId: user.id,
    properties: { email: user.email, role: result.role },
  })
  posthog.capture({
    distinctId: user.id,
    event: 'invitation_accepted',
    properties: {
      pharmacy_id: result.pharmacy_id,
      role: result.role,
    },
  })

  return NextResponse.json({ ok: true })
}
