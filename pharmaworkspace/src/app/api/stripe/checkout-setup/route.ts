// POST /api/stripe/checkout-setup
//
// Crée une session Stripe Checkout en mode subscription + trial 30 jours +
// mandat de prélèvement SEPA obligatoire (IBAN). Appelé depuis la 4ᵉ étape du
// wizard onboarding (Dim P2-01) : l'utilisateur a choisi son tier/billing, on
// lui retourne l'URL Checkout.
//
// Paiement : prélèvement SEPA uniquement (`payment_method_types: ['sepa_debit']`).
// La carte bancaire a été retirée volontairement — on collecte l'IBAN et le
// mandat SEPA pendant l'essai, le 1er prélèvement se fait à J+30.
// Pré-requis compte Stripe : SEPA Direct Debit activé (Dashboard → Settings →
// Payment methods) et devise EUR.
//
// Body : { tier: 'po' | 'otm' | 'go', billing: 'monthly' | 'yearly' }
// Réponse : { checkout_url: string } (201) ou { error, ... } (4xx/5xx)
//
// Contrat §B8 #5 (COORDINATION.md). Le `success_url` matérialise le contrat #8.

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getStripe } from '@/lib/stripe/server'
import { getPriceId } from '@/lib/stripe/price-ids'

export const runtime = 'nodejs'

const BodySchema = z.object({
  tier: z.enum(['po', 'otm', 'go']),
  billing: z.enum(['monthly', 'yearly']),
})

export async function POST(request: Request) {
  // 1. Auth : getUser via la session SSR Supabase
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  // 2. Pharmacie de l'utilisateur (via son profil) + check role.
  // Seul un titulaire peut initier le checkout : c'est lui qui paye et qui
  // est responsable de l'abonnement. Un invité (adjoint/préparateur) qui
  // appellerait cet endpoint pourrait sinon créer un trial sur la pharma
  // de son titulaire avec son propre IBAN.
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

  // 3. Validation du body
  let rawBody: unknown
  try {
    rawBody = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }
  const parsed = BodySchema.safeParse(rawBody)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'validation_failed', details: parsed.error.flatten() },
      { status: 422 },
    )
  }

  // 4. Stripe client (lazy init côté serveur, peut être null si clé manquante)
  const stripe = getStripe()
  if (!stripe) {
    return NextResponse.json({ error: 'stripe_not_configured' }, { status: 503 })
  }

  // 5. Résolution du price ID : throw si env manquante (= bug de config, 503).
  // `getPriceId` renvoie `null` pour le tier `ep` (sur devis) — impossible ici
  // car le BodySchema n'accepte que po/otm/go, mais on garde le garde-fou TS.
  let priceId: string | null
  try {
    priceId = getPriceId(parsed.data.tier, parsed.data.billing)
  } catch (error) {
    console.error('[stripe/checkout-setup] price resolution error', {
      tier: parsed.data.tier,
      billing: parsed.data.billing,
      message: error instanceof Error ? error.message : 'unknown',
    })
    return NextResponse.json({ error: 'price_not_configured' }, { status: 503 })
  }
  if (!priceId) {
    return NextResponse.json({ error: 'price_not_configured' }, { status: 503 })
  }

  // 6. Service client pour lire/écrire `pharmacies.stripe_customer_id` en bypass RLS
  const admin = createServiceClient()
  if (!admin) {
    return NextResponse.json({ error: 'service_unavailable' }, { status: 503 })
  }

  // 7. Récupère la pharmacie (nom + customer_id éventuel)
  const { data: pharmacy, error: pharmacyError } = await admin
    .from('pharmacies')
    .select('id, name, stripe_customer_id')
    .eq('id', profile.pharmacy_id)
    .maybeSingle()
  if (pharmacyError || !pharmacy) {
    return NextResponse.json({ error: 'pharmacy_not_found' }, { status: 404 })
  }

  // 8. Stripe customer : récupère l'existant ou crée + persiste l'ID en DB.
  let customerId = pharmacy.stripe_customer_id
  if (!customerId) {
    try {
      const customer = await stripe.customers.create({
        email: user.email ?? undefined,
        name: pharmacy.name,
        metadata: {
          pharmacy_id: pharmacy.id,
          user_id: user.id,
        },
      })
      customerId = customer.id
      const { error: updateError } = await admin
        .from('pharmacies')
        .update({ stripe_customer_id: customerId })
        .eq('id', pharmacy.id)
      if (updateError) {
        // Le customer est créé côté Stripe mais on n'a pas pu le persister.
        // On peut continuer (le customer sera re-récupérable via l'email plus tard
        // au pire), mais on log car c'est un signal de drift.
        console.error('[stripe/checkout-setup] failed to persist stripe_customer_id', {
          pharmacy_id: pharmacy.id,
          customer_id: customerId,
          code: updateError.code,
        })
      }
    } catch (error) {
      console.error('[stripe/checkout-setup] stripe.customers.create failed', {
        message: error instanceof Error ? error.message : 'unknown',
      })
      return NextResponse.json({ error: 'stripe_error' }, { status: 502 })
    }
  }

  // 9. Crée la session Checkout : subscription + trial 30 j + mandat SEPA obligatoire
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  try {
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      // Prélèvement SEPA uniquement (pas de carte). Stripe collecte l'IBAN et
      // fait accepter le mandat SEPA à l'utilisateur pendant le tunnel Checkout.
      payment_method_types: ['sepa_debit'],
      payment_method_collection: 'always',
      line_items: [{ price: priceId, quantity: 1 }],
      // Metadata DOIT être présent à 2 endroits :
      //   - `metadata` (top-level) : porté par l'event `checkout.session.completed`
      //   - `subscription_data.metadata` : porté par tous les events ultérieurs
      //     (customer.subscription.*) qui n'ont pas accès à la session.
      // Sans la metadata top-level, le webhook handler ne sait pas à quelle
      // pharmacy associer la session reçue.
      metadata: {
        pharmacy_id: pharmacy.id,
        tier: parsed.data.tier,
        billing: parsed.data.billing,
      },
      subscription_data: {
        trial_period_days: 30,
        trial_settings: {
          end_behavior: { missing_payment_method: 'cancel' },
        },
        metadata: {
          pharmacy_id: pharmacy.id,
          tier: parsed.data.tier,
          billing: parsed.data.billing,
        },
      },
      success_url: `${appUrl}/onboarding/activate/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/onboarding/activate`,
      locale: 'fr',
    })

    if (!session.url) {
      console.error('[stripe/checkout-setup] session created without URL', {
        session_id: session.id,
      })
      return NextResponse.json({ error: 'checkout_url_missing' }, { status: 500 })
    }

    return NextResponse.json({ checkout_url: session.url }, { status: 201 })
  } catch (error) {
    console.error('[stripe/checkout-setup] stripe.checkout.sessions.create failed', {
      message: error instanceof Error ? error.message : 'unknown',
      pharmacy_id: pharmacy.id,
    })
    return NextResponse.json({ error: 'stripe_error' }, { status: 502 })
  }
}
