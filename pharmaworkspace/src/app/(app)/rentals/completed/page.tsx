'use client'

import { Suspense, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'

import { RentalTable } from '@/components/rentals/rental-table'
import { RentalDrawer } from '@/components/rentals/rental-drawer'
import { InfiniteLoader } from '@/components/shared/infinite-loader'
import { useRentalsPaginated } from '@/hooks/use-rentals'
import { usePageSize } from '@/hooks/use-page-size'
import type { Rental } from '@/types/index'

function CompletedRentalsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pageSize = usePageSize()
  const {
    rentals: completedRentals,
    loading,
    isError,
    hasNextPage,
    fetchNextPage,
    fetchingNextPage,
    refresh,
    updateRental,
    deleteRental,
    incrementPayment,
    markAsReturned,
  } = useRentalsPaginated({ status: 'returned', search: '' }, pageSize)

  const selectedId = searchParams.get('id')

  const handleRowClick = useCallback(
    (rental: Rental) => {
      router.push(`/rentals/completed?id=${rental.id}`, { scroll: false })
    },
    [router]
  )

  const handleDrawerClose = useCallback(() => {
    router.push('/rentals/completed', { scroll: false })
  }, [router])

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={() => router.push('/rentals')}
        className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
      >
        <ChevronLeft className="h-4 w-4" />
        Retour
      </button>

      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Locations retournées</p>
        </div>
      </div>

      <RentalTable
        rentals={completedRentals}
        loading={loading}
        onRowClick={handleRowClick}
        onIncrementPayment={incrementPayment}
        onMarkAsReturned={(r) => markAsReturned(r.id)}
        highlightRowId={selectedId}
      />

      <InfiniteLoader
        hasNextPage={hasNextPage}
        isLoading={fetchingNextPage}
        isError={isError}
        onLoadMore={fetchNextPage}
      />

      <RentalDrawer
        rentalId={selectedId}
        open={!!selectedId}
        onClose={handleDrawerClose}
        onUpdate={async (id, payload) => {
          await updateRental(id, payload)
          refresh()
        }}
        onDelete={async (id) => {
          await deleteRental(id)
          refresh()
        }}
      />
    </div>
  )
}

export default function CompletedRentalsPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Chargement…</p>}>
      <CompletedRentalsContent />
    </Suspense>
  )
}
