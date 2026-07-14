// src/lib/queries/contacts.ts
import { createClient } from '@/lib/supabase/client'
import { logAudit } from '@/lib/audit/log'
import { AUDIT_ACTIONS, AUDIT_TARGET_TYPES } from '@/lib/audit/actions'
import type {
  Contact,
  NewContact,
  UpdateContact,
  QueryResult,
} from '@/types/index'

// ── Liste ────────────────────────────────────────────────────

export async function getContacts(
  pharmacyId: string
): Promise<QueryResult<Contact[]>> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('contacts')
    .select('*')
    .eq('pharmacy_id', pharmacyId)
    .order('category')
    .order('name')

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

// ── Par ID ───────────────────────────────────────────────────

export async function getContactById(
  id: string
): Promise<QueryResult<Contact>> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('contacts')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

// ── Création ─────────────────────────────────────────────────

export async function createContact(
  payload: NewContact
): Promise<QueryResult<Contact>> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('contacts')
    .insert(payload)
    .select()
    .single()

  if (error) return { data: null, error: error.message }

  void logAudit({
    action: AUDIT_ACTIONS.contactCreated,
    target_type: AUDIT_TARGET_TYPES.contact,
    target_id: data.id,
    pharmacy_id: data.pharmacy_id,
    metadata: { name: data.name },
  })

  return { data, error: null }
}

// ── Mise à jour ───────────────────────────────────────────────

export async function updateContact(
  id: string,
  payload: UpdateContact
): Promise<QueryResult<Contact>> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('contacts')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) return { data: null, error: error.message }

  void logAudit({
    action: AUDIT_ACTIONS.contactUpdated,
    target_type: AUDIT_TARGET_TYPES.contact,
    target_id: data.id,
    pharmacy_id: data.pharmacy_id,
    metadata: { name: data.name },
  })

  return { data, error: null }
}

// ── Suppression ───────────────────────────────────────────────

export async function deleteContact(
  id: string
): Promise<QueryResult<null>> {
  const supabase = createClient()
  const { error } = await supabase
    .from('contacts')
    .delete()
    .eq('id', id)

  if (error) return { data: null, error: error.message }

  void logAudit({
    action: AUDIT_ACTIONS.contactDeleted,
    target_type: AUDIT_TARGET_TYPES.contact,
    target_id: id,
  })
  return { data: null, error: null }
}
