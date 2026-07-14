'use client'

import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { DetailDrawer } from '@/components/shared/detail-drawer'
import { StatusBadge } from '@/components/shared/status-badge'
import { RentalForm } from '@/components/rentals/rental-form'
import { RentalPhotoGallery } from '@/components/rentals/rental-photo-gallery'
import { RentalPhotoUpload } from '@/components/rentals/rental-photo-upload'
import { Button } from '@/components/ui/button'
import { useProfile } from '@/contexts/profile-context'
import { getRentalById } from '@/lib/queries/rentals'
import { AlertTriangle, CheckCircle2, Plus, Minus } from 'lucide-react'
import { DrawerActions } from '@/components/shared/drawer-actions'
import type { Rental, RentalStatus, UpdateRental } from '@/types/index'
import { cn } from '@/lib/utils'

function getUnitLabel(type: Rental['billing_type']) {
  // 'daily' n'est plus exposé dans le user flow ; fallback sur 'sem.' pour les
  // rentals historiques en DB qui auraient encore ce billing_type.
  if (type === 'monthly') return 'mo.'
  return 'sem.'
}

type RentalDrawerProps = {
  rentalId: string | null
  open: boolean
  onClose: () => void
  onUpdate: (id: string, payload: UpdateRental) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

function computeDisplayStatus(rental: Rental): RentalStatus {
  if (
    rental.status === 'active' &&
    rental.expected_return &&
    new Date(rental.expected_return) < new Date(new Date().toDateString())
  ) {
    return 'overdue'
  }
  return rental.status as RentalStatus
}

function computeTotalDue(rental: Rental): number | null {
  if (!rental.returned_at || rental.daily_rate == null) return null
  const started = new Date(rental.started_at).getTime()
  const returned = new Date(rental.returned_at).getTime()
  if (Number.isNaN(started) || Number.isNaN(returned)) return null
  const msPerDay = 24 * 60 * 60 * 1000
  const days = Math.max(1, Math.ceil((returned - started) / msPerDay))
  return days * rental.daily_rate
}

export function RentalDrawer({
  rentalId,
  open,
  onClose,
  onUpdate,
  onDelete,
}: RentalDrawerProps) {
  const { pharmacy, isAdmin, canWriteTasks } = useProfile()
  const queryClient = useQueryClient()
  const [rental, setRental] = useState<Rental | null>(null)
  const [loading, setLoading] = useState(false)
  const [editing, setEditing] = useState(false)

  useEffect(() => {
    if (!rentalId || !open) {
      const timeoutId = setTimeout(() => {
        setRental(null)
        setEditing(false)
      }, 0)
      return () => clearTimeout(timeoutId)
    }
    const timeoutId = setTimeout(() => {
      setLoading(true)
      getRentalById(rentalId).then((result) => {
        setRental(result.data ?? null)
        setLoading(false)
      })
    }, 0)
    return () => clearTimeout(timeoutId)
  }, [rentalId, open])

  const displayStatus = rental ? computeDisplayStatus(rental) : null
  const isOverdue = displayStatus === 'overdue'
  const totalDue = rental ? computeTotalDue(rental) : null
  const expectedUnits = rental?.total_units ?? 1

  const handleDelete = async () => {
    if (!rentalId) return
    await onDelete(rentalId)
    onClose()
  }

  const handleFormSubmit = async (payload: UpdateRental) => {
    if (!rentalId) return
    await onUpdate(rentalId, payload)
    setEditing(false)
    const result = await getRentalById(rentalId)
    setRental(result.data ?? null)
  }

  const actions = canWriteTasks ? (
    <DrawerActions
      canEdit
      canDelete={isAdmin}
      onEdit={() => setEditing(true)}
      onDelete={handleDelete}
    />
  ) : undefined

  return (
    <DetailDrawer
      open={open}
      onClose={onClose}
      title={rental ? rental.equipment : 'Chargement…'}
      actions={editing ? undefined : actions}
      width="lg"
    >
      {loading && (
        <p className="text-sm text-muted-foreground py-8 text-center">Chargement…</p>
      )}

      {!loading && !rental && (
        <p className="text-sm text-muted-foreground py-8 text-center">Location introuvable.</p>
      )}

      {!loading && rental && !editing && (
        <div className="space-y-6">
          {canWriteTasks && (displayStatus === 'active' || isOverdue) && (
            <div className="flex flex-col gap-3 pb-2 border-b border-slate-100">
              <button
                type="button"
                disabled={(rental.paid_units ?? 0) < expectedUnits}
                onClick={() => {
                  onUpdate(rental.id, {
                    status: 'returned',
                    returned_at: new Date().toISOString().split('T')[0],
                  })
                }}
                className={cn(
                  "flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors",
                  (rental.paid_units ?? 0) >= expectedUnits
                    ? "bg-emerald-600 text-white hover:bg-emerald-500"
                    : "bg-slate-100 text-slate-400 cursor-not-allowed"
                )}
                title={(rental.paid_units ?? 0) < expectedUnits ? `Tous les paiements dus (${expectedUnits}) doivent être effectués avant le retour` : ""}
              >
                <CheckCircle2 className="h-4 w-4" />
                Marquer comme retournée
              </button>

              <div className="flex justify-center mt-2">
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    className="h-10 w-10 rounded-full border-red-200 bg-white text-red-600 hover:bg-red-50 hover:text-red-700 shadow-sm"
                    onClick={() => {
                      const newValue = Math.max(0, (rental.paid_units ?? 0) - 1)
                      setRental({ ...rental, paid_units: newValue })
                      void onUpdate(rental.id, { paid_units: newValue })
                    }}
                    disabled={(rental.paid_units ?? 0) <= 0}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>

                  <div className="flex items-center justify-center px-5 h-10 border-2 border-slate-200 rounded-xl bg-white min-w-[100px] shadow-sm">
                    <span className="text-lg font-bold text-slate-900 tabular-nums">
                      {rental.paid_units ?? 0} <span className="text-slate-400 font-normal mx-1">/</span> {expectedUnits} <span className="text-sm font-normal text-slate-500 ml-1">{getUnitLabel(rental.billing_type)}</span>
                    </span>
                  </div>

                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    className="h-10 w-10 rounded-full border-blue-300 bg-white text-blue-600 hover:bg-blue-50 hover:text-blue-700 shadow-sm"
                    onClick={() => {
                      const newValue = Math.min(expectedUnits, (rental.paid_units ?? 0) + 1)
                      setRental({ ...rental, paid_units: newValue })
                      void onUpdate(rental.id, { paid_units: newValue })
                    }}
                    disabled={(rental.paid_units ?? 0) >= expectedUnits}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {isOverdue && (
            <div className="flex items-center gap-2 rounded-md border border-orange-300 bg-orange-50 p-3 text-sm text-orange-800">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>
                Retour en retard, prévu le{' '}
                {new Date(rental.expected_return).toLocaleDateString('fr-FR')}
              </span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Équipement</p>
              <p className="text-sm font-medium">{rental.equipment}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Statut</p>
              <div className="mt-1">
                <StatusBadge status={displayStatus!} />
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Client</p>
              <p className="text-sm">{rental.client_name || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Téléphone</p>
              <p className="text-sm">{rental.client_phone || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Retour prévu</p>
              <p className="text-sm">
                {rental.expected_return
                  ? new Date(rental.expected_return).toLocaleDateString('fr-FR')
                  : '-'}
              </p>
            </div>
            {rental.returned_at && (
              <div>
                <p className="text-xs text-muted-foreground">Retourné le</p>
                <p className="text-sm">
                  {new Date(rental.returned_at).toLocaleDateString('fr-FR')}
                </p>
              </div>
            )}
            {rental.deposit && (
              <div>
                <p className="text-xs text-muted-foreground">Caution</p>
                <p className="text-sm">{rental.deposit} €</p>
              </div>
            )}
            <div>
              <p className="text-xs text-muted-foreground">Facturation hebdo (est.)</p>
              <p className="text-sm">
                {rental.daily_rate != null ? `${(rental.daily_rate * 7).toFixed(2)} €` : '-'}
              </p>
            </div>
            {totalDue != null && (
              <div>
                <p className="text-xs text-muted-foreground">Montant total dû</p>
                <p className="text-sm font-medium">{totalDue.toFixed(2)} €</p>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-slate-900">Photos</h3>
            <RentalPhotoGallery rentalId={rental.id} canDelete={false} />
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
            <h3 className="text-sm font-semibold text-slate-900">Notes</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600 whitespace-pre-wrap">
              {rental.notes || 'Aucune note'}
            </p>
          </div>

        </div>
      )}

      {!loading && rental && editing && pharmacy && (
        <RentalForm
          pharmacyId={pharmacy.id}
          defaultValues={rental}
          onSubmit={(payload) => handleFormSubmit(payload as UpdateRental)}
          onCancel={() => setEditing(false)}
          photosSlot={
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
              <h3 className="text-sm font-semibold text-slate-900">Photos</h3>
              <RentalPhotoGallery rentalId={rental.id} canDelete={canWriteTasks} />
              {canWriteTasks && (
                <RentalPhotoUpload
                  pharmacyId={pharmacy.id}
                  rentalId={rental.id}
                  onUploaded={() => {
                    void queryClient.invalidateQueries({
                      queryKey: ['rental-attachments', rental.id],
                    })
                  }}
                />
              )}
            </div>
          }
        />
      )}
    </DetailDrawer>
  )
}