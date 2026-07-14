// POST /api/stripe/sync-subscription
//
// Resynchronise l'abonnement de la pharmacie en lisant l'état RÉEL côté Stripe
// via son `stripe_customer_id`, sans dépendre du webhook ni d'un session_id.
//
// Pourquoi : au retour de Stripe Checkout, la session Supabase peut être perdue
// (l'utilisateur repasse par /login) et le `session_id` de la Checkout Session
// disparaît de l'URL — le fallback confirm-checkout ne peut alors plus tourner.
// De même, le webhook peut être en retard ou mal configuré (staging). Cette route
// garantit que la page d'activation finit par refléter l'abonnement dès qu'il
// existe côté Stripe.
//
// Réponse : { subscription_status, trial_end } (200) ou { error } (4xx/5xx).

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getStripe } from '@/lib/stripe/server'
import { applySubscriptionToPharmacy } from '@/lib/stripe/apply-checkout-session'

export const runtime = 'nodejs'

export async function POST() {
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

  const stripe = getStripe()
  if (!stripe) {
    return NextResponse.json({ error: 'stripe_not_configured' }, { status: 503 })
  }

  const admin = createServiceClient()
  if (!admin) {
    return NextResponse.json({ error: 'service_unavailable' }, { status: 503 })
  }

  const { data: pharmacy } = await admin
    .from('pharmacies')
    .select('stripe_customer_id')
    .eq('id', profile.pharmacy_id)
    .maybeSingle()
  if (!pharmacy?.stripe_customer_id) {
    return NextResponse.json({ error: 'no_stripe_customer' }, { status: 404 })
  }

  // Dernière subscription du customer (triée par created desc). status:'all' pour
  // récupérer aussi un 'trialing' fraîchement créé.
  let subscriptions
  try {
    subscriptions = await stripe.subscriptions.list({
      customer: pharmacy.stripe_customer_id,
      status: 'all',
      limit: 1,
    })
  } catch (error) {
    console.error('[stripe/sync-subscription] subscriptions.list failed', {
      pharmacy_id: profile.pharmacy_id,
      message: error instanceof Error ? error.message : 'unknown',
    })
    return NextResponse.json({ error: 'stripe_error' }, { status: 502 })
  }

  const subscription = subscriptions.data[0]
  if (!subscription) {
    // Le customer existe mais aucune subscription : checkout pas (encore) finalisé.
    return NextResponse.json({ subscription_status: null, trial_end: null })
  }

  const result = await applySubscriptionToPharmacy(admin, subscription, {
    pharmacyId: profile.pharmacy_id,
    source: 'activation_sync',
  })
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  return NextResponse.json({
    subscription_status: result.status,
    trial_end: result.trialEnd,
  })
}
