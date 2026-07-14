'use client'

import { useRef, useState, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { createClient } from '@/lib/supabase/client'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RENTAL_STATUS_LABELS } from '@/config/constants'
import { Plus, Minus, ImagePlus, X } from 'lucide-react'
import { FormActions } from '@/components/shared/form-actions'
import type { Rental, RentalStatus, NewRental, UpdateRental } from '@/types/index'

type RentalFormProps = {
  pharmacyId: string
  defaultValues?: Rental
  onSubmit: (payload: NewRental | UpdateRental, files?: File[]) => Promise<void>
  onCancel: () => void
  id?: string
  hideActions?: boolean
  /** Contenu inséré juste au-dessus du champ Notes (ex. galerie + upload photos). */
  photosSlot?: ReactNode
}

export function RentalForm({
  pharmacyId,
  defaultValues,
  onSubmit,
  onCancel,
  id,
  hideActions,
  photosSlot,
}: RentalFormProps) {
  const isEdit = !!defaultValues

  const [clientName, setClientName] = useState(defaultValues?.client_name ?? '')
  const [clientPhone, setClientPhone] = useState(defaultValues?.client_phone ?? '')
  const [equipment, setEquipment] = useState(defaultValues?.equipment ?? '')
  const [expectedReturn, setExpectedReturn] = useState(
    defaultValues?.expected_return ?? ''
  )
  const [deposit, setDeposit] = useState(
    defaultValues?.deposit ? String(defaultValues.deposit) : ''
  )
  const [dailyRate, setDailyRate] = useState(
    defaultValues?.daily_rate ? String(defaultValues.daily_rate) : ''
  )
  // 'daily' n'est plus exposé dans le user flow (le Select n'a que weekly/monthly).
  // Les rentals historiques en 'daily' sont basculées vers 'weekly' en édition.
  const [billingType, setBillingType] = useState<'weekly' | 'monthly'>(
    defaultValues?.billing_type === 'monthly' ? 'monthly' : 'weekly'
  )
  const [status, setStatus] = useState<RentalStatus>(
    defaultValues?.status === 'overdue' ? 'active' : (defaultValues?.status ?? 'active')
  )
  const [paidUnits, setPaidUnits] = useState(defaultValues?.paid_units ?? 0)
  const [notes, setNotes] = useState(defaultValues?.notes ?? '')
  const [submitting, setSubmitting] = useState(false)
  // Photos ajoutées dès la création (bufferisées, uploadées par le parent
  // une fois la location créée). En édition, l'upload se fait dans le drawer.
  const [photoFiles, setPhotoFiles] = useState<File[]>([])
  const photoInputRef = useRef<HTMLInputElement>(null)

  // Convention métier (23/05/2026) : l'input est TOUJOURS un montant hebdomadaire,
  // quel que soit billing_type. Le `daily_rate` stocké est donc systématiquement
  // input / 7 (taux journalier équivalent, utile pour les calculs internes).
  const billingAmount = dailyRate ? parseFloat(dailyRate) : null
  const normalizedDailyRate =
    billingAmount == null ? null : Number((billingAmount / 7).toFixed(2))

  // Conversion approximative pour l'affichage uniquement. 30 jours / 7 = 4.286 semaines.
  const monthlyEquivalent =
    billingAmount == null ? null : Number(((billingAmount * 30) / 7).toFixed(2))

  // `calculateTotalUnits` garde la branche daily pour back-compat (rentals
  // historiques en DB pourraient avoir `billing_type = 'daily'`).
  const calculateTotalUnits = (startStr: string, endStr: string, type: 'daily' | 'weekly' | 'monthly') => {
    const start = new Date(startStr)
    const end = new Date(endStr)
    const diffMs = end.getTime() - start.getTime()
    const diffDays = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)))

    if (type === 'daily') return diffDays
    if (type === 'weekly') return Math.ceil(diffDays / 7)
    if (type === 'monthly') return Math.ceil(diffDays / 30)
    return 1
  }

  const totalUnits = expectedReturn
    ? calculateTotalUnits(
        isEdit ? defaultValues!.started_at : new Date().toISOString().split('T')[0],
        expectedReturn,
        billingType
      )
    : (defaultValues?.total_units ?? 1)

  const handleSubmit = async () => {
    if (!equipment.trim() || !expectedReturn || !clientName.trim()) return
    
    // Constraint: paid_units <= total_units
    if (paidUnits > totalUnits) {
      alert("Le nombre de paiements effectués ne peut pas dépasser le nombre de paiements dus.")
      return
    }

    setSubmitting(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSubmitting(false); return }

    if (isEdit) {
      const updatePayload: UpdateRental = {
        client_name: clientName.trim(),
        client_phone: clientPhone.trim() || null,
        equipment: equipment.trim(),
        expected_return: expectedReturn,
        deposit: deposit ? parseFloat(deposit) : null,
        daily_rate: normalizedDailyRate,
        billing_type: billingType,
        status,
        paid_units: paidUnits,
        total_units: calculateTotalUnits(defaultValues!.started_at, expectedReturn, billingType),
        notes: notes.trim() || null,
      }
      if (status === 'returned') {
        updatePayload.returned_at = new Date().toISOString().split('T')[0]
      }
      await onSubmit(updatePayload)
    } else {
      const createPayload: NewRental = {
        pharmacy_id: pharmacyId,
        created_by: user!.id,
        client_name: clientName.trim(),
        client_phone: clientPhone.trim() || null,
        equipment: equipment.trim(),
        expected_return: expectedReturn,
        started_at: new Date().toISOString().split('T')[0],
        deposit: deposit ? parseFloat(deposit) : null,
        daily_rate: normalizedDailyRate,
        billing_type: billingType,
        status: 'active',
        paid_units: 0,
        total_units: calculateTotalUnits(new Date().toISOString().split('T')[0], expectedReturn, billingType),
        notes: notes.trim() || null,
      }
      await onSubmit(createPayload, photoFiles)
    }
    setSubmitting(false)
  }

  return (
    <form id={id ?? 'rental-form'} className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-400">Équipement *</label>
          <Input
            required
            value={equipment}
            onChange={(e) => setEquipment(e.target.value)}
            placeholder="Nom de l'équipement"
          />
        </div>
        <div className="space-y-2">
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-400">Client *</label>
          <Input
            required
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            placeholder="Nom du client"
          />
        </div>
      </div>

      {billingAmount != null && (
        <div className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-700">
          Facturation {billingType === 'monthly' ? 'mensuelle' : 'hebdomadaire'} sélectionnée. Tarif : {billingAmount.toFixed(2)} €/semaine
          {billingType === 'monthly' && monthlyEquivalent != null && (
            <> (≈ {monthlyEquivalent.toFixed(2)} €/mois)</>
          )}
          .
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-400">Téléphone</label>
          <Input
            value={clientPhone}
            onChange={(e) => setClientPhone(e.target.value)}
            placeholder="06 00 00 00 00"
          />
        </div>
        <div className="space-y-2">
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-400">Caution (€)</label>
          <Input
            type="number"
            value={deposit}
            onChange={(e) => setDeposit(e.target.value)}
            placeholder="0.00"
            min="0"
            step="0.01"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-400">Facturation</label>
          <Select value={billingType} onValueChange={(v) => setBillingType(v as 'weekly' | 'monthly')}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">Hebdomadaire</SelectItem>
              <SelectItem value="monthly">Mensuelle</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-400">Montant hebdo (€)</label>
          <Input
            type="number"
            value={dailyRate}
            onChange={(e) => setDailyRate(e.target.value)}
            placeholder="0.00"
            min="0"
            step="0.01"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 border-t pt-4">
        <div className="space-y-2">
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-400">Retour prévu *</label>
          <Input
            required
            type="date"
            value={expectedReturn}
            onChange={(e) => setExpectedReturn(e.target.value)}
          />
        </div>
        {isEdit && (
          <div className="space-y-2">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-400">Statut</label>
            <Select
              value={status}
              onValueChange={(v) => setStatus(v as RentalStatus)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(['active', 'returned'] as const).map((s) => (
                  <SelectItem key={s} value={s}>
                    {RENTAL_STATUS_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {isEdit && (
        <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-400">Paiements effectués</label>
          <div className="flex items-center gap-4 py-2">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="icon"
                variant="outline"
                className="h-10 w-10 rounded-full border-red-200 bg-white text-red-600 hover:bg-red-50 hover:text-red-700 shadow-sm"
                onClick={() => setPaidUnits(Math.max(0, paidUnits - 1))}
                disabled={paidUnits <= 0}
              >
                <Minus className="h-4 w-4" />
              </Button>

              <div className="flex items-center justify-center px-5 h-10 border-2 border-slate-200 rounded-xl bg-white min-w-[100px] shadow-sm">
                <span className="text-lg font-bold text-slate-900 tabular-nums">
                  {paidUnits} <span className="text-slate-400 font-normal mx-1">/</span> {totalUnits}
                </span>
              </div>

              <Button
                type="button"
                size="icon"
                variant="outline"
                className="h-10 w-10 rounded-full border-blue-300 bg-white text-blue-600 hover:bg-blue-50 hover:text-blue-700 shadow-sm"
                onClick={() => setPaidUnits(Math.min(totalUnits, paidUnits + 1))}
                disabled={paidUnits >= totalUnits}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <span className="text-sm text-slate-500 font-medium uppercase tracking-wide">
              {billingType === 'monthly' ? 'mois' : 'semaines'}
            </span>
          </div>
        </div>
      )}

      {photosSlot}

      <div className="space-y-2">
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-400">Notes</label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notes…"
          rows={3}
        />
      </div>

      {!isEdit && (
        <div className="space-y-2 border-t pt-4">
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-400">Photos (optionnel)</label>
          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(e) => {
              const files = Array.from(e.target.files ?? [])
              if (files.length) setPhotoFiles((prev) => [...prev, ...files])
              e.target.value = ''
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-full"
            onClick={() => photoInputRef.current?.click()}
          >
            <ImagePlus className="mr-2 h-4 w-4" />
            Ajouter des photos
          </Button>
          {photoFiles.length > 0 && (
            <ul className="flex flex-wrap gap-2 pt-1">
              {photoFiles.map((file, i) => (
                <li
                  key={`${file.name}-${i}`}
                  className="flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-700"
                >
                  <span className="max-w-[140px] truncate">{file.name}</span>
                  <button
                    type="button"
                    aria-label={`Retirer ${file.name}`}
                    onClick={() => setPhotoFiles((prev) => prev.filter((_, j) => j !== i))}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {!hideActions && (
        <FormActions
          onCancel={onCancel}
          submitLabel={isEdit ? 'Mettre à jour' : 'Créer la location'}
          submitting={submitting}
          disabled={!equipment.trim() || !expectedReturn || !clientName.trim()}
          submitForm={id ?? 'rental-form'}
        />
      )}
    </form>
  )
}