import { createClient } from '@/lib/supabase/client'
import type {
  PrescriptionItem,
  NewPrescriptionItem,
  UpdatePrescriptionItem,
  QueryResult,
} from '@/types/index'

export async function getPrescriptionItems(
  prescriptionId: string
): Promise<QueryResult<PrescriptionItem[]>> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('prescription_items')
    .select('*')
    .eq('prescription_id', prescriptionId)
    .order('created_at', { ascending: true })

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

export async function createPrescriptionItem(
  payload: NewPrescriptionItem
): Promise<QueryResult<PrescriptionItem>> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('prescription_items')
    .insert(payload)
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

export async function updatePrescriptionItem(
  id: string,
  payload: UpdatePrescriptionItem
): Promise<QueryResult<PrescriptionItem>> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('prescription_items')
    .update(payload)
    .eq('id', id)
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

export async function deletePrescriptionItem(
  id: string
): Promise<QueryResult<null>> {
  const supabase = createClient()
  const { error } = await supabase.from('prescription_items').delete().eq('id', id)

  if (error) return { data: null, error: error.message }
  return { data: null, error: null }
}

export async function bulkCreatePrescriptionItems(
  items: NewPrescriptionItem[]
): Promise<QueryResult<PrescriptionItem[]>> {
  if (items.length === 0) return { data: [], error: null }

  const supabase = createClient()
  const { data, error } = await supabase
    .from('prescription_items')
    .insert(items)
    .select()

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}
