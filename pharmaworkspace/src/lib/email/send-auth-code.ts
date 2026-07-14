// Helper d'envoi : email de connexion (code OTP) via Resend.
//
// Appelé par le Send Email Hook Supabase (src/app/api/auth/send-email-hook).
// Render le template React Email en HTML + texte plain, puis envoie via Resend,
// avec le même expéditeur / reply-to que les autres emails transactionnels.

import { render } from '@react-email/render'
import {
  getResend,
  getFromAddress,
  getReplyToAddress,
} from '@/lib/email/client'
import {
  AuthCodeEmail,
  type AuthCodeEmailProps,
} from '@/lib/email/templates/auth-code'

export type SendAuthCodeResult =
  | { ok: true; id: string }
  | { ok: false; error: string }

export async function sendAuthCodeEmail(
  params: AuthCodeEmailProps,
): Promise<SendAuthCodeResult> {
  const resend = getResend()
  if (!resend) {
    return { ok: false, error: 'email_not_configured' }
  }

  const html = await render(AuthCodeEmail(params))
  const text = await render(AuthCodeEmail(params), { plainText: true })

  const subject = params.isSignup
    ? `Bienvenue sur PharmaWorkspace — votre code : ${params.code}`
    : `Votre code de connexion PharmaWorkspace : ${params.code}`

  try {
    const { data, error } = await resend.emails.send({
      from: getFromAddress(),
      to: params.recipientEmail,
      replyTo: getReplyToAddress(),
      subject,
      html,
      text,
      tags: [{ name: 'category', value: 'auth' }],
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
