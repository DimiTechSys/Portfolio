import type { ReactElement } from 'react'
import { render } from '@react-email/render'
import {
  getResend,
  getFromAddress,
  getReplyToAddress,
} from '@/lib/email/client'
import {
  LeaveRequestNotificationEmail,
  type LeaveRequestNotificationEmailProps,
} from '@/lib/email/templates/leave-request-notification'
import {
  LeaveDecisionEmail,
  type LeaveDecisionEmailProps,
} from '@/lib/email/templates/leave-decision'

export type SendEmailResult =
  | { ok: true; id: string }
  | { ok: false; error: string }

async function sendRenderedEmail(params: {
  to: string
  subject: string
  category: string
  component: ReactElement
}): Promise<SendEmailResult> {
  const resend = getResend()
  if (!resend) return { ok: false, error: 'email_not_configured' }

  const html = await render(params.component)
  const text = await render(params.component, { plainText: true })

  try {
    const { data, error } = await resend.emails.send({
      from: getFromAddress(),
      to: params.to,
      replyTo: getReplyToAddress(),
      subject: params.subject,
      html,
      text,
      tags: [{ name: 'category', value: params.category }],
    })

    if (error || !data?.id) {
      const message =
        typeof error === 'object' && error && 'message' in error
          ? String((error as { message: string }).message)
          : 'unknown'
      return { ok: false, error: message }
    }

    return { ok: true, id: data.id }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown'
    return { ok: false, error: message }
  }
}

export async function sendLeaveRequestNotificationEmail(
  params: LeaveRequestNotificationEmailProps & { recipientEmail: string }
): Promise<SendEmailResult> {
  const { recipientEmail, ...templateProps } = params
  return sendRenderedEmail({
    to: recipientEmail,
    subject: `Demande de congé de ${templateProps.requesterName}`,
    category: 'leave_request_submitted',
    component: LeaveRequestNotificationEmail(templateProps),
  })
}

export async function sendLeaveDecisionEmail(
  params: LeaveDecisionEmailProps & { recipientEmail: string }
): Promise<SendEmailResult> {
  const { recipientEmail, approved, ...templateProps } = params
  const status = approved ? 'approuvée' : 'refusée'
  return sendRenderedEmail({
    to: recipientEmail,
    subject: `Votre demande de congé a été ${status}`,
    category: 'leave_request_decided',
    component: LeaveDecisionEmail({ ...templateProps, approved }),
  })
}
