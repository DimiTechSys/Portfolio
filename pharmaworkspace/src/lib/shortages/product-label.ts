/** Normalise un libellé produit pour comparaison (accents, casse, espaces). */
export function normalizeProductLabel(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/\s+/g, ' ')
}

/**
 * Compare le nom signalé sur une rupture au nom officiel issu du CIP.
 * Évite les faux positifs des simples `includes` sur des sous-chaînes courtes.
 */
export function shortageNameMatchesMedication(
  productName: string,
  medicationNameFromDb: string
): boolean {
  const a = normalizeProductLabel(productName)
  const b = normalizeProductLabel(medicationNameFromDb)
  if (!a || !b) return false
  if (a === b) return true

  const [shorter, longer] = a.length <= b.length ? [a, b] : [b, a]
  if (shorter.length >= 5 && longer.includes(shorter)) return true

  const tokens = shorter.split(' ').filter((t) => t.length >= 3)
  if (tokens.length > 0 && tokens.every((token) => longer.includes(token))) {
    return true
  }

  return false
}

/** Correspondance prudente entre un produit signalé et un libellé liste ANSM. */
export function productMatchesAnsmLabel(productName: string, ansmMedicationName: string): boolean {
  return shortageNameMatchesMedication(productName, ansmMedicationName)
}
