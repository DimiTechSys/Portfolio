// src/lib/queries/profiles.ts
import { createClient } from '@/lib/supabase/client'
import { logAudit } from '@/lib/audit/log'
import { AUDIT_ACTIONS, AUDIT_TARGET_TYPES } from '@/lib/audit/actions'
import type { QueryResult, Profile } from '@/types/index'

export async function updateProfile(
  id: string,
  payload: { first_name?: string | null; last_name?: string | null; display_name?: string | null; avatar_url?: string | null }
): Promise<QueryResult<Profile>> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('profiles')
    .update(payload)
    .eq('id', id)
    .select()
    .single()

  if (error) return { data: null, error: error.message }

  void logAudit({
    action: AUDIT_ACTIONS.profileUpdated,
    target_type: AUDIT_TARGET_TYPES.profile,
    target_id: id,
    pharmacy_id: data.pharmacy_id ?? undefined,
  })

  return { data: data as Profile, error: null }
}
