/** Normalise un code CIP13 scanné (13 chiffres). */
export function normalizeCip13Code(raw: string): string {
  return raw.replace(/\D/g, '').slice(0, 13)
}

function normalizeCisDigits(value: string): string {
  const digits = value.replace(/\D/g, '')
  const trimmed = digits.replace(/^0+/, '')
  return trimmed || digits
}

/** Extrait des candidats CIS à partir d’un CIP13 scanné (référentiel ANSM indexé par CIS). */
export function cip13ToCisCandidates(cip13: string): string[] {
  const digits = cip13.replace(/\D/g, '')
  if (digits.length !== 13) return []

  const candidates = new Set<string>()
  const slices = [
    digits.slice(3, 10),
    digits.slice(3, 11),
    digits.slice(4, 11),
    digits.slice(5, 12),
  ]

  for (const slice of slices) {
    if (slice.length >= 7) {
      candidates.add(slice)
      candidates.add(slice.padStart(8, '0'))
    }
  }

  return [...candidates]
}

/** Le CIP13 scanné correspond-il à l’entrée ANSM liée (CIP13 en base ou CIS dérivé du scan) ? */
export function scannedCipMatchesDrugShortage(
  code: string,
  entry: { cip13?: string | null; cis: string }
): boolean {
  const normalized = normalizeCip13Code(code)
  if (normalized.length !== 13) return false

  const entryCip = entry.cip13 ? normalizeCip13Code(entry.cip13) : ''
  if (entryCip.length === 13 && entryCip === normalized) return true

  const entryCis = normalizeCisDigits(entry.cis)
  for (const candidate of cip13ToCisCandidates(normalized)) {
    if (normalizeCisDigits(candidate) === entryCis) return true
  }

  const rawCis = entry.cis.replace(/\D/g, '')
  if (rawCis.length >= 6 && normalized.includes(rawCis)) return true

  return false
}
