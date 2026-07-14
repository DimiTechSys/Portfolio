import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { captureFirstMilestone } from '@/lib/analytics/capture-first'
import { FIRST_MILESTONE_EVENTS } from '@/lib/analytics/events'
import { capture } from '@/lib/analytics/posthog'

vi.mock('@/lib/analytics/posthog', () => ({
  capture: vi.fn(),
}))

describe('captureFirstMilestone', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('emits once per pharmacy and event', () => {
    captureFirstMilestone(FIRST_MILESTONE_EVENTS.first_task_created, 'pharm-1', {
      priority: 'high',
    })
    captureFirstMilestone(FIRST_MILESTONE_EVENTS.first_task_created, 'pharm-1', {
      priority: 'low',
    })

    expect(capture).toHaveBeenCalledTimes(1)
    expect(capture).toHaveBeenCalledWith('first_task_created', {
      pharmacy_id: 'pharm-1',
      priority: 'high',
    })
  })

  it('emits separately per pharmacy', () => {
    captureFirstMilestone(FIRST_MILESTONE_EVENTS.first_ocr_done, 'pharm-a')
    captureFirstMilestone(FIRST_MILESTONE_EVENTS.first_ocr_done, 'pharm-b')

    expect(capture).toHaveBeenCalledTimes(2)
  })
})
