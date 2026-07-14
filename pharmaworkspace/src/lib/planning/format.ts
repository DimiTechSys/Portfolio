import { LEAVE_TYPE_LABELS } from '@/config/constants'
import type { LeaveRequest, LeaveType } from '@/types/index'

export function formatLeavePeriod(leave: Pick<
  LeaveRequest,
  'start_date' | 'end_date' | 'half_day_start' | 'half_day_end'
>): string {
  const fmt = new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
  const start = fmt.format(new Date(`${leave.start_date}T12:00:00`))
  const end = fmt.format(new Date(`${leave.end_date}T12:00:00`))

  if (leave.start_date === leave.end_date) {
    if (leave.half_day_start) return `${start} (matin)`
    if (leave.half_day_end) return `${start} (après-midi)`
    return start
  }

  const startSuffix = leave.half_day_start ? ' (matin)' : ''
  const endSuffix = leave.half_day_end ? ' (après-midi)' : ''
  return `${start}${startSuffix} → ${end}${endSuffix}`
}

export function getLeaveTypeLabel(type: LeaveType): string {
  return LEAVE_TYPE_LABELS[type] ?? type
}
