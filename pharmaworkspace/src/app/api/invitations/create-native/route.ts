import { randomUUID } from 'crypto'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { AUDIT_ACTIONS, AUDIT_TARGET_TYPES } from '@/lib/audit/actions'
import { createServiceClient } from '@/lib/supabase/service'
import { hashInvitationToken } from '@/lib/invite/hash-token'
import { sendInvitationEmail } from '@/lib/email/send-invitation'
import { apiError } from '@/lib/api/error-response'
import { ROLE_LABELS } from '@/config/constants'
import { isInvitableRole } from '@/lib/auth/roles'
import {
  getCurrentMemberCount,
  getMemberLimit,
  normalizeSubscriptionTier,
  TIER_LABELS,
} from '@/lib/subscription'
import type { UserRole } from '@/types/index'
import type { User } from '@supabase/supabase-js'

type Body = {
  email: string
  role: UserRole
}

/** `inviteUserByEmail` échoue si l’e-mail a déjà un utilisateur Auth dans ce projet. */
function isEmailAlreadyRegisteredError(err: { message?: string; code?: string }): boolean {
  const code = err.code
  if (code === 'email_exists' || code === 'user_already_exists') return true
  const msg = err.message?.toLowerCase() ?? ''
  if (code === 'conflict' && (msg.includes('user') || msg.includes('email'))) return true
  return (
    msg.includes('already') &&
    (msg.includes('registered') || msg.includes('exists') || msg.includes('user'))
  )
}

/** Recherche paginée (plafonnée) : suffisant pour la plupart des projets MVP. */
async function findAuthUserByEmail(
  admin: NonNullable<ReturnType<typeof createServiceClient>>,
  email: string
): Promise<User | null> {
  const normalized = email.toLowerCase()
  let page = 1
  const perPage = 200
  const maxPages = 25

  for (let i = 0; i < maxPages; i++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage })
    if (error || !data?.users?.length) return null
    const found = data.users.find((u) => u.email?.toLowerCase() === normalized)
    if (found) return found
    if (data.users.length < perPage) return null
    page += 1
  }
  return null
}

/**
 * Titulaire : enregistre l’invitation en base + envoie l’e-mail d’invitation **natif Supabase**
 * (`auth.admin.inviteUserByEmail`). Le collaborateur suit le lien Supabase puis arrive sur
 * `/auth/callback` pour établir la session.
 */
