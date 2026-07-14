import { describe, expect, it } from 'vitest'
import {
  INVITABLE_ROLES,
  hasPreparatorPermissions,
  isInvitableRole,
} from '@/lib/auth/roles'

describe('roles', () => {
  it('excludes titulaire from invitable roles', () => {
    expect(INVITABLE_ROLES).not.toContain('titulaire')
    expect(INVITABLE_ROLES).toEqual(
      expect.arrayContaining(['student', 'shelver'])
    )
  })

  it('isInvitableRole accepts new staff roles', () => {
    expect(isInvitableRole('student')).toBe(true)
    expect(isInvitableRole('shelver')).toBe(true)
    expect(isInvitableRole('titulaire')).toBe(false)
  })

  it('hasPreparatorPermissions matches preparateur-equivalent roles', () => {
    expect(hasPreparatorPermissions('preparateur')).toBe(true)
    expect(hasPreparatorPermissions('student')).toBe(true)
    expect(hasPreparatorPermissions('shelver')).toBe(true)
    expect(hasPreparatorPermissions('adjoint')).toBe(false)
    expect(hasPreparatorPermissions('titulaire')).toBe(false)
    expect(hasPreparatorPermissions(null)).toBe(false)
  })
})
