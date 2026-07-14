'use client'

import { Suspense, useCallback, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useRentalsPaginated } from '@/hooks/use-rentals'
import { usePageSize } from '@/hooks/use-page-size'
import { useProfile } from '@/contexts/profile-context'
import { RentalTable } from '@/components/rentals/rental-table'
import { RentalDrawer } from '@/components/rentals/rental-drawer'
import { RentalForm } from '@/components/rentals/rental-form'
import { InfiniteLoader } from '@/components/shared/infinite-loader'
import { DetailDrawer } from '@/components/shared/detail-drawer'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { RENTAL_STATUS_LABELS } from '@/config/constants'
import { Plus } from 'lucide-react'
import posthog from 'posthog-js'
import { toast } from 'sonner'
import { uploadRentalPhoto } from '@/features/rentals/services/rental-attachment.service'
import type { Rental, RentalStatus, NewRental } from '@/types/index'

function RentalsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const selectedId = searchParams.get('id')
  const highlightId = searchParams.get('highlight')

  useEffect(() => {
    if (!highlightId) return
    const t = window.setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())
      params.delete('highlight')
      const q = params.toString()
      router.replace(q ? `/rentals?${q}` : '/rentals', { scroll: false })
    }, 2000)
    return () => window.clearTimeout(t)
  }, [highlightId, router, searchParams])

  const { pharmacy, canWriteTasks } = useProfile()
  const pageSize = usePageSize()
  const [statusFilter, setStatusFilter] = useState<RentalStatus | 'all'>('all')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [createDialogOpen, setCreateDialogOpen] = useState(false)

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(search.trim()), 300)
    return () => window.clearTimeout(t)
  }, [search])

  const {
    rentals,
    loading,
    error,
    returnedCount,
    hasNextPage,
    fetchNextPage,
    fetchingNextPage,
    isError,
    createRental,
    updateRental,
    deleteRental,
    incrementPayment,
    markAsReturned,
  } = useRentalsPaginated({ status: statusFilter, search: debouncedSearch }, pageSize)

  const handleRowClick = useCallback(
    (rental: Rental) => {
      router.push(`/rentals?id=${rental.id}`, { scroll: false })
    },
    [router]
  )

  const handleDrawerClose = useCallback(() => {
    router.push('/rentals', { scroll: false })
  }, [router])

  const handleCreate = useCallback(
    async (payload: NewRental, files?: File[]) => {
      const created = await createRental(payload)
      posthog.capture('rental_created', {
        billing_type: payload.billing_type,
        equipment: payload.equipment,
      })
      // Pièces jointes ajoutées dès la création : on uploade une fois la
      // location créée (on a alors son id) avant de fermer le drawer.
      if (created && files?.length && pharmacy) {
        for (const file of files) {
          const res = await uploadRentalPhoto({
            pharmacyId: pharmacy.id,
            rentalId: created.id,
            file,
            uploadedBy: payload.created_by ?? null,
          })
          if (res.error) toast.error(`${file.name} : ${res.error}`)
        }
      }
      setCreateDialogOpen(false)
    },
    [createRental, pharmacy]
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Locations</h1>
          <p className="text-sm text-muted-foreground">
            Suivi du matériel médical en location
          </p>
        </div>
        {canWriteTasks && (
          <button
            type="button"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white shadow-lg transition-transform active:scale-95"
            onClick={() => setCreateDialogOpen(true)}
            aria-label="Nouvelle location"
          >
            <Plus className="h-6 w-6" />
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4">
        <div className="relative">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher client ou équipement…"
            className="h-11 w-full rounded-xl border-slate-200 bg-white pl-4 pr-10 shadow-sm focus:border-teal-500 focus:ring-teal-500"
          />
        </div>

        <div className="-mx-1 overflow-x-auto px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex w-max gap-2 pb-1">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={cn(
                'rounded-full border px-3 py-2 text-xs font-medium transition-all',
                statusFilter === 'all'
                  ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                  : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50'
              )}
            >
              Tous les statuts
            </button>
            {(
              Object.entries(RENTAL_STATUS_LABELS) as [RentalStatus, string][]
            )
              .filter(([value]) => value !== 'returned')
              .map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setStatusFilter(value)}
                  className={cn(
                    'rounded-full border px-3 py-2 text-xs font-medium transition-all',
                    statusFilter === value
                      ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                      : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50'
                  )}
                >
                  {label}
                </button>
              ))}
          </div>
        </div>
      </div>

      {statusFilter === 'all' && returnedCount > 0 && (
        <div className="flex items-center justify-between gap-2 lg:hidden">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600">
            Locations en cours
          </h2>
          <button
            type="button"
            onClick={() => router.push('/rentals/completed')}
            className="inline-flex items-center gap-1 text-xs font-medium"
          >
            <span className="text-slate-500">{returnedCount} retournée(s)</span>
            <span className="text-teal-600 underline underline-offset-2">Afficher</span>
          </button>
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <RentalTable
        rentals={rentals}
        loading={loading}
        onRowClick={handleRowClick}
        onIncrementPayment={incrementPayment}
        onMarkAsReturned={(r) => markAsReturned(r.id)}
        highlightRowId={highlightId}
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
        onUpdate={updateRental}
        onDelete={deleteRental}
      />

      <DetailDrawer
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        title="Nouvelle location"
        width="lg"
      >
        {pharmacy ? (
          <RentalForm
            pharmacyId={pharmacy.id}
            onSubmit={(payload, files) => handleCreate(payload as NewRental, files)}
            onCancel={() => setCreateDialogOpen(false)}
          />
        ) : null}
      </DetailDrawer>

    </div>
  )
}

export default function RentalsPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Chargement…</p>}>
      <RentalsContent />
    </Suspense>
  )
}
