import type { ShiftKind } from '@/types/index'

export const SHIFT_KIND_LABELS: Record<ShiftKind, string> = {
  ouverture: 'Ouverture',
  fermeture: 'Fermeture',
  journee: 'Journée',
  garde: 'Garde',
  custom: 'Autre',
}

// Toutes les présences prévues (shifts) partagent le MÊME bleu pastel (= couleur
// « Prévu »), pour ne pas entrer en conflit avec les couleurs de statut
// (Présent=emerald, Congé(attente)=amber, Congé=rose, Repos=slate). Le type de
// shift se distingue par son nom, pas par sa couleur.
const SHIFT_CHIP_STYLE = 'bg-sky-100 text-sky-800 border border-sky-200'

export const SHIFT_KIND_STYLES: Record<ShiftKind, string> = {
  ouverture: SHIFT_CHIP_STYLE,
  fermeture: SHIFT_CHIP_STYLE,
  journee: SHIFT_CHIP_STYLE,
  garde: SHIFT_CHIP_STYLE,
  custom: SHIFT_CHIP_STYLE,
}

export const SHIFT_KIND_OPTIONS: ShiftKind[] = [
  'ouverture',
  'fermeture',
  'journee',
  'garde',
  'custom',
]

// Modèles par défaut (auto-seed à la 1re visite + boutons d'ajout rapide).
export const DEFAULT_SHIFT_PRESETS: {
  kind: ShiftKind
  name: string
  start: string
  end: string
  breakStart?: string
  breakEnd?: string
}[] = [
  { kind: 'ouverture', name: 'Ouverture', start: '08:00', end: '14:00' },
  { kind: 'fermeture', name: 'Fermeture', start: '14:00', end: '20:00' },
  { kind: 'journee', name: 'Journée', start: '09:00', end: '19:00', breakStart: '12:30', breakEnd: '14:00' },
  { kind: 'garde', name: 'Garde', start: '20:00', end: '08:00' },
]

/** 'HH:MM:SS' | 'HH:MM' → 'HH:MM' */
export function formatShiftTime(t: string | null | undefined): string {
  if (!t) return ''
  return t.slice(0, 5)
}

export function formatShiftRange(start: string, end: string): string {
  return `${formatShiftTime(start)}–${formatShiftTime(end)}`
}
