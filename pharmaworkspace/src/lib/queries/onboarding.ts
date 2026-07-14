import { createClient } from '@/lib/supabase/client'
import type { QueryResult } from '@/types/index'

/**
 * Masque / réaffiche le widget des missions d'activation pour l'utilisateur
 * authentifié (ONBOARD-01, refactor per-user de la migration 0060).
 *
 * Per-user, pas per-pharmacie : chaque membre gère son propre confort visuel
 * sans impacter ses collègues. RLS `profiles_update_self_or_titulaire`
 * autorise tout user à UPDATE sa propre row.
 */
export async function setMissionsDismissed(
  userId: string,
  dismissed: boolean,
): Promise<QueryResult<{ dismissed: boolean }>> {
  const supabase = createClient()
  const { error } = await supabase
    .from('profiles')
    .update({
      missions_dismissed_at: dismissed ? new Date().toISOString() : null,
    })
    .eq('id', userId)
  if (error) return { data: null, error: error.message }
  return { data: { dismissed }, error: null }
}
