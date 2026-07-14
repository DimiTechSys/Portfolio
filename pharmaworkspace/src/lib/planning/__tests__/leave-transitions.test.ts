import { describe, expect, it } from 'vitest'
import {
  canTransitionLeave,
  statusForLeaveAction,
} from '@/lib/planning/leave-transitions'

describe('leave transitions', () => {
  it('allows approve/reject/cancel from pending only', () => {
    expect(canTransitionLeave('pending', 'approve')).toBe(true)
    expect(canTransitionLeave('pending', 'reject')).toBe(true)
    expect(canTransitionLeave('pending', 'cancel')).toBe(true)
    expect(canTransitionLeave('approved', 'approve')).toBe(false)
    expect(canTransitionLeave('rejected', 'reject')).toBe(false)
  })

  it('maps actions to statuses', () => {
    expect(statusForLeaveAction('approve')).toBe('approved')
    expect(statusForLeaveAction('reject')).toBe('rejected')
    expect(statusForLeaveAction('cancel')).toBe('cancelled')
  })
})
