'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { usePathname, useRouter } from 'next/navigation'
import {
  Rocket,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  CheckCircle2,
  Circle,
  X,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { scheduleIdleTask } from '@/lib/perf/schedule-idle'
import {
  getMissionsForUser,
  type MissionsResult,
  type Mission,
} from '@/lib/onboarding/missions'
import { setMissionsDismissed } from '@/lib/queries/onboarding'
import { useProfile } from '@/contexts/profile-context'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { MissionChecklist } from './mission-checklist'

// Wizard d'activation :
//   - Mobile : bouton fusée dans le header → popup (MissionChecklist).
//   - Desktop : carte flottante « Démarrage rapide » fixée en bas à droite.
// La popup s'ouvre auto une fois par session sur le dashboard (mobile uniquement).
const AUTO_OPEN_FLAG = 'pw_missions_autoopened'
// Masquage de la carte desktop pour la session courante. Persisté en sessionStorage
// car le composant est remonté lors d'une navigation traversant une frontière de
// layout ((app) ↔ (admin)) — un useState seul se réinitialiserait et ferait réapparaître la carte.
const HIDDEN_SESSION_FLAG = 'pw_missions_hidden'

export function MissionsLauncher() {
  const { profile } = useProfile()
  const router = useRouter()
  const pathname = usePathname()
  const userId = profile?.id ?? null
  const [result, setResult] = useState<MissionsResult | null>(null)
  const [dismissed, setDismissed] = useState(false)
  const [open, setOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [hiddenSession, setHiddenSession] = useState(() => {
    if (typeof window === 'undefined') return false
    try {
      return sessionStorage.getItem(HIDDEN_SESSION_FLAG) === '1'
    } catch {
      return false
    }
  })
  const [mounted, setMounted] = useState(false)
  const autoOpened = useRef(false)

  // eslint-disable-next-line react-hooks/set-state-in-effect -- flag de montage client pour autoriser le portal (rendu dans document.body après hydratation).
  useEffect(() => setMounted(true), [])

  useEffect(() => {
    if (!userId) return
    let active = true
    const cancel = scheduleIdleTask(() => {
      void (async () => {
        const supabase = createClient()
        const r = await getMissionsForUser(supabase, userId)
        if (active) setResult(r)
      })()
    })
    return () => {
      active = false
      cancel()
    }
  }, [userId])

  useEffect(() => {
    const onDismissed = () => {
      setDismissed(true)
      setOpen(false)
    }
    window.addEventListener('pw:missions-dismissed', onDismissed)
    return () => window.removeEventListener('pw:missions-dismissed', onDismissed)
  }, [])

  const dashboardMissions = result
    ? result.missions.filter((m) => m.status !== 'hidden' && m.variant === 'dashboard')
    : []
  const visibleCount = dashboardMissions.length
  const doneCount = dashboardMissions.filter((m) => m.status === 'done').length
  const remaining = visibleCount - doneCount
  const hiddenForGood = result?.allCompleted === true && (result.dismissed || dismissed)
  const shouldShow = !!result && visibleCount > 0 && !hiddenForGood

  // Auto-open de la popup : 1×/session, sur le dashboard, MOBILE uniquement
  // (sur desktop la carte flottante est déjà visible en permanence).
  useEffect(() => {
    if (!shouldShow || autoOpened.current || pathname !== '/dashboard') return
    if (typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches) return
    autoOpened.current = true
    let shouldOpen = true
    try {
      if (sessionStorage.getItem(AUTO_OPEN_FLAG) === '1') shouldOpen = false
      else sessionStorage.setItem(AUTO_OPEN_FLAG, '1')
    } catch {
      // sessionStorage indisponible → on ouvre quand même.
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- ouverture auto unique du wizard au 1er affichage du dashboard (mobile), gardée par un ref + flag session.
    if (shouldOpen) setOpen(true)
  }, [shouldShow, pathname])

  if (!shouldShow) return null

  const allDone = result!.allCompleted
  const progressPct = visibleCount ? Math.round((doneCount / visibleCount) * 100) : 0

  const handleStep = (m: Mission) => {
    if (!m.cta) return
    if ('href' in m.cta) router.push(m.cta.href)
    else if ('feedback' in m.cta) window.dispatchEvent(new Event('pw:open-feedback'))
  }

  const handleHideCard = async () => {
    setHiddenSession(true)
    try {
      sessionStorage.setItem(HIDDEN_SESSION_FLAG, '1')
    } catch {
      // sessionStorage indisponible → masquage mémoire seul (peut réapparaître au remount).
    }
    // Masquage permanent uniquement quand tout est terminé (sinon réapparaît à la
    // prochaine session pour ne pas perdre le guide).
    if (allDone && profile?.id) {
      await setMissionsDismissed(profile.id, true)
      setDismissed(true)
    }
  }

  return (
    <>
      {/* ── Mobile : bouton header + popup ── */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="relative rounded-full border border-teal-200 bg-teal-50 p-2 text-teal-700 shadow-sm transition-colors hover:bg-teal-100 hover:text-teal-800 lg:hidden"
        aria-label="Guide de démarrage"
        title="Guide de démarrage"
      >
        <Rocket className="h-4 w-4" />
        {remaining > 0 && (
          <span className="absolute -right-1 -top-1 inline-flex min-h-4 min-w-4 items-center justify-center rounded-full bg-teal-600 px-1 text-[10px] font-semibold text-white">
            {remaining}
          </span>
        )}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{allDone ? 'Bravo, tout est prêt 🎉' : 'Guide de démarrage'}</DialogTitle>
          </DialogHeader>
          <MissionChecklist variant="dashboard" embedded />
        </DialogContent>
      </Dialog>

      {/* ── Desktop : carte flottante « Démarrage rapide » ──
          Rendue via portal car le <header> (backdrop-blur) serait sinon le bloc
          conteneur du position:fixed. */}
      {mounted &&
        !hiddenSession &&
        createPortal(
          <div className="fixed bottom-[6.25rem] right-6 z-30 hidden w-[22rem] max-w-[calc(100vw-3rem)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl lg:block">
          <header className="flex items-center justify-between gap-2 px-4 py-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-50 text-teal-600">
                <Rocket className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">Démarrage rapide</p>
                <p className="text-xs text-slate-500">
                  {doneCount}/{visibleCount} étapes
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-0.5">
              <button
                type="button"
                onClick={() => setCollapsed((c) => !c)}
                className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                title={collapsed ? 'Déplier' : 'Réduire'}
                aria-label={collapsed ? 'Déplier' : 'Réduire'}
              >
                {collapsed ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
              <button
                type="button"
                onClick={() => void handleHideCard()}
                className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                title="Masquer"
                aria-label="Masquer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </header>

          <div className="h-1 bg-slate-100">
            <div
              className="h-full bg-teal-600 transition-[width] duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>

          {!collapsed && (
            <ul className="max-h-[60vh] overflow-y-auto py-1">
              {dashboardMissions.map((m) => {
                const isDone = m.status === 'done'
                const clickable = !isDone && Boolean(m.cta)
                return (
                  <li key={m.id}>
                    <button
                      type="button"
                      onClick={() => handleStep(m)}
                      disabled={!clickable}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-slate-50 disabled:hover:bg-transparent"
                    >
                      <span className="shrink-0">
                        {isDone ? (
                          <CheckCircle2 className="h-5 w-5 text-teal-600" />
                        ) : (
                          <Circle className="h-5 w-5 text-slate-300" />
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span
                          className={`block truncate text-sm font-medium ${
                            isDone ? 'text-slate-400 line-through' : 'text-slate-800'
                          }`}
                        >
                          {m.label}
                        </span>
                        {m.tooltip && (
                          <span className="block truncate text-xs text-slate-400">{m.tooltip}</span>
                        )}
                      </span>
                      {clickable && (
                        <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" aria-hidden />
                      )}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>,
          document.body
        )}
    </>
  )
}
