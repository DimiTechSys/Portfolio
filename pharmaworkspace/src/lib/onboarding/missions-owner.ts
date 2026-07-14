// Missions titulaire : 4 wizard (W1-W4, détectées par l'état P2-01) +
// 8 dashboard (M1-M8). M6 (chat) sort en 'hidden' quand le flag est OFF.

import type { Mission } from './missions'

export const OWNER_MISSION_LABELS = {
  W1: { label: 'Créer votre officine', tooltip: 'Nom, adresse, FINESS si vous l\'avez.' },
  W2: { label: 'Compléter votre profil', tooltip: 'Prénom, nom, fonction.' },
  W3: { label: 'Inviter vos premiers collègues', tooltip: 'Vous pouvez aussi passer cette étape et y revenir plus tard.' },
  W4: { label: 'Activer votre essai 30 jours', tooltip: 'IBAN renseigné (mandat SEPA), 0 € prélevé pendant 30 jours.' },
  M1: { label: 'Inviter au moins un membre de l\'équipe', cta: { href: '/admin' }, tooltip: 'Sans équipe, l\'outil ne sert à rien. C\'est l\'étape la plus importante.' },
  M2: { label: 'Créer votre première tâche', cta: { href: '/tasks?id=new' }, tooltip: 'Une tâche du jour, une note de transmission, une commande à passer.' },
  M3: { label: 'Scanner votre première ordonnance', cta: { href: '/prescriptions?create=1' }, tooltip: 'L\'IA française Mistral l\'analyse en 30 secondes.' },
  M4: { label: 'Signaler votre première rupture', cta: { href: '/shortages?create=1' }, tooltip: 'Le code-barre CIP13 suffit.' },
  M5: { label: 'Enregistrer une location de matériel', cta: { href: '/rentals' }, tooltip: 'Tensiomètre, lecteur glycémie, tire-lait…' },
  M6: { label: 'Écrire un message dans le salon d\'équipe', cta: { href: '/chat' }, tooltip: 'Comme un WhatsApp, en interne et sécurisé.' },
  M7: { label: 'Utiliser au moins 3 modules différents', cta: null, tooltip: 'Un module = Tâches, Ordonnances, Ruptures, Locations, Salon, Formation. Dès que vous avez créé une entrée dans 3 d\'entre eux, cette mission se coche automatiquement.' },
  M8: { label: 'Faire un point équipe à J+7 et nous donner votre retour', cta: { feedback: true }, tooltip: 'Cliquez sur le bouton flottant "Donner mon avis" et envoyez-nous vos premiers retours.' },
} as const

export type OwnerCounts = {
  members: number
  tasks: number
  prescriptions: number
  shortages: number
  rentals: number
  feedback: number
  chatMessages: number
  hasPharmacy: boolean
  profileComplete: boolean
  invitesHandled: boolean
  subscriptionActive: boolean
}

export function computeOwnerMissions(
  counts: OwnerCounts,
  requireChat: boolean,
): Mission[] {
  const done = (cond: boolean) => (cond ? 'done' : 'pending') as Mission['status']

  // M7 : ≥ 3 des 5 tables tasks/prescriptions/shortages/rentals/feedback ont
  // au moins 1 row (chat exclu tant que le flag est OFF).
  const moduleSources = [
    counts.tasks,
    counts.prescriptions,
    counts.shortages,
    counts.rentals,
    counts.feedback,
    ...(requireChat ? [counts.chatMessages] : []),
  ]
  const modulesUsed = moduleSources.filter((c) => c >= 1).length

  return [
    { id: 'W1', ...OWNER_MISSION_LABELS.W1, cta: null, status: done(counts.hasPharmacy), variant: 'wizard' },
    { id: 'W2', ...OWNER_MISSION_LABELS.W2, cta: null, status: done(counts.profileComplete), variant: 'wizard' },
    { id: 'W3', ...OWNER_MISSION_LABELS.W3, cta: null, status: done(counts.invitesHandled), variant: 'wizard' },
    { id: 'W4', ...OWNER_MISSION_LABELS.W4, cta: null, status: done(counts.subscriptionActive), variant: 'wizard' },
    { id: 'M1', ...OWNER_MISSION_LABELS.M1, status: done(counts.members >= 2), variant: 'dashboard' },
    { id: 'M2', ...OWNER_MISSION_LABELS.M2, status: done(counts.tasks >= 1), variant: 'dashboard' },
    { id: 'M3', ...OWNER_MISSION_LABELS.M3, status: done(counts.prescriptions >= 1), variant: 'dashboard' },
    { id: 'M4', ...OWNER_MISSION_LABELS.M4, status: done(counts.shortages >= 1), variant: 'dashboard' },
    { id: 'M5', ...OWNER_MISSION_LABELS.M5, status: done(counts.rentals >= 1), variant: 'dashboard' },
    {
      id: 'M6',
      ...OWNER_MISSION_LABELS.M6,
      status: requireChat ? done(counts.chatMessages >= 1) : 'hidden',
      variant: 'dashboard',
    },
    { id: 'M7', ...OWNER_MISSION_LABELS.M7, status: done(modulesUsed >= 3), variant: 'dashboard' },
    { id: 'M8', ...OWNER_MISSION_LABELS.M8, status: done(counts.feedback >= 1), variant: 'dashboard' },
  ]
}
