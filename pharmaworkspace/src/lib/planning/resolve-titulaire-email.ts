import type { SupabaseClient } from '@supabase/supabase-js'

export async function resolveTitulaireEmail(
  admin: SupabaseClient,
  pharmacyId: string
): Promise<string | null> {
  const { data: titulaire } = await admin
    .from('profiles')
    .select('id')
    .eq('pharmacy_id', pharmacyId)
    .eq('role', 'titulaire')
    .limit(1)
    .maybeSingle()

  if (!titulaire?.id) return null

  const { data: authUser, error } = await admin.auth.admin.getUserById(titulaire.id)
  if (error || !authUser.user?.email) return null
  return authUser.user.email
}

export async function resolveUserEmail(
  admin: SupabaseClient,
  userId: string
): Promise<string | null> {
  const { data: authUser, error } = await admin.auth.admin.getUserById(userId)
  if (error || !authUser.user?.email) return null
  return authUser.user.email
}
