'use client'

import { useMemo } from 'react'
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { useProfile } from '@/contexts/profile-context'
import { shortagesService } from '@/features/shortages/services/shortages.service'
import type { NewShortage, Shortage, ShortageStatus, UpdateShortage } from '@/types/index'

const PAGE_SIZE = 50

type UseShortagesOptions = {
  disablePagination?: boolean
}

export function useShortages(
  filters?: { status?: ShortageStatus },
  options?: UseShortagesOptions
) {
  const { pharmacy } = useProfile()
  const pharmacyId = pharmacy?.id ?? null
  const queryClient = useQueryClient()
  const disablePagination = options?.disablePagination ?? false

  const serializedFilters = useMemo(
    () => JSON.stringify({ status: filters?.status ?? null }),
    [filters?.status]
  )

  const queryKey = useMemo(
    () => ['shortages', pharmacyId, serializedFilters] as const,
    [pharmacyId, serializedFilters]
  )

  const legacyQuery = useQuery({
    queryKey: [...queryKey, 'all'] as const,
    enabled: Boolean(pharmacyId) && disablePagination,
    queryFn: async () => {
      const parsed = JSON.parse(serializedFilters) as { status: ShortageStatus | null }
      const result = await shortagesService.getShortages(pharmacyId!, {
        status: parsed.status ?? undefined,
      })
      if (result.error) throw new Error(result.error)
      return result.data ?? []
    },
  })

  const paginatedQuery = useInfiniteQuery({
    queryKey,
    enabled: Boolean(pharmacyId) && !disablePagination,
    initialPageParam: null as { created_at: string; id: string } | null,
    queryFn: async ({ pageParam }) => {
      const parsed = JSON.parse(serializedFilters) as { status: ShortageStatus | null }
      const result = await shortagesService.getShortagesPaginated(
        pharmacyId!,
        pageParam ?? undefined,
        PAGE_SIZE,
        { status: parsed.status ?? undefined }
      )
      if (result.error) throw new Error(result.error)
      return result.data ?? { items: [], nextCursor: null }
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  })

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['shortages', pharmacyId] })
  }

  const createShortageMutation = useMutation({
    mutationFn: async (payload: NewShortage) => {
      const result = await shortagesService.createShortage(payload)
      if (result.error) throw new Error(result.error)
    },
    onSuccess: refresh,
  })

  const updateShortageMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: UpdateShortage }) => {
      const result = await shortagesService.updateShortage(id, payload)
      if (result.error) throw new Error(result.error)
    },
    onSuccess: refresh,
  })

  const deleteShortageMutation = useMutation({
    mutationFn: async (id: string) => {
      const result = await shortagesService.deleteShortage(id)
      if (result.error) throw new Error(result.error)
    },
    onSuccess: refresh,
  })

  const shortages = (
    disablePagination
      ? (legacyQuery.data ?? [])
      : (paginatedQuery.data?.pages.flatMap((p) => p.items) ?? [])
  ) as Shortage[]

  const loading = disablePagination
    ? legacyQuery.isLoading || legacyQuery.isFetching
    : paginatedQuery.isLoading || paginatedQuery.isFetching

  return {
    shortages,
    loading,
    error:
      ((disablePagination ? legacyQuery.error : paginatedQuery.error) as Error | null)
        ?.message ??
      (createShortageMutation.error as Error | null)?.message ??
      (updateShortageMutation.error as Error | null)?.message ??
      (deleteShortageMutation.error as Error | null)?.message ??
      null,
    hasNextPage: disablePagination ? false : Boolean(paginatedQuery.hasNextPage),
    fetchNextPage: async () => {
      if (!disablePagination) await paginatedQuery.fetchNextPage()
    },
    fetchingNextPage: disablePagination ? false : paginatedQuery.isFetchingNextPage,
    createShortage: async (payload: NewShortage) =>
      createShortageMutation.mutateAsync(payload),
    updateShortage: async (id: string, payload: UpdateShortage) =>
      updateShortageMutation.mutateAsync({ id, payload }),
    deleteShortage: async (id: string) => deleteShortageMutation.mutateAsync(id),
    refresh,
  }
}
