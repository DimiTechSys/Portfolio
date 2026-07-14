// POST /api/planning/sessions/delete — suppression du pointage d'un membre sur
// une journée par le TITULAIRE (depuis la grille planning).
//
// La RLS `work_sessions_delete` n'autorise que le propriétaire à supprimer ses
// sessions, et `work_session_segments` n'a aucune policy de delete. On passe
// donc par le service_role APRÈS contrôle serveur :
//   - appelant authentifié + titulaire ;
//   - la cible appartient bien à l'officine de l'appelant.
//
// Body : { user_id: uuid, from: ISO, to: ISO } — bornes [from, to) de la journée
// locale calculées côté client (pour matcher l'affichage de la grille).

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { AUDIT_ACTIONS, AUDIT_TARGET_TYPES } from '@/lib/audit/actions'

export const runtime = 'nodejs'

const BodySchema = z.object({
  user_id: z.string().uuid(),
  from: z.string().datetime(),
  to: z.string().datetime(),
})

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const { data: caller } = await supabase
    .from('profiles')
    .select('pharmacy_id, role')
    .eq('id', user.id)
    .maybeSingle()
  if (!caller?.pharmacy_id) {
    return NextResponse.json({ error: 'no_pharmacy' }, { status: 403 })
  }
  if (caller.role !== 'titulaire') {
    return NextResponse.json({ error: 'titulaire_only' }, { status: 403 })
  }

  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }
  const parsed = BodySchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json({ error: 'validation_failed' }, { status: 422 })
  }
  const { user_id, from, to } = parsed.data

  const admin = createServiceClient()
  if (!admin) {
    return NextResponse.json({ error: 'service_unavailable' }, { status: 503 })
  }

  // Contrôle d'appartenance : la cible DOIT être dans l'officine de l'appelant.
  const { data: target } = await admin
    .from('profiles')
    .select('pharmacy_id')
    .eq('id', user_id)
    .maybeSingle()
  if (!target || target.pharmacy_id !== caller.pharmacy_id) {
    return NextResponse.json({ error: 'member_not_in_pharmacy' }, { status: 404 })
  }

  // Suppression des segments puis des sessions de la journée.
  const { error: segErr } = await admin
    .from('work_session_segments')
    .delete()
    .eq('user_id', user_id)
    .eq('pharmacy_id', caller.pharmacy_id)
    .gte('segment_started_at', from)
    .lt('segment_started_at', to)
  if (segErr) {
    console.error('[planning/sessions/delete] segments', { message: segErr.message })
    return NextResponse.json({ error: 'delete_failed' }, { status: 400 })
  }

  const { error: sessErr } = await admin
    .from('work_sessions')
    .delete()
    .eq('user_id', user_id)
    .eq('pharmacy_id', caller.pharmacy_id)
    .gte('started_at', from)
    .lt('started_at', to)
  if (sessErr) {
    console.error('[planning/sessions/delete] sessions', { message: sessErr.message })
    return NextResponse.json({ error: 'delete_failed' }, { status: 400 })
  }

  // Audit (via le client utilisateur → RLS OK : user_id = auth.uid()).
  await supabase.from('audit_log').insert({
    user_id: user.id,
    pharmacy_id: caller.pharmacy_id,
    action: AUDIT_ACTIONS.workSessionDeleted,
    target_type: AUDIT_TARGET_TYPES.workSession,
    target_id: user_id,
    metadata: { from, to },
  })

  return NextResponse.json({ ok: true })
}
