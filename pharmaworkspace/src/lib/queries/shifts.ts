import { createClient } from '@/lib/supabase/client'
import { toDateKey } from '@/lib/planning/cell-status'
import type {
  QueryResult,
  ShiftTemplate,
  ShiftAssignment,
  ShiftAssignmentWithTemplate,
  ShiftKind,
} from '@/types/index'

function addDaysToDateKey(dateKey: string, n: number): string {
  const [y, m, d] = dateKey.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  dt.setDate(dt.getDate() + n)
  return toDateKey(dt)
}

const TEMPLATE_COLS =
  'id, pharmacy_id, name, kind, start_time, end_time, break_start, break_end, color, archived_at, created_by, created_at'

// ── Modèles de shifts ─────────────────────────────────────────────────────────

export async function getShiftTemplates(
  pharmacyId: string
): Promise<QueryResult<ShiftTemplate[]>> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('shift_templates')
    .select(TEMPLATE_COLS)
    .eq('pharmacy_id', pharmacyId)
    .is('archived_at', null)
    .order('start_time', { ascending: true })

  if (error) return { data: null, error: error.message }
  return { data: (data as ShiftTemplate[]) ?? [], error: null }
}

export type NewShiftTemplateInput = {
  pharmacy_id: string
  name: string
  kind: ShiftKind
  start_time: string
  end_time: string
  break_start?: string | null
  break_end?: string | null
  color?: string | null
}

export async function createShiftTemplate(
  input: NewShiftTemplateInput
): Promise<QueryResult<ShiftTemplate>> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('shift_templates')
    .insert({
      pharmacy_id: input.pharmacy_id,
      name: input.name,
      kind: input.kind,
      start_time: input.start_time,
      end_time: input.end_time,
      break_start: input.break_start ?? null,
      break_end: input.break_end ?? null,
      color: input.color ?? null,
      created_by: user?.id ?? null,
    })
    .select(TEMPLATE_COLS)
    .single()

  if (error) return { data: null, error: error.message }
  return { data: data as ShiftTemplate, error: null }
}

export async function updateShiftTemplate(
  id: string,
  patch: Partial<Omit<NewShiftTemplateInput, 'pharmacy_id'>>
): Promise<QueryResult<ShiftTemplate>> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('shift_templates')
    .update(patch)
    .eq('id', id)
    .select(TEMPLATE_COLS)
    .single()

  if (error) return { data: null, error: error.message }
  return { data: data as ShiftTemplate, error: null }
}

export async function archiveShiftTemplate(id: string): Promise<QueryResult<null>> {
  const supabase = createClient()
  const { error } = await supabase
    .from('shift_templates')
    .update({ archived_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return { data: null, error: error.message }
  return { data: null, error: null }
}

// ── Affectations ──────────────────────────────────────────────────────────────

export async function getShiftAssignmentsForWeek(
  pharmacyId: string,
  fromDate: string,
  toDate: string
): Promise<QueryResult<ShiftAssignmentWithTemplate[]>> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('shift_assignments')
    .select(
      `id, pharmacy_id, user_id, template_id, date, note, created_by, created_at, template:shift_templates(${TEMPLATE_COLS})`
    )
    .eq('pharmacy_id', pharmacyId)
    .gte('date', fromDate)
    .lte('date', toDate)

  if (error) return { data: null, error: error.message }
  return { data: (data as unknown as ShiftAssignmentWithTemplate[]) ?? [], error: null }
}

export async function createShiftAssignment(input: {
  pharmacy_id: string
  user_id: string
  template_id: string
  date: string
}): Promise<QueryResult<ShiftAssignment>> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('shift_assignments')
    .insert({
      pharmacy_id: input.pharmacy_id,
      user_id: input.user_id,
      template_id: input.template_id,
      date: input.date,
      created_by: user?.id ?? null,
    })
    .select('id, pharmacy_id, user_id, template_id, date, note, created_by, created_at')
    .single()

  if (error) return { data: null, error: error.message }
  return { data: data as ShiftAssignment, error: null }
}

export async function deleteShiftAssignment(id: string): Promise<QueryResult<null>> {
  const supabase = createClient()
  const { error } = await supabase.from('shift_assignments').delete().eq('id', id)
  if (error) return { data: null, error: error.message }
  return { data: null, error: null }
}

// Affectation en masse (remplissage rapide). Upsert avec ignoreDuplicates pour
// ne pas planter sur l'index unique (user_id, date, template_id).
export async function createShiftAssignmentsBulk(
  rows: { pharmacy_id: string; user_id: string; template_id: string; date: string }[]
): Promise<QueryResult<number>> {
  if (rows.length === 0) return { data: 0, error: null }
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const payload = rows.map((r) => ({ ...r, created_by: user?.id ?? null }))
  const { error } = await supabase
    .from('shift_assignments')
    .upsert(payload, { onConflict: 'user_id,date,template_id', ignoreDuplicates: true })
  if (error) return { data: null, error: error.message }
  return { data: rows.length, error: null }
}

// Recopie les affectations d'une semaine source vers une cible (décalage en
// jours, typiquement +7). Sert au bouton « Reprendre la semaine précédente ».
export async function copyWeekAssignments(
  pharmacyId: string,
  sourceFromDate: string,
  sourceToDate: string,
  targetOffsetDays: number
): Promise<QueryResult<number>> {
  const src = await getShiftAssignmentsForWeek(pharmacyId, sourceFromDate, sourceToDate)
  if (src.error) return { data: null, error: src.error }
  const rows = (src.data ?? []).map((a) => ({
    pharmacy_id: pharmacyId,
    user_id: a.user_id,
    template_id: a.template_id,
    date: addDaysToDateKey(a.date, targetOffsetDays),
  }))
  if (rows.length === 0) return { data: 0, error: null }
  return createShiftAssignmentsBulk(rows)
}
