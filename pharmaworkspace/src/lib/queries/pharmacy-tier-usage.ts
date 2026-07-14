import { createClient } from '@/lib/supabase/client'
import {
  canInviteMore,
  getMemberCountBreakdown,
  getMemberLimit,
  getRemainingMemberSlots,
  getTierUsageLevel,
  normalizeSubscriptionTier,
  type SubscriptionTier,
  type TierUsageLevel,
} from '@/lib/subscription'
import type { QueryResult } from '@/types/index'

export type PharmacyTierUsage = {
  tier: SubscriptionTier | null
  currentCount: number
  activeCount: number
  pendingInviteCount: number
  limit: number
  remaining: number | null
  canInvite: boolean
  level: TierUsageLevel
}

export async function getPharmacyTierUsage(
  pharmacyId: string
): Promise<QueryResult<PharmacyTierUsage>> {
  try {
    const supabase = createClient()
    const { data: pharmacy, error: pharmacyError } = await supabase
      .from('pharmacies')
      .select('subscription_tier')
      .eq('id', pharmacyId)
      .maybeSingle()

    if (pharmacyError) return { data: null, error: pharmacyError.message }

    const tier = normalizeSubscriptionTier(
      pharmacy?.subscription_tier as string | null | undefined
    )
    const breakdown = await getMemberCountBreakdown(supabase, pharmacyId)
    const limit = getMemberLimit(tier)

    return {
      data: {
        tier,
        currentCount: breakdown.totalCount,
        activeCount: breakdown.activeCount,
        pendingInviteCount: breakdown.pendingInviteCount,
        limit,
        remaining: getRemainingMemberSlots(tier, breakdown.totalCount),
        canInvite: canInviteMore(tier, breakdown.totalCount),
        level: getTierUsageLevel(tier, breakdown.totalCount),
      },
      error: null,
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur chargement quota'
    return { data: null, error: message }
  }
}
