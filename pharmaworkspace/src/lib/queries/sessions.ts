// src/lib/queries/sessions.ts
import { createClient } from '@/lib/supabase/client'
import { logAudit } from '@/lib/audit/log'
import { AUDIT_ACTIONS, AUDIT_TARGET_TYPES } from '@/lib/audit/actions'
import {
  computeSegmentMinutes,
  getEarliestStartedAt,
  getLocalDayEndIso,
  getLocalDayStart,
  isSessionFromToday,
} from '@/lib/sessions/time'
import {
  computeTodayWorkedMinutes,
  computeUserDayWorkedMinutes as sumUserDayWorkedMinutes,
  getClosedSessionWorkedMinutes,
  getSegmentStartIso,
  isFullWallClockSpan,
  SEGMENT_START_TOLERANCE_MS,
  type SessionSegmentMinutesMap,
} from '@/lib/sessions/worked-time'
import type { WorkSession, QueryResult } from '@/types/index'

/** Position transmise au pointage pour le contrôle geofence (BADGE-01). */
export type ClockInGeo = {
  latitude: number
  longitude: number
  accuracy: number
}

export type TeamSessionDaySummary = {
  user_id: string
  display_name: string
  avatar_url: string | null
  session_id: string | null
  started_at: string
  ended_at: string | null
  is_active: boolean
  worked_minutes_today: number
  tasks_completed: number
}

type JoinedProfile = {
  display_name: string | null
  first_name?: string | null
  last_name?: string | null
  avatar_url?: string | null
}

function normalizeJoinedProfile(
  value: JoinedProfile | JoinedProfile[] | null | undefined
): JoinedProfile | null {
  if (!value) return null
  return Array.isArray(value) ? (value[0] ?? null) : value
}

function getReadableProfileName(profile: JoinedProfile | null): string {
  if (!profile) return 'Utilisateur'
  const displayName = profile.display_name?.trim()
  if (displayName) return displayName
  const first = profile.first_name?.trim() ?? ''
  const last = profile.last_name?.trim() ?? ''
  const full = `${first} ${last}`.trim()
  return full || 'Utilisateur'
}

// ── Session active ───────────────────────────────────────────

/** Clôture les sessions encore ouvertes des jours précédents (fin de journée locale). */
export async function closeSessionsBeforeToday(
  userId: string,
  pharmacyId: string
): Promise<QueryResult<number>> {
  const supabase = createClient()

  const { data: openRows, error } = await supabase
    .from('work_sessions')
    .select('*')
    .eq('user_id', userId)
    .eq('pharmacy_id', pharmacyId)
    .is('ended_at', null)

  if (error) return { data: null, error: error.message }

  let closedCount = 0
  for (const row of (openRows ?? []) as WorkSession[]) {
    if (isSessionFromToday(row.started_at)) continue

    const endedAt = getLocalDayEndIso(row.started_at)
    const closeError = await finalizeSessionClose(
      supabase,
      row as SessionCloseRow,
      endedAt
    )
    if (!closeError) closedCount++
  }

  return { data: closedCount, error: null }
}

export async function getActiveSession(
  userId: string,
  pharmacyId: string
): Promise<QueryResult<WorkSession | null>> {
  const supabase = createClient()
  await closeSessionsBeforeToday(userId, pharmacyId)

  const todayStartIso = getLocalDayStart().toISOString()
  const { data, error } = await supabase
    .from('work_sessions')
    .select('*')
    .eq('user_id', userId)
    .eq('pharmacy_id', pharmacyId)
    .is('ended_at', null)
    .gte('started_at', todayStartIso)
    .order('started_at', { ascending: false })
    .limit(1)

  if (error) return { data: null, error: error.message }

  const session = (data?.[0] as WorkSession | undefined) ?? null
  if (!session) return { data: null, error: null }

  const fixed = await ensureCurrentSegmentStartedAt(supabase, session)
  return { data: fixed, error: null }
}

export async function getTodayUserSessions(
  userId: string,
  pharmacyId: string
): Promise<QueryResult<WorkSession[]>> {
  const supabase = createClient()
  const todayStart = getLocalDayStart()

  const { data, error } = await supabase
    .from('work_sessions')
    .select('*')
    .eq('user_id', userId)
    .eq('pharmacy_id', pharmacyId)
    .gte('started_at', todayStart.toISOString())
    .order('started_at', { ascending: true })

  if (error) return { data: null, error: error.message }
  return { data: (data as WorkSession[]) ?? [], error: null }
}

