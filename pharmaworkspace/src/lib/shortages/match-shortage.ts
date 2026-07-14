import type { DrugShortage, Shortage } from '@/types/index'
import { shortageNameMatchesMedication } from '@/lib/shortages/name-match'

type ShortageLink = Pick<
  Shortage,
  'id' | 'drug_shortage_id' | 'product_name' | 'status' | 'notes'
>

type DrugShortageLink = Pick<
  DrugShortage,
  'id' | 'medication_name' | 'cip13' | 'cis'
>

/** Vérifie que le scan correspond à la rupture signalée (lien BDD ou repli nom). */
export function shortageMatchesScannedDrugShortage(
  shortage: Pick<Shortage, 'drug_shortage_id' | 'product_name'>,
  entry: DrugShortageLink
): boolean {
  if (shortage.drug_shortage_id) {
    return shortage.drug_shortage_id === entry.id
  }
  return shortageNameMatchesMedication(
    shortage.product_name,
    entry.medication_name ?? ''
  )
}

/** Trouve une rupture ouverte pour l’entrée ANSM issue du scan. */
export function findOpenShortageForDrugShortage(
  activeShortages: ShortageLink[],
  entry: DrugShortageLink
): ShortageLink | undefined {
  const byId = activeShortages.find(
    (s) => s.status !== 'resolved' && s.drug_shortage_id === entry.id
  )
  if (byId) return byId

  return activeShortages.find(
    (s) =>
      s.status !== 'resolved' &&
      !s.drug_shortage_id &&
      shortageNameMatchesMedication(s.product_name, entry.medication_name ?? '')
  )
}
