'use client'

import { useCallback, useMemo } from 'react'
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useProfile } from '@/contexts/profile-context'
import {
  getRentals,
  getRentalsPaginated,
  searchRentals,
  countRentalsByStatus,
  createRental as createRentalQuery,
  updateRental as updateRentalQuery,
  deleteRental as deleteRentalQuery,
  type RentalListStatus,
} from '@/lib/queries/rentals'
import type { KeysetCursor } from '@/lib/queries/keyset-pagination'
import type {
  Rental,
  RentalStatus,
  NewRental,
  UpdateRental,
} from '@/types/index'

function computeRentalStatus(rental: Rental): Rental {
  if (
    rental.status === 'active' &&
    rental.expected_return &&
    new Date(rental.expected_return) < new Date(new Date().toDateString())
  ) {
    return { ...rental, status: 'overdue' as RentalStatus }
  }
  return rental
}

// Mutations partagées entre useRentals (agenda) et useRentalsPaginated (pages liste).
// Toutes invalident le préfixe ['rentals', pharmacyId] → rafraîchit toutes les vues.
function useRentalMutations() {
  const { pharmacy } = useProfile()
  const queryClient = useQueryClient()
  const pharmacyId = pharmacy?.id ?? null

  const invalidate = useCallback(
    () => queryClient.invalidateQueries({ queryKey: ['rentals', pharmacyId] }),
    [queryClient, pharmacyId]
  )

  const createMutation = useMutation({
    mutationFn: async (payload: NewRental) => {
      const result = await createRentalQuery(payload)
      if (result.error) throw new Error(result.error)
      return result.data
    },
    onSuccess: (data) => {
      if (data) {
        const expectedReturnLabel = data.expected_return
          ? new Date(data.expected_return).toLocaleDateString('fr-FR')
          : '-'
        const weeklyRateLabel =
          data.daily_rate != null
            ? `${(data.daily_rate * 7).toFixed(2)} EUR/sem`
            : 'Non renseigné'
        toast('Nouvelle location créée', {
          description: `${data.equipment} · ${data.client_name} · Retour ${expectedReturnLabel} · ${weeklyRateLabel}`,
        })
      }
      void invalidate()
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: UpdateRental }) => {
      const enrichedPayload: UpdateRental = { ...payload }
      if (payload.status === 'returned' && !payload.returned_at) {
        enrichedPayload.returned_at = new Date().toISOString()
      }
      const result = await updateRentalQuery(id, enrichedPayload)
      if (result.error) throw new Error(result.error)
      return result.data
    },
    onSuccess: () => void invalidate(),
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteRentalQuery(id)
      if (result.error) throw new Error(result.error)
    },
    onSuccess: () => void invalidate(),
  })

  const updateRental = useCallback(
    async (id: string, payload: UpdateRental) => {
      await updateMutation.mutateAsync({ id, payload })
    },
    [updateMutation]
  )

  const createRental = useCallback(
    async (payload: NewRental) => {
      const data = await createMutation.mutateAsync(payload)
      return data ?? undefined
    },
    [createMutation]
  )

  const deleteRental = useCallback(
    async (id: string) => {
      await deleteMutation.mutateAsync(id)
    },
    [deleteMutation]
  )

  const incrementPayment = useCallback(
    async (rental: Rental) => {
      const currentPaid = rental.paid_units ?? 0
      const total = rental.total_units ?? 1
      if (currentPaid >= total) return
      await updateRental(rental.id, { paid_units: currentPaid + 1 })
    },
    [updateRental]
  )

  const markAsReturned = useCallback(
    async (id: string) => {
      await updateRental(id, { status: 'returned' })
    },
    [updateRental]
  )

  const mutationError =
    (createMutation.error as Error | null)?.message ??
    (updateMutation.error as Error | null)?.message ??
    (deleteMutation.error as Error | null)?.message ??
    null

  return {
    createRental,
    updateRental,
    deleteRental,
    incrementPayment,
    markAsReturned,
    invalidate,
    mutationError,
  }
}

/**
 * Charge TOUTES les locations (non paginé). Réservé aux vues qui ont besoin de
 * l'ensemble (agenda). Les pages de liste utilisent useRentalsPaginated.
 */
