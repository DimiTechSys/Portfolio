import { computeSegmentMinutes, filterSessionsStartedToday } from '@/lib/sessions/time'

export const SEGMENT_START_TOLERANCE_MS = 120_000

export type SessionRowForWorkedTime = {
  id?: string
  started_at: string
  ended_at: string | null
  worked_minutes_accumulated?: number | null
  current_segment_started_at?: string | null
}

export function hasResumedAfterPause(row: SessionRowForWorkedTime): boolean {
  if (!row.current_segment_started_at) return false
  return (
    new Date(row.current_segment_started_at).getTime() >
    new Date(row.started_at).getTime() + SEGMENT_START_TOLERANCE_MS
  )
}

/** Début du chronomètre en cours (reprise après pause = horodatage de reprise). */
export function getSegmentStartIso(row: SessionRowForWorkedTime): string {
  return row.current_segment_started_at ?? row.started_at
}

/** Temps écoulé sur le segment en cours (ms), 0 si session clôturée. */
export function getRunningSessionMs(
  row: SessionRowForWorkedTime,
  nowMs = Date.now()
): number {
  if (row.ended_at) return 0
  const startedMs = new Date(getSegmentStartIso(row)).getTime()
  return Math.max(0, nowMs - startedMs)
}

/** Durée « horloge » de la session (début premier pointage → fin). */
export function sessionWallClockMinutes(
  row: SessionRowForWorkedTime,
  nowMs = Date.now()
): number {
  if (!row.ended_at) return 0
  return computeSegmentMinutes(row.started_at, row.ended_at, nowMs)
}

export function isFullWallClockSpan(
  row: SessionRowForWorkedTime,
  segmentStartIso: string,
  segmentMinutes: number,
  endedAt: string
): boolean {
  const wall = computeSegmentMinutes(row.started_at, endedAt)
  if (wall < 15) return false
  const fromDayStart =
    Math.abs(
      new Date(segmentStartIso).getTime() - new Date(row.started_at).getTime()
    ) < SEGMENT_START_TOLERANCE_MS
  return fromDayStart && segmentMinutes >= wall * 0.85
}

/**
 * Minutes travaillées pour une session clôturée (même logique que le chrono live).
 * 1. Somme des segments en base  2. Cumul persisté (jamais l’horloge murale en secours).
 */
export function getClosedSessionWorkedMinutes(
  row: SessionRowForWorkedTime,
  options?: {
    validSegmentMinutes?: number
    resumeSegmentMinutes?: number
    nowMs?: number
  }
): number {
  if (!row.ended_at) return 0

  const accumulated = row.worked_minutes_accumulated ?? 0
  const segmentTotal =
    (options?.validSegmentMinutes ?? 0) + (options?.resumeSegmentMinutes ?? 0)

  if (segmentTotal > 0) return segmentTotal
  if (accumulated > 0) return accumulated

  return 0
}

/** Cumul figé (minutes) + chronomètre si session ouverte. */
export function getSessionWorkedMinutes(
  row: SessionRowForWorkedTime,
  nowMs = Date.now()
): number {
  if (row.ended_at) {
    return getClosedSessionWorkedMinutes(row, { nowMs })
  }
  const baseMinutes = row.worked_minutes_accumulated ?? 0
  const runningMinutes = Math.floor(getRunningSessionMs(row, nowMs) / 60_000)
  return baseMinutes + runningMinutes
}

export function getSessionWorkedMs(row: SessionRowForWorkedTime, nowMs = Date.now()): number {
  return getSessionWorkedMinutes(row, nowMs) * 60_000
}

function frozenMinutesForEndedRow(
  row: SessionRowForWorkedTime,
  nowMs: number,
  segmentMinutes: { valid?: number; resume?: number } = {}
): number {
  return getClosedSessionWorkedMinutes(row, {
    validSegmentMinutes: segmentMinutes.valid ?? 0,
    resumeSegmentMinutes: segmentMinutes.resume ?? 0,
    nowMs,
  })
}

export type SessionSegmentMinutesMap = Record<
  string,
  { valid: number; resume: number }
>

export function computeTodayWorkedMs(
  rows: SessionRowForWorkedTime[],
  nowMs = Date.now(),
  minutesBySessionId: SessionSegmentMinutesMap = {}
): number {
  const todayRows = filterSessionsStartedToday(rows, new Date(nowMs))
  if (todayRows.length === 0) return 0

  const active = todayRows.find((row) => !row.ended_at)

  if (active) {
    let totalMinutes = getSessionWorkedMinutes(active, nowMs)
    for (const row of todayRows) {
      if (row.id && row.id !== active.id && row.ended_at) {
        const seg = row.id ? minutesBySessionId[row.id] : undefined
        totalMinutes += frozenMinutesForEndedRow(row, nowMs, seg)
      }
    }
    return totalMinutes * 60_000
  }

  const totalMinutes = todayRows.reduce((sum, row) => {
    const seg = row.id ? minutesBySessionId[row.id] : undefined
    return sum + frozenMinutesForEndedRow(row, nowMs, seg)
  }, 0)
  return totalMinutes * 60_000
}

export function computeTodayWorkedMinutes(
  rows: SessionRowForWorkedTime[],
  nowMs = Date.now(),
  minutesBySessionId: SessionSegmentMinutesMap = {}
): number {
  return Math.floor(computeTodayWorkedMs(rows, nowMs, minutesBySessionId) / 60_000)
}

export function computeUserDayWorkedMinutes(
  rows: SessionRowForWorkedTime[],
  minutesBySessionId: SessionSegmentMinutesMap = {},
  nowMs = Date.now()
): number {
  return computeTodayWorkedMinutes(rows, nowMs, minutesBySessionId)
}
