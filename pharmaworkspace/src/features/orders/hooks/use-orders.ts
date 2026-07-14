'use client'

import { useMemo } from 'react'
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { useProfile } from '@/contexts/profile-context'
import { ordersService } from '@/features/orders/services/orders.service'
import type {
  NewOrder,
  NewOrderItem,
  NewSupplier,
  OrderStatus,
  OrderWithDetails,
  Supplier,
  UpdateOrder,
} from '@/types/index'

const PAGE_SIZE = 50

type UseOrdersOptions = {
  disablePagination?: boolean
}

export function useOrders(filters?: { status?: OrderStatus }, options?: UseOrdersOptions) {
  const { pharmacy } = useProfile()
  const queryClient = useQueryClient()
  const pharmacyId = pharmacy?.id ?? null
  const disablePagination = options?.disablePagination ?? false

  const serializedFilters = useMemo(
    () => JSON.stringify({ status: filters?.status ?? null }),
    [filters?.status]
  )

  const queryKey = useMemo(
    () => ['orders', pharmacyId, serializedFilters] as const,
    [pharmacyId, serializedFilters]
  )

  const legacyQuery = useQuery({
    queryKey: [...queryKey, 'all'] as const,
    enabled: Boolean(pharmacyId) && disablePagination,
    queryFn: async () => {
      const parsed = JSON.parse(serializedFilters) as { status: OrderStatus | null }
      const result = await ordersService.getOrders(pharmacyId!, {
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
      const parsed = JSON.parse(serializedFilters) as { status: OrderStatus | null }
      const result = await ordersService.getOrdersPaginated(
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
    await queryClient.invalidateQueries({ queryKey: ['orders', pharmacyId] })
  }

  const createOrderMutation = useMutation({
    mutationFn: async ({
      payload,
      items,
    }: {
      payload: NewOrder
      items: Omit<NewOrderItem, 'order_id' | 'pharmacy_id'>[]
    }) => {
      const result = await ordersService.createOrder(payload, items)
      if (result.error) throw new Error(result.error)
    },
    onSuccess: refresh,
  })

  const updateOrderMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: UpdateOrder }) => {
      const result = await ordersService.updateOrder(id, payload)
      if (result.error) throw new Error(result.error)
    },
    onSuccess: refresh,
  })

  const deleteOrderMutation = useMutation({
    mutationFn: async (id: string) => {
      const result = await ordersService.deleteOrder(id)
      if (result.error) throw new Error(result.error)
    },
    onSuccess: refresh,
  })

  const orders = (
    disablePagination
      ? (legacyQuery.data ?? [])
      : (paginatedQuery.data?.pages.flatMap((p) => p.items) ?? [])
  ) as OrderWithDetails[]

  const loading = disablePagination
    ? legacyQuery.isLoading || legacyQuery.isFetching
    : paginatedQuery.isLoading || paginatedQuery.isFetching

  return {
    orders,
    loading,
    error:
      ((disablePagination ? legacyQuery.error : paginatedQuery.error) as Error | null)
        ?.message ??
      (createOrderMutation.error as Error | null)?.message ??
      (updateOrderMutation.error as Error | null)?.message ??
      (deleteOrderMutation.error as Error | null)?.message ??
      null,
    hasNextPage: disablePagination ? false : Boolean(paginatedQuery.hasNextPage),
    fetchNextPage: async () => {
      if (!disablePagination) await paginatedQuery.fetchNextPage()
    },
    fetchingNextPage: disablePagination ? false : paginatedQuery.isFetchingNextPage,
    createOrder: async (
      payload: NewOrder,
      items: Omit<NewOrderItem, 'order_id' | 'pharmacy_id'>[]
    ) => createOrderMutation.mutateAsync({ payload, items }),
    updateOrder: async (id: string, payload: UpdateOrder) =>
      updateOrderMutation.mutateAsync({ id, payload }),
    deleteOrder: async (id: string) => deleteOrderMutation.mutateAsync(id),
    refresh,
  }
}

export function useSuppliers() {
  const { pharmacy } = useProfile()
  const queryClient = useQueryClient()
  const pharmacyId = pharmacy?.id ?? null

  const suppliersQuery = useQuery({
    queryKey: ['suppliers', pharmacyId],
    enabled: Boolean(pharmacyId),
    queryFn: async () => {
      const result = await ordersService.getSuppliers(pharmacyId!)
      if (result.error) throw new Error(result.error)
      return result.data ?? []
    },
  })

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['suppliers', pharmacyId] })
  }

  const createSupplierMutation = useMutation({
    mutationFn: async (payload: NewSupplier) => {
      const normalizedPayload: Omit<Supplier, 'id' | 'created_at'> = {
        pharmacy_id: payload.pharmacy_id,
        name: payload.name,
        contact_name: payload.contact_name ?? null,
        phone: payload.phone ?? null,
        email: payload.email ?? null,
        notes: payload.notes ?? null,
      }
      const result = await ordersService.createSupplier(normalizedPayload)
      if (result.error) throw new Error(result.error)
      return result.data
    },
    onSuccess: refresh,
  })

  const updateSupplierMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<NewSupplier> }) => {
      const result = await ordersService.updateSupplier(id, payload)
      if (result.error) throw new Error(result.error)
    },
    onSuccess: refresh,
  })

  const deleteSupplierMutation = useMutation({
    mutationFn: async (id: string) => {
      const result = await ordersService.deleteSupplier(id)
      if (result.error) throw new Error(result.error)
    },
    onSuccess: refresh,
  })

  return {
    suppliers: (suppliersQuery.data ?? []) as Supplier[],
    loading: suppliersQuery.isLoading || suppliersQuery.isFetching,
    error:
      (suppliersQuery.error as Error | null)?.message ??
      (createSupplierMutation.error as Error | null)?.message ??
      (updateSupplierMutation.error as Error | null)?.message ??
      (deleteSupplierMutation.error as Error | null)?.message ??
      null,
    createSupplier: async (payload: NewSupplier) =>
      createSupplierMutation.mutateAsync(payload),
    updateSupplier: async (id: string, payload: Partial<NewSupplier>) =>
      updateSupplierMutation.mutateAsync({ id, payload }),
    deleteSupplier: async (id: string) => deleteSupplierMutation.mutateAsync(id),
    refresh,
  }
}
