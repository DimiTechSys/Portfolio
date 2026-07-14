'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useProfile } from '@/contexts/profile-context'
import {
  closeSessionsBeforeToday,
  getActiveSession,
  getTodayUserSessions,
  startSession as startSessionQuery,
  endSession as endSessionQuery,
  type ClockInGeo,
} from '@/lib/queries/sessions'
import { canManageWorkSession } from '@/lib/sessions/can-manage-session'
import { computeTodayWorkedMs } from '@/lib/sessions/worked-time'
import {
  filterSessionsStartedToday,
  getEarliestStartedAt,
  getMsUntilNextLocalMidnight,
} from '@/lib/sessions/time'
import type { WorkSession } from '@/types/index'
import { toast } from 'sonner'

const HIDDEN_AUTO_CLOSE_MS = 10 * 60 * 1000

export type SessionActionResult =
  | { ok: true }
  | { ok: false; error: string }

type SessionContextValue = {
  session: WorkSession | null
  /** Premier pointage du jour (cohérent partout dans l'UI). */
  dayStartedAt: string | null
  isActive: boolean
  loading: boolean
  workedTodayMs: number
  canManageSession: boolean
  startSession: (geo?: ClockInGeo) => Promise<SessionActionResult>
  endSession: () => Promise<SessionActionResult>
  refetchSession: () => Promise<void>
}

const SessionContext = createContext<SessionContextValue | null>(null)

