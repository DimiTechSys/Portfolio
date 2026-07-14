import { describe, expect, it } from 'vitest'
import {
  computeSegmentMinutes,
  formatSessionClock,
  formatWorkedDuration,
  formatWorkedElapsedMs,
  getLocalDayEndIso,
  getLocalDayStart,
} from '../time'

describe('formatWorkedDuration', () => {
  it('affiche minutes seules sous une heure', () => {
    expect(formatWorkedDuration(45)).toBe('45m')
  })

  it('affiche heures et minutes au-delà de 60 min', () => {
    expect(formatWorkedDuration(125)).toBe('2h 5m')
  })

  it('ne retourne pas de durée négative', () => {
    expect(formatWorkedDuration(-10)).toBe('0m')
  })
})

describe('formatWorkedElapsedMs', () => {
  it('convertit les millisecondes en affichage minutes', () => {
    expect(formatWorkedElapsedMs(90 * 60_000)).toBe('1h 30m')
  })
})

describe('formatSessionClock', () => {
  it('retourne un tiret pour une valeur vide', () => {
    expect(formatSessionClock(null)).toBe('-')
  })

  it('formate une heure locale fr-FR', () => {
    const iso = new Date(2026, 4, 19, 14, 30, 0).toISOString()
    expect(formatSessionClock(iso)).toMatch(/\d{2}:\d{2}/)
  })
})

describe('getLocalDayStart / getLocalDayEndIso', () => {
  it('getLocalDayStart remet l’heure à minuit local', () => {
    const start = getLocalDayStart(new Date(2026, 4, 19, 15, 30, 0))
    expect(start.getHours()).toBe(0)
    expect(start.getMinutes()).toBe(0)
    expect(start.getDate()).toBe(19)
  })

  it('getLocalDayEndIso termine la journée locale', () => {
    const iso = getLocalDayEndIso('2026-05-19T10:00:00.000Z')
    const end = new Date(iso)
    const start = getLocalDayStart(new Date('2026-05-19T10:00:00.000Z'))
    expect(end.getTime()).toBeGreaterThan(start.getTime())
  })
})

describe('computeSegmentMinutes', () => {
  it('calcule la durée en minutes entre deux timestamps', () => {
    const started = '2026-05-19T10:00:00.000Z'
    const ended = '2026-05-19T10:45:00.000Z'
    expect(computeSegmentMinutes(started, ended)).toBe(45)
  })

  it('utilise nowMs quand endedAt est null', () => {
    const started = '2026-05-19T10:00:00.000Z'
    const nowMs = new Date('2026-05-19T10:30:00.000Z').getTime()
    expect(computeSegmentMinutes(started, null, nowMs)).toBe(30)
  })
})
