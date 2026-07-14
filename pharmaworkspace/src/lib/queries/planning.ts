import { createClient } from '@/lib/supabase/client'
import { logAudit } from '@/lib/audit/log'
import { AUDIT_ACTIONS, AUDIT_TARGET_TYPES } from '@/lib/audit/actions'
import { getMondayOfWeek } from '@/lib/agenda-utils'
import { toDateKey } from '@/lib/planning/cell-status'
import { aggregateUserDayWorkedMinutes } from '@/lib/queries/sessions'
import type {
  LeaveRequest,
  LeaveRequestWithProfiles,
  Profile,
  QueryResult,
  WeeklySchedule,
} from '@/types/index'

const LEAVE_SELECT = `
  *,
  requester:profiles!leave_requests_requester_id_fkey(id, display_name, first_name, last_name),
  reviewer:profiles!leave_requests_reviewed_by_fkey(id, display_name, first_name, last_name)
`

function getReadableProfileName(
  profile: Pick<Profile, 'display_name' | 'first_name' | 'last_name'> | null
): string {
  if (!profile) return 'Utilisateur'
  const displayName = profile.display_name?.trim()
  if (displayName) return displayName
  const first = profile.first_name?.trim() ?? ''
  const last = profile.last_name?.trim() ?? ''
  return `${first} ${last}`.trim() || 'Utilisateur'
}

export function getProfileDisplayName(
  profile: Pick<Profile, 'display_name' | 'first_name' | 'last_name'>
): string {
  return getReadableProfileName(profile)
}

export async function getLeaveRequestsForPharmacy(
  pharmacyId: string,
  options?: { status?: LeaveRequest['status']; fromDate?: string; toDate?: string }
): Promise<QueryResult<LeaveRequestWithProfiles[]>> {
  const supabase = createClient()
  let query = supabase
    .from('leave_requests')
    .select(LEAVE_SELECT)
    .eq('pharmacy_id', pharmacyId)
    .order('created_at', { ascending: false })

  if (options?.status) query = query.eq('status', options.status)
  if (options?.fromDate) query = query.gte('end_date', options.fromDate)
  if (options?.toDate) query = query.lte('start_date', options.toDate)

  const { data, error } = await query
  if (error) return { data: null, error: error.message }
  return { data: (data as LeaveRequestWithProfiles[]) ?? [], error: null }
}

export async function getLeaveRequestsForUser(
  pharmacyId: string,
  userId: string
): Promise<QueryResult<LeaveRequestWithProfiles[]>> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('leave_requests')
    .select(LEAVE_SELECT)
    .eq('pharmacy_id', pharmacyId)
    .eq('requester_id', userId)
    .order('created_at', { ascending: false })

  if (error) return { data: null, error: error.message }
  return { data: (data as LeaveRequestWithProfiles[]) ?? [], error: null }
}

export async function getPendingLeaveRequests(
  pharmacyId: string
): Promise<QueryResult<LeaveRequestWithProfiles[]>> {
  return getLeaveRequestsForPharmacy(pharmacyId, { status: 'pending' })
}

export async function getWeeklySchedules(
  pharmacyId: string
): Promise<QueryResult<WeeklySchedule[]>> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('weekly_schedules')
    .select('*')
    .eq('pharmacy_id', pharmacyId)

  if (error) return { data: null, error: error.message }
  return { data: (data as WeeklySchedule[]) ?? [], error: null }
}

// Suppression du pointage d'un membre sur une journée (titulaire) — passe par
// la route service-role (la RLS interdit au titulaire de supprimer les sessions
// d'autrui). `fromIso`/`toIso` = bornes [from, to) de la journée locale.
export async function deleteMemberDayPresence(
  userId: string,
  fromIso: string,
  toIso: string
): Promise<QueryResult<null>> {
  try {
    const res = await fetch('/api/planning/sessions/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, from: fromIso, to: toIso }),
    })
    if (!res.ok) {
      return { data: null, error: 'Suppression du pointage impossible.' }
    }
    return { data: null, error: null }
  } catch {
    return { data: null, error: 'Suppression du pointage impossible (réseau).' }
  }
}

export type WeekSegmentMinutes = Record<string, Record<string, number>>

