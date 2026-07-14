import { describe, expect, it } from 'vitest'
import {
  normalizeProductLabel,
  productMatchesAnsmEntry,
  shortageNameMatchesMedication,
} from '../name-match'

describe('normalizeProductLabel', () => {
  it('normalise casse, espaces et accents', () => {
    expect(normalizeProductLabel('  Doliprane   500mg  ')).toBe('doliprane 500mg')
    expect(normalizeProductLabel('Élévité')).toBe('elevite')
  })
})

describe('shortageNameMatchesMedication', () => {
  it('matche les libellés identiques après normalisation', () => {
    expect(shortageNameMatchesMedication('DOLIPRANE 500', 'doliprane 500')).toBe(true)
  })

  it('matche quand la majorité des mots significatifs correspondent', () => {
    expect(
      shortageNameMatchesMedication(
        'Doliprane 500 mg',
        'DOLIPRANE 500 MG COMPRIME'
      )
    ).toBe(true)
  })

  it('rejette les chaînes vides', () => {
    expect(shortageNameMatchesMedication('', 'Doliprane')).toBe(false)
    expect(shortageNameMatchesMedication('Doliprane', '')).toBe(false)
  })

  it('rejette des noms sans recouvrement suffisant', () => {
    expect(shortageNameMatchesMedication('Ibuprofene', 'Amoxicilline')).toBe(false)
  })
})

describe('productMatchesAnsmEntry', () => {
  it('délègue à shortageNameMatchesMedication', () => {
    expect(productMatchesAnsmEntry('doliprane', 'DOLIPRANE')).toBe(true)
  })
})
