import { describe, expect, it } from 'vitest'
import { haversineDistanceMeters } from '@/lib/geofencing/haversine'

describe('haversineDistanceMeters', () => {
  it('returns 0 for identical points', () => {
    expect(haversineDistanceMeters(48.8566, 2.3522, 48.8566, 2.3522)).toBe(0)
  })

  it('is symmetric', () => {
    const a = haversineDistanceMeters(48.8566, 2.3522, 45.764, 4.8357)
    const b = haversineDistanceMeters(45.764, 4.8357, 48.8566, 2.3522)
    expect(Math.abs(a - b)).toBeLessThan(1e-6)
  })

  it('measures Paris → Lyon as ~392 km', () => {
    const d = haversineDistanceMeters(48.8566, 2.3522, 45.764, 4.8357)
    expect(d).toBeGreaterThan(390_000)
    expect(d).toBeLessThan(395_000)
  })

  it('measures a small ~111 m step in latitude', () => {
    // 0.001° de latitude ≈ 111 m
    const d = haversineDistanceMeters(48.8566, 2.3522, 48.8576, 2.3522)
    expect(d).toBeGreaterThan(105)
    expect(d).toBeLessThan(117)
  })
})
