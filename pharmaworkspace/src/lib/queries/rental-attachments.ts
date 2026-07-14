import { createClient } from '@/lib/supabase/client'
import type { NewRentalAttachment, QueryResult, RentalAttachment } from '@/types/index'

export async function getRentalAttachments(
  rentalId: string
): Promise<QueryResult<RentalAttachment[]>> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('rental_attachments')
    .select('*')
    .eq('rental_id', rentalId)
    .order('created_at', { ascending: true })

  if (error) return { data: null, error: error.message }
  return { data: data ?? [], error: null }
}

export async function insertRentalAttachment(
  row: NewRentalAttachment
): Promise<QueryResult<RentalAttachment>> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('rental_attachments')
    .insert(row)
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

export async function deleteRentalAttachment(
  id: string
): Promise<QueryResult<null>> {
  const supabase = createClient()
  const { error } = await supabase.from('rental_attachments').delete().eq('id', id)
  if (error) return { data: null, error: error.message }
  return { data: null, error: null }
}

export async function getRentalAttachmentById(
  id: string
): Promise<QueryResult<RentalAttachment>> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('rental_attachments')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}
