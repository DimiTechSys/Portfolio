import { createClient } from '@/lib/supabase/client'
import type { Vehicle, VehicleHistory } from '@/types'

export async function getVehicles(filters?: {
  status?: string
  brand?: string
  type?: string
  search?: string
}) {
  const supabase = createClient()
  let query = supabase.from('vehicles').select('*').order('created_at', { ascending: false })

  if (filters?.status && filters.status !== 'tous') {
    query = query.eq('status', filters.status)
  }
  if (filters?.brand) {
    query = query.eq('brand', filters.brand)
  }
  if (filters?.type) {
    query = query.eq('type', filters.type)
  }
  if (filters?.search) {
    query = query.or(
      `plate.ilike.%${filters.search}%,brand.ilike.%${filters.search}%,model.ilike.%${filters.search}%`
    )
  }

  const { data, error } = await query
  if (error) throw error
  return data as Vehicle[]
}

export async function getVehicle(id: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('vehicles')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data as Vehicle
}

export async function getVehicleByPlate(plate: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('vehicles')
    .select('*')
    .eq('plate', plate.toUpperCase())
    .single()
  if (error) throw error
  return data as Vehicle
}

export async function createVehicle(vehicle: Omit<Vehicle, 'id' | 'created_at' | 'updated_at'>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('vehicles')
    .insert({ ...vehicle, plate: vehicle.plate.toUpperCase() })
    .select()
    .single()
  if (error) throw error

  await addVehicleHistory(data.id, 'Véhicule ajouté au parc')
  return data as Vehicle
}

export async function updateVehicle(id: string, updates: Partial<Vehicle>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('vehicles')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as Vehicle
}

export async function updateVehicleStatus(id: string, status: Vehicle['status'], note?: string) {
  const vehicle = await updateVehicle(id, { status })
  await addVehicleHistory(id, note || `Statut changé → ${status}`)
  return vehicle
}

export async function deleteVehicle(id: string) {
  const supabase = createClient()
  const { error } = await supabase.from('vehicles').delete().eq('id', id)
  if (error) throw error
}

export async function getVehicleHistory(vehicleId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('vehicle_history')
    .select('*')
    .eq('vehicle_id', vehicleId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as VehicleHistory[]
}

export async function addVehicleHistory(vehicleId: string, event: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from('vehicle_history')
    .insert({ vehicle_id: vehicleId, event })
  if (error) console.error('History error:', error)
}

export async function getDashboardStats() {
  const supabase = createClient()

  const { data: vehicles } = await supabase
    .from('vehicles')
    .select('status, price_sell, created_at')

  const { data: documents } = await supabase
    .from('documents')
    .select('status, amount_ttc, created_at, type, expires_at')

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const endOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0)

  const stock = vehicles || []
  const docs = documents || []

  const inThisMonth = (d: string) => new Date(d) >= startOfMonth
  const inPrevMonth = (d: string) =>
    new Date(d) >= startOfPrevMonth && new Date(d) <= endOfPrevMonth
  const inToday = (d: string) => {
    const date = new Date(d)
    return (
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear()
    )
  }
  const upcomingWithinDays = (d: string, days: number) => {
    const date = new Date(d)
    const diffMs = date.getTime() - now.getTime()
    const diffDays = diffMs / (1000 * 60 * 60 * 24)
    return diffDays >= 0 && diffDays <= days
  }

  const soldThisMonth = stock.filter(
    v => v.status === 'vendu' && inThisMonth(v.created_at)
  )
  const newVehiclesArrived = stock.filter(v => inThisMonth(v.created_at))

  const paidThisMonth = docs.filter(
    d => d.status === 'payé' && inThisMonth(d.created_at)
  )
  const paidPrevMonth = docs.filter(
    d => d.status === 'payé' && inPrevMonth(d.created_at)
  )

  const pendingDevis = docs.filter(
    d => d.type === 'devis' && d.status === 'en_attente'
  )
  const appointmentsMonth = docs.filter(
    d => d.type === 'devis' && inThisMonth(d.created_at)
  )
  const appointmentsToday = docs.filter(
    d => d.type === 'devis' && inToday(d.created_at)
  )
  const upcomingDeadlines = docs.filter(
    d => d.type === 'devis' && d.expires_at && upcomingWithinDays(d.expires_at, 7)
  )

  return {
    stock_count: stock.length,
    stock_disponible: stock.filter(v => v.status === 'disponible').length,
    stock_reserve: stock.filter(v => v.status === 'réservé').length,
    new_vehicles_arrived: newVehiclesArrived.length,
    appointments_month: appointmentsMonth.length,
    appointments_today: appointmentsToday.length,
    upcoming_deadlines: upcomingDeadlines.length,
    sales_month: soldThisMonth.length,
    sales_target: 15,
    devis_pending: pendingDevis.length,
    devis_expiring_soon: 2,
    revenue_month: paidThisMonth.reduce((s, d) => s + Number(d.amount_ttc), 0),
    revenue_prev_month: paidPrevMonth.reduce((s, d) => s + Number(d.amount_ttc), 0),
  }
}
