// POST /api/stripe/portal
//
// Crée une session Stripe Customer Portal et retourne son URL. Utilisé par la
// page /billing/reactivate (et plus tard depuis un éventuel bouton "Gérer mon
// abonnement" dans l'app) pour rediriger l'utilisateur vers le portail Stripe
// où il peut mettre à jour son IBAN / mandat SEPA, annuler, ou réactiver.
//
// Réponse : { portal_url: string } (200) ou { error } (4xx/5xx)
//
// Pré-requis : le Customer Portal Stripe doit être configuré côté Dashboard
// (P4-13a, fait : annulation fin période + update moyen de paiement + 6 prices switch).

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getStripe } from '@/lib/stripe/server'

export const runtime = 'nodejs'

export async function POST() {
  // 1. Auth
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  // 2. Pharmacie de l'utilisateur + check role.
  // Le Customer Portal Stripe gère l'abonnement de la pharmacie (annulation,
  // changement de tier, update IBAN) → réservé au titulaire qui en est le
  // responsable légal et financier.
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

  // 3. Stripe customer ID (admin/service pour bypass RLS)
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
    // Pas de customer Stripe → la pharmacie n'a jamais checkout. Le portal n'a
    // pas de sens ici ; le caller (page /billing/reactivate) doit plutôt
    // proposer un (re)checkout.
    return NextResponse.json({ error: 'no_stripe_customer' }, { status: 404 })
  }

  // 4. Stripe client
  const stripe = getStripe()
  if (!stripe) {
    return NextResponse.json({ error: 'stripe_not_configured' }, { status: 503 })
  }

  // 5. Création de la session
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: pharmacy.stripe_customer_id,
      return_url: `${appUrl}/billing/reactivate`,
      locale: 'fr',
    })
    return NextResponse.json({ portal_url: session.url }, { status: 200 })
  } catch (error) {
    console.error('[stripe/portal] billingPortal.sessions.create failed', {
      pharmacy_id: profile.pharmacy_id,
      message: error instanceof Error ? error.message : 'unknown',
    })
    return NextResponse.json({ error: 'stripe_error' }, { status: 502 })
  }
}
