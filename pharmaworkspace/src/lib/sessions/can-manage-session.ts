import { PHARMACY_MEMBER_ROLES } from '@/lib/auth/roles'

/** Tout membre rattaché à une officine peut badger (pas seulement le titulaire). */
export function canManageWorkSession(profile: {
  pharmacy_id?: string | null
  role?: string | null
} | null): boolean {
  if (!profile?.pharmacy_id) return false
  if (!profile.role) return true
  return (PHARMACY_MEMBER_ROLES as readonly string[]).includes(profile.role)
}
