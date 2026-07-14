'use client'

import { useEffect, useState } from 'react'
import { DetailDrawer } from '@/components/shared/detail-drawer'
import { StatusBadge } from '@/components/shared/status-badge'
import { OrderForm } from '@/components/orders/order-form'
import { DrawerActions } from '@/components/shared/drawer-actions'
import { useProfile } from '@/contexts/profile-context'
import { ordersService } from '@/features/orders'
import { type Attachment } from '@/components/shared/file-uploader'
import { AudioRecorder } from '@/components/shared/audio-recorder'
import { SignedImage } from '@/components/shared/signed-image'
import { useSignedUrl } from '@/lib/storage/get-signed-url'
import { downloadAttachmentFile } from '@/lib/tasks/task-attachments'
import type { OrderWithDetails, NewOrder, NewOrderItem, UpdateOrder } from '@/types/index'
import { CheckCircle2 } from 'lucide-react'

type OrderDrawerProps = {
  orderId: string | null
  open: boolean
  onClose: () => void
  onUpdate: (id: string, payload: UpdateOrder) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

export function OrderDrawer({
  orderId,
  open,
  onClose,
  onUpdate,
  onDelete,
}: OrderDrawerProps) {
  const { pharmacy, isAdmin, canWriteTasks } = useProfile()
  const [order, setOrder] = useState<OrderWithDetails | null>(null)
  const [loading, setLoading] = useState(false)
  const [editing, setEditing] = useState(false)
  const [selectedImagePath, setSelectedImagePath] = useState<string | null>(null)
  const { data: selectedImageSignedUrl } = useSignedUrl(
    'attachments',
    selectedImagePath ?? undefined
  )


  useEffect(() => {
    if (!orderId || !open) {
      const timeoutId = setTimeout(() => {
        setOrder(null)
        setEditing(false)
      }, 0)
      return () => clearTimeout(timeoutId)
    }
    const timeoutId = setTimeout(() => {
      setLoading(true)
      ordersService.getOrderById(orderId).then((result) => {
        setOrder(result.data ?? null)
        setLoading(false)
      })
    }, 0)
    return () => clearTimeout(timeoutId)
  }, [orderId, open])

  const handleDelete = async () => {
    if (!orderId) return
    await onDelete(orderId)
    onClose()
  }

  const handleFormSubmit = async (
    payload: NewOrder,
    items: Omit<NewOrderItem, 'order_id' | 'pharmacy_id'>[]
  ) => {
    void items
    if (!orderId) return
    const updatePayload: UpdateOrder = {
      supplier_id: payload.supplier_id,
      status: payload.status,
      notes: payload.notes,
    }
    await onUpdate(orderId, updatePayload)
    setEditing(false)
    // Refetch
    const result = await ordersService.getOrderById(orderId)
    setOrder(result.data ?? null)
  }

  const handleAttachmentUpload = async (attachment: Attachment) => {
    if (!order?.id) return
    const newAttachments = [...(order.attachments || []), attachment]
    await onUpdate(order.id, { attachments: newAttachments })
    const result = await ordersService.getOrderById(order.id)
    setOrder(result.data ?? null)
  }

  const handleAttachmentDelete = async (index: number) => {
    if (!order?.id || !order.attachments) return
    const newAttachments = [...order.attachments]
    newAttachments.splice(index, 1)
    await onUpdate(order.id, { attachments: newAttachments })
    const result = await ordersService.getOrderById(order.id)
    setOrder(result.data ?? null)
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- conservé pour la feature "memo vocal sur commande" à venir
  const handleAudioUpload = async (path: string) => {
    if (!order?.id) return
    // Audio mémo is stored as an attachment with type 'audio'.
    const attachment: Attachment = { path, name: 'Memo vocal', type: 'audio' }
    await handleAttachmentUpload(attachment)
  }

  const audioAttachmentIndex = order?.attachments?.findIndex((a: Attachment) => a.type === 'audio') ?? -1
  const hasAudio = audioAttachmentIndex >= 0
  const audioAttachmentPath = hasAudio && order?.attachments ? order.attachments[audioAttachmentIndex].path : null

  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- conservé pour la feature "memo vocal sur commande" à venir
  const handleAudioDelete = async () => {
    if (audioAttachmentIndex >= 0) {
      await handleAttachmentDelete(audioAttachmentIndex)
    }
  }

  const documentAttachments = order?.attachments?.filter((a: Attachment) => a.type !== 'audio') || []
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- conservé pour la suppression individuelle de documents (UI à venir)
  const mapDocToDeleteIndex = (docIndex: number) => {
    if (!order?.attachments) return -1
    let count = -1
    for (let i = 0; i < order.attachments.length; i++) {
      if (order.attachments[i].type !== 'audio') count++
      if (count === docIndex) return i
    }
    return -1
  }

  const viewActions = canWriteTasks ? (
    <DrawerActions
      canEdit
      canDelete={isAdmin}
      onEdit={() => setEditing(true)}
      onDelete={handleDelete}
    />
  ) : undefined

  return (
    <>
      <DetailDrawer
        open={open}
        onClose={onClose}
        actions={editing ? undefined : viewActions}
        width="lg"
      >
      {loading && (
        <p className="text-sm text-muted-foreground py-8 text-center">
          Chargement…
        </p>
      )}

      {!loading && !order && (
        <p className="text-sm text-muted-foreground py-8 text-center">
          Commande introuvable.
        </p>
      )}

      {!loading && order && !editing && (
        <div className="space-y-6">
          {canWriteTasks && order.status !== 'received' && (
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => onUpdate(order.id, { status: 'received' })}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-500"
              >
                <CheckCircle2 className="h-4 w-4" />
                Marquer comme bien reçu
              </button>
              {order.status === 'draft' && (
                <button
                  type="button"
                  onClick={() => onUpdate(order.id, { status: 'sent' })}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                >
                  Marquer envoyée
                </button>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <p className="text-xs text-muted-foreground">Fournisseur</p>
              {order.supplier ? (
                <>
                  <p className="text-sm font-medium">{order.supplier.name}</p>
                  <div className="mt-1 flex flex-col gap-0.5 text-xs text-slate-500">
                    {order.supplier.contact_name && (
                      <span>Contact: <span className="font-medium text-slate-600">{order.supplier.contact_name}</span></span>
                    )}
                    {order.supplier.phone && <span>Tél: {order.supplier.phone}</span>}
                    {order.supplier.email && <span>Email: {order.supplier.email}</span>}
                  </div>
                </>
              ) : (
                <p className="text-sm font-medium">-</p>
              )}
            </div>
          </div>

          {/* Order items */}
          <div>
            <p className="text-xs text-muted-foreground mb-2">
              Lignes de commande
            </p>
            <div className="divide-y divide-slate-100">
              {order.items.length === 0 && (
                <p className="text-sm text-slate-500">
                  Aucune ligne.
                </p>
              )}
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0"
                >
                  <p className="text-sm text-slate-900">
                    <span className="font-medium">{item.quantity}×</span> {item.product_name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {item.unit_price != null ? `${item.unit_price} €` : '-'}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <p className="text-xs text-muted-foreground">Notes</p>
            <p className="mt-1 text-sm font-medium text-slate-900 whitespace-pre-wrap">
              {order.notes || 'Aucune note'}
            </p>
          </div>

          {/* Attachments Section */}
          <div>
            <p className="text-xs text-muted-foreground mb-2">Documents & Mémos</p>
            <div className="flex flex-col gap-3">
              <div className="flex gap-2 items-center flex-wrap">
                {hasAudio && pharmacy && (
                  <AudioRecorder
                    pharmacyId={pharmacy.id}
                    folderPath={`orders/${order.id}`}
                    existingPath={audioAttachmentPath}
                    onUploaded={() => {}}
                    readOnly
                  />
                )}
              </div>
              
              {documentAttachments.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {documentAttachments.map((att: Attachment, idx: number) => {
                    if (att.type === 'image') {
                      return (
                        <button
                          key={`${att.path}-${idx}`}
                          type="button"
                          onClick={() => setSelectedImagePath(att.path)}
                          className="flex items-center gap-2 p-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-left"
                        >
                          <div className="h-10 w-10 shrink-0 overflow-hidden rounded-md bg-slate-100 border border-slate-200">
                            <SignedImage path={att.path} alt={att.name} className="h-full w-full object-cover" loading="lazy" />
                          </div>
                          <span className="text-sm font-medium text-slate-700 truncate">{att.name}</span>
                        </button>
                      )
                    }

                    return (
                      <button
                        key={`${att.path}-${idx}`}
                        type="button"
                        onClick={() => void downloadAttachmentFile(att)}
                        className="flex items-center gap-2 p-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-left"
                      >
                        <div className="h-10 w-10 rounded-md bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200">
                          <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <span className="text-sm font-medium text-slate-700 truncate">{att.name}</span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Status & Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Statut</p>
              <div className="mt-1">
                <StatusBadge status={order.status} />
              </div>
            </div>

            <div>
              <p className="text-xs text-muted-foreground">Créée le</p>
              <p className="text-sm">
                {new Date(order.created_at).toLocaleDateString('fr-FR')}
              </p>
            </div>
          </div>

        </div>
      )}

      {!loading && order && editing && pharmacy && (
        <OrderForm
          pharmacyId={pharmacy.id}
          defaultValues={order}
          onSubmit={handleFormSubmit}
          onCancel={() => setEditing(false)}
        />
      )}
      </DetailDrawer>

      {selectedImagePath && selectedImageSignedUrl && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedImagePath(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={selectedImageSignedUrl}
            alt="Preview"
            className="max-h-full max-w-full rounded-lg object-contain shadow-2xl ring-1 ring-white/10"
          />
          <button
            type="button"
            className="absolute top-4 right-4 rounded-full bg-black/50 p-2 text-white hover:bg-black/70 transition-colors"
            onClick={() => setSelectedImagePath(null)}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </>
  )
}


// ============================================================================
// FILE: src/components/orders/order-table.tsx
// ============================================================================
