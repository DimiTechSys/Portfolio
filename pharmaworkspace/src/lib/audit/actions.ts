// Catalogue des actions tracées dans le journal d'audit (P2-16).
// Objectif : journaliser TOUTES les actions métier de l'équipe sur l'app.
// Hors scope volontaire (bruit / vie privée) : notifications système, lectures
// de listes, préférences UI, messages de chat individuels (le contenu vit déjà
// dans le salon ; seules les suppressions modérées sont tracées).

export const AUDIT_ACTIONS = {
  // Ordonnances
  prescriptionRead: 'prescription.read',
  prescriptionCreated: 'prescription.created',
  prescriptionUpdated: 'prescription.updated',
  prescriptionDeleted: 'prescription.deleted',
  prescriptionCommentAdded: 'prescription.comment_added',
  prescriptionCommentDeleted: 'prescription.comment_deleted',
  // Tâches
  taskCreated: 'task.created',
  taskUpdated: 'task.updated',
  taskCompleted: 'task.completed',
  taskDeleted: 'task.deleted',
  // Commandes & fournisseurs
  orderCreated: 'order.created',
  orderUpdated: 'order.updated',
  orderDeleted: 'order.deleted',
  supplierCreated: 'supplier.created',
  supplierUpdated: 'supplier.updated',
  supplierDeleted: 'supplier.deleted',
  // Ruptures
  shortageReported: 'shortage.reported',
  shortageUpdated: 'shortage.updated',
  shortageDeleted: 'shortage.deleted',
  // Locations
  rentalCreated: 'rental.created',
  rentalUpdated: 'rental.updated',
  rentalDeleted: 'rental.deleted',
  // Annuaire
  contactCreated: 'contact.created',
  contactUpdated: 'contact.updated',
  contactDeleted: 'contact.deleted',
  // Formations / qualité
  trainingCreated: 'training.created',
  trainingUpdated: 'training.updated',
  trainingDeleted: 'training.deleted',
  // Pointage
  clockinGeofenceBlocked: 'clockin.geofence_blocked',
  clockIn: 'work_session.clock_in',
  clockOut: 'work_session.clock_out',
  workSessionDeleted: 'work_session.deleted',
  // Congés
  leaveRequestSubmitted: 'leave_request.submitted',
  leaveRequestCancelled: 'leave_request.cancelled',
  leaveRequestApproved: 'leave_request.approved',
  leaveRequestRejected: 'leave_request.rejected',
  // Équipe / administration
  memberInvited: 'member.invited',
  invitationRevoked: 'member.invitation_revoked',
  memberRoleChanged: 'member.role_changed',
  memberDeactivated: 'member.deactivated',
  // 'erase_member' est déjà écrit tel quel par /api/legal/erase — on garde la
  // valeur pour que le libellé matche.
  memberErased: 'erase_member',
  pharmacySettingsUpdated: 'pharmacy.settings_updated',
  // Profil
  profileUpdated: 'profile.updated',
  // Chat
  chatMessageDeleted: 'chat_message.deleted',
} as const

export const AUDIT_TARGET_TYPES = {
  prescription: 'prescription',
  prescriptionComment: 'prescription_comment',
  task: 'task',
  order: 'order',
  supplier: 'supplier',
  shortage: 'shortage',
  rental: 'rental',
  contact: 'contact',
  trainingResource: 'training_resource',
  workSession: 'work_session',
  leaveRequest: 'leave_request',
  member: 'member',
  invitation: 'invitation',
  pharmacy: 'pharmacy',
  profile: 'profile',
  chatMessage: 'chat_message',
} as const
