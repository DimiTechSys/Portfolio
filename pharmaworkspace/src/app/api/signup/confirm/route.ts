import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getPostHogClient } from '@/lib/posthog-server'

export const runtime = 'nodejs'

// Finalise l'acquisition après confirmation OTP : marque
// `pharmacy_acquisition.confirmed_at`. Idempotent, appelé depuis
// /auth/callback côté client après que la session Supabase soit établie.
// Erreurs silencieuses (log only) : ne pas casser le callback si aucune
// acquisition en attente n'est trouvée pour l'e-mail de la session.
export async function POST() {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json(
      { ok: false, skipped: true, reason: 'no_user' },
      { status: 401 }
    )
  }

  // R3-3 : on ne fait plus confiance à user_metadata.acquisition_id (modifiable
  // par le client). On re-dérive l'acquisition depuis l'e-mail de la session :
  // la dernière ligne non confirmée pour cet e-mail.
  if (!user.email) {
    return NextResponse.json(
      { ok: false, skipped: true, reason: 'no_email' },
      { status: 200 }
    )
  }

  const admin = createServiceClient()
  if (!admin) {
    console.error('[signup/confirm] service client unavailable')
    return NextResponse.json(
      { ok: false, skipped: true, reason: 'service_unavailable' },
      { status: 200 }
    )
  }

  const emailNormalized = user.email.trim().toLowerCase()
  const { data: existing, error: selectError } = await admin
    .from('pharmacy_acquisition')
    .select('id, confirmed_at, email, source')
    .eq('email', emailNormalized)
    .is('confirmed_at', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (selectError) {
    console.error('[signup/confirm] select error', {
      code: selectError.code,
      message: selectError.message,
    })
    return NextResponse.json(
      { ok: false, skipped: true, reason: 'select_error' },
      { status: 200 }
    )
  }

  if (!existing) {
    // Aucune acquisition en attente : déjà confirmée, ou pas un signup self-serve.
    return NextResponse.json(
      { ok: false, skipped: true, reason: 'not_found' },
      { status: 200 }
    )
  }

  // Idempotence : le filtre `.is('confirmed_at', null)` ci-dessus garantit que
  // les rejouages du callback retombent sur `not_found` plutôt que de re-confirmer.
  const acquisitionId = existing.id

  const nowIso = new Date().toISOString()
  const { error: updateError } = await admin
    .from('pharmacy_acquisition')
    .update({
      confirmed_at: nowIso,
      funnel_step: 'confirmed',
      last_seen_at: nowIso,
    })
    .eq('id', acquisitionId)

  if (updateError) {
    console.error('[signup/confirm] update error', {
      code: updateError.code,
      message: updateError.message,
    })
    return NextResponse.json(
      { ok: false, skipped: true, reason: 'update_error' },
      { status: 200 }
    )
  }

  // Tracking P4-14 : event funnel `signup_confirmed` côté serveur.
  // distinctId = user.id pour lier au profile PostHog (identifié au client
  // via identify() au prochain login/dashboard).
  try {
    const posthog = getPostHogClient()
    posthog.capture({
      distinctId: user.id,
      event: 'signup_confirmed',
      properties: {
        acquisition_id: acquisitionId,
        source: existing.source ?? null,
      },
    })
    await posthog.flush()
  } catch (err) {
    // Tracking ne doit jamais casser le callback.
    console.error('[signup/confirm] posthog capture failed', err)
  }

  return NextResponse.json({ ok: true }, { status: 200 })
}
