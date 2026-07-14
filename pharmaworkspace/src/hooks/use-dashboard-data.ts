'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getDashboardKpis, getTodayTeamSessionsSummary } from '@/lib/queries/sessions'

const WORK_SESSIONS_POLL_MS = 30_000

export type DashboardKpis = {
  tasksTotal: number
  tasksInProgress: number
  tasksDueToday: number
  tasksOverdue: number
  prescriptionsToServe: number
  prescriptionsOnHold: number
  rentalsOverdue: number
  rentalsInProgress: number
  shortagesOpen: number
  ordersInProgress: number
}

export const EMPTY_DASHBOARD_KPIS: DashboardKpis = {
  tasksTotal: 0,
  tasksInProgress: 0,
  tasksDueToday: 0,
  tasksOverdue: 0,
  prescriptionsToServe: 0,
  prescriptionsOnHold: 0,
  rentalsOverdue: 0,
  rentalsInProgress: 0,
  shortagesOpen: 0,
  ordersInProgress: 0,
}

export function useDashboardData(
  pharmacyId: string | null,
  sessionFingerprint: string
) {
  const queryClient = useQueryClient()

  const kpisQuery = useQuery({
    queryKey: ['dashboard-kpis', pharmacyId] as const,
    enabled: Boolean(pharmacyId),
    queryFn: async () => {
      const result = await getDashboardKpis(pharmacyId!)
      if (result.error) throw new Error(result.error)
      return result.data ?? EMPTY_DASHBOARD_KPIS
    },
    refetchInterval: WORK_SESSIONS_POLL_MS,
  })

  const teamQuery = useQuery({
    queryKey: ['dashboard-team', pharmacyId, sessionFingerprint] as const,
    enabled: Boolean(pharmacyId),
    queryFn: async () => {
      const result = await getTodayTeamSessionsSummary(pharmacyId!)
      if (result.error) throw new Error(result.error)
      return result.data ?? []
    },
    refetchInterval: WORK_SESSIONS_POLL_MS,
  })

  const refetchTeam = async () => {
    if (!pharmacyId) return
    await queryClient.invalidateQueries({ queryKey: ['dashboard-team', pharmacyId] })
  }

  return {
    kpis: kpisQuery.data ?? EMPTY_DASHBOARD_KPIS,
    teamSessions: teamQuery.data ?? [],
    loadingTeam: teamQuery.isLoading,
    refetchTeam,
  }
}
