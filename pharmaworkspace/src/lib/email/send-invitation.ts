// Helper d'envoi : invitation à rejoindre une officine.
//
// Render le template React Email en HTML + texte plain, puis envoie via Resend.
// Erreurs propagées vers l'appelant : c'est à lui de décider si l'échec
// d'envoi email doit faire échouer la création d'invitation côté DB
// (rollback) ou être loggé sans bloquer.

import { render } from '@react-email/render'
import {
  getResend,
  getFromAddress,
  getReplyToAddress,
} from '@/lib/email/client'
import {
  InvitationEmail,
  type InvitationEmailProps,
} from '@/lib/email/templates/invitation'

type SendInvitationParams = InvitationEmailProps

export type SendInvitationResult =
  | { ok: true; id: string }
  | { ok: false; error: string }

/**
 * Resend impose que les *values* des tags soient ASCII strict
 * (`[a-zA-Z0-9_-]` uniquement). Cette fonction normalise une chaîne libre
 * (nom de pharmacie, etc.) en slug compatible. Le tag sert juste à
 * segmenter les sends dans le dashboard Resend ; l'affichage email
 * (subject, html, text) n'est pas affecté.
 */
function slugifyTagValue(value: string, maxLength = 64): string {
  const slug = value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // diacritiques (é → e, à → a, ç → c)
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '_') // tout caractère hors set autorisé → _
    .replace(/_+/g, '_') // collapse les _ consécutifs
    .replace(/^_+|_+$/g, '') // trim les _ en début/fin
    .slice(0, maxLength)
  return slug.length > 0 ? slug : 'unknown'
}

export async function sendInvitationEmail(
  params: SendInvitationParams,
): Promise<SendInvitationResult> {
  const resend = getResend()
  if (!resend) {
    return { ok: false, error: 'email_not_configured' }
  }

  const html = await render(InvitationEmail(params))
  const text = await render(InvitationEmail(params), { plainText: true })

  const subject = params.inviterName
    ? `${params.inviterName} vous invite à rejoindre ${params.pharmacyName} sur PharmaWorkspace`
    : `Invitation à rejoindre ${params.pharmacyName} sur PharmaWorkspace`

  try {
    const { data, error } = await resend.emails.send({
      from: getFromAddress(),
      to: params.recipientEmail,
      replyTo: getReplyToAddress(),
      subject,
      html,
      text,
      tags: [
        { name: 'category', value: 'invitation' },
        { name: 'pharmacy', value: slugifyTagValue(params.pharmacyName) },
      ],
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
