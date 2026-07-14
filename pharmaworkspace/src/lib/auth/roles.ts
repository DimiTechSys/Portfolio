import type { UserRole } from '@/types/index'

export const USER_ROLES: readonly UserRole[] = [
  'titulaire',
  'adjoint',
  'preparateur',
  'student',
  'shelver',
] as const

/** Rôles invitables par le titulaire (pas de second titulaire par officine). */
export const INVITABLE_ROLES: readonly UserRole[] = [
  'adjoint',
  'preparateur',
  'student',
  'shelver',
] as const

/** Membres rattachés à une officine (badge, sessions, nav métier). */
export const PHARMACY_MEMBER_ROLES: readonly UserRole[] = USER_ROLES

/** Rôles avec accès aux écrans métier standard (hors /admin). */
export const NAV_MEMBER_ROLES: readonly UserRole[] = USER_ROLES

const PREPARATOR_EQUIVALENT: readonly UserRole[] = [
  'preparateur',
  'student',
  'shelver',
]

export function isInvitableRole(role: string): role is UserRole {
  return (INVITABLE_ROLES as readonly string[]).includes(role)
}

/** Même matrice que préparateur (TECH-10). */
export function hasPreparatorPermissions(role: UserRole | null): boolean {
  return role !== null && (PREPARATOR_EQUIVALENT as readonly string[]).includes(role)
}
