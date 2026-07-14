// GET /api/legal/export
//
// Implémente le droit d'accès / portabilité RGPD (art. 15 + 20). Retourne
// un JSON téléchargeable contenant l'ensemble des données concernant
// l'utilisateur authentifié à travers les tables métier.
//
// L'export ne contient PAS les données de la pharmacie au sens large (tâches
// créées par d'autres, etc.) : seulement ce qui se rapporte directement à
// l'utilisateur (ses créations, ses notifications, son audit log, etc.).
// La pharmacie elle-même reste sous la responsabilité du titulaire.
//
// Réponse : 200 + application/json + Content-Disposition attachment.

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { legalRateLimit } from '@/lib/rate-limit/upstash'
import { SUPPORT_EMAIL } from '@/config/constants'

export const runtime = 'nodejs'

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  // L4 : limite l'exercice du droit d'accès (5/h par utilisateur).
  const { success } = await legalRateLimit.limit(user.id)
  if (!success) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 })
  }

  // Les requêtes ci-dessous passent par le client de l'utilisateur (cookies)
  // et donc par RLS. RLS garantit qu'on ne voit que ce qui appartient à
  // l'utilisateur (politiques `user_id = auth.uid()` ou `pharmacy_id = ...`
  // qui pourraient inclure plus large que désiré). Pour limiter strictement
  // à la personne, on filtre explicitement par user.id en plus.
  const [
    profileRes,
    tasksCreatedRes,
    tasksAssignedRes,
    prescriptionsRes,
    prescriptionCommentsRes,
    ordersRes,
    rentalsRes,
    shortagesRes,
    contactsRes,
    trainingResourcesRes,
    notificationsRes,
    workSessionsRes,
    workSessionSegmentsRes,
    feedbackRes,
    auditLogRes,
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
    supabase.from('tasks').select('*').eq('created_by', user.id),
    supabase.from('tasks').select('*').eq('assigned_to', user.id),
    supabase
      .from('prescriptions')
      .select('*, prescription_items(*)')
      .eq('created_by', user.id),
    supabase.from('prescription_comments').select('*').eq('author_id', user.id),
    supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('created_by', user.id),
    supabase.from('rentals').select('*').eq('created_by', user.id),
    supabase.from('shortages').select('*').eq('reported_by', user.id),
    supabase.from('contacts').select('*').eq('created_by', user.id),
    supabase.from('training_resources').select('*').eq('created_by', user.id),
    supabase.from('notifications').select('*').eq('user_id', user.id),
    supabase.from('work_sessions').select('*').eq('user_id', user.id),
    supabase.from('work_session_segments').select('*').eq('user_id', user.id),
    supabase.from('feedback').select('*').eq('user_id', user.id),
    supabase.from('audit_log').select('*').eq('user_id', user.id),
  ])

  const payload = {
    exported_at: new Date().toISOString(),
    notice:
      `Export des données à caractère personnel vous concernant, conformément aux articles 15 et 20 du RGPD. Pour toute question, contactez ${SUPPORT_EMAIL}.`,
    user: {
      id: user.id,
      email: user.email,
      created_at: user.created_at,
      last_sign_in_at: user.last_sign_in_at,
    },
    profile: profileRes.data,
    tasks_created: tasksCreatedRes.data ?? [],
    tasks_assigned: tasksAssignedRes.data ?? [],
    prescriptions: prescriptionsRes.data ?? [],
    prescription_comments: prescriptionCommentsRes.data ?? [],
    orders: ordersRes.data ?? [],
    rentals: rentalsRes.data ?? [],
    shortages: shortagesRes.data ?? [],
    contacts: contactsRes.data ?? [],
    training_resources: trainingResourcesRes.data ?? [],
    notifications: notificationsRes.data ?? [],
    work_sessions: workSessionsRes.data ?? [],
    work_session_segments: workSessionSegmentsRes.data ?? [],
    feedback: feedbackRes.data ?? [],
    audit_log: auditLogRes.data ?? [],
  }

  const today = new Date().toISOString().slice(0, 10)
  const body = JSON.stringify(payload, null, 2)

  return new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="pharmaworkspace-export-${today}.json"`,
      'Cache-Control': 'no-store',
    },
  })
}
