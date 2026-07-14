'use client'

import { useCallback, useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { shortagesService } from '@/features/shortages'
import { FormActions } from '@/components/shared/form-actions'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { SHORTAGE_STATUS_LABELS } from '@/config/constants'
import { useProfile } from '@/contexts/profile-context'
import type { Shortage, ShortageStatus, NewShortage, UpdateShortage } from '@/types/index'

type ShortageFormProps = {
  defaultValues?: Shortage
  onSubmit: (payload: NewShortage | UpdateShortage) => Promise<void>
  onCancel: () => void
}

export function ShortageForm({ defaultValues, onSubmit, onCancel }: ShortageFormProps) {
  const { pharmacy, canWrite } = useProfile()
  const isEditing = Boolean(defaultValues)

  const [productName, setProductName] = useState(defaultValues?.product_name ?? '')
  const [status, setStatus] = useState<ShortageStatus>(defaultValues?.status ?? 'open')
  const [notes, setNotes] = useState(defaultValues?.notes ?? '')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    setProductName(defaultValues?.product_name ?? '')
    setStatus(defaultValues?.status ?? 'open')
    setNotes(defaultValues?.notes ?? '')
  }, [defaultValues])

  const availableStatuses = Object.entries(SHORTAGE_STATUS_LABELS).filter(
    ([key]) => !(key === 'resolved' && !canWrite)
  )

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (!productName.trim()) return

      const userId = await shortagesService.getCurrentUserId()
      if (!userId) return

      setSubmitting(true)
      try {
        if (isEditing) {
          const payload: UpdateShortage = {
            product_name: productName.trim(),
            status,
            notes: notes.trim() || null,
          }
          await onSubmit(payload)
        } else {
          const payload: NewShortage = {
            product_name: productName.trim(),
            status: 'open',
            notes: notes.trim() || null,
            pharmacy_id: pharmacy!.id,
            reported_by: userId,
          }
          await onSubmit(payload)
        }
      } finally {
        setSubmitting(false)
      }
    },
    [productName, status, notes, isEditing, onSubmit, pharmacy]
  )

  return (
    <form id="shortage-form" onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2 rounded-2xl border border-slate-200 bg-white p-3">
        <Label htmlFor="product_name">Médicament *</Label>
        <p className="text-xs text-muted-foreground">
          Saisissez le médicament en rupture. La levée se fera en indiquant le médicament de
          substitution (et son CIP13 si vous l&apos;avez).
        </p>
        <Input
          id="product_name"
          value={productName}
          onChange={(e) => setProductName(e.target.value)}
          placeholder="Nom du médicament en rupture…"
          required
          autoComplete="off"
        />
      </div>

      {isEditing && (
        <div className="space-y-2 rounded-2xl border border-slate-200 bg-white p-3">
          <Label htmlFor="status">Statut</Label>
          <Select value={status} onValueChange={(v) => setStatus(v as ShortageStatus)}>
            <SelectTrigger id="status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableStatuses.map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-2 rounded-2xl border border-slate-200 bg-white p-3">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notes complémentaires…"
          rows={3}
        />
      </div>

      <FormActions
        onCancel={onCancel}
        submitLabel={isEditing ? 'Mettre à jour' : 'Signaler la rupture'}
        submitting={submitting}
        disabled={!productName.trim()}
        submitForm="shortage-form"
      />
    </form>
  )
}