// ── Démarrer une session ─────────────────────────────────────

export async function startSession(
  geo?: ClockInGeo
): Promise<QueryResult<WorkSession>> {
  const supabase = createClient()
  const geoPatch = geo
    ? {
        clockin_latitude: geo.latitude,
        clockin_longitude: geo.longitude,
        clockin_accuracy_m: geo.accuracy,
      }
    : {}

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) {
    return { data: null, error: authError?.message ?? 'Non authentifié.' }
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('pharmacy_id')
    .eq('id', user.id)
    .single()

  if (profileError) {
    return { data: null, error: profileError.message }
  }
  if (!profile?.pharmacy_id) {
    return {
      data: null,
      error: 'Aucune officine associée à votre profil. Contactez le titulaire.',
    }
  }

  const pharmacyId = profile.pharmacy_id
  const userId = user.id

  await closeSessionsBeforeToday(userId, pharmacyId)

  const todayStartIso = getLocalDayStart().toISOString()
  const { data: openRows, error: openError } = await supabase
    .from('work_sessions')
    .select('*')
    .eq('user_id', userId)
    .eq('pharmacy_id', pharmacyId)
    .is('ended_at', null)
    .gte('started_at', todayStartIso)
    .order('started_at', { ascending: false })
    .limit(1)

  if (openError) return { data: null, error: openError.message }

  const openSession = (openRows?.[0] as WorkSession | undefined) ?? null
  if (openSession) {
    const fixed = await ensureCurrentSegmentStartedAt(supabase, openSession)
    return { data: fixed, error: null }
  }

  const { data: todayRows, error: todayError } = await supabase
    .from('work_sessions')
    .select('*')
    .eq('user_id', userId)
    .eq('pharmacy_id', pharmacyId)
    .gte('started_at', todayStartIso)
    .order('started_at', { ascending: true })

  if (todayError) return { data: null, error: todayError.message }

  const todaySessions = (todayRows ?? []) as WorkSession[]
  const endedToday = todaySessions.filter((row) => row.ended_at)
  if (endedToday.length > 0) {
    const toReopen = endedToday.reduce((latest, row) => {
      if (!latest.ended_at || !row.ended_at) return row
      return row.ended_at > latest.ended_at ? row : latest
    })
    const nowIso = new Date().toISOString()
    const priorAccumulated = toReopen.worked_minutes_accumulated ?? 0
    const { data: reopened, error: reopenError } = await updateWorkSessionRow(
      supabase,
      toReopen.id,
      {
        ended_at: null,
        current_segment_started_at: nowIso,
        worked_minutes_accumulated: priorAccumulated,
        ...geoPatch,
      }
    )

    if (reopenError || !reopened) {
      return {
        data: null,
        error:
          reopenError ??
          'Impossible de reprendre la session (migration 0017/0019 requise). Contactez le titulaire.',
      }
    }

    const fixed = await ensureCurrentSegmentStartedAt(supabase, reopened)
    return { data: fixed, error: null }
  }

  const nowIso = new Date().toISOString()
  let { data, error } = await supabase
    .from('work_sessions')
    .insert({
      user_id: userId,
      pharmacy_id: pharmacyId,
      current_segment_started_at: nowIso,
      ...geoPatch,
    })
    .select()
    .single()

  if (error) {
    const fallback = await supabase
      .from('work_sessions')
      .insert({ user_id: userId, pharmacy_id: pharmacyId, ...geoPatch })
      .select()
      .single()
    data = fallback.data
    error = fallback.error
  }

  if (error) return { data: null, error: error.message }

  const created = data as WorkSession
  const fixed = await ensureCurrentSegmentStartedAt(supabase, created)
  return { data: fixed, error: null }
}

// ── Terminer une session ─────────────────────────────────────

type SessionRowForMinutes = {
  id?: string
  started_at: string
  ended_at: string | null
  worked_minutes_accumulated?: number | null
  current_segment_started_at?: string | null
}

type WorkSessionSegmentRow = {
  session_id: string
  user_id: string
  minutes: number
  segment_started_at: string
  segment_ended_at: string
}

export type TodaySegmentsAggregate = {
  available: boolean
  minutesByUser: Record<string, number>
  minutesBySession: SessionSegmentMinutesMap
}

