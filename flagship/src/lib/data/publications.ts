import { createClient } from '@/lib/supabase/client'
import type { VehiclePublication } from '@/types'

function toSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

export async function getPublications() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('vehicle_publications')
    .select('*, vehicle:vehicles(*)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as VehiclePublication[]
}

export async function upsertPublication(input: {
  vehicle_id: string
  status: VehiclePublication['status']
  title?: string | null
}) {
  const supabase = createClient()
  const title = input.title ?? null
  const nowIso = new Date().toISOString()

  const payload = {
    vehicle_id: input.vehicle_id,
    status: input.status,
    title,
    slug: title ? toSlug(title) : null,
    published_at: input.status === 'publié' ? nowIso : null,
    unpublished_at: input.status === 'retiré' ? nowIso : null,
  }

  const { data, error } = await supabase
    .from('vehicle_publications')
    .upsert(payload, { onConflict: 'vehicle_id' })
    .select('*, vehicle:vehicles(*)')
    .single()
  if (error) throw error
  return data as VehiclePublication
}
