/** Normalise un libellé produit pour comparaison (accents, espaces, casse). */
export function normalizeProductLabel(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/\s+/g, ' ')
}

function significantWords(label: string): string[] {
  return label
    .split(' ')
    .map((w) => w.replace(/[^a-z0-9]/gi, ''))
    .filter((w) => w.length >= 2)
}

/**
 * Compare le nom signalé à la déclaration avec le nom officiel issu du CIP.
 * Évite les faux positifs des simples sous-chaînes (includes).
 */
export function shortageNameMatchesMedication(
  productName: string,
  medicationNameFromDb: string
): boolean {
  const a = normalizeProductLabel(productName)
  const b = normalizeProductLabel(medicationNameFromDb)
  if (!a || !b) return false
  if (a === b) return true

  const wordsA = significantWords(a)
  const wordsB = significantWords(b)
  if (wordsA.length === 0 || wordsB.length === 0) return false

  const [shorter, longer] =
    wordsA.length <= wordsB.length ? [wordsA, wordsB] : [wordsB, wordsA]
  const longerWords = new Set(longer)

  const matched = shorter.filter((word) => {
    if (longerWords.has(word)) return true
    return longer.some(
      (lw) => word.length >= 4 && lw.length >= 4 && (lw.startsWith(word) || word.startsWith(lw))
    )
  })

  return matched.length / shorter.length >= 0.75
}

/** Indique si un produit signalé correspond à une entrée ANSM (même règle que la levée). */
export function productMatchesAnsmEntry(
  productName: string,
  ansmMedicationName: string
): boolean {
  return shortageNameMatchesMedication(productName, ansmMedicationName)
}
