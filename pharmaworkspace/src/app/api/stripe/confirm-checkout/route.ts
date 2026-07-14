// POST /api/stripe/confirm-checkout
//
// Fallback quand le webhook `checkout.session.completed` est lent ou absent
// (staging mal configuré, latence réseau). Récupère la session Checkout côté
// Stripe et synchronise la pharmacie (même logique que le webhook).

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getStripe } from '@/lib/stripe/server'
import { applyCheckoutSessionToPharmacy } from '@/lib/stripe/apply-checkout-session'

export const runtime = 'nodejs'

const BodySchema = z.object({
  session_id: z.string().min(1),
})

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('pharmacy_id, role')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile?.pharmacy_id) {
    return NextResponse.json({ error: 'no_pharmacy' }, { status: 403 })
  }
  if (profile.role !== 'titulaire') {
    return NextResponse.json({ error: 'titulaire_only' }, { status: 403 })
  }

  let rawBody: unknown
  try {
    rawBody = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const parsed = BodySchema.safeParse(rawBody)
  if (!parsed.success) {
    return NextResponse.json({ error: 'validation_failed' }, { status: 422 })
  }

  const stripe = getStripe()
  if (!stripe) {
    return NextResponse.json({ error: 'stripe_not_configured' }, { status: 503 })
  }

  const admin = createServiceClient()
  if (!admin) {
    return NextResponse.json({ error: 'service_unavailable' }, { status: 503 })
  }

  let session
  try {
    session = await stripe.checkout.sessions.retrieve(parsed.data.session_id)
  } catch (error) {
    console.error('[stripe/confirm-checkout] retrieve failed', {
      message: error instanceof Error ? error.message : 'unknown',
    })
    return NextResponse.json({ error: 'stripe_error' }, { status: 502 })
  }

  const sessionPharmacyId = (session.metadata as Record<string, string> | null)?.pharmacy_id
  if (sessionPharmacyId && sessionPharmacyId !== profile.pharmacy_id) {
    return NextResponse.json({ error: 'pharmacy_mismatch' }, { status: 403 })
  }

  const result = await applyCheckoutSessionToPharmacy(admin, stripe, session)
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  return NextResponse.json({
    subscription_status: result.status,
    trial_end: result.trialEnd,
  })
}
