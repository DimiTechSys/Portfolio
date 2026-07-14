import type Stripe from 'stripe'
import type { SupabaseClient } from '@supabase/supabase-js'
import { getPostHogClient } from '@/lib/posthog-server'
import { resolveTierBillingFromPriceId } from '@/lib/stripe/price-ids'

type SupabaseAdmin = SupabaseClient

function tsToIso(ts: number | null | undefined): string | null {
  if (typeof ts !== 'number' || !Number.isFinite(ts)) return null
  return new Date(ts * 1000).toISOString()
}

function getCurrentPeriodEnd(subscription: Stripe.Subscription): number | null {
  const legacy = (subscription as unknown as { current_period_end?: number }).current_period_end
  if (typeof legacy === 'number') return legacy
  const itemEnd = subscription.items?.data?.[0]?.current_period_end
  return typeof itemEnd === 'number' ? itemEnd : null
}

export type ApplyCheckoutResult =
  | {
      ok: true
      pharmacyId: string
      status: string
      trialEnd: string | null
    }
  | { ok: false; error: string }

/**
 * Applique une subscription Stripe à la pharmacie (status / tier / billing / dates).
 * Cœur partagé entre :
 *   - le webhook + le fallback confirm-checkout (via applyCheckoutSessionToPharmacy) ;
 *   - la resynchro par customer (route /api/stripe/sync-subscription), utilisée par
 *     la page d'activation quand le session_id est perdu (session cassée au retour
 *     de Stripe) ou que le webhook est en retard.
 *
 * `fallback` fournit les valeurs issues d'une éventuelle Checkout Session (metadata
 * top-level) quand la subscription elle-même ne les porte pas encore.
 */
export async function applySubscriptionToPharmacy(
  admin: SupabaseAdmin,
  subscription: Stripe.Subscription,
  fallback: {
    pharmacyId?: string
    tier?: string
    billing?: string
    source?: string
  } = {},
): Promise<ApplyCheckoutResult> {
  const subMd = (subscription.metadata ?? {}) as Record<string, string>
  const pharmacyId = subMd.pharmacy_id || fallback.pharmacyId

  if (!pharmacyId) {
    return { ok: false, error: 'missing_pharmacy_id' }
  }

  // Source de vérité tier/billing = le price_id réel de la subscription, pas
  // metadata.tier (manipulable / désynchronisé). Fallback prudent sur metadata
  // si le price n'est pas reconnu, pour ne pas casser un checkout légitime.
  const priceId = subscription.items?.data?.[0]?.price?.id
  const resolved = resolveTierBillingFromPriceId(priceId)
  if (!resolved) {
    console.error('[stripe/apply-checkout-session] unrecognized price_id, falling back to metadata', {
      subscription_id: subscription.id,
      price_id: priceId,
    })
  }
  const tier = resolved?.tier ?? subMd.tier ?? fallback.tier
  const billing = resolved?.billing ?? subMd.billing ?? fallback.billing

  const trialEnd = tsToIso(subscription.trial_end)

  const { error: updateError } = await admin
    .from('pharmacies')
    .update({
      stripe_subscription_id: subscription.id,
      subscription_status: subscription.status,
      subscription_tier: tier ?? null,
      subscription_billing: billing ?? null,
      trial_end: trialEnd,
      current_period_end: tsToIso(getCurrentPeriodEnd(subscription)),
    })
    .eq('id', pharmacyId)

  if (updateError) {
    return { ok: false, error: updateError.message }
  }

  await admin
    .from('pharmacy_acquisition')
    .update({ funnel_step: 'trial_started' })
    .eq('pharmacy_id', pharmacyId)

  getPostHogClient().capture({
    distinctId: pharmacyId,
    event: 'checkout_succeeded',
    properties: {
      pharmacy_id: pharmacyId,
      tier,
      billing,
      subscription_id: subscription.id,
      status: subscription.status,
      source: fallback.source ?? 'subscription_sync',
    },
  })

  return {
    ok: true,
    pharmacyId,
    status: subscription.status,
    trialEnd,
  }
}

/**
 * Applique le résultat d'une Checkout Session subscription à la pharmacie.
 * Utilisé par le webhook Stripe et le fallback POST /api/stripe/confirm-checkout.
 */
export async function applyCheckoutSessionToPharmacy(
  admin: SupabaseAdmin,
  stripe: Stripe,
  session: Stripe.Checkout.Session,
): Promise<ApplyCheckoutResult> {
  if (session.mode !== 'subscription' || !session.subscription) {
    return { ok: false, error: 'not_subscription_session' }
  }

  const subscriptionId =
    typeof session.subscription === 'string' ? session.subscription : session.subscription.id

  const subscription = await stripe.subscriptions.retrieve(subscriptionId)

  const sessionMd = (session.metadata ?? {}) as Record<string, string>

  return applySubscriptionToPharmacy(admin, subscription, {
    pharmacyId: sessionMd.pharmacy_id,
    tier: sessionMd.tier,
    billing: sessionMd.billing,
    source: 'checkout_sync',
  })
}
