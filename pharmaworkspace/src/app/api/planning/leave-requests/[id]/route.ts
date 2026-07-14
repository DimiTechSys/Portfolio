import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { sendLeaveDecisionEmail } from '@/lib/email/send-leave-notification'
import { resolveUserEmail } from '@/lib/planning/resolve-titulaire-email'
import { formatLeavePeriod, getLeaveTypeLabel } from '@/lib/planning/format'
import { getProfileDisplayName } from '@/lib/queries/planning'
import {
  canTransitionLeave,
  statusForLeaveAction,
  type LeaveReviewAction,
} from '@/lib/planning/leave-transitions'
import { AUDIT_ACTIONS, AUDIT_TARGET_TYPES } from '@/lib/audit/actions'

type ReviewBody = {
  action: LeaveReviewAction
  review_note?: string | null
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params

  let body: ReviewBody
  try {
    body = (await request.json()) as ReviewBody
  } catch {
    return NextResponse.json({ error: 'Corps invalide.' }, { status: 400 })
  }

  if (body.action !== 'approve' && body.action !== 'reject') {
    return NextResponse.json({ error: 'Action invalide.' }, { status: 400 })
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('pharmacy_id, role')
    .eq('id', user.id)
    .single()

  if (profileError || !profile?.pharmacy_id) {
    return NextResponse.json({ error: 'Profil introuvable.' }, { status: 403 })
  }

  if (profile.role !== 'titulaire') {
    return NextResponse.json({ error: 'Réservé au titulaire.' }, { status: 403 })
  }

  const { data: existing, error: fetchError } = await supabase
    .from('leave_requests')
    .select('*')
    .eq('id', id)
    .eq('pharmacy_id', profile.pharmacy_id)
    .single()

  if (fetchError || !existing) {
    return NextResponse.json({ error: 'Demande introuvable.' }, { status: 404 })
  }

  if (!canTransitionLeave(existing.status, body.action)) {
    return NextResponse.json({ error: 'Transition impossible.' }, { status: 409 })
  }

  const reviewNote =
    typeof body.review_note === 'string' ? body.review_note.trim() || null : null
  const newStatus = statusForLeaveAction(body.action)
  const now = new Date().toISOString()

  const { data: updated, error: updateError } = await supabase
    .from('leave_requests')
    .update({
      status: newStatus,
      reviewed_by: user.id,
      reviewed_at: now,
      review_note: reviewNote,
      updated_at: now,
    })
    .eq('id', id)
    .eq('status', 'pending')
    .select()
    .single()

  if (updateError || !updated) {
    return NextResponse.json(
      { error: updateError?.message ?? 'Mise à jour impossible.' },
      { status: 500 }
    )
  }

  await supabase.from('audit_log').insert({
    pharmacy_id: profile.pharmacy_id,
    user_id: user.id,
    action:
      body.action === 'approve'
        ? AUDIT_ACTIONS.leaveRequestApproved
        : AUDIT_ACTIONS.leaveRequestRejected,
    target_type: AUDIT_TARGET_TYPES.leaveRequest,
    target_id: id,
    metadata: { leave_type: updated.leave_type, status: newStatus },
  })

  const { data: requesterProfile } = await supabase
    .from('profiles')
    .select('id, display_name, first_name, last_name')
    .eq('id', updated.requester_id)
    .single()

  const { data: pharmacy } = await supabase
    .from('pharmacies')
    .select('name')
    .eq('id', profile.pharmacy_id)
    .single()

  const requesterName = requesterProfile
    ? getProfileDisplayName(requesterProfile)
    : 'Collaborateur'
  const approved = body.action === 'approve'
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  const admin = createServiceClient()
  if (admin) {
    const requesterEmail = await resolveUserEmail(admin, updated.requester_id)
    if (requesterEmail) {
      const sendResult = await sendLeaveDecisionEmail({
        recipientEmail: requesterEmail,
        requesterName,
        pharmacyName: pharmacy?.name ?? 'Votre officine',
        leaveTypeLabel: getLeaveTypeLabel(updated.leave_type),
        periodLabel: formatLeavePeriod(updated),
        approved,
        reviewNote,
        planningUrl: `${appUrl}/planning/requests`,
      })

      if (!sendResult.ok) {
        console.error('[planning/leave-requests/id] email send failed', sendResult.error)
      }
    }
  }

  await supabase.from('notifications').insert({
    pharmacy_id: profile.pharmacy_id,
    user_id: updated.requester_id,
    type: 'leave_request_decided',
    title: approved ? 'Congé approuvé' : 'Congé refusé',
    body: `${getLeaveTypeLabel(updated.leave_type)} : ${formatLeavePeriod(updated)}`,
    metadata: {
      leave_request_id: updated.id,
      target_url: '/planning/requests',
    },
  })

  return NextResponse.json({ data: updated })
}
