import { describe, expect, it } from 'vitest'
import {
  cip13ToCisCandidates,
  normalizeCip13Code,
  scannedCipMatchesDrugShortage,
} from '../cip13'

describe('normalizeCip13Code', () => {
  it('retire les caractères non numériques et tronque à 13 chiffres', () => {
    expect(normalizeCip13Code('34009 3012345 6')).toBe('3400930123456')
  })

  it('retourne une chaîne vide pour une entrée sans chiffres', () => {
    expect(normalizeCip13Code('abc')).toBe('')
  })
})

describe('cip13ToCisCandidates', () => {
  it('retourne des candidats CIS pour un CIP13 valide', () => {
    const code = '3400930123456'
    const candidates = cip13ToCisCandidates(code)
    expect(candidates.length).toBeGreaterThan(0)
    expect(candidates.every((c) => c.length >= 7)).toBe(true)
  })

  it('retourne un tableau vide si la longueur n’est pas 13', () => {
    expect(cip13ToCisCandidates('12345')).toEqual([])
  })
})

describe('scannedCipMatchesDrugShortage', () => {
  it('matche quand le CIP13 en base est identique au scan', () => {
    const code = '3400930123456'
    expect(
      scannedCipMatchesDrugShortage(code, { cip13: '34009 3012345 6', cis: '60001234' })
    ).toBe(true)
  })

  it('rejette un code trop court', () => {
    expect(scannedCipMatchesDrugShortage('123', { cis: '60001234' })).toBe(false)
  })

  it('matche via CIS dérivé du scan', () => {
    const code = '3400930123456'
    const [candidate] = cip13ToCisCandidates(code)
    expect(
      scannedCipMatchesDrugShortage(code, {
        cip13: null,
        cis: candidate.padStart(8, '0'),
      })
    ).toBe(true)
  })
})
