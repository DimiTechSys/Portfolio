import { createClient } from '@/lib/supabase/client'
import { cancelLeaveRequest } from '@/lib/queries/planning'
import type { LeaveRequest, LeaveType } from '@/types/index'
import type { LeaveReviewAction } from '@/lib/planning/leave-transitions'

export type SubmitLeavePayload = {
  leave_type: LeaveType
  start_date: string
  end_date: string
  half_day_start?: boolean
  half_day_end?: boolean
  reason?: string | null
}

type ApiResult<T> = { data: T | null; error: string | null }

async function getAccessToken(): Promise<string | null> {
  const supabase = createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  return session?.access_token ?? null
}

export async function submitLeaveRequest(
  payload: SubmitLeavePayload
): Promise<ApiResult<LeaveRequest>> {
  const token = await getAccessToken()
  if (!token) return { data: null, error: 'Non authentifié' }

  const response = await fetch('/api/planning/leave-requests', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  })

  const json = (await response.json()) as { data?: LeaveRequest; error?: string }
  if (!response.ok) {
    return { data: null, error: json.error ?? 'Erreur lors de la demande' }
  }

  return { data: json.data ?? null, error: null }
}

export async function reviewLeaveRequest(
  leaveId: string,
  action: Extract<LeaveReviewAction, 'approve' | 'reject'>,
  reviewNote?: string | null
): Promise<ApiResult<LeaveRequest>> {
  const token = await getAccessToken()
  if (!token) return { data: null, error: 'Non authentifié' }

  const response = await fetch(`/api/planning/leave-requests/${leaveId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ action, review_note: reviewNote ?? null }),
  })

  const json = (await response.json()) as { data?: LeaveRequest; error?: string }
  if (!response.ok) {
    return { data: null, error: json.error ?? 'Erreur lors de la validation' }
  }

  return { data: json.data ?? null, error: null }
}

export const leaveService = {
  submitLeaveRequest,
  reviewLeaveRequest,
  cancelLeaveRequest,
}
