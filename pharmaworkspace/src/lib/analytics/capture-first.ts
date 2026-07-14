import { capture } from '@/lib/analytics/posthog'
import type { FirstMilestoneEventName } from '@/lib/analytics/events'

const STORAGE_PREFIX = 'pw_first_milestone_'

function storageKey(pharmacyId: string, event: FirstMilestoneEventName): string {
  return `${STORAGE_PREFIX}${pharmacyId}_${event}`
}

/**
 * Émet un event `first_*` une seule fois par officine (localStorage).
 * Utilisé pour le funnel activation PostHog (first value par pharmacy).
 */
export function captureFirstMilestone(
  event: FirstMilestoneEventName,
  pharmacyId: string,
  properties?: Record<string, unknown>
): void {
  if (!pharmacyId || typeof window === 'undefined') return

  const key = storageKey(pharmacyId, event)
  try {
    if (window.localStorage.getItem(key)) return
  } catch {
    // localStorage bloqué : on émet quand même une fois par session.
  }

  capture(event, { pharmacy_id: pharmacyId, ...properties })

  try {
    window.localStorage.setItem(key, '1')
  } catch {
    // ignore
  }
}
