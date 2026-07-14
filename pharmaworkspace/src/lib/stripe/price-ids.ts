// Mapping (tier, billing) → Stripe price ID.
//
// Les price IDs vivent dans les env vars Vercel (Test mode en Preview, Live mode
// en Production). Ce module les résout au runtime depuis `process.env`. Un throw
// dur si une env manque : ça force la détection au boot de l'app en preview
// plutôt qu'au moment du checkout (où l'erreur serait visible par un client).
//
// Convention de nommage : `STRIPE_PRICE_<TIER>_<BILLING>` en majuscules.
// Exemples : STRIPE_PRICE_PO_MONTHLY, STRIPE_PRICE_OTM_YEARLY, STRIPE_PRICE_GO_MONTHLY.
//
// PRICING-V2 (juin 2026) : 4 tiers basés sur les ETP (cf. PRICING-2026-v2.md).
// L'identifiant interne du tier moyen reste `otm` (la grille publique l'affiche
// « OM » — c'est un libellé cosmétique, pas un changement de schéma). Seul le
// tier `ep` (Enterprise / groupement) est ajouté. `ep` est « sur devis » : pas
// de price ID public, géré hors self-serve (invoice manuelle / Stripe Quote).
// `getPriceId` renvoie donc `null` pour `ep` — il ne passe jamais par le Checkout.

export type SubscriptionTier = 'po' | 'otm' | 'go' | 'ep'
/** Tiers facturables en self-serve (un price Stripe existe). `ep` exclu. */
export type BillableTier = Exclude<SubscriptionTier, 'ep'>
export type BillingInterval = 'monthly' | 'yearly'

export const SUBSCRIPTION_TIERS: readonly SubscriptionTier[] = ['po', 'otm', 'go', 'ep'] as const
export const BILLABLE_TIERS: readonly BillableTier[] = ['po', 'otm', 'go'] as const
export const BILLING_INTERVALS: readonly BillingInterval[] = ['monthly', 'yearly'] as const

/**
 * Price ID Stripe pour un (tier, billing). `null` pour le tier `ep` (sur devis,
 * pas de price public). Throw si une env var attendue manque ou est mal formée
 * (= bug de config détecté au boot/preview plutôt qu'au checkout client).
 */
export function getPriceId(tier: SubscriptionTier, billing: BillingInterval): string | null {
  if (tier === 'ep') return null

  const envKey = `STRIPE_PRICE_${tier.toUpperCase()}_${billing.toUpperCase()}`
  const priceId = process.env[envKey]

  if (!priceId) {
    throw new Error(`[stripe/price-ids] Missing env var: ${envKey}`)
  }
  if (!priceId.startsWith('price_')) {
    throw new Error(
      `[stripe/price-ids] Invalid price ID format for ${envKey} (expected prefix 'price_')`,
    )
  }

  return priceId
}

/**
 * Résout (tier, billing) depuis un price_id réel de subscription. Source de vérité
 * pour le webhook : on ne se fie plus à `metadata.tier` (manipulable / désynchronisé)
 * mais au price effectivement attaché à la subscription Stripe.
 *
 * Construit la table inverse au runtime depuis les mêmes env vars que `getPriceId`.
 * Un price absent des env (ou env manquante) → null : l'appelant garde la valeur DB.
 */
export function resolveTierBillingFromPriceId(
  priceId: string | null | undefined,
): { tier: SubscriptionTier; billing: BillingInterval } | null {
  if (!priceId) return null

  for (const tier of BILLABLE_TIERS) {
    for (const billing of BILLING_INTERVALS) {
      const envKey = `STRIPE_PRICE_${tier.toUpperCase()}_${billing.toUpperCase()}`
      if (process.env[envKey] === priceId) {
        return { tier, billing }
      }
    }
  }

  return null
}
