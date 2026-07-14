'use client'

import { useCallback, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { FormLabel } from '@/components/shared/form-label'
import { FormActions } from '@/components/shared/form-actions'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Trash2 } from 'lucide-react'
import { ordersService, useSuppliers } from '@/features/orders'
import { SupplierDialog } from '@/components/orders/supplier-dialog'
import { ORDER_STATUS_LABELS } from '@/config/constants'
import { AudioRecorder } from '@/components/shared/audio-recorder'
import { AttachmentList, FileUploader, type Attachment } from '@/components/shared/file-uploader'
import type {
  OrderWithDetails,
  OrderStatus,
  NewOrder,
  NewOrderItem,
  Supplier,
} from '@/types/index'

type OrderItemRow = {
  key: string
  product_name: string
  quantity: number
  unit_price: string
}

type OrderFormProps = {
  pharmacyId: string
  defaultValues?: OrderWithDetails
  onSubmit: (
    payload: NewOrder,
    items: Omit<NewOrderItem, 'order_id' | 'pharmacy_id'>[]
  ) => Promise<void>
  onCancel?: () => void
}

function formatSupplierLabel(supplier: Supplier): string {
  const contact = supplier.contact_name?.trim()
  if (!contact) return supplier.name
  return `${supplier.name} - ${contact}`
}

function createEmptyItem(): OrderItemRow {
  return {
    key: crypto.randomUUID(),
    product_name: '',
    quantity: 1,
    unit_price: '',
  }
}

