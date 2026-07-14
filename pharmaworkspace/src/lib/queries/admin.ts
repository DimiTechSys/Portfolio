// src/lib/queries/admin.ts
import { createClient } from '@/lib/supabase/client'
import { logAudit } from '@/lib/audit/log'
import { AUDIT_ACTIONS, AUDIT_TARGET_TYPES } from '@/lib/audit/actions'
import type {
  Pharmacy,
  Profile,
  Invitation,
  UserRole,
  QueryResult,
} from '@/types/index'

// ════════════════════════════════════════════════════════════
// Pharmacy
// ════════════════════════════════════════════════════════════

export async function createPharmacy(
  payload: Pick<Pharmacy, 'name' | 'finess' | 'address'>
): Promise<QueryResult<Pharmacy>> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('pharmacies')
    .insert(payload)
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

type PharmacySettingsPayload = Partial<
  Pick<
    Pharmacy,
    | 'name'
    | 'finess'
    | 'address'
    | 'logo_url'
    | 'address_latitude'
    | 'address_longitude'
    | 'address_geocoded_at'
    | 'clockin_geofence_enabled'
    | 'clockin_geofence_radius_m'
  >
>

export async function updatePharmacySettings(
  id: string,
  payload: PharmacySettingsPayload
): Promise<QueryResult<Pharmacy>> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('pharmacies')
    .update(payload)
    .eq('id', id)
    .select()
    .single()

  if (error) return { data: null, error: error.message }

  void logAudit({
    action: AUDIT_ACTIONS.pharmacySettingsUpdated,
    target_type: AUDIT_TARGET_TYPES.pharmacy,
    target_id: id,
    pharmacy_id: id,
    metadata: { fields: Object.keys(payload) },
  })

  return { data, error: null }
}

// ════════════════════════════════════════════════════════════
// Members
// ════════════════════════════════════════════════════════════

export async function getPharmacyMembers(
  pharmacyId: string
): Promise<QueryResult<Profile[]>> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('pharmacy_id', pharmacyId)
    .order('last_name', { ascending: true })

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

// H2 (0056) : profiles.role/pharmacy_id sont verrouillés au client par trigger.
// Ces 2 mutations titulaire passent donc par la route serveur service_role
// /api/admin/members (contrôle auth + titulaire + appartenance côté serveur).
export async function updateMemberRole(
  memberId: string,
  role: UserRole
): Promise<QueryResult<Profile>> {
  const res = await fetch('/api/admin/members', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ member_id: memberId, action: 'set_role', role }),
  })
  const json = (await res.json().catch(() => ({}))) as { profile?: Profile; error?: string }
  if (!res.ok) return { data: null, error: json.error ?? 'Mise à jour du rôle impossible.' }
  return { data: json.profile as Profile, error: null }
}

export async function deactivateMember(
  memberId: string
): Promise<QueryResult<null>> {
  // Retire le pharmacy_id du profil (révoque l'accès) — via service_role serveur.
  const res = await fetch('/api/admin/members', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ member_id: memberId, action: 'deactivate' }),
  })
  if (!res.ok) {
    const json = (await res.json().catch(() => ({}))) as { error?: string }
    return { data: null, error: json.error ?? 'Révocation impossible.' }
  }
  return { data: null, error: null }
}

// ════════════════════════════════════════════════════════════
// Invitations
// ════════════════════════════════════════════════════════════

export async function getPendingInvitations(
  pharmacyId: string
): Promise<QueryResult<Invitation[]>> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('invitations')
    .select('*')
    .eq('pharmacy_id', pharmacyId)
    .is('accepted_at', null)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

export async function createInvitation(
  pharmacyId: string,
  email: string,
  role: UserRole
): Promise<QueryResult<Invitation>> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('invitations')
    .insert({ pharmacy_id: pharmacyId, email, role })
    .select()
    .single()

  if (error) return { data: null, error: error.message }

  void logAudit({
    action: AUDIT_ACTIONS.memberInvited,
    target_type: AUDIT_TARGET_TYPES.invitation,
    target_id: data.id,
    pharmacy_id: pharmacyId,
    metadata: { email, role },
  })

  return { data, error: null }
}

export async function revokeInvitation(
  id: string
): Promise<QueryResult<null>> {
  const supabase = createClient()
  const { error } = await supabase
    .from('invitations')
    .delete()
    .eq('id', id)

  if (error) return { data: null, error: error.message }

  void logAudit({
    action: AUDIT_ACTIONS.invitationRevoked,
    target_type: AUDIT_TARGET_TYPES.invitation,
    target_id: id,
  })

  return { data: null, error: null }
}