import { describe, expect, it } from 'vitest'
import { resolvePlanningCellStatus } from '@/lib/planning/cell-status'

describe('resolvePlanningCellStatus', () => {
  it('prioritises approved leave over badged presence', () => {
    const status = resolvePlanningCellStatus({
      dateKey: '2026-06-10',
      scheduled: true,
      badgedMinutes: 480,
      leaves: [
        {
          start_date: '2026-06-10',
          end_date: '2026-06-10',
          half_day_start: false,
          half_day_end: false,
          status: 'approved',
        },
      ],
    })
    expect(status).toBe('leave_approved')
  })

  it('shows pending leave before scheduled slot', () => {
    const status = resolvePlanningCellStatus({
      dateKey: '2026-06-10',
      scheduled: true,
      badgedMinutes: 0,
      leaves: [
        {
          start_date: '2026-06-10',
          end_date: '2026-06-12',
          half_day_start: false,
          half_day_end: false,
          status: 'pending',
        },
      ],
    })
    expect(status).toBe('leave_pending')
  })

  it('shows badged when no leave applies', () => {
    const status = resolvePlanningCellStatus({
      dateKey: '2026-06-10',
      scheduled: false,
      badgedMinutes: 120,
      leaves: [],
    })
    expect(status).toBe('badged')
  })
})