export function OrderForm({
  pharmacyId,
  defaultValues,
  onSubmit,
  onCancel,
}: OrderFormProps) {
  const { suppliers, refresh: refreshSuppliers } = useSuppliers()
  const [supplierId, setSupplierId] = useState(defaultValues?.supplier_id ?? '')
  const [status, setStatus] = useState<OrderStatus>(() => {
    if (!defaultValues?.status) return 'sent'
    return defaultValues.status === 'draft' ? 'sent' : defaultValues.status
  })
  const [notes, setNotes] = useState(defaultValues?.notes ?? '')
  const [items, setItems] = useState<OrderItemRow[]>(() => {
    if (defaultValues?.items && defaultValues.items.length > 0) {
      return defaultValues.items.map((item) => ({
        key: item.id,
        product_name: item.product_name ?? '',
        quantity: item.quantity ?? 1,
        unit_price: item.unit_price ? String(item.unit_price) : '',
      }))
    }
    return [createEmptyItem()]
  })
  const [supplierDialogOpen, setSupplierDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [uploadedAttachments, setUploadedAttachments] = useState<Attachment[]>(
    defaultValues?.attachments ?? []
  )

  const isEdit = !!defaultValues
  const [tempFolderSuffix] = useState(() => Date.now())
  const attachmentFolderPath = isEdit
    ? `orders/${defaultValues?.id}`
    : `temp/orders/${tempFolderSuffix}`
  const selectedSupplier = suppliers.find((supplier) => supplier.id === supplierId)

  const handleAddItem = () => {
    setItems((prev) => [...prev, createEmptyItem()])
  }

  const handleRemoveItem = (key: string) => {
    setItems((prev) => {
      if (prev.length <= 1) return prev
      return prev.filter((item) => item.key !== key)
    })
  }

  const handleItemChange = (
    key: string,
    field: keyof Omit<OrderItemRow, 'key'>,
    value: string | number
  ) => {
    setItems((prev) =>
      prev.map((item) =>
        item.key === key ? { ...item, [field]: value } : item
      )
    )
  }

  const handleSupplierCreated = useCallback(
    (supplier: Supplier) => {
      refreshSuppliers()
      setSupplierId(supplier.id)
    },
    [refreshSuppliers]
  )

  const hasValidItems = items.some((item) => item.product_name.trim() !== '')

  const handleSubmit = async () => {
    if (!supplierId || !hasValidItems) return
    setSubmitting(true)

    const userId = await ordersService.getCurrentUserId()
    if (!userId) {
      setSubmitting(false)
      return
    }

    const orderPayload: NewOrder = {
      pharmacy_id: pharmacyId,
      supplier_id: supplierId,
      created_by: userId,
      status,
      notes: notes.trim() || null,
      attachments: uploadedAttachments,
    }

    const orderItems: Omit<NewOrderItem, 'order_id' | 'pharmacy_id'>[] = items
      .filter((item) => item.product_name.trim() !== '')
      .map((item) => ({
        product_name: item.product_name.trim(),
        quantity: item.quantity,
        unit_price: item.unit_price ? parseFloat(item.unit_price) : null,
      }))

    await onSubmit(orderPayload, orderItems)
    setUploadedAttachments([])
    setSubmitting(false)
  }

  const handleAudioUpload = (path: string) => {
    const att: Attachment = { path, name: 'Memo vocal', type: 'audio' }
    setUploadedAttachments(prev => [...prev, att])
  }

  const audioAttachmentIndex = uploadedAttachments.findIndex(a => a.type === 'audio')
  const hasAudio = audioAttachmentIndex >= 0
  const audioAttachmentPath = hasAudio ? uploadedAttachments[audioAttachmentIndex].path : null

  const handleAudioDelete = () => {
    setUploadedAttachments(prev => prev.filter(a => a.type !== 'audio'))
  }

  const documentAttachments = uploadedAttachments.filter((a) => a.type !== 'audio')

  const handleDocumentUpload = (attachment: Attachment) => {
    setUploadedAttachments((prev) => [...prev, attachment])
  }

  const handleDocumentDelete = (index: number) => {
    setUploadedAttachments((prev) => {
      const docs = prev.filter((a) => a.type !== 'audio')
      const removed = docs[index]
      if (!removed) return prev
      return prev.filter((a) => a !== removed)
    })
  }

  return (
    <>
      <div className="space-y-4">
        {/* Fournisseur + Statut */}
        <div className="grid grid-cols-2 gap-4">
          {/* Fournisseur */}
          <div className="flex flex-col gap-1">
            <FormLabel required>Fournisseur</FormLabel>
            <Select value={supplierId} onValueChange={setSupplierId}>
              <SelectTrigger className="h-11 w-full rounded-xl border-slate-200 bg-white px-4 text-slate-800 transition focus:ring-0 focus-visible:ring-2 focus-visible:ring-teal-600/20 data-[size=default]:h-11">
                <SelectValue placeholder="Sélectionner un fournisseur" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-slate-200 shadow-lg">
                {suppliers.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {formatSupplierLabel(s)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedSupplier && (
              <p className="mt-1 text-xs text-slate-500">
                {formatSupplierLabel(selectedSupplier)}
              </p>
            )}
          </div>

          {/* Statut + Bouton Nouveau */}
          <div className="flex flex-col gap-1">
            <FormLabel>Statut</FormLabel>
            <div className="flex gap-2">
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as OrderStatus)}
              >
                <SelectTrigger className="h-11 flex-1 rounded-xl border-slate-200 bg-white px-4 text-slate-800 transition focus:ring-0 focus-visible:ring-2 focus-visible:ring-teal-600/20 data-[size=default]:h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-200 shadow-lg">
                  {(['sent', 'received'] as const).map((s) => (
                    <SelectItem key={s} value={s}>
                      {ORDER_STATUS_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setSupplierDialogOpen(true)}
                title="Nouveau fournisseur"
                className="h-11 w-11 rounded-xl border-slate-200 bg-white hover:bg-slate-50 text-slate-600"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>


        {/* Lignes de commande */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <FormLabel required>Lignes de commande</FormLabel>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddItem}
            >
              <Plus className="mr-1 h-3 w-3" />
              Ajouter une ligne
            </Button>
          </div>
          <div className="space-y-2">
            {items.map((item) => (
              <div
                key={item.key}
                className="grid grid-cols-[1fr_80px_100px_36px] gap-2 items-center"
              >
                <Input
                  placeholder="Nom du produit"
                  value={item.product_name}
                  onChange={(e) =>
                    handleItemChange(item.key, 'product_name', e.target.value)
                  }
                />
                <Input
                  type="number"
                  min={1}
                  placeholder="Qté"
                  value={item.quantity}
                  onChange={(e) =>
                    handleItemChange(
                      item.key,
                      'quantity',
                      parseInt(e.target.value, 10) || 1
                    )
                  }
                />
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder="Prix HT (€)"
                  value={item.unit_price}
                  onChange={(e) =>
                    handleItemChange(item.key, 'unit_price', e.target.value)
                  }
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveItem(item.key)}
                  disabled={items.length <= 1}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Notes commande */}
        <div className="space-y-2">
          <FormLabel>Notes</FormLabel>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes sur la commande…"
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <FormLabel>Mémo vocal</FormLabel>
          <AudioRecorder
            pharmacyId={pharmacyId}
            folderPath={attachmentFolderPath}
            existingPath={audioAttachmentPath}
            onUploaded={handleAudioUpload}
            onDelete={handleAudioDelete}
          />
        </div>

        <div className="space-y-2">
          <FormLabel>Photo / fichiers</FormLabel>
          <FileUploader
            pharmacyId={pharmacyId}
            folderPath={attachmentFolderPath}
            onUploaded={handleDocumentUpload}
          />
          <AttachmentList
            attachments={documentAttachments}
            onDelete={handleDocumentDelete}
          />
        </div>

        {/* Actions */}
        <FormActions
          onCancel={onCancel ?? (() => undefined)}
          onSubmit={handleSubmit}
          submitLabel={isEdit ? 'Mettre à jour' : 'Créer la commande'}
          submitting={submitting}
          disabled={!supplierId || !hasValidItems}
        />
      </div>

      <SupplierDialog
        open={supplierDialogOpen}
        onClose={() => setSupplierDialogOpen(false)}
        onCreated={handleSupplierCreated}
      />
    </>
  )
}