// Temps travaillé par (user, jour) sur la semaine, calculé depuis work_sessions
// (source fiable : une session continue ne crée pas de segment, son temps vit
// dans worked_minutes_accumulated). Remplace l'usage des segments pour le
// « présent » du planning.
export async function fetchWeekWorkedMinutes(
  pharmacyId: string,
  weekStart: Date,
  weekEnd: Date
): Promise<QueryResult<WeekSegmentMinutes>> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('work_sessions')
    .select('*')
    .eq('pharmacy_id', pharmacyId)
    .gte('started_at', weekStart.toISOString())
    .lt('started_at', weekEnd.toISOString())

  if (error) return { data: null, error: error.message }

  // Regroupe par user → jour (date locale du started_at) → lignes de session.
  const byUserDay = new Map<string, Map<string, unknown[]>>()
  for (const row of data ?? []) {
    const r = row as { user_id: string; started_at: string }
    const dateKey = toDateKey(new Date(r.started_at))
    let dayMap = byUserDay.get(r.user_id)
    if (!dayMap) {
      dayMap = new Map()
      byUserDay.set(r.user_id, dayMap)
    }
    const list = dayMap.get(dateKey) ?? []
    list.push(row)
    dayMap.set(dateKey, list)
  }

  const now = Date.now()
  const result: WeekSegmentMinutes = {}
  for (const [userId, dayMap] of byUserDay) {
    for (const [dateKey, rows] of dayMap) {
      const minutes = aggregateUserDayWorkedMinutes(
        rows as Parameters<typeof aggregateUserDayWorkedMinutes>[0],
        now
      )
      if (minutes > 0) {
        if (!result[userId]) result[userId] = {}
        result[userId][dateKey] = minutes
      }
    }
  }
  return { data: result, error: null }
}

export async function fetchWeekSegmentMinutes(
  pharmacyId: string,
  weekStart: Date,
  weekEnd: Date
): Promise<QueryResult<WeekSegmentMinutes>> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('work_session_segments')
    .select('user_id, minutes, segment_started_at')
    .eq('pharmacy_id', pharmacyId)
    .gte('segment_started_at', weekStart.toISOString())
    .lt('segment_started_at', weekEnd.toISOString())

  if (error) {
    if (error.message.includes('work_session_segments')) {
      return { data: {}, error: null }
    }
    return { data: null, error: error.message }
  }

  const result: WeekSegmentMinutes = {}
  for (const row of data ?? []) {
    const userId = row.user_id as string
    const startedAt = new Date(row.segment_started_at as string)
    const key = toDateKey(startedAt)
    if (!result[userId]) result[userId] = {}
    result[userId][key] = (result[userId][key] ?? 0) + Number(row.minutes ?? 0)
  }

  return { data: result, error: null }
}

export function isScheduleActiveOnDate(
  schedule: WeeklySchedule,
  date: Date
): boolean {
  const dateKey = toDateKey(date)
  if (dateKey < schedule.active_from) return false
  if (schedule.active_until && dateKey > schedule.active_until) return false
  return schedule.day_of_week === date.getDay()
}

export function getWeekRange(weekOffset: number): {
  monday: Date
  sunday: Date
  weekEndExclusive: Date
  days: Date[]
} {
  const monday = getMondayOfWeek(weekOffset)
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    d.setHours(0, 0, 0, 0)
    return d
  })
  const sunday = days[6]!
  const weekEndExclusive = new Date(sunday)
  weekEndExclusive.setDate(sunday.getDate() + 1)
  weekEndExclusive.setHours(0, 0, 0, 0)
  return { monday, sunday, weekEndExclusive, days }
}

// Annulation par le TITULAIRE (depuis la grille planning) : retire le congé
// (n'importe quel statut, n'importe quel membre de l'officine). RLS
// `leave_requests_update` autorise déjà le titulaire sur sa pharmacie.
export async function cancelLeaveAsTitulaire(
  leaveId: string
): Promise<QueryResult<LeaveRequest>> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('leave_requests')
    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('id', leaveId)
    .select()
    .single()

  if (error) return { data: null, error: error.message }

  void logAudit({
    action: AUDIT_ACTIONS.leaveRequestCancelled,
    target_type: AUDIT_TARGET_TYPES.leaveRequest,
    target_id: leaveId,
    pharmacy_id: (data as LeaveRequest).pharmacy_id,
  })

  return { data: data as LeaveRequest, error: null }
}

export async function cancelLeaveRequest(
  leaveId: string
): Promise<QueryResult<LeaveRequest>> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Non authentifié' }

  const { data, error } = await supabase
    .from('leave_requests')
    .update({
      status: 'cancelled',
      updated_at: new Date().toISOString(),
    })
    .eq('id', leaveId)
    .eq('requester_id', user.id)
    .eq('status', 'pending')
    .select()
    .single()

  if (error) return { data: null, error: error.message }

  void logAudit({
    action: AUDIT_ACTIONS.leaveRequestCancelled,
    target_type: AUDIT_TARGET_TYPES.leaveRequest,
    target_id: data.id,
    pharmacy_id: data.pharmacy_id,
  })

  return { data: data as LeaveRequest, error: null }
}
