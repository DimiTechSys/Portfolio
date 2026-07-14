// Send Email Hook Supabase → envoi des emails d'authentification via Resend.
//
// Activé dans Supabase (Auth → Hooks → Send Email). Une fois actif, Supabase
// délègue TOUS les emails d'auth (code OTP de connexion, signup…) à cette
// route au lieu de les envoyer lui-même. On rend le template React Email
// (aligné sur l'email d'invitation) et on envoie via Resend.
//
// Sécurité : la requête est signée selon la spec Standard Webhooks. On vérifie
// la signature avec SEND_EMAIL_HOOK_SECRET avant tout traitement. Sans secret
// valide → 401, on n'envoie rien.

import { NextResponse } from 'next/server'
import crypto from 'node:crypto'
import { sendAuthCodeEmail } from '@/lib/email/send-auth-code'

export const runtime = 'nodejs'

type EmailActionType =
  | 'signup'
  | 'magiclink'
  | 'recovery'
  | 'invite'
  | 'email_change'
  | 'email_change_current'
  | 'email_change_new'

type SupabaseEmailHookPayload = {
  user: { email?: string | null }
  email_data: {
    token: string
    token_hash: string
    redirect_to: string
    email_action_type: EmailActionType
    site_url?: string
  }
}

// Vérification de signature Standard Webhooks (https://www.standardwebhooks.com).
// Le secret Supabase est de la forme "v1,whsec_<base64>". On HMAC-SHA256
// `${id}.${timestamp}.${body}` avec la clé décodée et on compare en temps
// constant aux signatures fournies dans l'en-tête `webhook-signature`.
function isValidSignature(rawBody: string, headers: Headers): boolean {
  const rawSecret = process.env.SEND_EMAIL_HOOK_SECRET
  if (!rawSecret) {
    console.error('[auth/send-email-hook] SEND_EMAIL_HOOK_SECRET missing')
    return false
  }

  const id = headers.get('webhook-id')
  const timestamp = headers.get('webhook-timestamp')
  const signatureHeader = headers.get('webhook-signature')
  if (!id || !timestamp || !signatureHeader) return false

  // Anti-rejeu : on rejette les requêtes datant de plus de 5 minutes.
  const tsSeconds = Number(timestamp)
  if (!Number.isFinite(tsSeconds)) return false
  const skewSeconds = Math.abs(Date.now() / 1000 - tsSeconds)
  if (skewSeconds > 300) return false

  const keyB64 = rawSecret.replace(/^v1,/, '').replace(/^whsec_/, '')
  const key = Buffer.from(keyB64, 'base64')

  const signedContent = `${id}.${timestamp}.${rawBody}`
  const expected = crypto
    .createHmac('sha256', key)
    .update(signedContent)
    .digest('base64')
  const expectedBuf = Buffer.from(expected)

  // L'en-tête peut contenir plusieurs signatures "v1,<sig>" séparées par espace.
  return signatureHeader.split(' ').some((part) => {
    const sig = part.includes(',') ? part.split(',')[1] : part
    const sigBuf = Buffer.from(sig)
    if (sigBuf.length !== expectedBuf.length) return false
    try {
      return crypto.timingSafeEqual(sigBuf, expectedBuf)
    } catch {
      return false
    }
  })
}

// Le lien magique pointe DIRECTEMENT vers le callback de l'app avec
// `token_hash` + `type` (et non vers le endpoint GoTrue `/auth/v1/verify`).
// La page /auth/callback fait alors `verifyOtp({ token_hash, type })`, qui
// n'exige PAS de `code_verifier` PKCE → le lien marche depuis n'importe quel
// navigateur/appareil (un clic d'email vient rarement du navigateur du login).
// Passer par GoTrue renverrait `?code=` → échange PKCE → « code verifier not
// found ».
function buildMagicLink(
  data: SupabaseEmailHookPayload['email_data'],
): string | null {
  if (!data.token_hash || !data.redirect_to) return null
  try {
    // redirect_to = URL du callback de l'app (emailRedirectTo passé au login),
    // ex. https://…/auth/callback?next=/dashboard. On y ajoute le token.
    const url = new URL(data.redirect_to)
    url.searchParams.set('token_hash', data.token_hash)
    url.searchParams.set('type', data.email_action_type)
    return url.toString()
  } catch {
    return null
  }
}

export async function POST(request: Request): Promise<Response> {
  const rawBody = await request.text()

  if (!isValidSignature(rawBody, request.headers)) {
    return NextResponse.json({ error: 'invalid_signature' }, { status: 401 })
  }

  let payload: SupabaseEmailHookPayload
  try {
    payload = JSON.parse(rawBody) as SupabaseEmailHookPayload
  } catch {
    return NextResponse.json({ error: 'invalid_payload' }, { status: 400 })
  }

  const email = payload.user?.email
  const code = payload.email_data?.token
  if (!email || !code) {
    return NextResponse.json({ error: 'missing_fields' }, { status: 400 })
  }

  const result = await sendAuthCodeEmail({
    recipientEmail: email,
    code,
    magicLink: buildMagicLink(payload.email_data),
    isSignup: payload.email_data.email_action_type === 'signup',
  })

  if (!result.ok) {
    console.error('[auth/send-email-hook] send failed', { error: result.error })
    return NextResponse.json({ error: result.error }, { status: 502 })
  }

  return NextResponse.json({ ok: true })
}
