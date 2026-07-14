import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createServiceClient } from '@/lib/supabase/service'
import { signupRateLimit } from '@/lib/rate-limit/upstash'
import {
  CGS_VERSION,
  CGS_HASH,
  DPA_VERSION,
  DPA_HASH,
} from '@/lib/legal/consent-versions'

export const runtime = 'nodejs'

// Validation stricte des champs envoyés par /signup. Les `cgs_accepted` et
// `dpa_accepted` doivent être `true` litéral pour passer (refus implicite si
// false côté front : on n'enregistre pas un signup sans consentement).
const SignupSchema = z.object({
  email: z.string().email().max(200),
  locale: z.enum(['fr', 'en']).default('fr'),
  cgs_accepted: z.literal(true),
  dpa_accepted: z.literal(true),
  source: z.string().max(50).optional(),
  utm_source: z.string().max(100).optional(),
  utm_medium: z.string().max(100).optional(),
  utm_campaign: z.string().max(100).optional(),
  utm_term: z.string().max(100).optional(),
  utm_content: z.string().max(100).optional(),
  referrer: z.string().max(500).optional(),
})

type ServiceClient = NonNullable<ReturnType<typeof createServiceClient>>

/**
 * Existence ciblée d'un compte par e-mail (déjà normalisé en minuscules).
 * Retourne true (existe) / false (n'existe pas) / null (erreur dure → 500).
 *
 * Voie principale : lecture indexée sur `auth.users` via le service role
 * (O(1) vs scan paginé). PostgREST peut refuser le schéma `auth` s'il n'est
 * pas exposé : dans ce cas on retombe sur listUsers borné (maxPages) plutôt
 * que de planter ou de scanner sans limite.
 */
