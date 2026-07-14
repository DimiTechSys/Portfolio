export function getLocalDayStart(date = new Date()): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

/** Fin de journée locale (23:59:59.999) pour la date du timestamp donné. */
export function getLocalDayEndIso(isoDate: string): string {
  const dayStart = getLocalDayStart(new Date(isoDate))
  const end = new Date(dayStart)
  end.setDate(end.getDate() + 1)
  end.setMilliseconds(end.getMilliseconds() - 1)
  return end.toISOString()
}

export function isSessionFromToday(startedAt: string, now = new Date()): boolean {
  return (
    getLocalDayStart(new Date(startedAt)).getTime() >= getLocalDayStart(now).getTime()
  )
}

export function getMsUntilNextLocalMidnight(now = new Date()): number {
  const next = getLocalDayStart(now)
  next.setDate(next.getDate() + 1)
  return Math.max(0, next.getTime() - now.getTime())
}

export function formatSessionClock(iso: string | null | undefined): string {
  if (!iso) return '-'
  return new Date(iso).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatWorkedDuration(totalMinutes: number): string {
  const minutes = Math.max(0, totalMinutes)
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

/** Affichage du chronomètre (heures + minutes uniquement, PC et mobile). */
export function formatWorkedElapsedMs(elapsedMs: number, _live = false): string {
  const totalMinutes = Math.max(0, Math.floor(elapsedMs / 60_000))
  return formatWorkedDuration(totalMinutes)
}

/** Sessions dont le pointage a commencé aujourd’hui (fuseau local, remise à 0 à 00:00). */
export function filterSessionsStartedToday<T extends { started_at: string }>(
  rows: T[],
  now = new Date()
): T[] {
  const todayStartMs = getLocalDayStart(now).getTime()
  return rows.filter((row) => new Date(row.started_at).getTime() >= todayStartMs)
}

export function getEarliestStartedAt(
  rows: { started_at: string }[]
): string | null {
  if (rows.length === 0) return null
  return rows.reduce(
    (min, row) => (row.started_at < min ? row.started_at : min),
    rows[0].started_at
  )
}

export function computeSegmentMinutes(
  startedAt: string,
  endedAt: string | null,
  nowMs: number = Date.now()
): number {
  const startedMs = new Date(startedAt).getTime()
  const endedMs = endedAt ? new Date(endedAt).getTime() : nowMs
  return Math.max(0, Math.floor((endedMs - startedMs) / 60000))
}
