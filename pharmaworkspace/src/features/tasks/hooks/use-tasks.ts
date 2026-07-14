'use client'

import { useMemo } from 'react'
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useProfile } from '@/contexts/profile-context'
import { tasksService } from '@/features/tasks/services/tasks.service'
import type { NewTask, TaskStatus, TaskWithProfiles, UpdateTask } from '@/types/index'

type TaskFilters = {
  status?: TaskStatus
  assignedTo?: string
}

type UseTasksOptions = {
  // Désactive la requête de liste plate (les mutations restent disponibles).
  // Utilisé par la page /tasks en vue liste, qui charge ses données via useTaskSections.
  enabled?: boolean
}

export function useTasks(filters?: TaskFilters, options?: UseTasksOptions): {
  tasks: TaskWithProfiles[]
  loading: boolean
  error: string | null
  hasNextPage: boolean
  fetchNextPage: () => Promise<void>
  fetchingNextPage: boolean
  createTask: (payload: NewTask) => Promise<void>
  updateTask: (id: string, payload: UpdateTask) => Promise<void>
  deleteTask: (id: string) => Promise<void>
  refresh: () => Promise<void>
} {
  const queryEnabled = options?.enabled ?? true
  const { pharmacy } = useProfile()
  const queryClient = useQueryClient()
  const pharmacyId = pharmacy?.id ?? null

  const serializedFilters = useMemo(
    () =>
      JSON.stringify({
        status: filters?.status ?? null,
        assignedTo: filters?.assignedTo ?? null,
      }),
    [filters?.assignedTo, filters?.status]
  )

  const queryKey = useMemo(
    () => ['tasks', pharmacyId, serializedFilters] as const,
    [pharmacyId, serializedFilters]
  )

  const tasksQuery = useInfiniteQuery({
    queryKey,
    enabled: Boolean(pharmacyId) && queryEnabled,
    initialPageParam: null as { created_at: string; id: string } | null,
    queryFn: async ({ pageParam }) => {
      const parsed = JSON.parse(serializedFilters) as {
        status: TaskStatus | null
        assignedTo: string | null
      }

      const result = await tasksService.getTasksPaginated(
        pharmacyId!,
        pageParam ?? undefined,
        50,
        {
          status: parsed.status ?? undefined,
          assignedTo: parsed.assignedTo ?? undefined,
        }
      )
      if (result.error) throw new Error(result.error)
      return result.data ?? { items: [], nextCursor: null }
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  })

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['tasks', pharmacyId] })
  }

  const createTaskMutation = useMutation({
    mutationFn: async (payload: NewTask) => {
      const result = await tasksService.createTask(payload)
      if (result.error) throw new Error(result.error)
    },
    onSuccess: refresh,
  })

  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: UpdateTask }) => {
      const result = await tasksService.updateTask(id, payload)
      if (result.error) throw new Error(result.error)
    },
    onSuccess: refresh,
  })

  const deleteTaskMutation = useMutation({
    mutationFn: async (id: string) => {
      const result = await tasksService.deleteTask(id)
      if (result.error) throw new Error(result.error)
    },
    onSuccess: refresh,
  })

  return {
    tasks: tasksQuery.data?.pages.flatMap((p) => p.items) ?? [],
    loading: tasksQuery.isLoading || tasksQuery.isFetching,
    error:
      (tasksQuery.error as Error | null)?.message ??
      (createTaskMutation.error as Error | null)?.message ??
      (updateTaskMutation.error as Error | null)?.message ??
      (deleteTaskMutation.error as Error | null)?.message ??
      null,
    hasNextPage: Boolean(tasksQuery.hasNextPage),
    fetchNextPage: async () => {
      await tasksQuery.fetchNextPage()
    },
    fetchingNextPage: tasksQuery.isFetchingNextPage,
    createTask: async (payload) => createTaskMutation.mutateAsync(payload),
    updateTask: async (id, payload) =>
      updateTaskMutation.mutateAsync({ id, payload }),
    deleteTask: async (id) => deleteTaskMutation.mutateAsync(id),
    refresh,
  }
}
