import { describe, expect, it } from 'vitest'

/** Paths alignés bucket attachments privé (TECH-11). */
export function rentalPhotoStoragePath(pharmacyId: string, rentalId: string, fileId: string) {
  return `${pharmacyId}/rentals/${rentalId}/${fileId}.jpg`
}

describe('rental attachment storage paths', () => {
  it('prefixes by pharmacy_id for RLS storage policies', () => {
    const path = rentalPhotoStoragePath(
      '11111111-1111-1111-1111-111111111111',
      '22222222-2222-2222-2222-222222222222',
      'abc'
    )
    expect(path.startsWith('11111111-1111-1111-1111-111111111111/')).toBe(true)
    expect(path).toContain('/rentals/22222222-2222-2222-2222-222222222222/')
    expect(path.endsWith('.jpg')).toBe(true)
  })
})
