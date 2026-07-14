import { describe, expect, it } from 'vitest'
import { addThreeMonthsIsoDate, parseOcrIsoDate } from '@/lib/ocr/parse-ocr-dates'

describe('parseOcrIsoDate', () => {
  it('accepts valid YYYY-MM-DD', () => {
    expect(parseOcrIsoDate('2026-03-15')).toBe('2026-03-15')
  })

  it('rejects invalid values', () => {
    expect(parseOcrIsoDate('15/03/2026')).toBeNull()
    expect(parseOcrIsoDate(null)).toBeNull()
    expect(parseOcrIsoDate('')).toBeNull()
  })
})

describe('addThreeMonthsIsoDate', () => {
  it('adds three calendar months', () => {
    expect(addThreeMonthsIsoDate('2026-01-15')).toBe('2026-04-15')
  })
})
