import { createClient } from '@/lib/supabase/client'
import type { Client } from '@/types'

export async function getClients(filters?: {
  status?: string
  search?: string
}) {
  const supabase = createClient()
  let query = supabase.from('clients').select('*').order('created_at', { ascending: false })

  if (filters?.status && filters.status !== 'tous') {
    query = query.eq('status', filters.status)
  }
  if (filters?.search) {
    query = query.or(
      `first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`
    )
  }

  const { data, error } = await query
  if (error) throw error
  return data as Client[]
}

export async function getClient(id: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data as Client
}

export async function createClient_(client: Omit<Client, 'id' | 'created_at' | 'total_purchases' | 'total_revenue'>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('clients')
    .insert(client)
    .select()
    .single()
  if (error) throw error
  return data as Client
}

export async function updateClient(id: string, updates: Partial<Client>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('clients')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as Client
}

export async function getClientDocuments(clientId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('documents')
    .select('*, vehicle:vehicles(*)')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}