type WorkSessionPatch = {
  ended_at?: string | null
  worked_minutes_accumulated?: number
  current_segment_started_at?: string | null
  clockin_latitude?: number | null
  clockin_longitude?: number | null
  clockin_accuracy_m?: number | null
}

/** Met à jour une session et vérifie qu’une ligne est bien renvoyée (sinon RLS / migration). */
async function updateWorkSessionRow(
  supabase: ReturnType<typeof createClient>,
  sessionId: string,
  patch: WorkSessionPatch
): Promise<{ data: WorkSession | null; error: string | null }> {
  const { data, error } = await supabase
    .from('work_sessions')
    .update(patch)
    .eq('id', sessionId)
    .select()
    .maybeSingle()

  if (error) {
    return { data: null, error: error.message }
  }
  if (!data) {
    return {
      data: null,
      error:
        'Mise à jour de session refusée. Vérifiez que les migrations 0017/0018 sont appliquées sur Supabase.',
    }
  }
  return { data: data as WorkSession, error: null }
}

/** Session ouverte : ancrer le chrono (pointage initial ou reprise après pause). */
async function ensureCurrentSegmentStartedAt(
  supabase: ReturnType<typeof createClient>,
  row: WorkSession
): Promise<WorkSession> {
  if (row.ended_at) return row

  const accumulated = row.worked_minutes_accumulated ?? 0
  const seg = row.current_segment_started_at
  let needsFix = !seg

  if (!needsFix && accumulated > 0 && seg) {
    const segMs = new Date(seg).getTime()
    const startedMs = new Date(row.started_at).getTime()
    needsFix = segMs <= startedMs + SEGMENT_START_TOLERANCE_MS
  }

  if (!needsFix) return row

  const anchorIso =
    accumulated > 0 ? new Date().toISOString() : row.started_at

  const { data, error } = await updateWorkSessionRow(supabase, row.id, {
    current_segment_started_at: anchorIso,
  })

  if (error) {
    console.warn('[session] ensureCurrentSegmentStartedAt:', error)
    return row
  }
  return data ?? row
}

/**
 * Segment erroné : une ligne depuis le premier pointage qui couvre presque toute la session
 * (souvent en incluant les pauses). Les sessions courtes (< 90 min) ne sont jamais exclues.
 */
function isSegmentFromDayStart(
  segment: Pick<WorkSessionSegmentRow, 'segment_started_at'>,
  session: SessionRowForMinutes
): boolean {
  return (
    Math.abs(
      new Date(segment.segment_started_at).getTime() - new Date(session.started_at).getTime()
    ) < SEGMENT_START_TOLERANCE_MS
  )
}

export function isBogusWallClockSegment(
  segment: Pick<
    WorkSessionSegmentRow,
    'session_id' | 'segment_started_at' | 'segment_ended_at' | 'minutes'
  >,
  session: SessionRowForMinutes | null | undefined,
  allSessionSegments: WorkSessionSegmentRow[] = []
): boolean {
  if (!session) return false

  const wallEndIso = session.ended_at ?? segment.segment_ended_at
  const sessionWall = computeSegmentMinutes(session.started_at, wallEndIso)
  if (sessionWall < 15) return false

  const fromDayStart = isSegmentFromDayStart(segment, session)
  if (!fromDayStart) return false

  if (segment.minutes < sessionWall * 0.85) return false

  const otherMinutes = allSessionSegments
    .filter(
      (other) =>
        other.session_id === segment.session_id &&
        (other.segment_started_at !== segment.segment_started_at ||
          other.segment_ended_at !== segment.segment_ended_at) &&
        !isSegmentFromDayStart(other, session)
    )
    .reduce((sum, other) => sum + other.minutes, 0)

  if (otherMinutes > 0) return true

  const accumulated = session.worked_minutes_accumulated ?? 0
  if (accumulated > 0 && accumulated < sessionWall * 0.85) return true

  return false
}

