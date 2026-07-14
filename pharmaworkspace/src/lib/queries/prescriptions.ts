// src/lib/queries/prescriptions.ts
import { createClient } from '@/lib/supabase/client'
import { AUDIT_ACTIONS, AUDIT_TARGET_TYPES } from '@/lib/audit/actions'
import { logAudit } from '@/lib/audit/log'
import {
  applyKeysetCursor,
  sliceKeysetPage,
  type KeysetCursor,
} from '@/lib/queries/keyset-pagination'
import type {
  Prescription,
  NewPrescription,
  UpdatePrescription,
  PrescriptionWithComments,
  PrescriptionComment,
  PrescriptionStatus,
  TaskPriority,
  QueryResult,
} from '@/types/index'

// ── Liste ────────────────────────────────────────────────────

export async function getPrescriptions(
  pharmacyId: string,
  filters?: { status?: PrescriptionStatus; priority?: TaskPriority }
): Promise<QueryResult<Prescription[]>> {
  const supabase = createClient()

  let query = supabase
    .from('prescriptions')
    .select('*, items:prescription_items(medication_name)')
    .eq('pharmacy_id', pharmacyId)
    .order('created_at', { ascending: false })

  if (filters?.status) query = query.eq('status', filters.status)
  if (filters?.priority) query = query.eq('priority', filters.priority)

  const { data, error } = await query
  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

export async function getPrescriptionsPaginated(
  pharmacyId: string,
  cursor?: KeysetCursor,
  limit = 50,
  filters?: { status?: PrescriptionStatus; priority?: TaskPriority }
): Promise<QueryResult<{ items: Prescription[]; nextCursor: KeysetCursor | null }>> {
  const supabase = createClient()

  let query = supabase
    .from('prescriptions')
    .select('*, items:prescription_items(medication_name)')
    .eq('pharmacy_id', pharmacyId)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(limit + 1)

  if (filters?.status) query = query.eq('status', filters.status)
  if (filters?.priority) query = query.eq('priority', filters.priority)

  query = applyKeysetCursor(query, cursor)

  const { data, error } = await query
  if (error) return { data: null, error: error.message }

  const rows = (data as Prescription[]) ?? []
  return { data: sliceKeysetPage(rows, limit), error: null }
}

export async function searchPrescriptions(
  pharmacyId: string,
  query: string,
  limit = 50
): Promise<QueryResult<Prescription[]>> {
  const trimmed = query.trim()
  if (!trimmed) return { data: [], error: null }

  const supabase = createClient()
  const { data, error } = await supabase
    .from('prescriptions')
    .select('*, items:prescription_items(medication_name)')
    .eq('pharmacy_id', pharmacyId)
    .textSearch('search_vec', trimmed, { config: 'french', type: 'plain' })
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) return { data: null, error: error.message }
  return { data: data ?? [], error: null }
}

// ── Par ID avec commentaires ──────────────────────────────────

export async function getPrescriptionById(
  id: string
): Promise<QueryResult<PrescriptionWithComments>> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('prescriptions')
    .select(`
      *,
      items:prescription_items (*),
      comments:prescription_comments (
        *,
        author:profiles!author_id (
          id,
          display_name,
          avatar_url
        )
      )
    `)
    .eq('id', id)
    .single()

  if (error) return { data: null, error: error.message }

  const prescription = data as unknown as PrescriptionWithComments
  void logAudit({
    action: AUDIT_ACTIONS.prescriptionRead,
    target_type: AUDIT_TARGET_TYPES.prescription,
    target_id: id,
    pharmacy_id: prescription.pharmacy_id,
    metadata: { status: prescription.status },
  })

  return { data: prescription, error: null }
}

// ── Création ─────────────────────────────────────────────────

export async function createPrescription(
  payload: NewPrescription
): Promise<QueryResult<Prescription>> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('prescriptions')
    .insert(payload)
    .select()
    .single()

  if (error) return { data: null, error: error.message }

  void logAudit({
    action: AUDIT_ACTIONS.prescriptionCreated,
    target_type: AUDIT_TARGET_TYPES.prescription,
    target_id: data.id,
    pharmacy_id: data.pharmacy_id,
    metadata: { status: data.status },
  })

  return { data, error: null }
}

// ── Mise à jour ───────────────────────────────────────────────

export async function updatePrescription(
  id: string,
  payload: UpdatePrescription
): Promise<QueryResult<Prescription>> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('prescriptions')
    .update(payload)
    .eq('id', id)
    .select()
    .single()

  if (error) return { data: null, error: error.message }

  void logAudit({
    action: AUDIT_ACTIONS.prescriptionUpdated,
    target_type: AUDIT_TARGET_TYPES.prescription,
    target_id: id,
    pharmacy_id: data.pharmacy_id,
    metadata: { status: data.status },
  })

  return { data, error: null }
}

// ── Suppression ───────────────────────────────────────────────

export async function deletePrescription(
  id: string
): Promise<QueryResult<null>> {
  const supabase = createClient()

  const { data: existing } = await supabase
    .from('prescriptions')
    .select('pharmacy_id')
    .eq('id', id)
    .maybeSingle()

  const { error } = await supabase.from('prescriptions').delete().eq('id', id)

  if (error) return { data: null, error: error.message }

  if (existing?.pharmacy_id) {
    void logAudit({
      action: AUDIT_ACTIONS.prescriptionDeleted,
      target_type: AUDIT_TARGET_TYPES.prescription,
      target_id: id,
      pharmacy_id: existing.pharmacy_id,
    })
  }

  return { data: null, error: null }
}

// ── Commentaires ──────────────────────────────────────────────

export async function addPrescriptionComment(
  prescriptionId: string,
  pharmacyId: string,
  content: string
): Promise<QueryResult<PrescriptionComment>> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Non authentifié' }

  const { data, error } = await supabase
    .from('prescription_comments')
    .insert({
      prescription_id: prescriptionId,
      pharmacy_id: pharmacyId,
      author_id: user.id,
      content,
    })
    .select()
    .single()

  if (error) return { data: null, error: error.message }

  void logAudit({
    action: AUDIT_ACTIONS.prescriptionCommentAdded,
    target_type: AUDIT_TARGET_TYPES.prescriptionComment,
    target_id: data.id,
    pharmacy_id: pharmacyId,
    metadata: { prescription_id: prescriptionId },
  })

  return { data, error: null }
}

export async function deletePrescriptionComment(
  id: string
): Promise<QueryResult<null>> {
  const supabase = createClient()
  const { error } = await supabase
    .from('prescription_comments')
    .delete()
    .eq('id', id)

  if (error) return { data: null, error: error.message }

  void logAudit({
    action: AUDIT_ACTIONS.prescriptionCommentDeleted,
    target_type: AUDIT_TARGET_TYPES.prescriptionComment,
    target_id: id,
  })

  return { data: null, error: null }
}