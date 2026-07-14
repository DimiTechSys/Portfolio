/** Parse YYYY-MM-DD from OCR JSON; returns null if invalid. */
export function parseOcrIsoDate(value: unknown): string | null {
  if (value == null || value === 'null') return null
  const s = String(value).trim()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null
  const d = new Date(`${s}T12:00:00`)
  if (Number.isNaN(d.getTime())) return null
  return s
}

/** Legal default: prescription valid 3 months after issue (France). */
export function addThreeMonthsIsoDate(isoDate: string): string {
  const d = new Date(`${isoDate}T12:00:00`)
  d.setMonth(d.getMonth() + 3)
  return d.toISOString().slice(0, 10)
}
