'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useRouter, useSearchParams } from 'next/navigation'
import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import { DataTable } from '@/components/shared/data-table'
import { KpiCard } from '@/components/shared/kpi-card'
import { DetailDrawer } from '@/components/shared/detail-drawer'
import { StatusBadge } from '@/components/shared/status-badge'
import { ShortageDrawer } from '@/components/shortages/shortage-drawer'
import { ShortageForm } from '@/components/shortages/shortage-form'
import { BarcodeScanner } from '@/components/shared/barcode-scanner'
import { LoadMoreButton } from '@/components/shared/load-more-button'
import { SearchInput } from '@/components/shared/search-input'
import { useProfile } from '@/contexts/profile-context'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { shortagesService, useShortages } from '@/features/shortages'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { SHORTAGE_STATUS_LABELS } from '@/config/constants'
import type { Shortage, ShortageStatus, NewShortage } from '@/types/index'
import { toast } from 'sonner'
import { captureFirstMilestone } from '@/lib/analytics/capture-first'
import { FIRST_MILESTONE_EVENTS } from '@/lib/analytics/events'
import posthog from 'posthog-js'

interface ShortageTableProps {
  isResolvedView?: boolean
}

export function ShortageTable({ isResolvedView = false }: ShortageTableProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const highlightId = searchParams.get('highlight')

  const [statusFilter, setStatusFilter] = useState<ShortageStatus | 'all'>(
    isResolvedView ? 'resolved' : 'all'
  )
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const { pharmacy } = useProfile()
  const [resolveShortageId, setResolveShortageId] = useState('')
  const [resolveCip13, setResolveCip13] = useState('')
  const [resolveDrugName, setResolveDrugName] = useState('')
  const [scannerOpen, setScannerOpen] = useState(false)
  const [resolving, setResolving] = useState(false)
  // Id de la rupture qu'on vient de lever. Sert à distinguer "l'item a disparu
  // de la liste active parce que NOUS venons de le résoudre" (silencieux) de
  // "lien vers une rupture qui n'existe pas / déjà levée" (feedback utile).
  // Sans cette distinction, l'effet ci-dessous re-tirait un toast d'erreur en
  // plus du toast de succès → les notifications en double constatées.
  const justResolvedIdRef = useRef<string | null>(null)

  const filters = useMemo(
    () =>
      statusFilter !== 'all' ? { status: statusFilter } : undefined,
    [statusFilter]
  )

  const {
    shortages,
    loading,
    createShortage,
    updateShortage,
    deleteShortage,
    refresh,
    hasNextPage,
    fetchNextPage,
    fetchingNextPage,
  } = useShortages(filters)

  const searchTerm = debouncedSearch.trim()
  const isSearchActive = Boolean(searchTerm && pharmacy?.id)
  const searchStatusFilter =
    statusFilter !== 'all' ? { status: statusFilter } : undefined

  const searchQuery = useQuery({
    queryKey: [
      'shortages-search',
      pharmacy?.id,
      searchTerm,
      statusFilter,
    ] as const,
    enabled: isSearchActive,
    queryFn: async () => {
      const result = await shortagesService.searchShortages(
        pharmacy!.id,
        searchTerm,
        50,
        searchStatusFilter
      )
      if (result.error) throw new Error(result.error)
      return result.data ?? []
    },
  })

  const listSource = isSearchActive ? (searchQuery.data ?? []) : shortages
  const searchLoading = searchQuery.isFetching

  useEffect(() => {
    if (!highlightId) return
    const t = window.setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())
      params.delete('highlight')
      const q = params.toString()
      router.replace(q ? `/shortages?${q}` : '/shortages', { scroll: false })
    }, 2000)
    return () => window.clearTimeout(t)
  }, [highlightId, router, searchParams])


  const filteredShortages = listSource
  const openCount = shortages.filter((s) => s.status === 'open').length
  const substituteCount = shortages.filter((s) => s.status === 'substitute_found').length

  const selectedId = searchParams.get('id')
  const resolveFromQuery = searchParams.get('shortageId')
  const drawerOpen = Boolean(selectedId)
  const createDialogOpen = searchParams.get('create') === '1'
  const resolveDialogOpen = searchParams.get('resolve') === '1'
  const activeShortages = useMemo(
    () => shortages.filter((shortage) => shortage.status !== 'resolved'),
    [shortages]
  )
  const selectedResolveShortage = useMemo(
    () => activeShortages.find((shortage) => shortage.id === resolveShortageId) ?? null,
    [activeShortages, resolveShortageId]
  )

  const openDrawer = useCallback(
    (row: Shortage) => {
      router.push(`/shortages?id=${row.id}`)
    },
    [router]
  )

  const closeDrawer = useCallback(() => {
    router.push('/shortages')
  }, [router])

  const closeCreateDialog = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('create')
    const query = params.toString()
    router.push(query ? `/shortages?${query}` : '/shortages')
  }, [router, searchParams])

  const closeResolveDialog = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('resolve')
    params.delete('shortageId')
    const query = params.toString()
    router.push(query ? `/shortages?${query}` : '/shortages')
    setResolveShortageId('')
    setResolveCip13('')
    setResolveDrugName('')
  }, [router, searchParams])

  const emitShortageResolved = useCallback(
    (props: { shortage_id: string; product_name: string; method: string }) => {
      posthog.capture('shortage_resolved', props)
      if (pharmacy?.id) {
        captureFirstMilestone(
          FIRST_MILESTONE_EVENTS.first_shortage_resolved,
          pharmacy.id,
          { method: props.method }
        )
      }
    },
    [pharmacy?.id]
  )

  const handleCreate = useCallback(
    async (payload: NewShortage) => {
      await createShortage(payload)
      posthog.capture('shortage_reported', {
        product_name: payload.product_name,
        linked_to_ansm: Boolean(payload.drug_shortage_id),
      })
      closeCreateDialog()
    },
    [createShortage, closeCreateDialog]
  )

  const handleResolveShortage = useCallback(async () => {
    if (!resolveShortageId) {
      toast.warning('Sélectionnez une rupture à lever.')
      return
    }
    const current = activeShortages.find((item) => item.id === resolveShortageId)
    if (!current) {
      toast.error('Rupture introuvable.')
      return
    }
    const substitute = resolveDrugName.trim()
    if (!substitute) {
      toast.warning('Indiquez le médicament de substitution.')
      return
    }
    const cip = resolveCip13.length === 13 ? resolveCip13 : ''
    setResolving(true)
    try {
      const userId = await shortagesService.getCurrentUserId()
      const evidence = `Substitut : ${substitute}${cip ? ` (CIP ${cip})` : ''}`
      const nextNotes = [current.notes, evidence].filter(Boolean).join('\n')
      await updateShortage(resolveShortageId, {
        status: 'resolved',
        resolved_by: userId,
        resolved_at: new Date().toISOString(),
        resolution_cip13: cip || null,
        notes: nextNotes || null,
      })
      emitShortageResolved({
        shortage_id: resolveShortageId,
        product_name: current.product_name,
        method: 'manual',
      })
      justResolvedIdRef.current = resolveShortageId
      toast.success('Rupture levée avec succès.')
      closeResolveDialog()
    } finally {
      setResolving(false)
    }
  }, [
    resolveShortageId,
    resolveCip13,
    resolveDrugName,
    activeShortages,
    updateShortage,
    closeResolveDialog,
    emitShortageResolved,
  ])

  useEffect(() => {
    if (!resolveDialogOpen) return
    if (resolving) return
    if (!resolveFromQuery) {
      closeResolveDialog()
      return
    }
    const match = activeShortages.find((item) => item.id === resolveFromQuery)
    if (!match) {
      // Lien direct vers une rupture inexistante ou déjà levée par un collègue :
      // on informe. Mais on reste muet si c'est notre propre résolution qui
      // vient de la retirer de la liste active (sinon double notification).
      if (resolveFromQuery !== justResolvedIdRef.current) {
        toast.error('Cette rupture est introuvable ou a déjà été levée.')
      }
      closeResolveDialog()
      return
    }
    setResolveShortageId(match.id)
  }, [resolveDialogOpen, resolveFromQuery, activeShortages, closeResolveDialog, resolving])

  const columns = useMemo(
    () => [
      {
        key: 'product_name' as const,
        header: 'Produit',
        sortable: true,
        render: (_value: unknown, row: Shortage) => (
          <span className="font-medium">{row.product_name}</span>
        ),
      },
      {
        key: 'status' as const,
        header: 'Statut',
        sortable: true,
        render: (value: unknown) => (
          <StatusBadge status={value as ShortageStatus} />
        ),
      },
      {
        key: 'created_at' as const,
        header: 'Créée le',
        sortable: true,
        render: (value: unknown) =>
          new Date(String(value)).toLocaleDateString('fr-FR'),
      },
      {
        key: 'actions' as const,
        header: '',
        render: (_value: unknown, row: Shortage) => {
          const canResolve = row.status !== 'resolved'
          if (!canResolve) return null
          return (
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-600"
              onClick={(event) => {
                event.stopPropagation()
                router.push(`/shortages?resolve=1&shortageId=${row.id}`)
              }}
              aria-label={`Lever la rupture pour ${row.product_name}`}
            >
              <CheckCircle2 className="h-3.5 w-3.5 text-slate-400" />
              Lever
            </button>
          )
        },
      },
    ],
    [router]
  )

  return (
    <div className="space-y-4 pb-24 md:space-y-6 lg:pb-0">
      <div className="grid grid-cols-2 gap-3">
        <KpiCard
          label="Ruptures ouvertes"
          value={openCount}
          icon={AlertTriangle}
          tone="red"
          subtitle="Sans alternative à ce jour"
        />
        <KpiCard
          label="Substitut trouvé"
          value={substituteCount}
          icon={CheckCircle2}
          tone="green"
          subtitle="En attente de levée"
        />
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex flex-wrap gap-3">
          <SearchInput
            value={search}
            onValueChange={setSearch}
            onDebouncedChange={setDebouncedSearch}
            placeholder="Rechercher produit, notes…"
            className="min-w-0 w-full sm:w-[320px]"
          />
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as ShortageStatus | 'all')}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Tous les statuts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              {Object.entries(SHORTAGE_STATUS_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-3xl border border-slate-200/70 bg-white p-2 shadow-sm">
        <DataTable
          data={filteredShortages}
          columns={columns}
          loading={loading || searchLoading}
          onRowClick={openDrawer}
          emptyMessage="Bonne nouvelle, aucune rupture en cours."
          highlightRowId={highlightId}
        />
      </div>
      {!isSearchActive ? (
        <LoadMoreButton
          hasMore={hasNextPage}
          loading={fetchingNextPage}
          onLoadMore={() => void fetchNextPage()}
        />
      ) : null}

      {/* Drawer de détail */}
      <ShortageDrawer
        shortageId={selectedId}
        open={drawerOpen}
        onClose={closeDrawer}
        onUpdate={async (id, payload) => {
          await updateShortage(id, payload)
          refresh()
        }}
        onDelete={async (id) => {
          await deleteShortage(id)
          refresh()
        }}
        onResolve={(id) => {
          router.push(`/shortages?resolve=1&shortageId=${id}`)
        }}
      />

      <DetailDrawer
        open={createDialogOpen}
        onClose={closeCreateDialog}
        title="Signaler une rupture"
        width="lg"
      >
        <ShortageForm
          onSubmit={async (payload) => {
            await handleCreate(payload as NewShortage)
          }}
          onCancel={closeCreateDialog}
        />
      </DetailDrawer>


      <Dialog
        open={resolveDialogOpen}
        onOpenChange={(open) => {
          if (!open) closeResolveDialog()
        }}
      >
        <DialogContent aria-describedby={undefined} className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Lever une rupture</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-700">Rupture à lever</p>
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                {selectedResolveShortage?.product_name ?? 'Rupture sélectionnée'}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-700">Médicament de substitution *</p>
              <Input
                value={resolveDrugName}
                onChange={(e) => setResolveDrugName(e.target.value)}
                placeholder="Nom du médicament de remplacement"
              />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-700">CIP13 (facultatif)</p>
              <div className="flex gap-2">
                <Input
                  value={resolveCip13}
                  onChange={(e) =>
                    setResolveCip13(e.target.value.replace(/\D/g, '').slice(0, 13))
                  }
                  placeholder="13 chiffres"
                  inputMode="numeric"
                />
                <Button type="button" variant="outline" onClick={() => setScannerOpen(true)}>
                  Scanner
                </Button>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={closeResolveDialog} disabled={resolving}>
                Annuler
              </Button>
              <Button onClick={() => void handleResolveShortage()} disabled={resolving}>
                {resolving ? 'Validation…' : 'Valider la levée'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={scannerOpen} onOpenChange={setScannerOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Scanner un code CIP13</DialogTitle>
          </DialogHeader>
          <BarcodeScanner
            onDetected={(code) => {
              setScannerOpen(false)
              setResolveCip13(code.replace(/\D/g, '').slice(0, 13))
            }}
            onClose={() => setScannerOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

