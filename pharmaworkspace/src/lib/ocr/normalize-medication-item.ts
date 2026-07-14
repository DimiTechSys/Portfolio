/**
 * Normalise un item médicament OCR : sépare nom et dosage si le modèle
 * a concaténé (ex. "AMOXICILLINE 1g") alors que dosage est vide.
 */
export type MedicationItemFields = {
  medication_name: string
  dosage: string | null
  quantity: number
}

const DOSAGE_SUFFIX =
  /^(.+?)\s+(\d+(?:[.,]\d+)?\s*(?:mg|g|ml|UI|µg|mcg|µl))\s*$/i

export function normalizeMedicationItem(
  input: MedicationItemFields
): MedicationItemFields {
  const quantity =
    typeof input.quantity === 'number' && Number.isFinite(input.quantity)
      ? Math.max(1, Math.floor(input.quantity))
      : 1

  let medication_name = String(input.medication_name ?? '').trim()
  let dosage =
    input.dosage == null || String(input.dosage).trim() === ''
      ? null
      : String(input.dosage).trim()

  if (!dosage && medication_name) {
    const m = medication_name.match(DOSAGE_SUFFIX)
    if (m) {
      medication_name = m[1].trim()
      dosage = m[2].trim()
    }
  }

  return { medication_name, dosage, quantity }
}
