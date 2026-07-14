// src/config/constants.ts
import type {
  TaskStatus,
  TaskPriority,
  PrescriptionStatus,
  OrderStatus,
  RentalStatus,
  ShortageStatus,
  UserRole,
} from '@/types/index'

export const APP_NAME = 'PharmaWorkspace'
export const SUPPORT_EMAIL = 'support@pharmaworkspace.fr'

// ── Task ─────────────────────────────────────────────────────

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  todo:        'À faire',
  done:        'Terminé',
  cancelled:   'Annulé',
}

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low:    'Basse',
  medium: 'Moyenne',
  high:   'Haute',
}

export const KANBAN_COLUMNS: { id: TaskStatus; label: string }[] = [
  { id: 'todo',        label: 'À faire' },
  { id: 'done',        label: 'Terminé' },
  { id: 'cancelled',   label: 'Annulé' },
]

// ── Prescription ─────────────────────────────────────────────

export const PRESCRIPTION_STATUS_LABELS: Record<PrescriptionStatus, string> = {
  to_serve: 'À traiter',
  served:   'Traités',
  expired:  'Expiré ?',
  on_hold:  'En attente',
}

// ── Order ─────────────────────────────────────────────────────

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  draft:    'Brouillon',
  sent:     'Envoyée',
  received: 'Reçue',
}

// ── Rental ────────────────────────────────────────────────────

export const RENTAL_STATUS_LABELS: Record<RentalStatus, string> = {
  active:   'En cours',
  returned: 'Retournée',
  overdue:  'En retard',
}

// ── Shortage ──────────────────────────────────────────────────

export const SHORTAGE_STATUS_LABELS: Record<ShortageStatus, string> = {
  open:             'Nouvelle rupture',
  resolved:         'Résolue',
  substitute_found: 'Substitut trouvé',
}

// ── Roles ─────────────────────────────────────────────────────

export const ROLE_LABELS: Record<UserRole, string> = {
  titulaire:   'Titulaire',
  adjoint:     'Pharmacien adjoint',
  preparateur: 'Préparateur',
  student:     'Étudiant en pharmacie',
  shelver:     'Rayonniste',
}

export const PAGINATION_SIZES = [10, 20, 50] as const
export const DEFAULT_PAGE_SIZE = 20

// ── Audit log (P2-16) ─────────────────────────────────────────

export const AUDIT_ACTION_LABELS: Record<string, string> = {
  // Ordonnances
  'prescription.read': 'Consultation ordonnance',
  'prescription.created': 'Ordonnance ajoutée',
  'prescription.updated': 'Modification ordonnance',
  'prescription.deleted': 'Suppression ordonnance',
  'prescription.comment_added': 'Commentaire ordonnance ajouté',
  'prescription.comment_deleted': 'Commentaire ordonnance supprimé',
  // Tâches
  'task.created': 'Tâche créée',
  'task.updated': 'Tâche modifiée',
  'task.completed': 'Tâche terminée',
  'task.deleted': 'Tâche supprimée',
  // Commandes & fournisseurs
  'order.created': 'Commande créée',
  'order.updated': 'Commande modifiée',
  'order.deleted': 'Commande supprimée',
  'supplier.created': 'Fournisseur ajouté',
  'supplier.updated': 'Fournisseur modifié',
  'supplier.deleted': 'Fournisseur supprimé',
  // Ruptures
  'shortage.reported': 'Rupture signalée',
  'shortage.updated': 'Rupture mise à jour',
  'shortage.deleted': 'Rupture supprimée',
  // Locations
  'rental.created': 'Location créée',
  'rental.updated': 'Location modifiée',
  'rental.deleted': 'Location supprimée',
  // Annuaire
  'contact.created': 'Contact ajouté',
  'contact.updated': 'Contact modifié',
  'contact.deleted': 'Contact supprimé',
  // Formations / qualité
  'training.created': 'Ressource formation ajoutée',
  'training.updated': 'Ressource formation modifiée',
  'training.deleted': 'Ressource formation supprimée',
  // Pointage
  'clockin.geofence_blocked': 'Badgeage refusé (hors zone)',
  'work_session.clock_in': 'Pointage : arrivée',
  'work_session.clock_out': 'Pointage : départ',
  'work_session.deleted': 'Pointage supprimé',
  // Congés
  'leave_request.submitted': 'Demande de congé envoyée',
  'leave_request.cancelled': 'Demande de congé annulée',
  'leave_request.approved': 'Congé approuvé',
  'leave_request.rejected': 'Congé refusé',
  // Équipe / administration
  'member.invited': 'Invitation envoyée',
  'member.invitation_revoked': 'Invitation révoquée',
  'member.role_changed': 'Rôle modifié',
  'member.deactivated': 'Accès révoqué',
  erase_member: 'Membre supprimé (RGPD)',
  'pharmacy.settings_updated': 'Paramètres officine modifiés',
  // Profil
  'profile.updated': 'Profil modifié',
  // Chat
  'chat_message.deleted': 'Message chat supprimé',
}

export const LEAVE_TYPE_LABELS: Record<
  import('@/types/index').LeaveType,
  string
> = {
  cp: 'Congé payé',
  rtt: 'RTT',
  sick: 'Maladie',
  training: 'Formation',
  public_holiday: 'Jour férié',
  unpaid: 'Congé sans solde',
  other: 'Autre',
}

export const LEAVE_STATUS_LABELS: Record<
  import('@/types/index').LeaveRequestStatus,
  string
> = {
  pending: 'En attente',
  approved: 'Approuvé',
  rejected: 'Refusé',
  cancelled: 'Annulé',
}