function aggregateValidSegments(
  segments: WorkSessionSegmentRow[],
  sessionsById: Map<string, SessionRowForMinutes>
): { minutesByUser: Record<string, number>; minutesBySession: SessionSegmentMinutesMap } {
  const minutesByUser: Record<string, number> = {}
  const minutesBySession: SessionSegmentMinutesMap = {}

  const segmentsBySession = new Map<string, WorkSessionSegmentRow[]>()
  for (const segment of segments) {
    const list = segmentsBySession.get(segment.session_id) ?? []
    list.push(segment)
    segmentsBySession.set(segment.session_id, list)
  }

  const addMinutes = (
    sessionId: string,
    userId: string,
    kind: 'valid' | 'resume',
    minutes: number
  ) => {
    const bucket = minutesBySession[sessionId] ?? { valid: 0, resume: 0 }
    bucket[kind] += minutes
    minutesBySession[sessionId] = bucket
    minutesByUser[userId] = (minutesByUser[userId] ?? 0) + minutes
  }

  for (const segment of segments) {
    if (!sessionsById.has(segment.session_id)) continue
    const session = sessionsById.get(segment.session_id)!
    const sessionSegments = segmentsBySession.get(segment.session_id) ?? []

    if (!isSegmentFromDayStart(segment, session)) {
      addMinutes(segment.session_id, segment.user_id, 'resume', segment.minutes)
      continue
    }

    if (isBogusWallClockSegment(segment, session, sessionSegments)) continue
    addMinutes(segment.session_id, segment.user_id, 'valid', segment.minutes)
  }

  return { minutesByUser, minutesBySession }
}

export async function fetchTodayValidSegments(
  pharmacyId: string,
  sessions: (SessionRowForMinutes & { id: string; user_id: string })[]
): Promise<TodaySegmentsAggregate> {
  const supabase = createClient()
  const todayStartIso = getLocalDayStart().toISOString()
  const sessionsById = new Map(sessions.map((row) => [row.id, row]))

  const { data, error } = await supabase
    .from('work_session_segments')
    .select('session_id, user_id, minutes, segment_started_at, segment_ended_at')
    .eq('pharmacy_id', pharmacyId)
    .gte('segment_started_at', todayStartIso)

  if (error) {
    if (error.message.includes('work_session_segments')) {
      return { available: false, minutesByUser: {}, minutesBySession: {} }
    }
    return { available: false, minutesByUser: {}, minutesBySession: {} }
  }

  const { minutesByUser, minutesBySession } = aggregateValidSegments(
    (data ?? []) as WorkSessionSegmentRow[],
    sessionsById
  )

  return { available: true, minutesByUser, minutesBySession }
}

function getEndedRowDisplayMinutes(
  row: SessionRowForMinutes,
  segmentMinutes: { valid: number; resume: number },
  nowMs: number
): number {
  return getClosedSessionWorkedMinutes(row, {
    validSegmentMinutes: segmentMinutes.valid,
    resumeSegmentMinutes: segmentMinutes.resume,
    nowMs,
  })
}

/**
 * Minutes travaillées sur une ligne (affichage / legacy sans table segments).
 */
export function sessionWorkedMinutesFromRow(
  row: SessionRowForMinutes,
  nowMs = Date.now(),
  segmentMinutes: { valid: number; resume: number } = { valid: 0, resume: 0 }
): number {
  if (!row.ended_at) {
    return computeTodayWorkedMinutes([row], nowMs)
  }
  return getEndedRowDisplayMinutes(row, segmentMinutes, nowMs)
}

/** Minutes du chronomètre en cours (0 hors session). */
export function getActiveSegmentMinutes(
  row: SessionRowForMinutes,
  nowMs = Date.now()
): number {
  if (row.ended_at) return 0
  return Math.floor(
    Math.max(0, nowMs - new Date(getSegmentStartIso(row)).getTime()) / 60_000
  )
}

/** Temps travaillé aujourd’hui (minutes), avec segments valides par session. */
export function computeUserDayWorkedMinutes(
  rows: (SessionRowForMinutes & { id?: string; user_id?: string })[],
  segments?: TodaySegmentsAggregate,
  nowMs = Date.now()
): number {
  return sumUserDayWorkedMinutes(
    rows,
    segments?.available ? segments.minutesBySession : {},
    nowMs
  )
}

export async function getTodaySegmentsMinutesForUser(
  userId: string,
  pharmacyId: string
): Promise<QueryResult<number>> {
  const todayResult = await getTodayUserSessions(userId, pharmacyId)
  if (todayResult.error || !todayResult.data) {
    return { data: 0, error: todayResult.error }
  }

  const sessions = todayResult.data as (SessionRowForMinutes & {
    id: string
    user_id: string
  })[]
  const aggregate = await fetchTodayValidSegments(pharmacyId, sessions)
  return {
    data: computeUserDayWorkedMinutes(sessions, aggregate),
    error: null,
  }
}

