import { createClient } from '@/lib/supabase/client'
import type { Lead, LeadSource, LeadStatus } from '@/types'

export async function getLeads(filters?: { status?: string; source?: string }) {
  const supabase = createClient()
  let query = supabase
    .from('leads')
    .select('*, client:clients(*), vehicle:vehicles(*)')
    .order('created_at', { ascending: false })

  if (filters?.status && filters.status !== 'tous') query = query.eq('status', filters.status)
  if (filters?.source && filters.source !== 'tous') query = query.eq('source', filters.source)

  const { data, error } = await query
  if (error) throw error
  return data as Lead[]
}

export async function createLead(input: {
  client_id?: string | null
  vehicle_id?: string | null
  source?: LeadSource
  status?: LeadStatus
  assigned_to?: string | null
  notes?: string
}) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('leads')
    .insert({
      client_id: input.client_id ?? null,
      vehicle_id: input.vehicle_id ?? null,
      source: input.source ?? 'site',
      status: input.status ?? 'nouveau',
      assigned_to: input.assigned_to ?? null,
      notes: input.notes ?? '',
    })
    .select('*, client:clients(*), vehicle:vehicles(*)')
    .single()
  if (error) throw error
  return data as Lead
}

export async function updateLead(id: string, updates: Partial<Lead>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('leads')
    .update(updates)
    .eq('id', id)
    .select('*, client:clients(*), vehicle:vehicles(*)')
    .single()
  if (error) throw error
  return data as Lead
}
