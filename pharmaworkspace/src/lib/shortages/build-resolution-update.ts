import type { Shortage, UpdateShortage } from '@/types/index'

export function buildShortageResolvedUpdate(
  shortage: Pick<Shortage, 'notes'>,
  cip13: string,
  medicationName: string,
  resolvedByUserId: string | null
): UpdateShortage {
  const evidence = `Levée via scanner CIP13 ${cip13}${
    medicationName ? ` (${medicationName})` : ''
  }`
  const nextNotes = [shortage.notes, evidence].filter(Boolean).join('\n')

  return {
    status: 'resolved',
    resolved_by: resolvedByUserId,
    resolved_at: new Date().toISOString(),
    resolution_cip13: cip13,
    notes: nextNotes || null,
  } as UpdateShortage
}
