'use client'

import { usePathname } from 'next/navigation'
import { useProfile } from '@/contexts/profile-context'

// ─────────────────────────────────────────────────────────────────────────────
// Catalogue des étapes
// ─────────────────────────────────────────────────────────────────────────────

const TITULAIRE_STEPS = [
  { key: 'create', label: 'Pharmacie', path: '/onboarding/create' },
  { key: 'profile', label: 'Profil', path: '/onboarding/profile' },
  { key: 'invite', label: 'Équipe', path: '/onboarding/invite' },
  { key: 'activate', label: 'Activation', path: '/onboarding/activate' },
] as const

const INVITEE_STEPS = [
  { key: 'profile', label: 'Profil', path: '/onboarding/profile' },
  { key: 'waiting', label: 'Attente', path: '/onboarding/waiting' },
] as const

// ─────────────────────────────────────────────────────────────────────────────
// Composant de rendu commun (4-step titulaire ou 2-step invité)
// ─────────────────────────────────────────────────────────────────────────────

type Step = { key: string; label: string; path: string }

function ProgressBarRenderer({
  steps,
  currentIndex,
  ariaLabel,
}: {
  steps: readonly Step[]
  currentIndex: number
  ariaLabel: string
}) {
  return (
    <nav aria-label={ariaLabel} className="mb-6 w-full max-w-md px-2">
      <ol className="flex items-start">
        {steps.map((step, idx) => {
          const isDone = idx < currentIndex
          const isCurrent = idx === currentIndex
          const isLast = idx === steps.length - 1

          return (
            <li
              key={step.key}
              className="relative flex flex-1 flex-col items-center"
            >
              {!isLast && (
                <div
                  aria-hidden
                  className={[
                    'absolute left-1/2 top-3.5 h-px w-full -translate-y-1/2 transition-colors duration-300',
                    isDone ? 'bg-teal-600' : 'bg-muted',
                  ].join(' ')}
                />
              )}

              <span
                aria-current={isCurrent ? 'step' : undefined}
                className={[
                  'relative z-10 flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-colors duration-300',
                  isDone
                    ? 'bg-teal-600 text-white'
                    : isCurrent
                      ? 'bg-slate-900 text-white ring-2 ring-slate-900 ring-offset-2 ring-offset-background'
                      : 'bg-muted text-muted-foreground',
                ].join(' ')}
              >
                {isDone ? '✓' : idx + 1}
              </span>

              <span
                className={[
                  'mt-1.5 text-[10px] font-medium leading-tight sm:text-xs transition-colors duration-300',
                  isCurrent ? 'text-slate-900' : 'text-muted-foreground',
                ].join(' ')}
              >
                {step.label}
              </span>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Dispatcher : choisit le bon stepper selon pathname + role
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Affiche le bon stepper selon le contexte utilisateur :
 *   - Titulaire (4 étapes) : Pharmacie / Profil / Équipe / Activation
 *     visible sur /create, /invite, /activate, /activate/success, et sur
 *     /profile pour les titulaires (ou role pas encore résolu = signup frais).
 *   - Invité (2 étapes) : Profil / Attente
 *     visible sur /waiting et sur /profile pour les invités confirmés.
 *
 * La logique de routing entre les deux : les routes titulaire-only
 * (/create, /invite, /activate*) sont garanties par le middleware (strict-mode
 * invité). Donc si on est sur l'une de ces routes, on rend toujours le bar
 * titulaire. Sur /profile ou /waiting, on regarde le role.
 */
export function OnboardingProgressBar() {
  const pathname = usePathname()
  // `isInvitee` vient de ProfileContext et est basé sur
  // `user.user_metadata.invitation_token` (signal posé par generateLink dans
  // /api/invitations/create-native, absent pour les titulaires qui signup
  // via signInWithOtp). Plus fiable que `profile.role` qui a une valeur par
  // défaut 'preparateur' en DB → créerait un état transitoire trompeur pour
  // les titulaires fraîchement signed up.
  // `isInvitee` démarre à `false` dans ProfileContext → bar titulaire affichée
  // par défaut au mount, AVANT même que la query DB profiles ne réponde.
  // Pas de flicker pour les titulaires (95% des cas).
  const { isInvitee } = useProfile()

  // Routes invitée-only (/waiting) ou /profile pour invité → bar invité.
  if (
    pathname === '/onboarding/waiting' ||
    (pathname === '/onboarding/profile' && isInvitee)
  ) {
    const idx = INVITEE_STEPS.findIndex((s) => pathname === s.path)
    if (idx === -1) return null
    return (
      <ProgressBarRenderer
        steps={INVITEE_STEPS}
        currentIndex={idx}
        ariaLabel="Progression de l'inscription invité"
      />
    )
  }

  // Sinon : bar titulaire (matche exact ou prefix pour /activate/success).
  const idx = TITULAIRE_STEPS.findIndex(
    (s) => pathname === s.path || pathname.startsWith(s.path + '/'),
  )
  if (idx === -1) return null

  return (
    <ProgressBarRenderer
      steps={TITULAIRE_STEPS}
      currentIndex={idx}
      ariaLabel="Progression de l'inscription titulaire"
    />
  )
}
