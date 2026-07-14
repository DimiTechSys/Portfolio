'use client'

import { Suspense, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'

import { LoadMoreButton } from '@/components/shared/load-more-button'
import { useOrders } from '@/features/orders'
import { OrderTable } from '@/components/orders/order-table'
import { OrderDrawer } from '@/components/orders/order-drawer'
import type { OrderWithDetails } from '@/types/index'

function CompletedOrdersContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const selectedId = searchParams.get('id')

  const {
    orders,
    loading,
    updateOrder,
    deleteOrder,
    hasNextPage,
    fetchNextPage,
    fetchingNextPage,
  } = useOrders({ status: 'received' })

  const handleRowClick = useCallback(
    (order: OrderWithDetails) => {
      router.push(`/orders/completed?id=${order.id}`, { scroll: false })
    },
    [router]
  )

  const handleDrawerClose = useCallback(() => {
    router.push('/orders/completed', { scroll: false })
  }, [router])

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={() => router.push('/orders')}
        className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
      >
        <ChevronLeft className="h-4 w-4" />
        Retour
      </button>

      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Commandes reçues</p>
        </div>
      </div>

      <OrderTable
        orders={orders}
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
    </div>
  )
}

export default function CompletedOrdersPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Chargement…</p>}>
      <CompletedOrdersContent />
    </Suspense>
  )
}
