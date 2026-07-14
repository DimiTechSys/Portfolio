import { createClient } from '@/lib/supabase/client'
import type { AuditLogEntry, QueryResult } from '@/types/index'

const DEFAULT_LIMIT = 100

export async function getAuditLogEntries(
  pharmacyId: string,
  limit = DEFAULT_LIMIT
): Promise<QueryResult<AuditLogEntry[]>> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('audit_log')
    .select(
      `
      *,
      actor:profiles!audit_log_user_id_fkey (
        id,
        display_name,
        first_name,
        last_name
      )
    `
    )
    .eq('pharmacy_id', pharmacyId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) return { data: null, error: error.message }
  return { data: (data as unknown as AuditLogEntry[]) ?? [], error: null }
}
