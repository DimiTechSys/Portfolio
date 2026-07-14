'use client'

import { useMemo } from 'react'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { useProfile } from '@/contexts/profile-context'
import { tasksService } from '@/features/tasks/services/tasks.service'
import type { KeysetCursor } from '@/lib/queries/keyset-pagination'
import type { TaskListFilters, TaskSection } from '@/lib/queries/tasks'
import type { TaskPriority, TaskWithProfiles } from '@/types/index'

const PAGE_SIZE = 50

export type TaskSectionResult = {
  items: TaskWithProfiles[]
  loading: boolean
  hasNextPage: boolean
  fetchNextPage: () => Promise<void>
  fetchingNextPage: boolean
}

// Requête paginée d'une section (mine/free/team). Appelée dans un ordre fixe
// par useTaskSections → conforme aux règles des hooks.
function useSectionQuery(
  section: TaskSection,
  pharmacyId: string | null,
  userId: string | null,
  serializedFilters: string,
  enabled: boolean
) {
  return useInfiniteQuery({
    queryKey: ['tasks', pharmacyId, 'section', section, serializedFilters] as const,
    enabled: enabled && Boolean(pharmacyId) && Boolean(userId),
    initialPageParam: null as KeysetCursor | null,
    queryFn: async ({ pageParam }) => {
      const parsed = JSON.parse(serializedFilters) as TaskListFilters
      const result = await tasksService.getTasksSectionPaginated(
        pharmacyId!,
        section,
        userId!,
        pageParam ?? undefined,
        PAGE_SIZE,
        {
          status: parsed.status ?? undefined,
          priority: parsed.priority ?? undefined,
          search: parsed.search ?? undefined,
        }
      )
      if (result.error) throw new Error(result.error)
      return result.data ?? { items: [], nextCursor: null }
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  })
}

// Compteur serveur (head:true). Ordre d'appel fixe également.
function useCountQuery(
  idKey: string,
  pharmacyId: string | null,
  userId: string | null,
  countFilters: {
    section?: TaskSection
    status?: 'active' | 'done'
    priority?: TaskPriority
  },
  enabled: boolean
) {
  return useQuery({
    queryKey: ['tasks', pharmacyId, 'count', userId, idKey] as const,
    enabled: enabled && Boolean(pharmacyId) && Boolean(userId),
    queryFn: async () => {
      const result = await tasksService.countTasks(pharmacyId!, {
        ...countFilters,
        userId,
      })
      if (result.error) throw new Error(result.error)
      return result.data ?? 0
    },
  })
}

function toSectionResult(
  query: ReturnType<typeof useSectionQuery>
): TaskSectionResult {
  return {
    items: query.data?.pages.flatMap((p) => p.items) ?? [],
    loading: query.isLoading,
    hasNextPage: Boolean(query.hasNextPage),
    fetchNextPage: async () => {
      await query.fetchNextPage()
    },
    fetchingNextPage: query.isFetchingNextPage,
  }
}

/**
 * Données de la page /tasks, calculées CÔTÉ SERVEUR :
 * - 3 sections paginées indépendamment (mes tâches / libres / équipe),
 * - compteurs exacts (progress bar + « terminée(s) ») via count head:true.
 *
 * `enabled` ne gate que les 3 listes de sections ; les compteurs restent actifs
 * (la barre de progression est visible aussi en vue kanban).
 */
export function useTaskSections(
  filters: TaskListFilters,
  options?: { enabled?: boolean }
) {
  const { profile, pharmacy } = useProfile()
  const pharmacyId = pharmacy?.id ?? null
  const userId = profile?.id ?? null
  const listEnabled = options?.enabled ?? true

  const serializedFilters = useMemo(
    () =>
      JSON.stringify({
        status: filters.status ?? null,
        priority: filters.priority ?? null,
        search: filters.search?.trim() || null,
      }),
    [filters.status, filters.priority, filters.search]
  )

  const mine = useSectionQuery('mine', pharmacyId, userId, serializedFilters, listEnabled)
  const free = useSectionQuery('free', pharmacyId, userId, serializedFilters, listEnabled)
  const team = useSectionQuery('team', pharmacyId, userId, serializedFilters, listEnabled)

  // Compteurs (indépendants des filtres de la page, comme l'ancienne barre).
  const myHigh = useCountQuery('mine-active-high', pharmacyId, userId, { section: 'mine', status: 'active', priority: 'high' }, true)
  const myMedium = useCountQuery('mine-active-medium', pharmacyId, userId, { section: 'mine', status: 'active', priority: 'medium' }, true)
  const myLow = useCountQuery('mine-active-low', pharmacyId, userId, { section: 'mine', status: 'active', priority: 'low' }, true)
  const myDone = useCountQuery('mine-done', pharmacyId, userId, { section: 'mine', status: 'done' }, true)
  const teamDone = useCountQuery('team-done', pharmacyId, userId, { section: 'team', status: 'done' }, true)

  const error =
    (mine.error as Error | null)?.message ??
    (free.error as Error | null)?.message ??
    (team.error as Error | null)?.message ??
    null

  return {
    sections: {
      mine: toSectionResult(mine),
      free: toSectionResult(free),
      team: toSectionResult(team),
    },
    counts: {
      myActive: {
        high: myHigh.data ?? 0,
        medium: myMedium.data ?? 0,
        low: myLow.data ?? 0,
      },
      myDone: myDone.data ?? 0,
      teamDone: teamDone.data ?? 0,
    },
    countsLoading:
      myHigh.isLoading || myMedium.isLoading || myLow.isLoading || myDone.isLoading || teamDone.isLoading,
    error,
  }
}
