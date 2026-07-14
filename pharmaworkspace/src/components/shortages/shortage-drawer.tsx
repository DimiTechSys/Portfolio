'use client'

import { useCallback, useEffect, useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { DetailDrawer } from '@/components/shared/detail-drawer'
import { DrawerActions } from '@/components/shared/drawer-actions'
import { StatusBadge } from '@/components/shared/status-badge'
import { ShortageForm } from '@/components/shortages/shortage-form'
import { useProfile } from '@/contexts/profile-context'
import { shortagesService } from '@/features/shortages'
import type { Shortage, UpdateShortage } from '@/types/index'

type ShortageWithResolution = Shortage & {
  resolved_at?: string | null
  resolution_cip13?: string | null
}

type ShortageDrawerProps = {
  shortageId: string | null
  open: boolean
  onClose: () => void
  onUpdate: (id: string, payload: UpdateShortage) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onResolve: (id: string) => void
}

export function ShortageDrawer({
  shortageId,
  open,
  onClose,
  onUpdate,
  onDelete,
  onResolve,
}: ShortageDrawerProps) {
  const { isAdmin, canWrite } = useProfile()
  const [shortage, setShortage] = useState<Shortage | null>(null)
  const [loading, setLoading] = useState(false)
  const [editing, setEditing] = useState(false)

  const fetchDetail = useCallback(async () => {
    if (!shortageId) return
    setLoading(true)
    const result = await shortagesService.getShortageById(shortageId)
    if (result.data) {
      setShortage(result.data)
    }
    setLoading(false)
  }, [shortageId])

  useEffect(() => {
    if (open && shortageId) {
      const timeoutId = setTimeout(() => {
        setEditing(false)
        void fetchDetail()
      }, 0)
      return () => clearTimeout(timeoutId)
    }
  }, [open, shortageId, fetchDetail])

  const handleUpdate = useCallback(
    async (payload: UpdateShortage) => {
      if (!shortageId) return
      await onUpdate(shortageId, payload)
      setEditing(false)
      await fetchDetail()
    },
    [shortageId, onUpdate, fetchDetail]
  )

  const handleDelete = useCallback(async () => {
    if (!shortageId) return
    if (!window.confirm('Supprimer cette rupture ?')) return
    await onDelete(shortageId)
    onClose()
  }, [shortageId, onDelete, onClose])

  const actions = (
    <DrawerActions
      canEdit={canWrite}
      canDelete={isAdmin}
      onEdit={() => setEditing(true)}
      onDelete={handleDelete}
    />
  )

  const canResolve = Boolean(
    canWrite && shortage && shortage.status !== 'resolved' && !editing
  )

  return (
    <DetailDrawer
      open={open}
      onClose={onClose}
      title={
        shortage
          ? `Rupture : ${shortage.product_name}`
          : 'Rupture'
      }
      actions={!editing ? actions : undefined}
      width="lg"
    >
      {loading && (
        <p className="text-sm text-muted-foreground">Chargement…</p>
      )}

      {!loading && shortage && !editing && (
        <div className="space-y-4">
          {canResolve ? (
            <button
              type="button"
              onClick={() => onResolve(shortage.id)}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-500"
            >
              <CheckCircle2 className="h-4 w-4" />
              Marquer la rupture comme levée
            </button>
          ) : null}

          <div className="flex items-center gap-3">
            <StatusBadge status={shortage.status} />
          </div>

          <div className="space-y-2 rounded-2xl border border-slate-200 bg-white p-3 text-sm">
            <div>
              <span className="text-muted-foreground">Produit : </span>
              <span className="font-medium">{shortage.product_name}</span>
            </div>

            {shortage.status === 'resolved' ? (
              <div>
                <span className="text-muted-foreground">Levée : </span>
                <span>
                  {(shortage as ShortageWithResolution).resolved_at
                    ? new Date(
                        (shortage as ShortageWithResolution).resolved_at!
                      ).toLocaleString('fr-FR')
                    : '-'}
                  {(shortage as ShortageWithResolution).resolution_cip13
                    ? ` · CIP ${(shortage as ShortageWithResolution).resolution_cip13}`
                    : ''}
                </span>
              </div>
            ) : null}

            {shortage.notes && (
              <div>
                <span className="text-muted-foreground">Notes : </span>
                <span className="whitespace-pre-wrap">{shortage.notes}</span>
              </div>
            )}

            <div>
              <span className="text-muted-foreground">Créée le : </span>
              <span>
                {new Date(shortage.created_at).toLocaleDateString('fr-FR')}
              </span>
            </div>
          </div>
        </div>
      )}

      {!loading && shortage && editing && (
        <ShortageForm
          defaultValues={shortage}
          onSubmit={async (payload) => {
            await handleUpdate(payload as UpdateShortage)
          }}
          onCancel={() => setEditing(false)}
        />
      )}
    </DetailDrawer>
  )
}

