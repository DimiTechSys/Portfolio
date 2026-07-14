// Aperçu / test des emails transactionnels — DEV UNIQUEMENT (404 en prod).
//
// Visualiser le rendu (HTML) sans envoyer :
//   /api/dev/email-preview?type=auth
//   /api/dev/email-preview?type=auth-signup
//   /api/dev/email-preview?type=invitation
//
// Envoyer un vrai email de test via Resend (ajouter &send=<email>) :
//   /api/dev/email-preview?type=auth&send=moi@exemple.fr
//   /api/dev/email-preview?type=invitation&send=moi@exemple.fr

import { render } from '@react-email/render'
import { AuthCodeEmail } from '@/lib/email/templates/auth-code'
import { InvitationEmail } from '@/lib/email/templates/invitation'
import { sendAuthCodeEmail } from '@/lib/email/send-auth-code'
import { sendInvitationEmail } from '@/lib/email/send-invitation'

export const runtime = 'nodejs'

const SAMPLE = {
  auth: {
    recipientEmail: 'apercu@pharmaworkspace.fr',
    code: '12345678',
    magicLink: 'http://localhost:3000/auth/callback?next=/dashboard&token_hash=apercu&type=magiclink',
    isSignup: false,
  },
  'auth-signup': {
    recipientEmail: 'apercu@pharmaworkspace.fr',
    code: '12345678',
    magicLink: 'http://localhost:3000/auth/callback?next=/dashboard&token_hash=apercu&type=magiclink',
    isSignup: true,
  },
  invitation: {
    recipientEmail: 'apercu@pharmaworkspace.fr',
    inviterName: 'Dr. Martin',
    pharmacyName: 'Pharmacie du Centre',
    roleLabel: 'préparateur',
    acceptUrl: 'http://localhost:3000/invite/accept?token=apercu',
  },
} as const

export async function GET(request: Request): Promise<Response> {
  if (process.env.NODE_ENV === 'production') {
    return new Response('Not found', { status: 404 })
  }

  const params = new URL(request.url).searchParams
  const type = (params.get('type') ?? 'auth') as keyof typeof SAMPLE
  const sendTo = params.get('send')
  const sample = SAMPLE[type] ?? SAMPLE.auth

  // Envoi réel via Resend (test de bout en bout local).
  if (sendTo) {
    const result =
      type === 'invitation'
        ? await sendInvitationEmail({ ...SAMPLE.invitation, recipientEmail: sendTo })
        : await sendAuthCodeEmail({ ...(sample as typeof SAMPLE.auth), recipientEmail: sendTo })
    return Response.json({ type, sentTo: sendTo, result })
  }

  // Aperçu HTML.
  const element =
    type === 'invitation'
      ? InvitationEmail(SAMPLE.invitation)
      : AuthCodeEmail(sample as typeof SAMPLE.auth)
  const html = await render(element)
  return new Response(html, {
    headers: { 'content-type': 'text/html; charset=utf-8' },
  })
}