type SessionCloseRow = SessionRowForMinutes & {
  id: string
  user_id: string
  pharmacy_id: string
}

/**
 * Clôture : ajoute la durée du segment en cours au cumul, arrête le chrono, fige ended_at.
 */
async function finalizeSessionClose(
  supabase: ReturnType<typeof createClient>,
  row: SessionCloseRow,
  endedAt: string
): Promise<string | null> {
  const liveRow = await ensureCurrentSegmentStartedAt(supabase, row as WorkSession)
  const closeRow: SessionCloseRow = {
    ...row,
    started_at: liveRow.started_at,
    worked_minutes_accumulated: liveRow.worked_minutes_accumulated,
    current_segment_started_at: liveRow.current_segment_started_at,
  }

  const segmentStart = getSegmentStartIso(closeRow)
  const segmentMinutes = computeSegmentMinutes(segmentStart, endedAt)
  const accumulated = (closeRow.worked_minutes_accumulated ?? 0) + segmentMinutes

  const fullPatch = {
    ended_at: endedAt,
    worked_minutes_accumulated: accumulated,
    current_segment_started_at: null,
  } as const

  const { error: updateError } = await updateWorkSessionRow(supabase, closeRow.id, fullPatch)

  if (updateError) {
    const { error: withoutNullSegment } = await updateWorkSessionRow(supabase, closeRow.id, {
      ended_at: endedAt,
      worked_minutes_accumulated: accumulated,
    })
    if (!withoutNullSegment) {
      await updateWorkSessionRow(supabase, closeRow.id, {
        current_segment_started_at: null,
      })
    } else {
      const { error: endedOnlyError } = await updateWorkSessionRow(supabase, closeRow.id, {
        ended_at: endedAt,
      })
      if (endedOnlyError) return endedOnlyError
      if (accumulated > 0) {
        const { error: accumError } = await updateWorkSessionRow(supabase, closeRow.id, {
          worked_minutes_accumulated: accumulated,
        })
        if (accumError) {
          console.warn('[session] worked_minutes_accumulated non enregistré:', accumError)
        }
      }
    }
  }

  const skipBogusSegment = isFullWallClockSpan(closeRow, segmentStart, segmentMinutes, endedAt)
  if (segmentMinutes > 0 && !skipBogusSegment) {
    const { error: segmentError } = await supabase.from('work_session_segments').insert({
      session_id: closeRow.id,
      user_id: closeRow.user_id,
      pharmacy_id: closeRow.pharmacy_id,
      segment_started_at: segmentStart,
      segment_ended_at: endedAt,
      minutes: segmentMinutes,
    })
    if (segmentError && !segmentError.message.includes('work_session_segments')) {
      console.warn('[session] segment insert:', segmentError.message)
    }
  }

  return null
}

/** Somme des périodes badgées du jour (pauses exclues, doublons fusionnés). */
export function aggregateUserDayWorkedMinutes(
  rows: SessionRowForMinutes[],
  nowMs = Date.now()
): number {
  if (rows.length === 0) return 0
  if (rows.length === 1) return sessionWorkedMinutesFromRow(rows[0], nowMs)

  return computeUserDayWorkedMinutes(rows, { available: false, minutesByUser: {}, minutesBySession: {} }, nowMs)
}

export async function endSession(
  sessionId: string
): Promise<QueryResult<WorkSession>> {
  const supabase = createClient()

  const { data: current, error: fetchError } = await supabase
    .from('work_sessions')
    .select('*')
    .eq('id', sessionId)
    .single()

  if (fetchError) return { data: null, error: fetchError.message }

  const row = current as WorkSession
  const endedAt = new Date().toISOString()
  const closeError = await finalizeSessionClose(supabase, row, endedAt)
  if (closeError) return { data: null, error: closeError }

  const { data, error } = await supabase
    .from('work_sessions')
    .select('*')
    .eq('id', sessionId)
    .single()

  if (error) return { data: null, error: error.message }

  const session = data as WorkSession
  void logAudit({
    action: AUDIT_ACTIONS.clockOut,
    target_type: AUDIT_TARGET_TYPES.workSession,
    target_id: session.id,
    pharmacy_id: session.pharmacy_id,
  })

  return { data: session, error: null }
}

