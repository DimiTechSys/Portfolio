// src/lib/queries/rentals.ts
import { createClient } from '@/lib/supabase/client'
import { logAudit } from '@/lib/audit/log'
import { AUDIT_ACTIONS, AUDIT_TARGET_TYPES } from '@/lib/audit/actions'
import {
  applyKeysetCursor,
  sliceKeysetPage,
  type KeysetCursor,
} from '@/lib/queries/keyset-pagination'
import type {
  Rental,
  NewRental,
  UpdateRental,
  RentalStatus,
  QueryResult,
} from '@/types/index'

/** Vue de liste des locations. 'all' = tout sauf retournées (liste principale). */
export type RentalListStatus = RentalStatus | 'all'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyRentalStatus(query: any, status: RentalListStatus | undefined) {
  if (status === 'returned') return query.eq('status', 'returned')
  if (status === 'active') return query.eq('status', 'active')
  if (status === 'overdue') {
    // Overdue = non retournée dont la date de retour est passée (indépendant de la
    // matérialisation cron du statut). today en date locale ISO (YYYY-MM-DD).
    const today = new Date().toISOString().split('T')[0]
    return query.neq('status', 'returned').lt('expected_return', today)
  }
  // 'all' / undefined → liste principale : on masque les retournées.
  return query.neq('status', 'returned')
}

// ── Liste ────────────────────────────────────────────────────

export async function getRentals(
  pharmacyId: string,
  filters?: { status?: RentalStatus }
): Promise<QueryResult<Rental[]>> {
  const supabase = createClient()

  let query = supabase
    .from('rentals')
    .select('*')
    .eq('pharmacy_id', pharmacyId)
    .order('created_at', { ascending: false })

  if (filters?.status) query = query.eq('status', filters.status)

  const { data, error } = await query
  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

export async function getRentalsPaginated(
  pharmacyId: string,
  cursor?: KeysetCursor,
  limit = 20,
  filters?: { status?: RentalListStatus }
): Promise<QueryResult<{ items: Rental[]; nextCursor: KeysetCursor | null }>> {
  const supabase = createClient()

  let query = supabase
    .from('rentals')
    .select('*')
    .eq('pharmacy_id', pharmacyId)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(limit + 1)

  query = applyRentalStatus(query, filters?.status)
  query = applyKeysetCursor(query, cursor)

  const { data, error } = await query
  if (error) return { data: null, error: error.message }

  const rows = (data as Rental[]) ?? []
  return { data: sliceKeysetPage(rows, limit), error: null }
}

export async function searchRentals(
  pharmacyId: string,
  search: string,
  limit = 50,
  filters?: { status?: RentalListStatus }
): Promise<QueryResult<Rental[]>> {
  const trimmed = search.trim()
  if (!trimmed) return { data: [], error: null }

  const supabase = createClient()
  // Échappe les caractères spéciaux ilike/PostgREST (%, _, virgule).
  const safe = trimmed.replace(/[%_,()]/g, ' ')

  let query = supabase
    .from('rentals')
    .select('*')
    .eq('pharmacy_id', pharmacyId)
    .or(`client_name.ilike.%${safe}%,equipment.ilike.%${safe}%`)
    .order('created_at', { ascending: false })
    .limit(limit)

  query = applyRentalStatus(query, filters?.status)

  const { data, error } = await query
  if (error) return { data: null, error: error.message }
  return { data: (data as Rental[]) ?? [], error: null }
}

export async function countRentalsByStatus(
  pharmacyId: string,
  status: RentalListStatus
): Promise<QueryResult<number>> {
  const supabase = createClient()
  let query = supabase
    .from('rentals')
    .select('*', { count: 'exact', head: true })
    .eq('pharmacy_id', pharmacyId)
  query = applyRentalStatus(query, status)
  const { count, error } = await query
  if (error) return { data: null, error: error.message }
  return { data: count ?? 0, error: null }
}

// ── Par ID ───────────────────────────────────────────────────

export async function getRentalById(
  id: string
): Promise<QueryResult<Rental>> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('rentals')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

// ── Création ─────────────────────────────────────────────────

export async function createRental(
  payload: NewRental
): Promise<QueryResult<Rental>> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('rentals')
    .insert(payload)
    .select()
    .single()

  if (error) return { data: null, error: error.message }

  void logAudit({
    action: AUDIT_ACTIONS.rentalCreated,
    target_type: AUDIT_TARGET_TYPES.rental,
    target_id: data.id,
    pharmacy_id: data.pharmacy_id,
    metadata: { status: data.status },
  })

  return { data, error: null }
}

// ── Mise à jour ───────────────────────────────────────────────

export async function updateRental(
  id: string,
  payload: UpdateRental
): Promise<QueryResult<Rental>> {
  const supabase = createClient()

  if (payload.status === 'returned' && !payload.returned_at) {
    payload.returned_at = new Date().toISOString().split('T')[0]
  }

  const { data, error } = await supabase
    .from('rentals')
    .update(payload)
    .eq('id', id)
    .select()
    .single()

  if (error) return { data: null, error: error.message }

  void logAudit({
    action: AUDIT_ACTIONS.rentalUpdated,
    target_type: AUDIT_TARGET_TYPES.rental,
    target_id: data.id,
    pharmacy_id: data.pharmacy_id,
    metadata: { status: data.status },
  })

  return { data, error: null }
}

// ── Suppression ───────────────────────────────────────────────

export async function deleteRental(
  id: string
): Promise<QueryResult<null>> {
  const supabase = createClient()
  const { error } = await supabase
    .from('rentals')
    .delete()
    .eq('id', id)

  if (error) return { data: null, error: error.message }

  void logAudit({
    action: AUDIT_ACTIONS.rentalDeleted,
    target_type: AUDIT_TARGET_TYPES.rental,
    target_id: id,
  })
  return { data: null, error: null }
}