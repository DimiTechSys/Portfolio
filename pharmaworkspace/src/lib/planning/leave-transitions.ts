import type { LeaveRequestStatus } from '@/types/index'

export type LeaveReviewAction = 'approve' | 'reject' | 'cancel'

const VALID_TRANSITIONS: Record<LeaveRequestStatus, LeaveReviewAction[]> = {
  pending: ['approve', 'reject', 'cancel'],
  approved: [],
  rejected: [],
  cancelled: [],
}

export function canTransitionLeave(
  currentStatus: LeaveRequestStatus,
  action: LeaveReviewAction
): boolean {
  return VALID_TRANSITIONS[currentStatus]?.includes(action) ?? false
}

export function statusForLeaveAction(action: LeaveReviewAction): LeaveRequestStatus {
  if (action === 'approve') return 'approved'
  if (action === 'reject') return 'rejected'
  return 'cancelled'
}