async function findExistingUserByEmail(
  admin: ServiceClient,
  emailLower: string
): Promise<boolean | null> {
  // Client service non typé (createClient sans générique Database) : schema()
  // et from() acceptent n'importe quel nom ; le seul échec possible est runtime
  // si le schéma auth n'est pas exposé à PostgREST.
  const { data, error } = await admin
    .schema('auth')
    .from('users')
    .select('id')
    .eq('email', emailLower)
    .maybeSingle()

  if (!error) {
    return data !== null
  }

  // Schéma auth non exposé (ou table inaccessible) : fallback paginé borné.
  // Tout autre échec reste loggé puis traité comme erreur paginée ci-dessous.
  console.warn('[signup/start] auth.users direct lookup unavailable, falling back', {
    message: error.message,
  })

  const perPage = 200
  const maxPages = 25
  for (let page = 1; page <= maxPages; page++) {
    const { data: pageData, error: listError } =
      await admin.auth.admin.listUsers({ page, perPage })
    if (listError) {
      console.error('[signup/start] listUsers error', {
        message: listError.message,
      })
      return null
    }
    const users = pageData?.users ?? []
    if (users.some((u) => u.email?.toLowerCase() === emailLower)) {
      return true
    }
    if (users.length < perPage) {
      return false
    }
  }
  // Au-delà du plafond on suppose un compte neuf (signup non bloqué) ; le
  // reste du flux (OTP shouldCreateUser par défaut) reste idempotent côté
  // Supabase si le compte existait pourtant.
  return false
}

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = SignupSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 422 }
    )
  }

  const ipAddress =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null
  const userAgent = request.headers.get('user-agent') ?? null
  const now = new Date().toISOString()
  const emailLower = parsed.data.email.trim().toLowerCase()

  // M6 + L7 : rate-limit AVANT tout appel admin/OTP. Keyé IP+email pour
  // freiner à la fois l'énumération de comptes et le spam d'e-mails de signup.
  const { success: withinLimit } = await signupRateLimit.limit(
    `${ipAddress ?? 'noip'}:${emailLower}`
  )
  if (!withinLimit) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 })
  }

  const admin = createServiceClient()
  if (!admin) {
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 503 })
  }

  // 0. Détecter un compte existant. L'API admin auth-js n'expose pas de
  // getUserByEmail (listUsers ne filtre que par page → scan O(n) qui ne scale
  // pas). M6 : lookup ciblé via le client service directement sur auth.users
  // (1 ligne indexée sur l'email au lieu d'un dump paginé).
  //
  // Le service role peut lire auth.users en SQL, mais l'accès PostgREST au
  // schéma `auth` n'est pas garanti (schéma non exposé par défaut). Si la
  // requête directe échoue pour cette raison, on retombe sur listUsers borné.
  //
  // M6 : on NE distingue PLUS le cas email_exists côté réponse (anti-énumération).
  // Si le compte existe, on n'insère pas de pharmacy_acquisition parasite mais
  // on envoie quand même l'OTP (login passwordless standard) et on renvoie la
  // MÊME réponse générique qu'une inscription neuve.
  const alreadyExists = await findExistingUserByEmail(admin, emailLower)
  if (alreadyExists === null) {
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }

  if (alreadyExists === true) {
    const { error: otpError } = await admin.auth.signInWithOtp({
      email: parsed.data.email,
      options: {
        shouldCreateUser: false,
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?next=/onboarding/create`,
        data: { locale: parsed.data.locale },
      },
    })
    if (otpError) {
      console.error('[signup/start] OTP error (existing)', {
        message: otpError.message,
      })
      return NextResponse.json({ error: 'Email error' }, { status: 502 })
    }
    return NextResponse.json({ ok: true }, { status: 201 })
  }

  // 1. Insert pharmacy_acquisition (pré-confirmation OTP).
  // RLS bypass via service role : la table n'a aucune policy ouverte.
  // P4-14 minimal : funnel_step='otp_sent' + last_seen_at à la création
  // (l'OTP est déclenché juste après par signInWithOtp ; si ça échoue, le
  // step est déjà 'started' au sens conceptuel ; le step réel est noté en
  // dur 'otp_sent' parce que la séquence atteinte est : insert → OTP send).
  const { data: acquisition, error: insertError } = await admin
    .from('pharmacy_acquisition')
    .insert({
      email: parsed.data.email,
      locale: parsed.data.locale,
      cgs_version: CGS_VERSION,
      cgs_hash: CGS_HASH,
      cgs_accepted_at: now,
      dpa_version: DPA_VERSION,
      dpa_hash: DPA_HASH,
      dpa_accepted_at: now,
      user_agent: userAgent,
      ip_address: ipAddress,
      source: parsed.data.source ?? null,
      utm_source: parsed.data.utm_source ?? null,
      utm_medium: parsed.data.utm_medium ?? null,
      utm_campaign: parsed.data.utm_campaign ?? null,
      utm_term: parsed.data.utm_term ?? null,
      utm_content: parsed.data.utm_content ?? null,
      referrer: parsed.data.referrer ?? null,
      funnel_step: 'otp_sent',
      last_seen_at: now,
    })
    .select('id')
    .single()

  if (insertError || !acquisition) {
    console.error('[signup/start] insert error', {
      code: insertError?.code,
      message: insertError?.message,
    })
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }

  // 2. Déclenche le magic link OTP Supabase.
  // emailRedirectTo pointe vers le callback existant ; l'acquisition_id est
  // stocké dans user_metadata pour que /api/signup/confirm puisse finaliser
  // confirmed_at après authentification (cookies présents).
  const { error: otpError } = await admin.auth.signInWithOtp({
    email: parsed.data.email,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?next=/onboarding/create`,
      data: {
        acquisition_id: acquisition.id,
        locale: parsed.data.locale,
      },
    },
  })

  if (otpError) {
    console.error('[signup/start] OTP error', { message: otpError.message })
    return NextResponse.json({ error: 'Email error' }, { status: 502 })
  }

  // M6 : réponse générique, identique au cas compte-existant (anti-énumération).
  // L'acquisition_id n'est plus exposé : /api/signup/confirm le relit depuis la
  // session (re-dérivation par e-mail, R3-3) plutôt que via le corps de réponse.
  return NextResponse.json({ ok: true }, { status: 201 })
}