// ── KPIs Dashboard ───────────────────────────────────────────

export async function getDashboardKpis(
  pharmacyId: string
): Promise<QueryResult<{
  tasksTotal: number
  tasksInProgress: number
  tasksDueToday: number
  tasksOverdue: number
  prescriptionsToServe: number
  prescriptionsOnHold: number
  rentalsOverdue: number
  rentalsInProgress: number
  shortagesOpen: number
  ordersInProgress: number
}>> {
  const supabase = createClient()
  const today = new Date().toISOString().split('T')[0]

  const [
    tasksTotalRes,
    tasksDueTodayRes,
    tasksOverdueRes,
    prescriptionsToServeRes,
    prescriptionsOnHoldRes,
    rentalsOverdueRes,
    rentalsInProgressRes,
    shortagesOpenRes,
    ordersInProgressRes,
  ] = await Promise.all([
    supabase.from('tasks').select('*', { count: 'exact', head: true })
      .eq('pharmacy_id', pharmacyId)
      .eq('status', 'todo'),
    supabase.from('tasks').select('*', { count: 'exact', head: true })
      .eq('pharmacy_id', pharmacyId)
      .eq('due_date', today)
      .neq('status', 'done'),
    supabase.from('tasks').select('*', { count: 'exact', head: true })
      .eq('pharmacy_id', pharmacyId)
      .lt('due_date', today)
      .eq('status', 'todo'),
    supabase.from('prescriptions').select('*', { count: 'exact', head: true })
      .eq('pharmacy_id', pharmacyId)
      .eq('status', 'to_serve'),
    supabase.from('prescriptions').select('*', { count: 'exact', head: true })
      .eq('pharmacy_id', pharmacyId)
      .eq('status', 'on_hold'),
    supabase.from('rentals').select('*', { count: 'exact', head: true })
      .eq('pharmacy_id', pharmacyId)
      .eq('status', 'active')
      .lt('expected_return', today),
    supabase.from('rentals').select('*', { count: 'exact', head: true })
      .eq('pharmacy_id', pharmacyId)
      .eq('status', 'active'),
    supabase.from('shortages').select('*', { count: 'exact', head: true })
      .eq('pharmacy_id', pharmacyId)
      .eq('status', 'open'),
    supabase.from('orders').select('*', { count: 'exact', head: true })
      .eq('pharmacy_id', pharmacyId)
      .in('status', ['sent']),
  ])

  return {
    data: {
      tasksTotal:            tasksTotalRes.count ?? 0,
      tasksInProgress:       tasksTotalRes.count ?? 0,
      tasksDueToday:         tasksDueTodayRes.count ?? 0,
      tasksOverdue:          tasksOverdueRes.count ?? 0,
      prescriptionsToServe:  prescriptionsToServeRes.count ?? 0,
      prescriptionsOnHold:   prescriptionsOnHoldRes.count ?? 0,
      rentalsOverdue:        rentalsOverdueRes.count ?? 0,
      rentalsInProgress:     rentalsInProgressRes.count ?? 0,
      shortagesOpen:         shortagesOpenRes.count ?? 0,
      ordersInProgress:      ordersInProgressRes.count ?? 0,
    },
    error: null,
  }
}

// ── Équipe du jour (sessions) ────────────────────────────────

export async function getTodayTeamSessions(
  pharmacyId: string
): Promise<
  QueryResult<
    {
      user_id: string
      display_name: string
      started_at: string
      ended_at: string | null
      tasks_completed: number
    }[]
  >
> {
  const supabase = createClient()
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  type SessionRow = {
    user_id: string
    started_at: string
    ended_at: string | null
    tasks_completed: number | null
    profiles: JoinedProfile | JoinedProfile[] | null
  }

  const { data, error } = await supabase
    .from('work_sessions')
    .select(
      `
      user_id,
      started_at,
      ended_at,
      tasks_completed,
      profiles!user_id (
        display_name,
        first_name,
        last_name
      )
    `
    )
    .eq('pharmacy_id', pharmacyId)
    .gte('started_at', todayStart.toISOString())
    .order('started_at', { ascending: false })

  if (error) return { data: null, error: error.message }

  const rows = ((data ?? []) as SessionRow[]).map((row) => {
    const profile = normalizeJoinedProfile(row.profiles)
    return {
      user_id: row.user_id,
      display_name: getReadableProfileName(profile),
      started_at: row.started_at,
      ended_at: row.ended_at,
      tasks_completed: row.tasks_completed ?? 0,
    }
  })

  return { data: rows, error: null }
}

