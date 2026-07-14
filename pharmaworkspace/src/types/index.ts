import type { Database } from './database.types'

// ─── Raccourcis depuis le schéma Supabase ────────────────────────────────────

export type Pharmacy    = Database['public']['Tables']['pharmacies']['Row']
export type Profile     = Database['public']['Tables']['profiles']['Row']
export type Invitation  = Database['public']['Tables']['invitations']['Row']
export type WorkSession = Database['public']['Tables']['work_sessions']['Row']
export type Task        = Database['public']['Tables']['tasks']['Row']
export type Prescription= Database['public']['Tables']['prescriptions']['Row']
export type PrescriptionComment = Database['public']['Tables']['prescription_comments']['Row']
export type PrescriptionItem = Database['public']['Tables']['prescription_items']['Row']
export type Supplier    = Database['public']['Tables']['suppliers']['Row']
export type Order       = Database['public']['Tables']['orders']['Row']
export type OrderItem   = Database['public']['Tables']['order_items']['Row']
// Rental includes `daily_rate: number | null` from database schema.
export type Rental      = Database['public']['Tables']['rentals']['Row']
export type RentalAttachment = Database['public']['Tables']['rental_attachments']['Row']
export type NewRentalAttachment = Database['public']['Tables']['rental_attachments']['Insert']
export type Shortage    = Database['public']['Tables']['shortages']['Row']
export type AuditLogRow = Database['public']['Tables']['audit_log']['Row']

export type AuditLogEntry = AuditLogRow & {
  actor?: Pick<Profile, 'id' | 'display_name' | 'first_name' | 'last_name'> | null
}

// ─── Contact (Annuaire) ──────────────────────────────────────────────────────

export type ContactCategory = string

export type Contact = Database['public']['Tables']['contacts']['Row']

export type NewContact = Omit<
  Database['public']['Tables']['contacts']['Insert'],
  'id' | 'created_at' | 'updated_at'
>

export type UpdateContact = Database['public']['Tables']['contacts']['Update']

export interface Medication {
  id: string
  cip13: string
  name: string
  dosage: string | null
  form: string | null
  laboratory: string | null
  active: boolean
  updated_at: string
}

export interface DrugShortage {
  id: string
  cis: string
  cip13: string | null
  medication_name: string | null
  type: 'Rupture de stock' | "Tension d'approvisionnement" | string
  started_at: string | null
  ends_at: string | null
  ansm_url: string | null
  imported_at: string
}

// ─── Training (Formation) ────────────────────────────────────────────────────

export type ResourceType = 'video' | 'memo'

export interface TrainingResource {
  id: string
  pharmacy_id: string
  created_by: string
  title: string
  description?: string
  type: ResourceType
  url?: string
  storage_path?: string
  duration_minutes?: number
  is_published: boolean
  order_index: number
  created_at: string
  updated_at: string
}

// ─── Types Insert (création) ─────────────────────────────────────────────────

export type NewTask         = Database['public']['Tables']['tasks']['Insert']
export type NewPrescription = Database['public']['Tables']['prescriptions']['Insert']
export type NewPrescriptionItem = Omit<PrescriptionItem, 'id' | 'created_at' | 'substitute'>
export type NewOrder        = Database['public']['Tables']['orders']['Insert']
export type NewOrderItem    = Database['public']['Tables']['order_items']['Insert']
export type NewSupplier     = Database['public']['Tables']['suppliers']['Insert']
export type NewRental       = Database['public']['Tables']['rentals']['Insert']
export type NewShortage     = Database['public']['Tables']['shortages']['Insert']
export type NewWorkSession  = Database['public']['Tables']['work_sessions']['Insert']
export type NewInvitation   = Database['public']['Tables']['invitations']['Insert']

// ─── Types Update (édition partielle) ───────────────────────────────────────

export type UpdateTask         = Database['public']['Tables']['tasks']['Update']
export type UpdatePrescription = Database['public']['Tables']['prescriptions']['Update']
export type UpdatePrescriptionItem = Partial<
  Omit<PrescriptionItem, 'id' | 'prescription_id' | 'pharmacy_id' | 'created_at' | 'substitute'>
>
export type UpdateOrder        = Database['public']['Tables']['orders']['Update']
export type UpdateRental       = Database['public']['Tables']['rentals']['Update']
export type UpdateShortage     = Database['public']['Tables']['shortages']['Update']
export type UpdateWorkSession  = Database['public']['Tables']['work_sessions']['Update']

// ─── Enums ───────────────────────────────────────────────────────────────────

export type UserRole              = 'titulaire' | 'adjoint' | 'preparateur' | 'student' | 'shelver'
export type TaskStatus            = 'todo' | 'done' | 'cancelled'
export type TaskPriority          = 'low' | 'medium' | 'high'
export type OrderStatus           = 'draft' | 'sent' | 'received'
export type PrescriptionStatus    = 'to_serve' | 'served' | 'expired' | 'on_hold'
export type RentalStatus          = 'active' | 'returned' | 'overdue'
export type ShortageStatus        = 'open' | 'resolved' | 'substitute_found'
export type NotificationType      =
  | 'task_assigned'
  | 'shortage_reported'
  | 'leave_request_submitted'
  | 'leave_request_decided'
