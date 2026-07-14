'use client'

// Widget des missions d'activation (ONBOARD-01). Variant 'wizard' : affiché
// dans le parcours d'inscription (W1-W4 / Wi1). Variant 'dashboard' : affiché
// en haut du dashboard (M1-M8 / M1-M4). Détection automatique par counts SQL
// à chaque mount, pas de cache applicatif.

import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { getMissionsForUser, type MissionsResult, type MissionVariant } from '@/lib/onboarding/missions'
import { setMissionsDismissed } from '@/lib/queries/onboarding'
import { capture } from '@/lib/analytics/posthog'
import { ONBOARDING_MISSION_EVENTS } from '@/lib/analytics/events'
import { useProfile } from '@/contexts/profile-context'
import { MissionItem } from './mission-item'
import { MissionProgressBar } from './mission-progress-bar'
import { MissionsCompletedBanner } from './missions-completed-banner'
import { DismissModal } from './dismiss-modal'

const TITLES: Record<MissionVariant, { title: string; subtitle: string }> = {
  wizard: {
    title: "Votre parcours d'inscription",
    subtitle: '4 étapes pour activer votre essai et inviter votre équipe.',
  },
  dashboard: {
    title: "Vos missions d'activation",
    subtitle:
      '8 actions pour que toute votre équipe adopte PharmaWorkspace en moins d\'une semaine.',
  },
}

function openFeedbackDialog() {
  window.dispatchEvent(new Event('pw:open-feedback'))
}

export function MissionChecklist({
  variant,
  embedded = false,
}: {
  variant: MissionVariant
  // `embedded` : rendu sans la coque de carte (bordure/ombre/padding), pour
  // être injecté dans la popup « Guide de démarrage » du dashboard.
  embedded?: boolean
}) {
  const { profile, pharmacy, role } = useProfile()
  const [result, setResult] = useState<MissionsResult | null>(null)
  const [dismissModalOpen, setDismissModalOpen] = useState(false)
  const [locallyDismissed, setLocallyDismissed] = useState(false)
  // Statuts du render précédent : détecte les transitions pending → done
  // pour émettre onboarding_mission_completed.
  const prevStatuses = useRef<Map<string, string> | null>(null)
  const shownCaptured = useRef(false)
  const allCompletedCaptured = useRef(false)

  const userId = profile?.id ?? null

  const refresh = useCallback(async () => {
    if (!userId) return
    const supabase = createClient()
    const r = await getMissionsForUser(supabase, userId)
    setResult(r)
  }, [userId])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      void refresh()
    }, 0)
    return () => clearTimeout(timeoutId)
  }, [refresh])

  useEffect(() => {
    if (!result) return

    if (!shownCaptured.current) {
      shownCaptured.current = true
      capture(ONBOARDING_MISSION_EVENTS.onboarding_missions_shown, {
        variant,
        role,
        progress_done: result.progress.done,
        progress_total: result.progress.total,
      })
    }

    const statuses = new Map(result.missions.map((m) => [m.id, m.status]))
    if (prevStatuses.current) {
      for (const [id, status] of statuses) {
        if (status === 'done' && prevStatuses.current.get(id) === 'pending') {
          capture(ONBOARDING_MISSION_EVENTS.onboarding_mission_completed, {
            mission_id: id,
          })
        }
      }
    }
    prevStatuses.current = statuses

    if (result.allCompleted && !allCompletedCaptured.current) {
      allCompletedCaptured.current = true
      // Wizard end ≈ début d'essai = trial_end - 30 jours (pas de timestamp
      // dédié en base).
      const trialEnd = (pharmacy as { trial_end?: string | null } | null)?.trial_end
      const wizardEndMs = trialEnd
        ? new Date(trialEnd).getTime() - 30 * 24 * 3600 * 1000
        : null
      capture(ONBOARDING_MISSION_EVENTS.onboarding_missions_all_completed, {
        role,
        time_to_complete_seconds: wizardEndMs
          ? Math.max(0, Math.round((Date.now() - wizardEndMs) / 1000))
          : null,
      })
    }
  }, [result, variant, role, pharmacy])

  const handleCtaClick = (missionId: string) => {
    capture(ONBOARDING_MISSION_EVENTS.onboarding_mission_clicked, {
      mission_id: missionId,
    })
  }

  const handleDismissConfirm = async () => {
    setDismissModalOpen(false)
    if (!profile?.id) return
    // Per-user depuis 0060 : on dismiss le profile de l'utilisateur courant,
    // pas la pharmacie. Chacun gère son confort, les collègues ne sont pas
    // impactés.
    const r = await setMissionsDismissed(profile.id, true)
    if (r.error) {
      toast.error(r.error)
      return
    }
    capture(ONBOARDING_MISSION_EVENTS.onboarding_missions_dismissed)
    setLocallyDismissed(true)
    // Notifie le lanceur popup (dashboard) pour qu'il masque son bouton et
    // ferme la popup — même pattern que `pw:open-feedback`.
    window.dispatchEvent(new Event('pw:missions-dismissed'))
  }

  if (!result) return null
  // En mode `embedded` (popup dashboard) on ne court-circuite PAS sur le flag
  // dismissed : le lanceur gère lui-même sa visibilité, et le contenu doit
  // toujours s'afficher quand la popup est ouverte.
  if (variant === 'dashboard' && !embedded && (result.dismissed || locallyDismissed))
    return null

  const visibleMissions = result.missions.filter(
    (m) => m.status !== 'hidden' && m.variant === variant,
  )
  if (visibleMissions.length === 0) return null

  const { title, subtitle } = TITLES[variant]

  if (variant === 'dashboard' && result.allCompleted) {
    return (
      <section aria-label={title} data-testid="mission-checklist">
        <MissionsCompletedBanner
          onFeedback={openFeedbackDialog}
          onDismiss={() => setDismissModalOpen(true)}
        />
        <DismissModal
          open={dismissModalOpen}
          onConfirm={handleDismissConfirm}
          onCancel={() => setDismissModalOpen(false)}
        />
      </section>
    )
  }

  return (
    <section
      aria-label={title}
      data-testid="mission-checklist"
      className={
        embedded
          ? ''
          : 'rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5'
      }
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          {!embedded && (
            <h2 className="text-sm font-semibold text-slate-900 sm:text-base">
              {title}
            </h2>
          )}
          <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">{subtitle}</p>
        </div>
        {variant === 'dashboard' && !embedded && (
          // Bouton dismiss accessible à TOUS les membres depuis la migration
          // 0060 (per-user flag) — chacun gère son propre confort visuel.
          // Masqué dans la popup : on n'y propose pas de masquage permanent tant
          // que des missions restent à faire (le lanceur reste accessible).
          <button
            type="button"
            onClick={() => setDismissModalOpen(true)}
            className="shrink-0 text-xs text-slate-400 underline-offset-2 hover:text-slate-600 hover:underline"
          >
            Masquer
          </button>
        )}
      </div>

      <div className="mt-3">
        <MissionProgressBar
          done={visibleMissions.filter((m) => m.status === 'done').length}
          total={visibleMissions.length}
        />
      </div>

      <ul className="mt-3 divide-y divide-slate-100">
        {visibleMissions.map((mission) => (
          <MissionItem
            key={mission.id}
            mission={mission}
            onCtaClick={handleCtaClick}
            onFeedbackClick={openFeedbackDialog}
          />
        ))}
      </ul>

      <DismissModal
        open={dismissModalOpen}
        onConfirm={handleDismissConfirm}
        onCancel={() => setDismissModalOpen(false)}
      />
    </section>
  )
}
