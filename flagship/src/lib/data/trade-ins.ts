import { createClient } from '@/lib/supabase/client'
import type { TradeIn, TradeInStatus } from '@/types'

export async function getTradeIns(filters?: { status?: string }) {
  const supabase = createClient()
  let query = supabase
    .from('trade_ins')
    .select('*, client:clients(*)')
    .order('created_at', { ascending: false })

  if (filters?.status && filters.status !== 'tous') query = query.eq('status', filters.status)

  const { data, error } = await query
  if (error) throw error
  return data as TradeIn[]
}

export async function createTradeIn(input: {
  client_id?: string | null
  brand: string
  model: string
  year?: number | null
  km?: number | null
  estimated_value?: number | null
  offered_value?: number | null
  status?: TradeInStatus
  notes?: string
}) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('trade_ins')
    .insert({
      client_id: input.client_id ?? null,
      brand: input.brand,
      model: input.model,
      year: input.year ?? null,
      km: input.km ?? null,
      estimated_value: input.estimated_value ?? null,
      offered_value: input.offered_value ?? null,
      status: input.status ?? 'nouveau',
      notes: input.notes ?? '',
    })
    .select('*, client:clients(*)')
    .single()
  if (error) throw error
  return data as TradeIn
}

export async function updateTradeIn(id: string, updates: Partial<TradeIn>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('trade_ins')
    .update(updates)
    .eq('id', id)
    .select('*, client:clients(*)')
    .single()
  if (error) throw error
  return data as TradeIn
}