export function useRentals(filters?: { status?: RentalStatus }) {
  const { pharmacy } = useProfile()
  const pharmacyId = pharmacy?.id ?? null

  // 'overdue' se calcule côté client à partir des locations 'active'.
  const dbStatus: RentalStatus | null =
    filters?.status === 'overdue' ? 'active' : filters?.status ?? null

  const query = useQuery({
    queryKey: ['rentals', pharmacyId, 'all', dbStatus] as const,
    enabled: Boolean(pharmacyId),
    queryFn: async () => {
      const result = await getRentals(pharmacyId!, dbStatus ? { status: dbStatus } : undefined)
      if (result.error) throw new Error(result.error)
      return result.data ?? []
    },
  })

  const rawRentals = useMemo(() => query.data ?? [], [query.data])
  const rentals = useMemo(() => {
    const computed = rawRentals.map(computeRentalStatus)
    if (filters?.status === 'overdue') return computed.filter((r) => r.status === 'overdue')
    return computed
  }, [rawRentals, filters?.status])

  const m = useRentalMutations()

  return {
    rentals,
    loading: query.isLoading,
    error: (query.error as Error | null)?.message ?? m.mutationError ?? null,
    createRental: m.createRental,
    updateRental: m.updateRental,
    deleteRental: m.deleteRental,
    incrementPayment: m.incrementPayment,
    markAsReturned: m.markAsReturned,
    refresh: m.invalidate,
  }
}

/**
 * Locations paginées (keyset) pour les pages de liste. Recherche serveur séparée
 * (ilike client/équipement) quand `search` est renseigné. Le statut 'overdue' est
 * recalculé pour l'affichage (badge) sur les lignes chargées.
 */
export function useRentalsPaginated(
  params: { status: RentalListStatus; search: string },
  pageSize: number
) {
  const { pharmacy } = useProfile()
  const pharmacyId = pharmacy?.id ?? null
  const status = params.status
  const search = params.search.trim()
  const isSearching = search.length > 0

  const browse = useInfiniteQuery({
    queryKey: ['rentals', pharmacyId, 'paginated', status, pageSize] as const,
    enabled: Boolean(pharmacyId) && !isSearching,
    initialPageParam: null as KeysetCursor | null,
    queryFn: async ({ pageParam }) => {
      const result = await getRentalsPaginated(pharmacyId!, pageParam ?? undefined, pageSize, { status })
      if (result.error) throw new Error(result.error)
      return result.data ?? { items: [], nextCursor: null }
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  })

  const searchQuery = useQuery({
    queryKey: ['rentals', pharmacyId, 'search', status, search] as const,
    enabled: Boolean(pharmacyId) && isSearching,
    queryFn: async () => {
      const result = await searchRentals(pharmacyId!, search, 50, { status })
      if (result.error) throw new Error(result.error)
      return result.data ?? []
    },
  })

  const returnedCountQuery = useQuery({
    queryKey: ['rentals', pharmacyId, 'count', 'returned'] as const,
    enabled: Boolean(pharmacyId),
    queryFn: async () => {
      const result = await countRentalsByStatus(pharmacyId!, 'returned')
      if (result.error) throw new Error(result.error)
      return result.data ?? 0
    },
  })

  const rawItems = useMemo(
    () =>
      isSearching
        ? searchQuery.data ?? []
        : browse.data?.pages.flatMap((p) => p.items) ?? [],
    [isSearching, searchQuery.data, browse.data]
  )
  const rentals = useMemo(() => rawItems.map(computeRentalStatus), [rawItems])

  const m = useRentalMutations()

  return {
    rentals,
    loading: isSearching ? searchQuery.isLoading : browse.isLoading,
    isError: isSearching ? searchQuery.isError : browse.isError,
    error:
      (browse.error as Error | null)?.message ??
      (searchQuery.error as Error | null)?.message ??
      m.mutationError ??
      null,
    isSearching,
    hasNextPage: !isSearching && Boolean(browse.hasNextPage),
    fetchNextPage: () => {
      void browse.fetchNextPage()
    },
    fetchingNextPage: browse.isFetchingNextPage,
    returnedCount: returnedCountQuery.data ?? 0,
    createRental: m.createRental,
    updateRental: m.updateRental,
    deleteRental: m.deleteRental,
    incrementPayment: m.incrementPayment,
    markAsReturned: m.markAsReturned,
    refresh: m.invalidate,
  }
}
