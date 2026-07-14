import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { sendLeaveRequestNotificationEmail } from '@/lib/email/send-leave-notification'
import { resolveTitulaireEmail } from '@/lib/planning/resolve-titulaire-email'
import { formatLeavePeriod, getLeaveTypeLabel } from '@/lib/planning/format'
import { getProfileDisplayName } from '@/lib/queries/planning'
import { apiError } from '@/lib/api/error-response'
import { LEAVE_TYPE_LABELS } from '@/config/constants'
import { AUDIT_ACTIONS, AUDIT_TARGET_TYPES } from '@/lib/audit/actions'
import type { LeaveType } from '@/types/index'

const VALID_LEAVE_TYPES = Object.keys(LEAVE_TYPE_LABELS) as [LeaveType, ...LeaveType[]]

const SubmitSchema = z
  .object({
    leave_type: z.enum(VALID_LEAVE_TYPES),
    start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    half_day_start: z.boolean().optional(),
    half_day_end: z.boolean().optional(),
    // reason est libre : on borne pour ne pas insérer un texte abusif en DB.
    reason: z.string().trim().max(500).nullish(),
  })
  .refine((b) => b.end_date >= b.start_date, {
    message: 'La date de fin doit être après la date de début.',
  })

export async function POST(request: Request) {
  let rawBody: unknown
  try {
    rawBody = await request.json()
  } catch {
    return NextResponse.json({ error: 'Corps invalide.' }, { status: 400 })
  }

  const parsed = SubmitSchema.safeParse(rawBody)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Données invalides.' }, { status: 400 })
  }
  const body = parsed.data

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('pharmacy_id, display_name, first_name, last_name')
    .eq('id', user.id)
    .single()

  if (profileError || !profile?.pharmacy_id) {
    return NextResponse.json({ error: 'Profil introuvable.' }, { status: 403 })
  }

  const reason = typeof body.reason === 'string' ? body.reason.trim() || null : null

  const { data: leave, error: insertError } = await supabase
    .from('leave_requests')
    .insert({
      pharmacy_id: profile.pharmacy_id,
      requester_id: user.id,
      leave_type: body.leave_type,
      start_date: body.start_date,
      end_date: body.end_date,
      half_day_start: Boolean(body.half_day_start),
      half_day_end: Boolean(body.half_day_end),
      reason,
      status: 'pending',
    })
    .select()
    .single()

  if (insertError || !leave) {
    return apiError(
      '[planning/leave-requests]',
      insertError,
      'Création impossible.',
      500
    )
  }

  await supabase.from('audit_log').insert({
    user_id: user.id,
    pharmacy_id: profile.pharmacy_id,
    action: AUDIT_ACTIONS.leaveRequestSubmitted,
    target_type: AUDIT_TARGET_TYPES.leaveRequest,
    target_id: leave.id,
    metadata: { leave_type: body.leave_type },
  })

  const { data: pharmacy } = await supabase
    .from('pharmacies')
    .select('name')
    .eq('id', profile.pharmacy_id)
    .single()

  const requesterName = getProfileDisplayName(profile)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const reviewUrl = `${appUrl}/planning/requests`

  const admin = createServiceClient()
  if (admin) {
    const titulaireEmail = await resolveTitulaireEmail(admin, profile.pharmacy_id)
    if (titulaireEmail) {
      const { data: titulaireProfile } = await admin
        .from('profiles')
        .select('id, display_name, first_name, last_name')
        .eq('pharmacy_id', profile.pharmacy_id)
        .eq('role', 'titulaire')
        .limit(1)
        .maybeSingle()

      const sendResult = await sendLeaveRequestNotificationEmail({
        recipientEmail: titulaireEmail,
        titulaireName: titulaireProfile ? getProfileDisplayName(titulaireProfile) : null,
        requesterName,
        pharmacyName: pharmacy?.name ?? 'Votre officine',
        leaveTypeLabel: getLeaveTypeLabel(body.leave_type),
        periodLabel: formatLeavePeriod(leave),
        reason,
        reviewUrl,
      })

      if (!sendResult.ok) {
        console.error('[planning/leave-requests] email send failed', sendResult.error)
      }

      if (titulaireProfile?.id) {
        await supabase.from('notifications').insert({
          pharmacy_id: profile.pharmacy_id,
          user_id: titulaireProfile.id,
          type: 'leave_request_submitted',
          title: 'Nouvelle demande de congé',
          body: `${requesterName} : ${getLeaveTypeLabel(body.leave_type)}`,
          metadata: {
            leave_request_id: leave.id,
            target_url: '/planning/requests',
          },
        })
      }
    }
  }

  return NextResponse.json({ data: leave })
}
