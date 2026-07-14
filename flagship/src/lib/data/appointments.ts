import { createClient } from '@/lib/supabase/client'
import type { Appointment, AppointmentStatus } from '@/types'

export async function getAppointments(filters?: { status?: string; from?: string; to?: string }) {
  const supabase = createClient()
  let query = supabase
    .from('appointments')
    .select('*, client:clients(*), vehicle:vehicles(*), lead:leads(*)')
    .order('starts_at', { ascending: true })

  if (filters?.status && filters.status !== 'tous') query = query.eq('status', filters.status)
  if (filters?.from) query = query.gte('starts_at', filters.from)
  if (filters?.to) query = query.lte('starts_at', filters.to)

  const { data, error } = await query
  if (error) throw error
  return data as Appointment[]
}

export async function createAppointment(input: {
  lead_id?: string | null
  client_id?: string | null
  vehicle_id?: string | null
  starts_at: string
  ends_at?: string | null
  status?: AppointmentStatus
  notes?: string
}) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('appointments')
    .insert({
      lead_id: input.lead_id ?? null,
      client_id: input.client_id ?? null,
      vehicle_id: input.vehicle_id ?? null,
      starts_at: input.starts_at,
      ends_at: input.ends_at ?? null,
      status: input.status ?? 'planifié',
      notes: input.notes ?? '',
    })
    .select('*, client:clients(*), vehicle:vehicles(*), lead:leads(*)')
    .single()
  if (error) throw error
  return data as Appointment
}

export async function updateAppointment(id: string, updates: Partial<Appointment>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('appointments')
    .update(updates)
    .eq('id', id)
    .select('*, client:clients(*), vehicle:vehicles(*), lead:leads(*)')
    .single()
  if (error) throw error
  return data as Appointment
}
