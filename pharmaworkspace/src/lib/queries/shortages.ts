// src/lib/queries/shortages.ts
import { createClient } from '@/lib/supabase/client'
import { createNotification } from '@/lib/queries/notifications'
import { logAudit } from '@/lib/audit/log'
import { AUDIT_ACTIONS, AUDIT_TARGET_TYPES } from '@/lib/audit/actions'
import {
  applyKeysetCursor,
  sliceKeysetPage,
  type KeysetCursor,
} from '@/lib/queries/keyset-pagination'
import type {
  Shortage,
  NewShortage,
  UpdateShortage,
  ShortageStatus,
  QueryResult,
} from '@/types/index'

// ── Liste ────────────────────────────────────────────────────

export async function getShortages(
  pharmacyId: string,
  filters?: { status?: ShortageStatus }
): Promise<QueryResult<Shortage[]>> {
  const supabase = createClient()

  let query = supabase
    .from('shortages')
    .select('*')
    .eq('pharmacy_id', pharmacyId)
    .order('created_at', { ascending: false })

  if (filters?.status) query = query.eq('status', filters.status)

  const { data, error } = await query
  if (error) return { data: null, error: error.message }
  return { data: (data as Shortage[]) ?? [], error: null }
}

export async function getShortagesPaginated(
  pharmacyId: string,
  cursor?: KeysetCursor,
  limit = 50,
  filters?: { status?: ShortageStatus }
): Promise<QueryResult<{ items: Shortage[]; nextCursor: KeysetCursor | null }>> {
  const supabase = createClient()

  let query = supabase
    .from('shortages')
    .select('*')
    .eq('pharmacy_id', pharmacyId)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(limit + 1)

  if (filters?.status) query = query.eq('status', filters.status)

  query = applyKeysetCursor(query, cursor)

  const { data, error } = await query
  if (error) return { data: null, error: error.message }

  const rows = (data as Shortage[]) ?? []
  return { data: sliceKeysetPage(rows, limit), error: null }
}

export async function searchShortages(
  pharmacyId: string,
  query: string,
  limit = 50,
  filters?: { status?: ShortageStatus }
): Promise<QueryResult<Shortage[]>> {
  const trimmed = query.trim()
  if (!trimmed) return { data: [], error: null }

  const supabase = createClient()
  let request = supabase
    .from('shortages')
    .select('*')
    .eq('pharmacy_id', pharmacyId)
    .textSearch('search_vec', trimmed, { config: 'french', type: 'plain' })
    .order('created_at', { ascending: false })
    .limit(limit)

  if (filters?.status) request = request.eq('status', filters.status)

  const { data, error } = await request
  if (error) return { data: null, error: error.message }
  return { data: (data as Shortage[]) ?? [], error: null }
}

// ── Par ID ───────────────────────────────────────────────────

export async function getShortageById(
  id: string
): Promise<QueryResult<Shortage>> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('shortages')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return { data: null, error: error.message }
  return { data: data as Shortage, error: null }
}

// ── Création ─────────────────────────────────────────────────

export async function createShortage(
  payload: NewShortage
): Promise<QueryResult<Shortage>> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('shortages')
    .insert(payload)
    .select()
    .single()

  if (error) return { data: null, error: error.message }

  const { data: members } = await supabase
    .from('profiles')
    .select('id')
    .eq('pharmacy_id', data.pharmacy_id)

  const memberIds = (members ?? [])
    .map((member) => member.id)
    .filter((memberId) => memberId && memberId !== data.reported_by)

  await Promise.all(
    memberIds.map((memberId) =>
      createNotification({
        pharmacy_id: data.pharmacy_id,
        user_id: memberId,
        type: 'shortage_reported',
        title: 'Nouvelle rupture signalée',
        body: data.product_name,
        metadata: { shortage_id: data.id, target_url: '/shortages' },
      })
    )
  )

  void logAudit({
    action: AUDIT_ACTIONS.shortageReported,
    target_type: AUDIT_TARGET_TYPES.shortage,
    target_id: data.id,
    pharmacy_id: data.pharmacy_id,
    metadata: { product_name: data.product_name },
  })

  return { data, error: null }
}

// ── Mise à jour ───────────────────────────────────────────────

export async function updateShortage(
  id: string,
  payload: UpdateShortage
): Promise<QueryResult<Shortage>> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('shortages')
    .update(payload)
    .eq('id', id)
    .select()
    .single()

  if (error) return { data: null, error: error.message }

  void logAudit({
    action: AUDIT_ACTIONS.shortageUpdated,
    target_type: AUDIT_TARGET_TYPES.shortage,
    target_id: data.id,
    pharmacy_id: data.pharmacy_id,
    metadata: { product_name: data.product_name, status: data.status },
  })

  return { data, error: null }
}

// ── Suppression ───────────────────────────────────────────────

export async function deleteShortage(
  id: string
): Promise<QueryResult<null>> {
  const supabase = createClient()
  const { error } = await supabase
    .from('shortages')
    .delete()
    .eq('id', id)

  if (error) return { data: null, error: error.message }

  void logAudit({
    action: AUDIT_ACTIONS.shortageDeleted,
    target_type: AUDIT_TARGET_TYPES.shortage,
    target_id: id,
  })

  return { data: null, error: null }
}