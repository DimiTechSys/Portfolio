import { describe, expect, it } from 'vitest'

import {
  canInviteMore,
  getInviteSlotsRemaining,
  getMemberLimit,
  getRemainingMemberSlots,
  getTierUsageLevel,
  TIER_LIMITS,
} from '@/lib/subscription'

// PRICING-V2 : PO=3, OM(otm)=9, GO=15, EP=∞. MAX_ONBOARDING_INVITE_ROWS=15.
describe('subscription tier limits', () => {
  it('getMemberLimit defaults to po when tier is null', () => {
    expect(getMemberLimit(null)).toBe(TIER_LIMITS.po)
  })

  it('canInviteMore respects tier caps', () => {
    expect(canInviteMore('po', 2)).toBe(true)
    expect(canInviteMore('po', 3)).toBe(false)
    expect(canInviteMore('otm', 8)).toBe(true)
    expect(canInviteMore('otm', 9)).toBe(false)
    expect(canInviteMore('go', 14)).toBe(true)
    expect(canInviteMore('go', 15)).toBe(false)
    expect(canInviteMore('ep', 1000)).toBe(true)
  })

  it('getInviteSlotsRemaining is capped by MAX rows and tier limit', () => {
    expect(getInviteSlotsRemaining('go', 1)).toBe(14) // min(15, 15-1)
    expect(getInviteSlotsRemaining('ep', 1)).toBe(15) // illimité → plafonné au MAX
    expect(getInviteSlotsRemaining('po', 1)).toBe(2)
    expect(getInviteSlotsRemaining('po', 3)).toBe(0)
  })

  it('getTierUsageLevel warning at 80% and blocked at limit', () => {
    expect(getTierUsageLevel('po', 2)).toBe('ok')
    expect(getTierUsageLevel('po', 3)).toBe('blocked')
    expect(getTierUsageLevel('otm', 8)).toBe('warning') // 8/9 ≈ 0.89
    expect(getTierUsageLevel('go', 10)).toBe('ok') // 10/15 ≈ 0.67
    expect(getTierUsageLevel('go', 15)).toBe('blocked')
  })

  it('getRemainingMemberSlots returns null only for unlimited tier', () => {
    expect(getRemainingMemberSlots('ep', 12)).toBeNull()
    expect(getRemainingMemberSlots('go', 12)).toBe(3)
    expect(getRemainingMemberSlots('po', 2)).toBe(1)
    expect(getRemainingMemberSlots('po', 3)).toBe(0)
  })
})
