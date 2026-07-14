// Catalogue des events PostHog côté client (noms canoniques, snake_case).
// Enrichir ici avant d'appeler capture() / captureFirstMilestone().

export const FIRST_MILESTONE_EVENTS = {
  first_task_created: 'first_task_created',
  first_ocr_done: 'first_ocr_done',
  first_shortage_resolved: 'first_shortage_resolved',
} as const

export type FirstMilestoneEventName =
  (typeof FIRST_MILESTONE_EVENTS)[keyof typeof FIRST_MILESTONE_EVENTS]

// Events du wizard onboarding (P2-01), émis aux transitions de chaque étape.
//   pharmacy_created           : step 1 (INSERT pharmacy réussi)
//   pharmacy_updated           : step 1 (UPDATE pharmacy via back-edit)
//   profile_completed          : step 2 (first_name/last_name remplis)
//   first_invite_sent          : step 3 (au moins une invitation envoyée)
//   onboarding_invites_skipped : step 3 (bouton "Passer" cliqué)
//   onboarding_activate_viewed : step 4 (affichage du sélecteur tier + saisie IBAN/SEPA)
//   onboarding_completed       : sortie vers `/` une fois subscription_status='trialing'
export const ONBOARDING_EVENTS = {
  pharmacy_created: 'pharmacy_created',
  pharmacy_updated: 'pharmacy_updated',
  profile_completed: 'profile_completed',
  first_invite_sent: 'first_invite_sent',
  onboarding_invites_skipped: 'onboarding_invites_skipped',
  onboarding_activate_viewed: 'onboarding_activate_viewed',
  onboarding_completed: 'onboarding_completed',
} as const

export type OnboardingEventName =
  (typeof ONBOARDING_EVENTS)[keyof typeof ONBOARDING_EVENTS]

export const PLANNING_EVENTS = {
  leave_request_submitted: 'leave_request_submitted',
  leave_request_approved: 'leave_request_approved',
  leave_request_rejected: 'leave_request_rejected',
} as const

export type PlanningEventName =
  (typeof PLANNING_EVENTS)[keyof typeof PLANNING_EVENTS]

// Events des missions d'activation (ONBOARD-01) :
//   onboarding_missions_shown         : affichage du widget (variant, role, progress_done, progress_total)
//   onboarding_mission_clicked        : clic sur le CTA d'une mission (mission_id)
//   onboarding_mission_completed      : transition pending → done détectée à un re-render (mission_id)
//   onboarding_missions_all_completed : 100 % des missions visibles (role, time_to_complete_seconds)
//   onboarding_missions_dismissed     : widget masqué via la modal de dismiss
export const ONBOARDING_MISSION_EVENTS = {
  onboarding_missions_shown: 'onboarding_missions_shown',
  onboarding_mission_clicked: 'onboarding_mission_clicked',
  onboarding_mission_completed: 'onboarding_mission_completed',
  onboarding_missions_all_completed: 'onboarding_missions_all_completed',
  onboarding_missions_dismissed: 'onboarding_missions_dismissed',
} as const

export type OnboardingMissionEventName =
  (typeof ONBOARDING_MISSION_EVENTS)[keyof typeof ONBOARDING_MISSION_EVENTS]

export const CHAT_EVENTS = {
  chat_message_sent: 'chat_message_sent',
  chat_window_opened: 'chat_window_opened',
  chat_first_message_in_pharmacy: 'chat_first_message_in_pharmacy',
} as const

export type ChatEventName = (typeof CHAT_EVENTS)[keyof typeof CHAT_EVENTS]
