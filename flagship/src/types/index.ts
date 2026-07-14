export type VehicleStatus = 'disponible' | 'réservé' | 'vendu'
export type VehicleType = 'VO' | 'VN'
export type FuelType = 'Essence' | 'Diesel' | 'Hybride' | 'Électrique' | 'GPL'
export type GearType = 'Manuelle' | 'Automatique'
export type DPE = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G'

export interface Vehicle {
  id: string
  created_at: string
  updated_at: string
  plate: string
  brand: string
  model: string
  year: number
  type: VehicleType
  km: number
  fuel: FuelType
  gear: GearType
  color_ext: string
  color_int: string
  power_hp: number
  doors: number
  price_sell: number
  price_buy: number
  dpe: DPE
  ct_status: string
  ct_date: string | null
  options: string
  notes_internal: string
  status: VehicleStatus
  instagram_published: boolean
  instagram_post_id: string | null
  photos: string[]
}

export interface VehicleHistory {
  id: string
  vehicle_id: string
  created_at: string
  event: string
  user_id: string | null
}

export interface Client {
  id: string
  created_at: string
  first_name: string
  last_name: string
  email: string
  phone: string
  address: string
  city: string
  postal_code: string
  notes: string
  total_purchases: number
  total_revenue: number
  status: 'prospect' | 'actif' | 'fidèle' | 'inactif'
}

export type DocumentStatus = 'brouillon' | 'envoyé' | 'en_attente' | 'accepté' | 'refusé' | 'expiré' | 'payé'
export type DocumentType = 'devis' | 'facture'

export interface Document {
  id: string
  created_at: string
  updated_at: string
  type: DocumentType
  reference: string
  client_id: string
  client?: Client
  vehicle_id: string
  vehicle?: Vehicle
  status: DocumentStatus
  lines: DocumentLine[]
  amount_ht: number
  tva_rate: number
  amount_ttc: number
  deposit_percent: number
  deposit_paid: boolean
  notes: string
  expires_at: string | null
  paid_at: string | null
  payment_link: string | null
}

export interface DocumentLine {
  id: string
  description: string
  quantity: number
  unit_price_ht: number
  total_ht: number
}

export interface Competitor {
  id: string
  name: string
  location: string
  distance_km: number
  url: string | null
}

export interface CompetitorPrice {
  id: string
  created_at: string
  competitor_id: string
  competitor?: Competitor
  brand: string
  model: string
  year: number
  km: number
  price: number
  url: string | null
}

export interface FinancingPartner {
  id: string
  name: string
  rate_percent: number
  min_months: number
  max_months: number
}

export interface DashboardStats {
  stock_count: number
  stock_disponible: number
  stock_reserve: number
  new_vehicles_arrived: number
  appointments_month: number
  appointments_today: number
  upcoming_deadlines: number
  sales_month: number
  sales_target: number
  devis_pending: number
  devis_expiring_soon: number
  revenue_month: number
  revenue_prev_month: number
}

export type LeadSource = 'site' | 'appel' | 'whatsapp' | 'email'
export type LeadStatus = 'nouveau' | 'contacté' | 'qualifié' | 'rdv_planifié' | 'converti' | 'perdu'
export type AppointmentStatus = 'planifié' | 'confirmé' | 'réalisé' | 'no_show' | 'annulé'
export type TradeInStatus = 'nouveau' | 'expertise' | 'offre_envoyée' | 'négociation' | 'acceptée' | 'refusée'
export type TaskStatus = 'todo' | 'in_progress' | 'done'
export type TaskPriority = 'haute' | 'moyenne' | 'basse'
export type PublicationStatus = 'brouillon' | 'prêt' | 'publié' | 'retiré'

export interface Lead {
  id: string
  created_at: string
  updated_at: string
  client_id: string | null
  client?: Client | null
  vehicle_id: string | null
  vehicle?: Vehicle | null
  source: LeadSource
  status: LeadStatus
  assigned_to: string | null
  notes: string
}

export interface Appointment {
  id: string
  created_at: string
  updated_at: string
  lead_id: string | null
  lead?: Lead | null
  client_id: string | null
  client?: Client | null
  vehicle_id: string | null
  vehicle?: Vehicle | null
  starts_at: string
  ends_at: string | null
  status: AppointmentStatus
  notes: string
}

export interface TradeIn {
  id: string
  created_at: string
  updated_at: string
  client_id: string | null
  client?: Client | null
  brand: string
  model: string
  year: number | null
  km: number | null
  estimated_value: number | null
  offered_value: number | null
  status: TradeInStatus
  notes: string
}

export interface TaskItem {
  id: string
  created_at: string
  updated_at: string
  title: string
  due_at: string | null
  status: TaskStatus
  priority: TaskPriority
  assigned_to: string | null
  related_type: string | null
  related_id: string | null
}

export interface VehiclePublication {
  id: string
  created_at: string
  updated_at: string
  vehicle_id: string
  vehicle?: Vehicle | null
  status: PublicationStatus
  title: string | null
  slug: string | null
  published_at: string | null
  unpublished_at: string | null
}
