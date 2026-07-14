'use client'

import { useQuery } from '@tanstack/react-query'
import { useProfile } from '@/contexts/profile-context'
import { getPharmacyMembers } from '@/lib/queries/admin'
import {
  fetchWeekWorkedMinutes,
  getLeaveRequestsForPharmacy,
  getWeekRange,
} from '@/lib/queries/planning'
import {
  getShiftTemplates,
  getShiftAssignmentsForWeek,
} from '@/lib/queries/shifts'
import { toDateKey } from '@/lib/planning/cell-status'

export function usePlanningWeek(weekOffset: number) {
  const { pharmacy } = useProfile()
  const pharmacyId = pharmacy?.id ?? null
  const weekRange = getWeekRange(weekOffset)

  return useQuery({
    queryKey: ['planning-week', pharmacyId, weekOffset] as const,
    enabled: Boolean(pharmacyId),
    queryFn: async () => {
      // Dates LOCALES (pas toISOString, qui décale d'un jour selon le fuseau et
      // faisait disparaître la colonne du dimanche).
      const fromDate = toDateKey(weekRange.monday)
      const toDate = toDateKey(weekRange.sunday)
      const [membersRes, leavesRes, segmentsRes, templatesRes, assignmentsRes] =
        await Promise.all([
          getPharmacyMembers(pharmacyId!),
          getLeaveRequestsForPharmacy(pharmacyId!, { fromDate, toDate }),
          fetchWeekWorkedMinutes(pharmacyId!, weekRange.monday, weekRange.weekEndExclusive),
          getShiftTemplates(pharmacyId!),
          getShiftAssignmentsForWeek(pharmacyId!, fromDate, toDate),
        ])

      if (membersRes.error) throw new Error(membersRes.error)
      if (leavesRes.error) throw new Error(leavesRes.error)
      if (segmentsRes.error) throw new Error(segmentsRes.error)
      if (templatesRes.error) throw new Error(templatesRes.error)
      if (assignmentsRes.error) throw new Error(assignmentsRes.error)

      return {
        members: membersRes.data ?? [],
        leaves: leavesRes.data ?? [],
        segmentMinutes: segmentsRes.data ?? {},
        templates: templatesRes.data ?? [],
        assignments: assignmentsRes.data ?? [],
        weekRange,
      }
    },
  })
}

export function useLeaveRequests(options?: { mineOnly?: boolean }) {
  const { pharmacy, profile } = useProfile()
  const pharmacyId = pharmacy?.id ?? null
  const userId = profile?.id ?? null

  return useQuery({
    queryKey: ['leave-requests', pharmacyId, options?.mineOnly ? userId : 'all'] as const,
    enabled: Boolean(pharmacyId && userId),
    queryFn: async () => {
      const { getLeaveRequestsForUser, getPendingLeaveRequests } = await import(
        '@/lib/queries/planning'
      )

      if (options?.mineOnly) {
        const result = await getLeaveRequestsForUser(pharmacyId!, userId!)
        if (result.error) throw new Error(result.error)
        return result.data ?? []
      }

      const result = await getPendingLeaveRequests(pharmacyId!)
      if (result.error) throw new Error(result.error)
      return result.data ?? []
    },
  })
}
