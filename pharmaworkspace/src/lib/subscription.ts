import type { SupabaseClient } from '@supabase/supabase-js'
import type { SubscriptionTier } from '@/lib/stripe/price-ids'

export type { SubscriptionTier } from '@/lib/stripe/price-ids'

// Helpers d'état d'abonnement, lus côté serveur et côté client (purs, pas d'I/O).
//
// Les fonctions prennent une interface structurelle minimale `PharmacySubscriptionFields`
// plutôt que le type `Pharmacy` complet : ça évite de bloquer ce module sur la
// regen `database.types.ts` après l'application de la migration 0042. Une vraie
// `Pharmacy` (issue de la DB) restera assignable grâce au structural typing TS.

export type SubscriptionStatus =
  | 'incomplete'
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'unpaid'

export interface PharmacySubscriptionFields {
  subscription_status: SubscriptionStatus | null
  trial_end: string | null
  current_period_end: string | null
}

/** Le user de cette pharmacie peut-il accéder aux routes produit ? */
export function canAccessApp(p: PharmacySubscriptionFields | null): boolean {
  if (!p) return false
  const s = p.subscription_status
  return s === 'trialing' || s === 'active' || s === 'past_due'
}

/**
 * Nombre de jours avant le prochain prélèvement :
 * - en trialing → distance jusqu'à trial_end
 * - en active/past_due → distance jusqu'à current_period_end
 * - autres états ou dates manquantes → null
 *
 * Valeur arrondie au jour supérieur (Math.ceil) : un trial qui finit dans 4h
 * retourne donc 1, pas 0.
 */
export function getDaysUntilCharge(p: PharmacySubscriptionFields): number | null {
  let target: string | null = null
  if (p.subscription_status === 'trialing') {
    target = p.trial_end
  } else if (p.subscription_status === 'active' || p.subscription_status === 'past_due') {
    target = p.current_period_end
  }
  if (!target) return null

  const targetMs = new Date(target).getTime()
  if (Number.isNaN(targetMs)) return null

  const diffMs = targetMs - Date.now()
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24))
}

/** Faut-il afficher le banner pré-prélèvement (J-5 à J0 de la fin du trial) ? */
export function shouldShowTrialBanner(p: PharmacySubscriptionFields): boolean {
  if (p.subscription_status !== 'trialing') return false
  const days = getDaysUntilCharge(p)
  return days !== null && days >= 0 && days <= 5
}

/** Faut-il afficher l'alerte paiement échoué ? */
export function shouldShowPastDueBanner(p: PharmacySubscriptionFields): boolean {
  return p.subscription_status === 'past_due'
}

// ── Limites d'utilisateurs par tier (TECH-12, CGS §5.1) ─────────────────────

// PRICING-V2 : capacité comptes par tier (TECH-12). PO=3, OM=9, GO=15, EP=∞.
// L'id interne du tier moyen reste `otm` (affiché « OM » côté public).
export const TIER_LIMITS: Record<SubscriptionTier, number> = {
  po: 3,
  otm: 9,
  go: 15,
  ep: Number.POSITIVE_INFINITY,
}

export const TIER_LABELS: Record<SubscriptionTier, string> = {
  po: 'Petite officine',
  otm: 'Officine moyenne',
  go: 'Grande officine',
  ep: 'Enterprise / Pôle',
}

/** Cap visuel du nombre de champs d'invitation (wizard onboarding). */
export const MAX_ONBOARDING_INVITE_ROWS = 15

export function normalizeSubscriptionTier(
  tier: string | null | undefined
): SubscriptionTier | null {
  if (tier === 'po' || tier === 'otm' || tier === 'go' || tier === 'ep') return tier
  return null
}

export function getMemberLimit(tier: SubscriptionTier | null): number {
  if (!tier) return TIER_LIMITS.po
  return TIER_LIMITS[tier]
}

export async function getCurrentMemberCount(
  supabase: SupabaseClient,
  pharmacyId: string
): Promise<number> {
  const { totalCount } = await getMemberCountBreakdown(supabase, pharmacyId)
  return totalCount
}

export function canInviteMore(tier: SubscriptionTier | null, currentCount: number): boolean {
  return currentCount < getMemberLimit(tier)
}

/** Places restantes sur la formule (`null` = illimité). */
export function getRemainingMemberSlots(
  tier: SubscriptionTier | null,
  currentCount: number
): number | null {
  const limit = getMemberLimit(tier)
  if (!Number.isFinite(limit)) return null
  return Math.max(0, limit - currentCount)
}

export type MemberCountBreakdown = {
  activeCount: number
  pendingInviteCount: number
  totalCount: number
}

export async function getMemberCountBreakdown(
  supabase: SupabaseClient,
  pharmacyId: string
): Promise<MemberCountBreakdown> {
  const now = new Date().toISOString()

  const { count: activeCount, error: membersError } = await supabase
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('pharmacy_id', pharmacyId)

  if (membersError) throw new Error(membersError.message)

  const { count: pendingInviteCount, error: invitesError } = await supabase
    .from('invitations')
    .select('id', { count: 'exact', head: true })
    .eq('pharmacy_id', pharmacyId)
    .is('accepted_at', null)
    .gt('expires_at', now)

  if (invitesError) throw new Error(invitesError.message)

  const active = activeCount ?? 0
  const pending = pendingInviteCount ?? 0

  return {
    activeCount: active,
    pendingInviteCount: pending,
    totalCount: active + pending,
  }
}

/** Places restantes invitables (plafonné pour l'UI onboarding). */
export function getInviteSlotsRemaining(
  tier: SubscriptionTier | null,
  currentCount: number
): number {
  const limit = getMemberLimit(tier)
  if (!Number.isFinite(limit)) return MAX_ONBOARDING_INVITE_ROWS
  return Math.max(0, Math.min(MAX_ONBOARDING_INVITE_ROWS, limit - currentCount))
}

export type TierUsageLevel = 'ok' | 'warning' | 'blocked'

export function getTierUsageLevel(
  tier: SubscriptionTier | null,
  currentCount: number
): TierUsageLevel {
  const limit = getMemberLimit(tier)
  if (!Number.isFinite(limit)) return 'ok'
  if (currentCount >= limit) return 'blocked'
  if (currentCount / limit >= 0.8) return 'warning'
  return 'ok'
}
