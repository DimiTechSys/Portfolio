// Missions invité : 1 wizard (Wi1) + 4 dashboard (M1-M4).
// M4 (chat) sort en 'hidden' quand le flag est OFF.

import type { Mission } from './missions'

export const MEMBER_MISSION_LABELS = {
  Wi1: { label: 'Compléter votre profil', tooltip: 'Prénom, nom.' },
  M1: { label: 'Ajouter votre photo de profil', cta: { href: '/profile' }, tooltip: 'Optionnel mais conseillé pour que vos collègues vous reconnaissent.' },
  M2: { label: 'Créer votre première tâche', cta: { href: '/tasks?id=new' }, tooltip: 'Une tâche du jour, une demande à un collègue.' },
  M3: { label: 'Lire une note de transmission de l\'équipe', cta: { href: '/tasks' }, tooltip: 'Pour rester au courant de ce qui s\'est passé pendant votre absence.' },
  M4: { label: 'Écrire votre premier message dans le salon', cta: { href: '/chat' }, tooltip: 'Saluez votre équipe !' },
} as const

export type MemberState = {
  profileComplete: boolean
  hasAvatar: boolean
  tasksCreated: number
  hasOpenedTransmissionNote: boolean
  chatMessages: number
}

export function computeMemberMissions(
  state: MemberState,
  requireChat: boolean,
): Mission[] {
  const done = (cond: boolean) => (cond ? 'done' : 'pending') as Mission['status']

  return [
    { id: 'Wi1', ...MEMBER_MISSION_LABELS.Wi1, cta: null, status: done(state.profileComplete), variant: 'wizard' },
    { id: 'M1', ...MEMBER_MISSION_LABELS.M1, status: done(state.hasAvatar), variant: 'dashboard' },
    { id: 'M2', ...MEMBER_MISSION_LABELS.M2, status: done(state.tasksCreated >= 1), variant: 'dashboard' },
    { id: 'M3', ...MEMBER_MISSION_LABELS.M3, status: done(state.hasOpenedTransmissionNote), variant: 'dashboard' },
    {
      id: 'M4',
      ...MEMBER_MISSION_LABELS.M4,
      status: requireChat ? done(state.chatMessages >= 1) : 'hidden',
      variant: 'dashboard',
    },
  ]
}
