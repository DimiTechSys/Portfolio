import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  getWeekDays,
  isSameDay,
  isToday,
  normalizeDate,
} from '../agenda-utils'

describe('isSameDay', () => {
  it('compare année, mois et jour uniquement', () => {
    const a = new Date(2026, 4, 19, 10, 0, 0)
    const b = new Date(2026, 4, 19, 23, 59, 59)
    expect(isSameDay(a, b)).toBe(true)
    expect(isSameDay(a, new Date(2026, 4, 20))).toBe(false)
  })
})

describe('normalizeDate', () => {
  it('retourne null pour null, undefined ou date invalide', () => {
    expect(normalizeDate(null)).toBeNull()
    expect(normalizeDate(undefined)).toBeNull()
    expect(normalizeDate('pas-une-date')).toBeNull()
  })

  it('accepte une chaîne ISO valide', () => {
    const d = normalizeDate('2026-05-19T12:00:00.000Z')
    expect(d).toBeInstanceOf(Date)
    expect(d!.getTime()).toBe(new Date('2026-05-19T12:00:00.000Z').getTime())
  })
})

describe('isToday', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 4, 19, 12, 0, 0))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('retourne true pour la date du jour (fuseau local)', () => {
    expect(isToday(new Date(2026, 4, 19))).toBe(true)
    expect(isToday(new Date(2026, 4, 18))).toBe(false)
  })
})

describe('getWeekDays', () => {
  it('retourne 7 jours consécutifs à partir du lundi', () => {
    const monday = new Date(2026, 4, 18)
    monday.setHours(0, 0, 0, 0)
    const days = getWeekDays(monday)
    expect(days).toHaveLength(7)
    expect(days[0].getDay()).toBe(1)
    expect(days[6].getDay()).toBe(0)
    expect(isSameDay(days[6], new Date(2026, 4, 24))).toBe(true)
  })
})