export async function getTodayTeamSessionsSummary(
  pharmacyId: string
): Promise<QueryResult<TeamSessionDaySummary[]>> {
  const supabase = createClient()
  const todayStartIso = getLocalDayStart().toISOString()

  type SessionRow = SessionRowForMinutes & {
    id: string
    user_id: string
    tasks_completed: number | null
  }

  const { data: sessions, error } = await supabase
    .from('work_sessions')
    .select('*')
    .eq('pharmacy_id', pharmacyId)
    .gte('started_at', todayStartIso)
    .order('started_at', { ascending: true })

  if (error) return { data: null, error: error.message }

  const rows = (sessions ?? []) as SessionRow[]
  if (rows.length === 0) return { data: [], error: null }

  const segmentsAggregate = await fetchTodayValidSegments(pharmacyId, rows)

  const rowsByUser = new Map<string, SessionRow[]>()
  for (const row of rows) {
    const list = rowsByUser.get(row.user_id) ?? []
    list.push(row)
    rowsByUser.set(row.user_id, list)
  }

  const byUser = new Map<
    string,
    {
      session_id: string | null
      started_at: string
      ended_at: string | null
      is_active: boolean
      worked_minutes_today: number
      tasks_completed: number
    }
  >()

  for (const [userId, userRows] of rowsByUser) {
    const startedAt = getEarliestStartedAt(userRows) ?? userRows[0].started_at
    const activeRow = userRows.find((row) => !row.ended_at)
    const endedRows = userRows.filter((row) => row.ended_at)
    const latestEndedAt =
      endedRows.length > 0
        ? endedRows.reduce((max, row) => {
            if (!row.ended_at) return max
            return !max || row.ended_at > max ? row.ended_at : max
          }, null as string | null)
        : null

    byUser.set(userId, {
      session_id: activeRow?.id ?? null,
      started_at: startedAt,
      ended_at: activeRow ? null : latestEndedAt,
      is_active: Boolean(activeRow),
      worked_minutes_today: computeUserDayWorkedMinutes(userRows, segmentsAggregate),
      tasks_completed: Math.max(...userRows.map((row) => row.tasks_completed ?? 0)),
    })
  }

  const userIds = [...byUser.keys()]
  const profilesByUserId: Record<string, JoinedProfile & { id: string }> = {}
  if (userIds.length > 0) {
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, display_name, first_name, last_name, avatar_url')
      .in('id', userIds)

    if (!profilesError) {
      for (const p of profiles ?? []) {
        profilesByUserId[p.id] = p as JoinedProfile & { id: string }
      }
    }
  }

  const summaries: TeamSessionDaySummary[] = userIds.map((userId) => {
    const agg = byUser.get(userId)!
    const profile = profilesByUserId[userId] ?? null
    return {
      user_id: userId,
      display_name: getReadableProfileName(profile),
      avatar_url: profile?.avatar_url ?? null,
      session_id: agg.session_id,
      started_at: agg.started_at,
      ended_at: agg.ended_at,
      is_active: agg.is_active,
      worked_minutes_today: agg.worked_minutes_today,
      tasks_completed: agg.tasks_completed,
    }
  })

  summaries.sort((a, b) => {
    if (a.is_active !== b.is_active) return a.is_active ? -1 : 1
    return a.started_at.localeCompare(b.started_at)
  })

  return { data: summaries, error: null }
}

/** @deprecated Utiliser getTodayTeamSessionsSummary */
export async function getActiveSessionsToday(pharmacyId: string) {
  const result = await getTodayTeamSessionsSummary(pharmacyId)
  if (result.error) return { data: null, error: result.error }
  return {
    data: (result.data ?? [])
      .filter((row) => row.is_active)
      .map((row) => ({
        session_id: row.session_id ?? '',
        user_id: row.user_id,
        display_name: row.display_name,
        avatar_url: row.avatar_url,
        started_at: row.started_at,
        tasks_completed: row.tasks_completed,
        worked_minutes_today: row.worked_minutes_today,
      })),
    error: null,
  }
}