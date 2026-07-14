import type { LeaveRequest, LeaveRequestStatus } from '@/types/index'

export type PlanningCellStatus =
  | 'badged'
  | 'scheduled'
  | 'leave_pending'
  | 'leave_approved'
  | 'off'

export type PlanningCellInput = {
  dateKey: string
  scheduled: boolean
  badgedMinutes: number
  leaves: Pick<LeaveRequest, 'start_date' | 'end_date' | 'half_day_start' | 'half_day_end' | 'status'>[]
}

export function toDateKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function dateKeyInLeaveRange(
  dateKey: string,
  leave: Pick<LeaveRequest, 'start_date' | 'end_date' | 'half_day_start' | 'half_day_end'>
): boolean {
  if (dateKey < leave.start_date || dateKey > leave.end_date) return false
  if (dateKey === leave.start_date && leave.half_day_start && dateKey === leave.end_date && leave.half_day_end) {
    return true
  }
  return true
}

function leaveStatusPriority(status: LeaveRequestStatus): number {
  if (status === 'approved') return 3
  if (status === 'pending') return 2
  return 0
}

export function resolvePlanningCellStatus(input: PlanningCellInput): PlanningCellStatus {
  let bestLeave: LeaveRequestStatus | null = null
  let bestPriority = 0

  for (const leave of input.leaves) {
    if (!dateKeyInLeaveRange(input.dateKey, leave)) continue
    if (leave.status !== 'approved' && leave.status !== 'pending') continue
    const priority = leaveStatusPriority(leave.status)
    if (priority > bestPriority) {
      bestPriority = priority
      bestLeave = leave.status
    }
  }

  if (bestLeave === 'approved') return 'leave_approved'
  if (bestLeave === 'pending') return 'leave_pending'
  if (input.badgedMinutes > 0) return 'badged'
  if (input.scheduled) return 'scheduled'
  return 'off'
}

export const PLANNING_CELL_STYLES: Record<
  PlanningCellStatus,
  { bg: string; label: string }
> = {
  badged: { bg: 'bg-emerald-100 text-emerald-800', label: 'Présent' },
  scheduled: { bg: 'bg-sky-100 text-sky-800', label: 'Prévu' },
  leave_pending: { bg: 'bg-amber-100 text-amber-800', label: 'Congé (attente)' },
  leave_approved: { bg: 'bg-rose-100 text-rose-800', label: 'Congé' },
  off: { bg: 'bg-slate-50 text-slate-400', label: 'Repos' },
}