export type FeedbackCategory      = 'bug' | 'idea' | 'praise' | 'other'
export type Feedback              = Database['public']['Tables']['feedback']['Row']
export type LeaveRequest          = Database['public']['Tables']['leave_requests']['Row']
export type NewLeaveRequest       = Database['public']['Tables']['leave_requests']['Insert']
export type UpdateLeaveRequest    = Database['public']['Tables']['leave_requests']['Update']
export type WeeklySchedule        = Database['public']['Tables']['weekly_schedules']['Row']
export type LeaveType             = LeaveRequest['leave_type']
export type LeaveRequestStatus    = LeaveRequest['status']

export type LeaveRequestWithProfiles = LeaveRequest & {
  requester: Pick<Profile, 'id' | 'display_name' | 'first_name' | 'last_name'> | null
  reviewer: Pick<Profile, 'id' | 'display_name' | 'first_name' | 'last_name'> | null
}

// ── Shifts (migration 0061) ───────────────────────────────────────────────────
// Types autonomes : ces tables ne sont pas (encore) dans database.types.ts et le
// client Supabase n'est pas typé, donc on les déclare à la main.
export type ShiftKind = 'ouverture' | 'fermeture' | 'journee' | 'garde' | 'custom'

export type ShiftTemplate = {
  id: string
  pharmacy_id: string
  name: string
  kind: ShiftKind
  start_time: string // 'HH:MM[:SS]'
  end_time: string
  break_start: string | null
  break_end: string | null
  color: string | null
  archived_at: string | null
  created_by: string | null
  created_at: string
}

export type ShiftAssignment = {
  id: string
  pharmacy_id: string
  user_id: string
  template_id: string
  date: string // 'YYYY-MM-DD'
  note: string | null
  created_by: string | null
  created_at: string
}

export type ShiftAssignmentWithTemplate = ShiftAssignment & {
  template: ShiftTemplate | null
}

export type ChatChannel = Database['public']['Tables']['chat_channels']['Row']
export type ChatMessage = Database['public']['Tables']['chat_messages']['Row']
export type ChatReadState = Database['public']['Tables']['chat_read_states']['Row']

export type ChatMessageWithAuthor = ChatMessage & {
  author: Pick<Profile, 'id' | 'display_name' | 'first_name' | 'last_name' | 'avatar_url'> | null
}

// ─── Types composites (jointures fréquentes) ─────────────────────────────────

// Tâche avec auteur et assigné résolus
export type TaskWithProfiles = Task & {
  created_by_profile: Pick<Profile, 'id' | 'display_name' | 'avatar_url'> | null
  assigned_to_profile: Pick<Profile, 'id' | 'display_name' | 'avatar_url'> | null
}

// Commande avec fournisseur et lignes
export type OrderWithDetails = Order & {
  supplier: Supplier | null
  items: OrderItem[]
}

// Ordonnance avec commentaires
export type PrescriptionWithItems = Prescription & {
  items: PrescriptionItem[]
}

// Ordonnance avec commentaires
export type PrescriptionWithComments = PrescriptionWithItems & {
  comments: (PrescriptionComment & {
    author: Pick<Profile, 'id' | 'display_name' | 'avatar_url'>
  })[]
}

// Session active avec profil
export type WorkSessionWithProfile = WorkSession & {
  profile: Pick<Profile, 'id' | 'display_name' | 'avatar_url'>
}

// ─── Types applicatifs (UI uniquement) ───────────────────────────────────────

// Contexte utilisateur global (hook useProfile)
export type UserContext = {
  profile: Profile | null
  pharmacy: Pharmacy | null
  role: UserRole | null
  isAdmin: boolean
  canWrite: boolean
  canWriteTasks: boolean
  loading: boolean
  signOut: () => Promise<void>
  refetch: () => Promise<void>
}

// Session de travail active (hook useSession)
export type SessionActionResult =
  | { ok: true }
  | { ok: false; error: string }

export type ActiveSession = {
  session: WorkSession | null
  isActive: boolean
  startSession: () => Promise<SessionActionResult>
  endSession: () => Promise<SessionActionResult>
}

export interface Notification {
  id: string
  pharmacy_id: string
  user_id: string
  type: NotificationType
  title: string
  body: string | null
  read_at: string | null
  metadata: Record<string, unknown> | null
  created_at: string
}

export type NewNotification = Omit<Notification, 'id' | 'created_at' | 'read_at'>

// ─── Agenda (UI uniquement, jamais persisté) ─────────────────────────────────

export type AgendaItemType = 'task' | 'rental' | 'shortage' | 'order'

export type AgendaItemPriority = 'high' | 'medium' | 'low' | null

export interface AgendaItem {
  id: string
  type: AgendaItemType
  title: string
  meta: string
  priority: AgendaItemPriority
  date: Date | null
  status: string
  originalId: string
}

// Item de navigation sidebar
export type NavItem = {
  label: string
  href: string
  icon: string           // nom de l'icône Lucide
  roles: UserRole[]      // rôles qui voient cet item
}

// Réponse standard des queries
export type QueryResult<T> = {
  data: T | null
  error: string | null
}