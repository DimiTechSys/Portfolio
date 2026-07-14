'use client'

import { useCallback, useMemo } from 'react'
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { useProfile } from '@/contexts/profile-context'
import { tasksService } from '@/features/tasks/services/tasks.service'
import type { KeysetCursor } from '@/lib/queries/keyset-pagination'
import type { TaskListFilters, TaskSection } from '@/lib/queries/tasks'
import type { TaskWithProfiles } from '@/types/index'

export type UseTaskSectionResult = {
  items: TaskWithProfiles[]
  loading: boolean
  isError: boolean
  hasNextPage: boolean
  fetchNextPage: () => void
  fetchingNextPage: boolean
  refresh: () => Promise<void>
}

/**
 * Une section de tâches (mine/free/team) paginée en keyset, avec taille de lot
 * configurable. Sert notamment la page /tasks/completed (section + status='done').
 */
export function useTaskSection(
  section: TaskSection,
  filters: TaskListFilters,
  pageSize: number,
  options?: { enabled?: boolean }
): UseTaskSectionResult {
  const { profile, pharmacy } = useProfile()
  const queryClient = useQueryClient()
  const pharmacyId = pharmacy?.id ?? null
  const userId = profile?.id ?? null
  const enabled = (options?.enabled ?? true) && Boolean(pharmacyId) && Boolean(userId)

  const serializedFilters = useMemo(
    () =>
      JSON.stringify({
        status: filters.status ?? null,
        priority: filters.priority ?? null,
        search: filters.search?.trim() || null,
      }),
    [filters.status, filters.priority, filters.search]
  )

  const query = useInfiniteQuery({
    queryKey: ['tasks', pharmacyId, 'section', section, pageSize, serializedFilters] as const,
    enabled,
    initialPageParam: null as KeysetCursor | null,
    queryFn: async ({ pageParam }) => {
      const parsed = JSON.parse(serializedFilters) as TaskListFilters
      const result = await tasksService.getTasksSectionPaginated(
        pharmacyId!,
        section,
        userId!,
        pageParam ?? undefined,
        pageSize,
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

  const refresh = useCallback(
    () => queryClient.invalidateQueries({ queryKey: ['tasks', pharmacyId] }),
    [queryClient, pharmacyId]
  )

  return {
    items: query.data?.pages.flatMap((p) => p.items) ?? [],
    loading: query.isLoading,
    isError: query.isError,
    hasNextPage: Boolean(query.hasNextPage),
    fetchNextPage: () => {
      void query.fetchNextPage()
    },
    fetchingNextPage: query.isFetchingNextPage,
    refresh,
  }
}