export async function POST(request: Request) {
  let body: Body
  try {
    body = (await request.json()) as Body
  } catch {
    return NextResponse.json({ error: 'Corps invalide.' }, { status: 400 })
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const role = body.role

  if (!email || !role) {
    return NextResponse.json({ error: 'E-mail et rôle requis.' }, { status: 400 })
  }

  if (!isInvitableRole(role)) {
    return NextResponse.json({ error: 'Rôle non invitable.' }, { status: 400 })
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
    .select('pharmacy_id, role, first_name, last_name')
    .eq('id', user.id)
    .single()

  if (profileError || !profile?.pharmacy_id) {
    return NextResponse.json({ error: 'Profil introuvable.' }, { status: 403 })
  }

  if (profile.role !== 'titulaire') {
    return NextResponse.json({ error: 'Réservé au titulaire.' }, { status: 403 })
  }

  // Récupère le nom de la pharmacie + nom du titulaire pour personnaliser l'email.
  const { data: pharmacyRow } = await supabase
    .from('pharmacies')
    .select('name')
    .eq('id', profile.pharmacy_id)
    .maybeSingle()

  const pharmacyName = (pharmacyRow?.name as string | null) ?? 'votre officine'
  const inviterName =
    profile.first_name || profile.last_name
      ? `${profile.first_name ?? ''} ${profile.last_name ?? ''}`.trim()
      : null
  const roleLabel = ROLE_LABELS[role]

  const admin = createServiceClient()
  if (!admin) {
    return NextResponse.json(
      { error: 'Configuration : ajoutez SUPABASE_SERVICE_ROLE_KEY sur le serveur.' },
      { status: 503 }
    )
  }

  const { data: pharmacyTierRow } = await admin
    .from('pharmacies')
    .select('subscription_tier')
    .eq('id', profile.pharmacy_id)
    .maybeSingle()

  const tier = normalizeSubscriptionTier(
    pharmacyTierRow?.subscription_tier as string | null | undefined
  )
  const tierLimit = getMemberLimit(tier)

  // G7 : recompte + INSERT atomiques dans une transaction Postgres (verrou
  // xact par officine), pour fermer la race TOCTOU du check-then-insert. Le
  // token est généré ici pour pré-calculer son hash (P1-08) ; `token_hash` est
  // donc posé dès l'INSERT, plus besoin de l'update service séparé. La limite
  // (TIER_LIMITS) reste pilotée côté JS — source de vérité unique.
  const inviteToken = randomUUID()
  const { data: invitation, error: rpcError } = await admin
    .rpc('create_invitation_with_quota', {
      p_pharmacy_id: profile.pharmacy_id,
      p_email: email,
      p_role: role,
      p_token: inviteToken,
      p_token_hash: hashInvitationToken(inviteToken),
      p_limit: tierLimit,
    })
    .single<{ id: string; token: string }>()

  if (rpcError) {
    if (rpcError.message?.includes('SEAT_LIMIT_REACHED')) {
      const tierLabel = tier != null ? TIER_LABELS[tier] : TIER_LABELS.po
      return NextResponse.json(
        {
          error: 'tier_limit_reached',
          message: `Votre formule ${tierLabel} est limitée à ${tierLimit} utilisateurs. Mettez à niveau votre abonnement pour inviter davantage de collaborateurs.`,
          current_count: await getCurrentMemberCount(admin, profile.pharmacy_id),
          tier_limit: tierLimit,
          current_tier: tier ?? 'po',
        },
        { status: 409 }
      )
    }
    return apiError(
      '[invitations/create-native]',
      rpcError,
      "Impossible de créer l'invitation.",
      400
    )
  }

  if (!invitation) {
    return apiError(
      '[invitations/create-native]',
      'rpc returned no row',
      "Impossible de créer l'invitation.",
      400
    )
  }

  await supabase.from('audit_log').insert({
    user_id: user.id,
    pharmacy_id: profile.pharmacy_id,
    action: AUDIT_ACTIONS.memberInvited,
    target_type: AUDIT_TARGET_TYPES.invitation,
    target_id: invitation.id as string,
    metadata: { email, role },
  })

  const proto = request.headers.get('x-forwarded-proto') ?? 'http'
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host')
  const origin =
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    (host ? `${proto}://${host}` : new URL(request.url).origin)
  const base = origin.replace(/\/$/, '')
  /** Après acceptation : le proxy envoie vers /onboarding/profile si prénom/nom manquants. */
  const nextPath = '/dashboard'
  const redirectTo = `${base}/auth/callback?next=${encodeURIComponent(nextPath)}`

  const inviteMeta = {
    invitation_token: String(invitation.token),
    pharmacy_id: profile.pharmacy_id,
    role,
  }

  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: 'invite',
    email,
    options: {
      redirectTo,
      data: inviteMeta,
    },
  })

  if (!linkError && linkData?.properties?.action_link) {
    const actionLink = linkData.properties.action_link
    const sendResult = await sendInvitationEmail({
      recipientEmail: email,
      inviterName,
      pharmacyName,
      roleLabel,
      acceptUrl: actionLink,
    })
    if (!sendResult.ok) {
      // L'invitation existe en DB + l'user Auth est créé. On log mais on
      // renvoie quand même le link au caller pour qu'il puisse l'afficher
      // / le copier en fallback (cf. admin/invite-dialog).
      console.error('[invitations/create-native] email send failed (invite)', {
        error: sendResult.error,
        pharmacy_id: profile.pharmacy_id,
      })
    }
    return NextResponse.json({
      ok: true,
      mode: 'invite_link' as const,
      link: actionLink,
      email_sent: sendResult.ok,
      invitation_id: invitation.id as string,
    })
  }

  if (!isEmailAlreadyRegisteredError(linkError ?? { code: 'unknown', message: 'Unknown error' })) {
    await admin.from('invitations').delete().eq('id', invitation.id)
    return NextResponse.json(
      { error: linkError?.message ?? "La génération du lien d'invitation Supabase a échoué." },
      { status: 500 }
    )
  }

  const authUser = await findAuthUserByEmail(admin, email)
  if (!authUser) {
    await admin.from('invitations').delete().eq('id', invitation.id)
    return NextResponse.json(
      {
        error:
          'Un compte semble déjà exister pour cet e-mail, mais nous ne pouvons pas le retrouver (liste utilisateurs). Réessayez ou vérifiez dans le tableau Supabase Auth.',
      },
      { status: 409 }
    )
  }

  const { data: inviteeProfile } = await admin
    .from('profiles')
    .select('pharmacy_id')
    .eq('id', authUser.id)
    .maybeSingle()

  const theirPharmacy = inviteeProfile?.pharmacy_id

  if (theirPharmacy && theirPharmacy === profile.pharmacy_id) {
    await admin.from('invitations').delete().eq('id', invitation.id)
    return NextResponse.json({
      ok: true,
      mode: 'already_member' as const,
      message: 'Cette personne a déjà un compte rattaché à votre officine.',
    })
  }

  if (theirPharmacy && theirPharmacy !== profile.pharmacy_id) {
    await admin.from('invitations').delete().eq('id', invitation.id)
    return NextResponse.json(
      {
        error:
          'Cette adresse a déjà un compte PharmaWorkspace rattaché à une autre officine. Il faut utiliser un autre e-mail ou contacter le support.',
      },
      { status: 409 }
    )
  }

  /**
   * Compte existant mais non rattaché (ou rattaché à une officine passée dont l'ID a été mis à null).
   * On ne supprime PAS l'utilisateur pour préserver ses historiques (tâches, commandes, etc.).
   * Au lieu de cela, on génère un lien magique (magiclink) qui inclut les données d'invitation.
   * Quand il cliquera, il sera connecté et la page de callback l'ajoutera à l'officine.
   */
  await admin.auth.admin.updateUserById(authUser.id, { user_metadata: inviteMeta })

  const { data: magicLinkData, error: magicLinkError } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email,
    options: {
      redirectTo,
      data: inviteMeta,
    },
  })

  if (magicLinkError || !magicLinkData?.properties?.action_link) {
    await admin.from('invitations').delete().eq('id', invitation.id)
    return NextResponse.json(
      {
        error:
          magicLinkError?.message ??
          "La génération du lien de connexion pour le compte existant a échoué. Réessayez.",
      },
      { status: 500 }
    )
  }

  const magicActionLink = magicLinkData.properties.action_link
  const magicSendResult = await sendInvitationEmail({
    recipientEmail: email,
    inviterName,
    pharmacyName,
    roleLabel,
    acceptUrl: magicActionLink,
  })
  if (!magicSendResult.ok) {
    console.error('[invitations/create-native] email send failed (magiclink)', {
      error: magicSendResult.error,
      pharmacy_id: profile.pharmacy_id,
    })
  }

  return NextResponse.json({
    ok: true,
    mode: 'invite_link' as const,
    link: magicActionLink,
    email_sent: magicSendResult.ok,
    invitation_id: invitation.id as string,
  })
}
