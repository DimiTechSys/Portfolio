import { createClient } from '@/lib/supabase/client'

export type LogAuditParams = {
  action: string
  target_type: string
  target_id?: string
  metadata?: Record<string, unknown>
  pharmacy_id?: string
}

/**
 * Enregistre une entrée d'audit (best-effort : n'interrompt jamais le flux métier).
 */
export async function logAudit(params: LogAuditParams): Promise<void> {
  try {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    let pharmacyId = params.pharmacy_id
    if (!pharmacyId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('pharmacy_id')
        .eq('id', user.id)
        .maybeSingle()
      pharmacyId = profile?.pharmacy_id ?? undefined
    }
    if (!pharmacyId) return

    const { error } = await supabase.from('audit_log').insert({
      pharmacy_id: pharmacyId,
      user_id: user.id,
      action: params.action,
      target_type: params.target_type,
      target_id: params.target_id ?? null,
      metadata: params.metadata ?? {},
    })

    if (error) {
      console.warn('[audit] insert failed', error.message)
    }
  } catch (err) {
    console.warn('[audit] logAudit error', err)
  }
}
