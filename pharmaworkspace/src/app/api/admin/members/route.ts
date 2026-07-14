// POST /api/admin/members — gestion d'un membre par le titulaire (changer le rôle / révoquer l'accès).
//
// H2 (migration 0056) : un trigger BEFORE UPDATE verrouille profiles.role et
// profiles.pharmacy_id pour tout client non-service_role (anti-escalade). Les
// actions LÉGITIMES du titulaire (changer le rôle d'un membre, le retirer de
// l'officine) doivent donc passer par le service_role APRÈS contrôle serveur :
//   - appelant authentifié + titulaire ;
//   - la cible appartient bien à l'officine de l'appelant ;
//   - pas d'auto-modification (évite qu'un titulaire s'auto-retire / s'orpheline).

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { AUDIT_ACTIONS, AUDIT_TARGET_TYPES } from '@/lib/audit/actions'

export const runtime = 'nodejs'

const BodySchema = z.object({
  member_id: z.string().uuid(),
  action: z.enum(['set_role', 'deactivate']),
  role: z.enum(['titulaire', 'adjoint', 'preparateur', 'student', 'shelver']).optional(),
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
  const { member_id, action, role } = parsed.data

  if (member_id === user.id) {
    return NextResponse.json({ error: 'cannot_modify_self' }, { status: 400 })
  }
  if (action === 'set_role' && !role) {
    return NextResponse.json({ error: 'role_required' }, { status: 422 })
  }

  const admin = createServiceClient()
  if (!admin) {
    return NextResponse.json({ error: 'service_unavailable' }, { status: 503 })
  }

  // Contrôle d'appartenance : la cible DOIT être dans l'officine de l'appelant.
  const { data: target } = await admin
    .from('profiles')
    .select('id, pharmacy_id')
    .eq('id', member_id)
    .maybeSingle()
  if (!target || target.pharmacy_id !== caller.pharmacy_id) {
    return NextResponse.json({ error: 'member_not_in_pharmacy' }, { status: 404 })
  }

  if (action === 'deactivate') {
    const { error } = await admin
      .from('profiles')
      .update({ pharmacy_id: null })
      .eq('id', member_id)
    if (error) {
      console.error('[admin/members] deactivate', { code: (error as { code?: string }).code, message: error.message })
      return NextResponse.json({ error: 'update_failed' }, { status: 400 })
    }
    // Audit via le client utilisateur (user_id=auth.uid() + pharmacy_id → RLS OK).
    await supabase.from('audit_log').insert({
      user_id: user.id,
      pharmacy_id: caller.pharmacy_id,
      action: AUDIT_ACTIONS.memberDeactivated,
      target_type: AUDIT_TARGET_TYPES.member,
      target_id: member_id,
    })
    return NextResponse.json({ ok: true })
  }

  const { data: updated, error } = await admin
    .from('profiles')
    .update({ role })
    .eq('id', member_id)
    .select()
    .single()
  if (error) {
    console.error('[admin/members] set_role', { code: (error as { code?: string }).code, message: error.message })
    return NextResponse.json({ error: 'update_failed' }, { status: 400 })
  }
  await supabase.from('audit_log').insert({
    user_id: user.id,
    pharmacy_id: caller.pharmacy_id,
    action: AUDIT_ACTIONS.memberRoleChanged,
    target_type: AUDIT_TARGET_TYPES.member,
    target_id: member_id,
    metadata: { role },
  })
  return NextResponse.json({ ok: true, profile: updated })
}
