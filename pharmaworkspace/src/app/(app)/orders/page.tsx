'use client'

import { Suspense, useCallback, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useOrders } from '@/features/orders'
import { useProfile } from '@/contexts/profile-context'
import { OrderTable } from '@/components/orders/order-table'
import { OrderDrawer } from '@/components/orders/order-drawer'
import { OrderForm } from '@/components/orders/order-form'
import { DetailDrawer } from '@/components/shared/detail-drawer'
import { LoadMoreButton } from '@/components/shared/load-more-button'
import { Input } from '@/components/ui/input'
import { Plus } from 'lucide-react'
import posthog from 'posthog-js'
import type { OrderWithDetails, NewOrder, NewOrderItem } from '@/types/index'

function OrdersContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const selectedId = searchParams.get('id')

  const { pharmacy, canWriteTasks } = useProfile()
  const {
    orders,
    loading,
    error,
    createOrder,
    updateOrder,
    deleteOrder,
    hasNextPage,
    fetchNextPage,
    fetchingNextPage,
  } = useOrders()
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [search, setSearch] = useState('')

  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase()
    return orders.filter((order) => {
      if (order.status === 'received') return false
      const supplier = (order.supplier?.name ?? '').toLowerCase()
      const notes = (order.notes ?? '').toLowerCase()
      const matchesSearch = !q || supplier.includes(q) || notes.includes(q)
      return matchesSearch
    })
  }, [orders, search])
  const completedOrdersCount = useMemo(
    () => orders.filter((order) => order.status === 'received').length,
    [orders]
  )

  const handleRowClick = useCallback(
    (order: OrderWithDetails) => {
      router.push(`/orders?id=${order.id}`, { scroll: false })
    },
    [router]
  )

  const handleDrawerClose = useCallback(() => {
    router.push('/orders', { scroll: false })
  }, [router])

  const handleFormSubmit = useCallback(
    async (
      payload: NewOrder,
      items: Omit<NewOrderItem, 'order_id' | 'pharmacy_id'>[]
    ) => {
      await createOrder(payload, items)
      posthog.capture('order_created', {
        item_count: items.length,
        status: payload.status,
      })
      setCreateDialogOpen(false)
    },
    [createOrder]
  )

  const openCompletedOrders = useCallback(() => {
    router.push('/orders/completed')
  }, [router])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Commandes</h1>
          <p className="text-sm text-muted-foreground">
            Gestion des commandes fournisseurs
          </p>
        </div>
        {canWriteTasks && (
          <button
            type="button"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white shadow-lg transition-transform active:scale-95"
            onClick={() => setCreateDialogOpen(true)}
            aria-label="Nouvelle commande"
          >
            <Plus className="h-6 w-6" />
          </button>
        )}
      </div>

      <div className="hidden items-center justify-between gap-2 lg:flex">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600">
          Commandes en cours
        </h2>
      </div>

      <div className="relative lg:w-[320px]">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher fournisseur ou notes…"
          className="h-11 w-full rounded-xl border-slate-200 bg-white pl-4 pr-10 shadow-sm focus:border-teal-500 focus:ring-teal-500"
        />
      </div>

      <div className="flex items-center justify-between gap-2 lg:hidden">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600">
          Commandes en cours
        </h2>
        <button
          type="button"
          onClick={openCompletedOrders}
          className="inline-flex items-center gap-1 text-xs font-medium"
        >
          <span className="text-slate-500">{completedOrdersCount} terminée(s)</span>
          <span className="text-teal-600 underline underline-offset-2">Afficher</span>
        </button>
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      <OrderTable
        orders={filteredOrders}
        loading={loading}
        onRowClick={handleRowClick}
      />

      <LoadMoreButton
        hasMore={hasNextPage}
        loading={fetchingNextPage}
        onLoadMore={() => void fetchNextPage()}
      />

      <OrderDrawer
        orderId={selectedId}
        open={!!selectedId}
        onClose={handleDrawerClose}
        onUpdate={updateOrder}
        onDelete={deleteOrder}
      />

      <DetailDrawer
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        title="Nouvelle commande"
        width="lg"
      >
        {pharmacy ? (
          <OrderForm
            pharmacyId={pharmacy.id}
            onSubmit={handleFormSubmit}
            onCancel={() => setCreateDialogOpen(false)}
          />
        ) : null}
      </DetailDrawer>

    </div>
  )
}

export default function OrdersPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Chargement…</p>}>
      <OrdersContent />
    </Suspense>
  )
}


// ============================================================================
// FILE: src/app/(app)/orders/suppliers/page.tsx
// ============================================================================
