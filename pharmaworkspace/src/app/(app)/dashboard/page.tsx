'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useProfile } from '@/contexts/profile-context'
import { useSession } from '@/hooks/use-session'
import { useDashboardData } from '@/hooks/use-dashboard-data'
import { formatSessionClock, formatWorkedDuration, formatWorkedElapsedMs } from '@/lib/sessions/time'
import { KpiCard } from '@/components/shared/kpi-card'
import {
  CalendarCheck,
  AlertCircle,
  AlertTriangle,
  Package,
  ShoppingCart,
} from 'lucide-react'
import { toast } from 'sonner'
import { EndSessionDialog } from '@/components/session/end-session-dialog'
import { ClockInButton } from '@/components/work-sessions/clock-in-button'
import { TeamSessionsDayTable } from '@/components/session/team-sessions-day-table'
import { NAV_GROUPS } from '@/config/nav'
import { TransitionBanner } from '@/components/onboarding/transition-banner'

export default function DashboardPage() {
  const router = useRouter()
  const { profile, pharmacy, role } = useProfile()
  const {
    session,
    dayStartedAt,
    isActive,
    workedTodayMs,
    endSession,
  } = useSession()
  const pharmacyId = profile?.pharmacy_id ?? pharmacy?.id ?? null
  const sessionFingerprint = `${session?.id ?? 'none'}-${isActive ? '1' : '0'}`

  const { kpis, teamSessions, loadingTeam, refetchTeam } = useDashboardData(
    pharmacyId,
    sessionFingerprint
  )

  const [showEndModal, setShowEndModal] = useState(false)
  const [ending, setEnding] = useState(false)

  const handleEndSession = async () => {
    setEnding(true)
    try {
      const result = await endSession()
      if (result.ok) {
        toast.success('Session clôturée')
        setShowEndModal(false)
        await refetchTeam()
      } else {
        toast.error(result.error)
      }
    } finally {
      setEnding(false)
    }
  }

  // Bannière de transition wizard → missions : affichée une seule fois,
  // flag posé en sessionStorage par la page de succès d'activation Stripe.
  const [showTransitionBanner, setShowTransitionBanner] = useState(false)
  useEffect(() => {
    try {
      if (sessionStorage.getItem('pw_missions_transition') === '1') {
        sessionStorage.removeItem('pw_missions_transition')
        setShowTransitionBanner(true)
      }
    } catch {
      // sessionStorage indisponible, pas bloquant.
    }
  }, [])

  const firstName = profile?.display_name?.split(' ')[0] ?? ''

  const teamList = useMemo(() => teamSessions.slice(0, 12), [teamSessions])

  const myDaySummary = useMemo(
    () => teamSessions.find((row) => row.user_id === profile?.id) ?? null,
    [teamSessions, profile?.id]
  )

  const primaryTabs = [
    {
      label: 'Tâches',
      value: kpis.tasksInProgress,
      href: '/tasks',
      icon: CalendarCheck,
      tone: 'green' as const,
    },
    {
      label: 'Commandes',
      value: kpis.ordersInProgress,
      href: '/orders',
      icon: ShoppingCart,
      tone: 'red' as const,
    },
    {
      label: 'Ruptures',
      value: kpis.shortagesOpen,
      href: '/shortages',
      icon: AlertTriangle,
      tone: 'blue' as const,
    },
    {
      label: 'Locations',
      value: kpis.rentalsInProgress,
      href: '/rentals',
      icon: Package,
      tone: 'orange' as const,
    },
  ]

  const secondaryTabs = NAV_GROUPS.flatMap((group) => group.items)
    .filter((item) => !role || item.roles.includes(role))
    .filter(
      (item) =>
        ![
          '/dashboard',
          '/tasks',
          '/orders',
          '/rentals',
          '/shortages',
          '/agenda',
          // Mobile : le salon d'équipe est accessible via la bulle flottante.
          '/chat',
        ].includes(
          item.href
        )
    )
  const extraSecondaryTabs: { label: string; href: string }[] = []
  const allSecondaryTabs = [
    ...secondaryTabs.map((item) => ({ label: item.label, href: item.href })),
    ...extraSecondaryTabs,
  ].filter(
    (item, index, arr) => arr.findIndex((entry) => entry.href === item.href) === index
  )

  return (
    <div className="space-y-6 pb-0 md:space-y-8">
      {showTransitionBanner && <TransitionBanner />}

      {/* Header */}
      <div className="rounded-3xl border border-slate-200/70 bg-white/90 p-4 shadow-sm md:p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Dashboard</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            Bonjour{firstName ? ` ${firstName}` : ''}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Voici le résumé de votre officine.
          </p>
        </div>
        {isActive && session ? (
          <div className="flex flex-col items-end gap-1">
            <p className="text-sm font-semibold text-emerald-700">
              {formatWorkedElapsedMs(workedTodayMs, true)}
            </p>
            <p className="hidden text-xs text-slate-500 lg:block">
              Début {formatSessionClock(dayStartedAt)} · Fin en cours
            </p>
            <button
              onClick={() => setShowEndModal(true)}
              className="hidden rounded-full border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground lg:inline-flex"
            >
              Clôturer ma session
            </button>
          </div>
        ) : (
          <div className="hidden flex-col items-end gap-2 lg:flex">
            {/* Démarrage + dernière session déjà gérés par le header sur mobile → desktop uniquement */}
            {myDaySummary && !myDaySummary.is_active ? (
              <p className="text-xs text-slate-500">
                Dernière session : {formatSessionClock(myDaySummary.started_at)} –{' '}
                {formatSessionClock(myDaySummary.ended_at)} ·{' '}
                {formatWorkedDuration(myDaySummary.worked_minutes_today)}
              </p>
            ) : null}
            <ClockInButton onStarted={() => void refetchTeam()} />
          </div>
        )}
        </div>
      </div>

      {/* Main tabs on cards (mobile only) */}
      <div className="grid grid-cols-2 gap-3 lg:hidden">
        {primaryTabs.map((tab) => (
          <button
            key={tab.href}
            type="button"
            onClick={() => router.push(tab.href)}
            className="rounded-2xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:ring-offset-2"
          >
            <KpiCard
              label={tab.label}
              value={tab.value}
              icon={tab.icon}
              tone={tab.tone}
              className="cursor-pointer transition-transform hover:-translate-y-0.5"
            />
          </button>
        ))}
      </div>

      {/* Desktop KPIs (unchanged desktop behavior) */}
      <div className="hidden grid-cols-2 gap-3 lg:grid lg:grid-cols-4">
        <button
          type="button"
          onClick={() => router.push('/tasks')}
          className="rounded-2xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:ring-offset-2"
        >
          <KpiCard
            label="Tâches du jour"
            value={kpis.tasksDueToday}
            icon={CalendarCheck}
            tone="green"
            className="cursor-pointer transition-transform hover:-translate-y-0.5"
          />
        </button>
        <button
          type="button"
          onClick={() => router.push('/tasks')}
          className="rounded-2xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:ring-offset-2"
        >
          <KpiCard
            label="Tâches en retard"
            value={kpis.tasksOverdue}
            icon={AlertCircle}
            tone="red"
            className="cursor-pointer transition-transform hover:-translate-y-0.5"
          />
        </button>
        <button
          type="button"
          onClick={() => router.push('/shortages')}
          className="rounded-2xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:ring-offset-2"
        >
          <KpiCard
            label="Ruptures sans alternative"
            value={kpis.shortagesOpen}
            icon={AlertTriangle}
            tone="blue"
            className="cursor-pointer transition-transform hover:-translate-y-0.5"
          />
        </button>
        <button
          type="button"
          onClick={() => router.push('/rentals')}
          className="rounded-2xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:ring-offset-2"
        >
          <KpiCard
            label="Locations en retard"
            value={kpis.rentalsOverdue}
            icon={Package}
            tone="orange"
            className="cursor-pointer transition-transform hover:-translate-y-0.5"
          />
        </button>
      </div>

      {/* Secondary tabs row (mobile) */}
      {allSecondaryTabs.length > 0 ? (
        <div className="lg:hidden">
          <div className="rounded-2xl border border-slate-200/70 bg-white p-2 shadow-sm">
            <div className="divide-y divide-slate-100">
              {allSecondaryTabs.map((item) => (
                <button
                  key={item.href}
                  type="button"
                  onClick={() => router.push(item.href)}
                  className="flex w-full items-center justify-between px-3 py-3 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                >
                  <span>{item.label}</span>
                  <span aria-hidden className="text-slate-400">
                    ›
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      <section className="rounded-3xl border border-slate-200/70 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-medium">Équipe · aujourd&apos;hui</h2>
          <span className="text-sm text-slate-500">
            {role === 'titulaire' ? 'Pointage du jour' : 'Équipe'}
          </span>
        </div>
        {loadingTeam ? (
          <p className="text-sm text-muted-foreground">Chargement…</p>
        ) : teamList.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun pointage enregistré aujourd&apos;hui.</p>
        ) : (
          <TeamSessionsDayTable rows={teamList} showTasks={role === 'titulaire'} />
        )}
      </section>

      <EndSessionDialog
        open={showEndModal}
        ending={ending}
        onOpenChange={setShowEndModal}
        onConfirm={handleEndSession}
      />



    </div>
  )
}
