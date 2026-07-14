// POST /api/stripe/webhook
//
// Endpoint webhook Stripe. Reçoit les events asynchrones de Stripe et
// synchronise notre DB + envoie les events PostHog correspondants.
//
// Sécurité : signature Stripe vérifiée via `stripe.webhooks.constructEvent`
// avec `STRIPE_WEBHOOK_SECRET`. Sans signature valide → 400.
//
// Idempotence : INSERT into `stripe_webhook_log` avec `stripe_event_id` UNIQUE.
// Si conflict (déjà traité), on retourne 200 sans rien faire. Trade-off accepté :
// si le processing échoue APRÈS l'INSERT, on perd cette mise à jour, mais
// l'event `customer.subscription.updated` suivant remettra l'état d'aplomb.
//
// Events gérés :
//   checkout.session.completed              → trialing + trial_end + current_period_end + tier + billing
//   customer.subscription.updated           → sync status / dates (couvre trialing→active, →past_due, ...)
//   customer.subscription.deleted           → status='canceled'
//   customer.subscription.trial_will_end    → log only (Stripe gère son email natif)
//   invoice.payment_failed                  → status='past_due' (en filet de sécurité, subscription.updated le fait aussi)
//   invoice.payment_succeeded               → PostHog event si 1er prélèvement post-trial
//   (autres)                                → log et 200

import { NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { createServiceClient } from '@/lib/supabase/service'
import { getStripe } from '@/lib/stripe/server'
import { applyCheckoutSessionToPharmacy } from '@/lib/stripe/apply-checkout-session'
import { resolveTierBillingFromPriceId } from '@/lib/stripe/price-ids'
import { getPostHogClient } from '@/lib/posthog-server'

export const runtime = 'nodejs'

type SupabaseAdmin = NonNullable<ReturnType<typeof createServiceClient>>

export async function POST(request: Request) {
  // 1. Récupérer raw body + signature
  const signature = request.headers.get('stripe-signature')
  if (!signature) {
    return NextResponse.json({ error: 'missing_signature' }, { status: 400 })
  }
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret) {
    console.error('[stripe/webhook] STRIPE_WEBHOOK_SECRET not configured')
    return NextResponse.json({ error: 'webhook_not_configured' }, { status: 503 })
  }

  const stripe = getStripe()
  if (!stripe) {
    return NextResponse.json({ error: 'stripe_not_configured' }, { status: 503 })
  }

  // Important : raw body (string) pour la vérif signature, pas request.json()
  const rawBody = await request.text()

  // 2. Vérification signature (lève une erreur si invalide)
  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, secret)
  } catch (error) {
    console.error('[stripe/webhook] signature verification failed', {
      message: error instanceof Error ? error.message : 'unknown',
    })
    return NextResponse.json({ error: 'invalid_signature' }, { status: 400 })
  }

  const admin = createServiceClient()
  if (!admin) {
    return NextResponse.json({ error: 'service_unavailable' }, { status: 503 })
  }

  // 3. Idempotence : INSERT log (ON CONFLICT = déjà traité)
  const pharmacyId = extractPharmacyId(event)
  const { error: logError } = await admin.from('stripe_webhook_log').insert({
    stripe_event_id: event.id,
    event_type: event.type,
    pharmacy_id: pharmacyId,
    payload: event.data as unknown as object,
  })

  // Postgres UNIQUE violation code = 23505
  if (logError?.code === '23505') {
    return NextResponse.json({ received: true, deduped: true }, { status: 200 })
  }
  if (logError) {
    console.error('[stripe/webhook] failed to insert webhook log', {
      code: logError.code,
      event_type: event.type,
    })
    return NextResponse.json({ error: 'db_error' }, { status: 500 })
  }

  // 4. Dispatch event
  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(admin, stripe, event)
        break
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(admin, event)
        break
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(admin, event)
        break
      case 'customer.subscription.trial_will_end':
        // Stripe envoie 3 jours avant fin trial. On log, son email natif suffit.
        break
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(admin, event)
        break
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event)
        break
      default:
        // Event non-géré → on a déjà loggé via stripe_webhook_log, 200 OK.
        break
    }
  } catch (error) {
    console.error('[stripe/webhook] handler threw', {
      event_type: event.type,
      event_id: event.id,
      message: error instanceof Error ? error.message : 'unknown',
    })
    return NextResponse.json({ error: 'handler_failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true }, { status: 200 })
}

// ---------------------------------------------------------------------------
// Handlers par event type
// ---------------------------------------------------------------------------

async function handleCheckoutCompleted(
  admin: SupabaseAdmin,
  stripe: Stripe,
  event: Stripe.CheckoutSessionCompletedEvent,
) {
  const session = event.data.object
  const result = await applyCheckoutSessionToPharmacy(admin, stripe, session)
  if (!result.ok) {
    console.error('[stripe/webhook] checkout.session.completed apply failed', {
      session_id: session.id,
      error: result.error,
    })
  }
}

async function handleSubscriptionUpdated(
  admin: SupabaseAdmin,
  event: Stripe.CustomerSubscriptionUpdatedEvent,
) {
  const subscription = event.data.object
  const md = (subscription.metadata ?? {}) as Record<string, string>
  const pharmacyId = md.pharmacy_id
  if (!pharmacyId) return // pas pour nous

  const previousStatus =
    event.data.previous_attributes && 'status' in event.data.previous_attributes
      ? (event.data.previous_attributes.status as string | undefined)
      : undefined

  // Source de vérité tier/billing = le price_id réel de la subscription, pas
  // metadata.tier (qui peut être désynchronisé après un changement de plan).
  // Si le price n'est pas reconnu, on n'écrase pas la valeur DB existante.
  const priceId = subscription.items?.data?.[0]?.price?.id
  const resolved = resolveTierBillingFromPriceId(priceId)

  await admin
    .from('pharmacies')
    .update({
      subscription_status: subscription.status,
      trial_end: tsToIso(subscription.trial_end),
      current_period_end: tsToIso(getCurrentPeriodEnd(subscription)),
      ...(resolved
        ? { subscription_tier: resolved.tier, subscription_billing: resolved.billing }
        : {}),
    })
    .eq('id', pharmacyId)

  // Detect first charge post-trial (trialing → active)
  if (previousStatus === 'trialing' && subscription.status === 'active') {
    getPostHogClient().capture({
      distinctId: pharmacyId,
      event: 'subscription_first_charge_succeeded',
      properties: {
        pharmacy_id: pharmacyId,
        subscription_id: subscription.id,
      },
    })
  }
}

async function handleSubscriptionDeleted(
  admin: SupabaseAdmin,
  event: Stripe.CustomerSubscriptionDeletedEvent,
) {
  const subscription = event.data.object
  const md = (subscription.metadata ?? {}) as Record<string, string>
  const pharmacyId = md.pharmacy_id
  if (!pharmacyId) return

  await admin
    .from('pharmacies')
    .update({ subscription_status: 'canceled' })
    .eq('id', pharmacyId)

  getPostHogClient().capture({
    distinctId: pharmacyId,
    event: 'subscription_canceled',
    properties: {
      pharmacy_id: pharmacyId,
      subscription_id: subscription.id,
      cancellation_details: subscription.cancellation_details ?? null,
    },
  })
}

async function handleInvoicePaymentFailed(
  admin: SupabaseAdmin,
  event: Stripe.InvoicePaymentFailedEvent,
) {
  const invoice = event.data.object
  const subscriptionId = getInvoiceSubscriptionId(invoice)
  if (!subscriptionId) return

  // Recherche la pharmacie via stripe_subscription_id.
  const { data: pharmacy } = await admin
    .from('pharmacies')
    .select('id')
    .eq('stripe_subscription_id', subscriptionId)
    .maybeSingle()
  if (!pharmacy) return

  await admin
    .from('pharmacies')
    .update({ subscription_status: 'past_due' })
    .eq('id', pharmacy.id)

  // Note : l'event customer.subscription.updated suivant fera aussi la mise à jour,
  // mais on fait ici pour minimiser la fenêtre où la DB et Stripe divergent.
}

async function handleInvoicePaymentSucceeded(event: Stripe.InvoicePaymentSucceededEvent) {
  // Tracking uniquement : la mise à jour status='active' est faite via
  // customer.subscription.updated (qui arrive en parallèle).
  const invoice = event.data.object
  const subscriptionId = getInvoiceSubscriptionId(invoice)
  if (!subscriptionId) return

  // billing_reason = 'subscription_create' au tout 1er checkout (avant le trial),
  // = 'subscription_cycle' au prélèvement post-trial et aux suivants.
  // On émet le first_charge event seulement à la transition trial → paid, ce qui
  // est mieux capté par subscription.updated (trialing → active). Donc ici on
  // se contente d'un log léger.
  getPostHogClient().capture({
    distinctId: subscriptionId, // pas mieux : si on a pas pharmacy_id directement
    event: 'invoice_payment_succeeded',
    properties: {
      subscription_id: subscriptionId,
      billing_reason: invoice.billing_reason,
      amount_paid: invoice.amount_paid,
      currency: invoice.currency,
    },
  })
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Extrait pharmacy_id de l'event (best effort) pour le log d'idempotence. */
function extractPharmacyId(event: Stripe.Event): string | null {
  const obj = event.data.object as { metadata?: Record<string, string> }
  return obj.metadata?.pharmacy_id ?? null
}

/** Convertit un timestamp Stripe (seconds since epoch) en ISO string, ou null. */
function tsToIso(ts: number | null | undefined): string | null {
  if (typeof ts !== 'number' || !Number.isFinite(ts)) return null
  return new Date(ts * 1000).toISOString()
}

/**
 * Récupère current_period_end depuis une subscription. Selon l'API version du SDK,
 * c'est soit sur subscription.current_period_end (legacy) soit sur
 * subscription.items.data[0].current_period_end (récent). On gère les deux.
 */
function getCurrentPeriodEnd(subscription: Stripe.Subscription): number | null {
  const legacy = (subscription as unknown as { current_period_end?: number }).current_period_end
  if (typeof legacy === 'number') return legacy
  const itemEnd = subscription.items?.data?.[0]?.current_period_end
  return typeof itemEnd === 'number' ? itemEnd : null
}

/**
 * Récupère subscription_id depuis une invoice. Selon l'API version, c'est soit
 * sur invoice.subscription (legacy) soit sur invoice.parent.subscription_details
 * (récent). On gère les deux.
 */
function getInvoiceSubscriptionId(invoice: Stripe.Invoice): string | null {
  const legacy = (invoice as unknown as { subscription?: string | { id: string } | null })
    .subscription
  if (typeof legacy === 'string') return legacy
  if (legacy && typeof legacy === 'object' && 'id' in legacy) return legacy.id

  const parent = (invoice as unknown as {
    parent?: { subscription_details?: { subscription?: string | null } } | null
  }).parent
  return parent?.subscription_details?.subscription ?? null
}
