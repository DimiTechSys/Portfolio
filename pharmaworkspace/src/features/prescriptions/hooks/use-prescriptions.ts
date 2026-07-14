'use client'

import { useMemo } from 'react'
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { useProfile } from '@/contexts/profile-context'
import { prescriptionsService } from '@/features/prescriptions/services/prescriptions.service'
import type {
  NewPrescription,
  Prescription,
  PrescriptionStatus,
  UpdatePrescription,
} from '@/types/index'

const PAGE_SIZE = 50

type UsePrescriptionsOptions = {
  /** Agenda / vues agrégées : charge toute la liste (legacy). */
  disablePagination?: boolean
}

export function usePrescriptions(
  filters?: { status?: PrescriptionStatus },
  options?: UsePrescriptionsOptions
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
    () => ['prescriptions', pharmacyId, serializedFilters] as const,
    [pharmacyId, serializedFilters]
  )

  const legacyQuery = useQuery({
    queryKey: [...queryKey, 'all'] as const,
    enabled: Boolean(pharmacyId) && disablePagination,
    queryFn: async () => {
      const parsed = JSON.parse(serializedFilters) as { status: PrescriptionStatus | null }
      const result = await prescriptionsService.getPrescriptions(pharmacyId!, {
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
      const parsed = JSON.parse(serializedFilters) as { status: PrescriptionStatus | null }
      const result = await prescriptionsService.getPrescriptionsPaginated(
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
    await queryClient.invalidateQueries({ queryKey: ['prescriptions', pharmacyId] })
  }

  const createPrescriptionMutation = useMutation({
    mutationFn: async (payload: NewPrescription) => {
      const result = await prescriptionsService.createPrescription(payload)
      if (result.error) throw new Error(result.error)
    },
    onSuccess: refresh,
  })

  const updatePrescriptionMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: UpdatePrescription }) => {
      const result = await prescriptionsService.updatePrescription(id, payload)
      if (result.error) throw new Error(result.error)
    },
    onSuccess: refresh,
  })

  const deletePrescriptionMutation = useMutation({
    mutationFn: async (id: string) => {
      const result = await prescriptionsService.deletePrescription(id)
      if (result.error) throw new Error(result.error)
    },
    onSuccess: refresh,
  })

  const prescriptions = (
    disablePagination
      ? (legacyQuery.data ?? [])
      : (paginatedQuery.data?.pages.flatMap((p) => p.items) ?? [])
  ) as Prescription[]

  const loading = disablePagination
    ? legacyQuery.isLoading || legacyQuery.isFetching
    : paginatedQuery.isLoading || paginatedQuery.isFetching

  return {
    prescriptions,
    loading,
    error:
      ((disablePagination ? legacyQuery.error : paginatedQuery.error) as Error | null)
        ?.message ??
      (createPrescriptionMutation.error as Error | null)?.message ??
      (updatePrescriptionMutation.error as Error | null)?.message ??
      (deletePrescriptionMutation.error as Error | null)?.message ??
      null,
    hasNextPage: disablePagination ? false : Boolean(paginatedQuery.hasNextPage),
    fetchNextPage: async () => {
      if (!disablePagination) await paginatedQuery.fetchNextPage()
    },
    fetchingNextPage: disablePagination ? false : paginatedQuery.isFetchingNextPage,
    createPrescription: async (payload: NewPrescription) =>
      createPrescriptionMutation.mutateAsync(payload),
    updatePrescription: async (id: string, payload: UpdatePrescription) =>
      updatePrescriptionMutation.mutateAsync({ id, payload }),
    deletePrescription: async (id: string) =>
      deletePrescriptionMutation.mutateAsync(id),
    refresh,
  }
}