export function SessionProvider({ children }: { children: ReactNode }) {
  const { profile, pharmacy, loading: profileLoading } = useProfile()
  const profileId = profile?.id ?? null
  const pharmacyId = profile?.pharmacy_id ?? pharmacy?.id ?? null
  const [session, setSession] = useState<WorkSession | null>(null)
  const [todaySessions, setTodaySessions] = useState<WorkSession[]>([])
  const [loading, setLoading] = useState(true)
  const [nowMs, setNowMs] = useState(() => Date.now())

  const canManageSession = Boolean(
    !profileLoading && profile && canManageWorkSession(profile)
  )

  // `background` : true pour les rafraîchissements silencieux (poll 30s, retour d'onglet)
  // afin de ne pas lever `loading` (qui ferait flicker l'UI toutes les 30s).
  const fetchSession = useCallback(async (background = false) => {
    if (!profileId || !pharmacyId) {
      setSession(null)
      setTodaySessions([])
      setLoading(false)
      return
    }

    if (!background) setLoading(true)
    const [activeResult, todayResult] = await Promise.all([
      getActiveSession(profileId, pharmacyId),
      getTodayUserSessions(profileId, pharmacyId),
    ])

    if (activeResult.error) {
      console.error('[session] getActiveSession:', activeResult.error)
    } else {
      setSession(activeResult.data ?? null)
    }

    if (!todayResult.error && todayResult.data) {
      setTodaySessions(todayResult.data)
    } else {
      setTodaySessions([])
    }

    setLoading(false)
  }, [profileId, pharmacyId])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      void fetchSession()
    }, 0)
    return () => clearTimeout(timeoutId)
  }, [fetchSession])

  // Sync périodique de l'état de session (pointage depuis un autre appareil, auto-close…).
  // On ne poll PAS quand l'onglet est caché (économie serveur : chaque user = 2 requêtes/30s),
  // et on resync une fois au retour de l'onglet. Rafraîchissements en arrière-plan (pas de loading).
  useEffect(() => {
    if (!pharmacyId) return
    const intervalId = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return
      void fetchSession(true)
    }, 30_000)
    const onVisible = () => {
      if (!document.hidden) void fetchSession(true)
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearInterval(intervalId)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [pharmacyId, fetchSession])

  const todaySessionsOnly = useMemo(
    () => filterSessionsStartedToday(todaySessions),
    [todaySessions]
  )

  /** Chronomètre : tick chaque seconde uniquement pendant une session ouverte. */
  useEffect(() => {
    if (!session) return
    const intervalId = setInterval(() => setNowMs(Date.now()), 1000)
    return () => clearInterval(intervalId)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- on veut re-démarrer uniquement quand l'id de session change, pas les autres champs (accumulated_minutes, ended_at)
  }, [session?.id])

  const dayStartedAt = useMemo(() => {
    const fromToday = getEarliestStartedAt(todaySessionsOnly)
    if (fromToday) return fromToday
    if (session && filterSessionsStartedToday([session]).length > 0) {
      return session.started_at
    }
    return null
  }, [todaySessionsOnly, session])

  const rowsForWorkedTime = useMemo(() => {
    const byId = new Map(todaySessionsOnly.map((row) => [row.id, row]))
    if (session && filterSessionsStartedToday([session]).length > 0) {
      byId.set(session.id, session)
    }
    return [...byId.values()]
  }, [todaySessionsOnly, session])

  const workedTodayMs = useMemo(() => {
    if (rowsForWorkedTime.length === 0) return 0
    return computeTodayWorkedMs(rowsForWorkedTime, nowMs)
  }, [rowsForWorkedTime, nowMs])

  const startSession = useCallback(async (geo?: ClockInGeo): Promise<SessionActionResult> => {
    if (!canManageSession) {
      return {
        ok: false,
        error: 'Profil ou officine introuvable. Rechargez la page ou contactez le titulaire.',
      }
    }

    const { data, error } = await startSessionQuery(geo)
    if (error || !data) {
      return { ok: false, error: error ?? 'Impossible de démarrer la session.' }
    }

    await fetchSession()
    return { ok: true }
  }, [canManageSession, fetchSession])

  const endSession = useCallback(async (): Promise<SessionActionResult> => {
    const sessionId = session?.id
    if (!sessionId) {
      return { ok: false, error: 'Aucune session active.' }
    }

    const { error } = await endSessionQuery(sessionId)
    if (error) {
      return { ok: false, error }
    }

    await fetchSession()
    return { ok: true }
  }, [session, fetchSession])

  const endSessionRef = useRef(endSession)
  useEffect(() => {
    endSessionRef.current = endSession
  }, [endSession])

  useEffect(() => {
    if (!session) return

    let hiddenSince: number | null = null

    const onVisibilityChange = () => {
      if (document.hidden) hiddenSince = Date.now()
      else hiddenSince = null
    }

    const checkAutoClose = () => {
      if (!hiddenSince) return
      if (Date.now() - hiddenSince < HIDDEN_AUTO_CLOSE_MS) return
      hiddenSince = null
      void endSessionRef.current().then((result) => {
        if (result.ok) {
          toast.message(
            'Session clôturée automatiquement (onglet inactif). Les pauses ne sont pas comptées.'
          )
        }
      })
    }

    document.addEventListener('visibilitychange', onVisibilityChange)
    const intervalId = setInterval(checkAutoClose, 30_000)
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange)
      clearInterval(intervalId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- on veut re-démarrer uniquement quand l'id de session change, pas les autres champs (accumulated_minutes, ended_at)
  }, [session?.id])

  useEffect(() => {
    if (!profileId || !pharmacyId) return

    let timeoutId: ReturnType<typeof setTimeout>

    const scheduleMidnightReset = () => {
      const delay = getMsUntilNextLocalMidnight()
      timeoutId = setTimeout(() => {
        void (async () => {
          const { data: closedCount } = await closeSessionsBeforeToday(
            profileId,
            pharmacyId
          )
          if (closedCount && closedCount > 0) {
            toast.message(
              'Nouvelle journée : session clôturée automatiquement. Le cumul repart à 0.'
            )
          }
          setNowMs(Date.now())
          await fetchSession()
          scheduleMidnightReset()
        })()
      }, delay)
    }

    scheduleMidnightReset()
    return () => clearTimeout(timeoutId)
  }, [profileId, pharmacyId, fetchSession])

  return (
    <SessionContext.Provider
      value={{
        session,
        dayStartedAt,
        isActive: session !== null,
        loading: loading || profileLoading,
        workedTodayMs,
        canManageSession,
        startSession,
        endSession,
        refetchSession: fetchSession,
      }}
    >
      {children}
    </SessionContext.Provider>
  )
}

export function useSessionContext(): SessionContextValue {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error('useSessionContext must be used within SessionProvider')
  return ctx
}
