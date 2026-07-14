'use client'

import Image from 'next/image'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { FormActions } from '@/components/shared/form-actions'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  PRESCRIPTION_STATUS_LABELS,
  PRIORITY_LABELS,
} from '@/config/constants'
import type {
  Prescription,
  PrescriptionItem,
  PrescriptionStatus,
  PrescriptionWithItems,
  TaskPriority,
  NewPrescription,
  UpdatePrescription,
  NewPrescriptionItem,
} from '@/types/index'
import { useProfile } from '@/contexts/profile-context'
import { prescriptionsService } from '@/features/prescriptions'
import { toast } from 'sonner'
import { captureFirstMilestone } from '@/lib/analytics/capture-first'
import { FIRST_MILESTONE_EVENTS } from '@/lib/analytics/events'
import posthog from 'posthog-js'
import { normalizeMedicationItem } from '@/lib/ocr/normalize-medication-item'
import { Camera, Trash2 } from 'lucide-react'

type PrescriptionFormProps = {
  defaultValues?: Prescription
  onSubmit?: (payload: NewPrescription | UpdatePrescription) => Promise<void>
  onCreated?: () => Promise<void> | void
  onCancel: () => void
}

type EditableMedicationItem = {
  localId: string
  id?: string
  medication_name: string
  dosage: string
  quantity: number
  status: PrescriptionStatus
}

export function PrescriptionForm({
  defaultValues,
  onSubmit,
  onCreated,
  onCancel,
}: PrescriptionFormProps) {
  const { pharmacy } = useProfile()
  const isEditing = Boolean(defaultValues)

  const [patientRef, setPatientRef] = useState(defaultValues?.patient_ref ?? '')
  const [prescriberName, setPrescriberName] = useState(defaultValues?.prescriber_name ?? '')
  const [prescribedDate, setPrescribedDate] = useState(defaultValues?.prescribed_date ?? '')
  const [expiryDate, setExpiryDate] = useState(defaultValues?.expiry_date ?? '')
  const [status, setStatus] = useState<PrescriptionStatus>(
    defaultValues?.status ?? 'to_serve'
  )
  const [priority, setPriority] = useState<TaskPriority>(
    defaultValues?.priority ?? 'medium'
  )
  const [executionDate, setExecutionDate] = useState(() => {
    if (!defaultValues?.execution_date) return ''
    const d = new Date(defaultValues.execution_date)
    if (isNaN(d.getTime())) return ''
    const pad = (n: number) => n.toString().padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [ocrLoading, setOcrLoading] = useState(false)
  const [medicationItems, setMedicationItems] = useState<EditableMedicationItem[]>(() => {
    // We must cast because defaultValues is technically typed as just Prescription
    // but we know it's PrescriptionWithComments or PrescriptionWithItems in edit mode.
    const initialItems = (defaultValues as PrescriptionWithItems | undefined)?.items || []
    return initialItems.map((item: PrescriptionItem) => ({
      localId: item.id,
      id: item.id,
      medication_name: item.medication_name,
      dosage: item.dosage ?? '',
      quantity: item.quantity,
      status: (item.status ?? 'to_serve') as PrescriptionStatus,
    }))
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!imageFile || !imageFile.type.startsWith('image/')) {
      setPreviewUrl(null)
      return
    }
    const nextUrl = URL.createObjectURL(imageFile)
    setPreviewUrl(nextUrl)
    return () => URL.revokeObjectURL(nextUrl)
  }, [imageFile])

  const isPdf = useMemo(
    () => Boolean(imageFile && imageFile.type === 'application/pdf'),
    [imageFile]
  )

  const handleImageChange = useCallback((file: File | null) => {
    setImageFile(file)
  }, [])

  const addMedication = useCallback(() => {
    setMedicationItems((prev) => [
      ...prev,
      {
        localId: crypto.randomUUID(),
        medication_name: '',
        dosage: '',
        quantity: 1,
        status: 'to_serve',
      },
    ])
  }, [])

  const updateMedication = useCallback(
    (localId: string, patch: Partial<EditableMedicationItem>) => {
      setMedicationItems((prev) =>
        prev.map((item) => (item.localId === localId ? { ...item, ...patch } : item))
      )
    },
    []
  )

  const removeMedication = useCallback((localId: string) => {
    setMedicationItems((prev) => prev.filter((item) => item.localId !== localId))
  }, [])



  const handleOcr = useCallback(async () => {
    if (!imageFile) {
      toast.warning("Sélectionnez d'abord une image ou un PDF.")
      return
    }

    setOcrLoading(true)
    try {
      let fileForOcr = imageFile
      if (imageFile.type === 'application/pdf') {
        try {
          const { pdfFileToJpegFile } = await import('@/lib/ocr/render-pdf-first-page')
          fileForOcr = await pdfFileToJpegFile(imageFile)
        } catch {
          toast.error(
            'Impossible de convertir le PDF. Utilisez une photo (JPEG/PNG) ou un autre PDF.'
          )
          return
        }
      }

      const formData = new FormData()
      formData.append('image', fileForOcr)
      const response = await fetch('/api/ocr', {
        method: 'POST',
        body: formData,
        headers: { 'x-posthog-distinct-id': posthog.get_distinct_id() },
      })
      const data = (await response.json()) as {
        success: boolean
        patient_name?: string | null
        prescriber_name?: string | null
        prescribed_date?: string | null
        expiry_date?: string | null
        items: { medication_name: string; dosage: string | null; quantity: number }[]
        error?: string
      }

      if (!response.ok || !data.success) {
        setMedicationItems([])
        const hint =
          data.error === 'provider_not_configured'
            ? 'Configurez OCR_PROVIDER / clé API ou Ollama.'
            : data.error
              ? ` (${data.error})`
              : ''
        toast.warning(
          `Analyse automatique non aboutie : vérifiez et complétez manuellement${hint}`
        )
        return
      }

      if (data.patient_name?.trim()) {
        setPatientRef(data.patient_name.trim())
      }
      if (data.prescriber_name?.trim()) {
        setPrescriberName(data.prescriber_name.trim())
      }
      if (data.prescribed_date) {
        setPrescribedDate(data.prescribed_date)
      }
      if (data.expiry_date) {
        setExpiryDate(data.expiry_date)
      }

      if (pharmacy?.id) {
        captureFirstMilestone(FIRST_MILESTONE_EVENTS.first_ocr_done, pharmacy.id, {
          item_count: data.items?.length ?? 0,
          has_patient_name: Boolean(data.patient_name?.trim()),
        })
      }

      if (data.items?.length) {
        setMedicationItems(
          data.items.map((item) => {
            const n = normalizeMedicationItem({
              medication_name: item.medication_name,
              dosage: item.dosage ?? null,
              quantity: item.quantity ?? 1,
            })
            return {
              localId: crypto.randomUUID(),
              medication_name: n.medication_name,
              dosage: n.dosage ?? '',
              quantity: n.quantity,
              status: 'to_serve',
            }
          })
        )
      }
    } catch {
      setMedicationItems([])
      toast.warning(
        'Analyse automatique non aboutie : vérifiez et complétez manuellement'
      )
    } finally {
      setOcrLoading(false)
    }
  }, [imageFile, pharmacy?.id])

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (!patientRef.trim()) return
      if (prescribedDate && expiryDate && expiryDate < prescribedDate) {
        toast.error("La date d'expiration ne peut pas être avant la date de prescription.")
        return
      }

      setSubmitting(true)
      try {
        if (isEditing) {
          const payload: UpdatePrescription = {
            patient_ref: patientRef.trim(),
            prescriber_name: prescriberName.trim() || null,
            prescribed_date: prescribedDate || null,
            expiry_date: expiryDate || null,
            status,
            priority,
            execution_date: executionDate ? new Date(executionDate).toISOString() : null,
          }
          if (onSubmit) await onSubmit(payload)

          if (pharmacy && defaultValues) {
            const oldItems = (defaultValues as PrescriptionWithItems | undefined)?.items || []
            const oldItemIds = new Set<string>(oldItems.map((i: PrescriptionItem) => i.id))
            
            for (const item of medicationItems) {
              if (item.id) {
                await prescriptionsService.updatePrescriptionItem(item.id, {
                  medication_name: item.medication_name.trim(),
                  dosage: item.dosage.trim() || null,
                  quantity: Number.isFinite(item.quantity) && item.quantity > 0 ? Math.floor(item.quantity) : 1,
                  status: item.status,
                })
                oldItemIds.delete(item.id)
              } else {
                await prescriptionsService.createPrescriptionItem({
                  prescription_id: defaultValues.id,
                  pharmacy_id: pharmacy.id,
                  medication_name: item.medication_name.trim(),
                  dosage: item.dosage.trim() || null,
                  quantity: Number.isFinite(item.quantity) && item.quantity > 0 ? Math.floor(item.quantity) : 1,
                  status: item.status,
                })
              }
            }
            
            for (const id of oldItemIds) {
               await prescriptionsService.deletePrescriptionItem(id)
            }
          }
        } else {
          const userId = await prescriptionsService.getCurrentUserId()
          if (!userId || !pharmacy) return

          let imageUrl: string | null = null
          if (imageFile) {
            imageUrl = await prescriptionsService.uploadPrescriptionAsset(
              imageFile,
              userId,
              pharmacy.id
            )
          }

          const payload: NewPrescription = {
            patient_ref: patientRef.trim(),
            prescriber_name: prescriberName.trim() || null,
            prescribed_date: prescribedDate || null,
            expiry_date: expiryDate || null,
            status,
            priority,
            execution_date: executionDate ? new Date(executionDate).toISOString() : null,
            image_url: imageUrl,
            pharmacy_id: pharmacy.id,
            created_by: userId,
          }

          const created = await prescriptionsService.createPrescription(payload)
          if (created.error || !created.data) {
            toast.error(created.error ?? "Impossible de créer l'ordonnance")
            return
          }
          const createdPrescription = created.data

          const validItems: NewPrescriptionItem[] = medicationItems
            .filter((item) => item.medication_name.trim())
            .map((item) => ({
              prescription_id: createdPrescription.id,
              pharmacy_id: pharmacy.id,
              medication_name: item.medication_name.trim(),
              dosage: item.dosage.trim() || null,
              quantity: Number.isFinite(item.quantity) && item.quantity > 0
                ? Math.floor(item.quantity)
                : 1,
              status: item.status,
            }))

          const itemsResult =
            await prescriptionsService.bulkCreatePrescriptionItems(validItems)
          if (itemsResult.error) {
            toast.error(itemsResult.error)
            return
          }

          posthog.capture('prescription_created', {
            item_count: validItems.length,
            status,
            priority,
            has_image: Boolean(imageFile),
          })
          toast.success('Ordonnance enregistrée')
          await onCreated?.()
          onCancel()
        }
      } finally {
        setSubmitting(false)
      }
    },
    [
      patientRef,
      prescriberName,
      prescribedDate,
      expiryDate,
      status,
      priority,
      pharmacy,
      imageFile,
      medicationItems,
      onCancel,
      defaultValues,
      executionDate,
      isEditing,
      onCreated,
      onSubmit,
    ]
  )

  return (
    <form id="prescription-form" onSubmit={handleSubmit} className="min-w-0 space-y-4">
      {!isEditing && (
        <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-3">
          <h4 className="text-sm font-semibold">Ordonnance (photo / PDF)</h4>

          <label
            htmlFor="prescription-image"
            className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 transition-colors hover:bg-slate-100"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-transparent">
              <Camera className="h-5 w-5 text-slate-700" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900">
                Ajouter une ordonnance
              </p>
              <p className="text-xs text-slate-500">
                Touchez ici pour prendre une photo ou choisir un fichier (image / PDF).
              </p>
            </div>
          </label>
            <Input
              id="prescription-image"
              type="file"
              accept="image/*,application/pdf,.heic,.heif"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                handleImageChange(e.target.files?.[0] ?? null)
                e.currentTarget.value = ''
              }}
            />

          {previewUrl && (
            <div className="flex max-h-[min(45vh,320px)] w-full justify-center overflow-hidden rounded-md border bg-muted">
              <Image
                src={previewUrl}
                alt="Aperçu ordonnance"
                width={1200}
                height={900}
                unoptimized
                className="h-auto max-h-[min(45vh,320px)] w-full object-contain"
              />
            </div>
          )}

          {isPdf && (
            <p className="text-xs text-muted-foreground">
              Fichier PDF sélectionné: {imageFile?.name}
            </p>
          )}

          <Button
            type="button"
            variant="outline"
            onClick={handleOcr}
            disabled={!imageFile || ocrLoading}
          >
            {ocrLoading ? 'Analyse…' : "Analyser l'ordonnance"}
          </Button>
        </div>
      )}

      <div className="space-y-2 rounded-2xl border border-slate-200 bg-white p-3">
        <label htmlFor="patient_ref" className="text-xs text-muted-foreground block mb-1">Patient *</label>
        <Input
          id="patient_ref"
          value={patientRef}
          onChange={(e) => setPatientRef(e.target.value)}
          placeholder='Ex : "M. D.", "Enfant B."'
          required
        />
      </div>

      <div className="grid grid-cols-1 gap-3 rounded-2xl border border-slate-200 bg-white p-3 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="prescriber_name" className="text-xs text-muted-foreground">
            Prescripteur
          </Label>
          <Input
            id="prescriber_name"
            value={prescriberName}
            onChange={(e) => setPrescriberName(e.target.value)}
            placeholder="Dr Nom Prénom"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="prescribed_date" className="text-xs text-muted-foreground">
            Date de prescription
          </Label>
          <Input
            id="prescribed_date"
            type="date"
            value={prescribedDate}
            onChange={(e) => setPrescribedDate(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="expiry_date" className="text-xs text-muted-foreground">
            Date d&apos;expiration
          </Label>
          <Input
            id="expiry_date"
            type="date"
            value={expiryDate}
            min={prescribedDate || undefined}
            onChange={(e) => setExpiryDate(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold">Médicaments</h4>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="rounded-full"
              onClick={addMedication}
            >
              Ajouter un médicament
            </Button>
          </div>

          {medicationItems.length === 0 && (
            <p className="text-xs text-muted-foreground">
              Aucun médicament extrait. Vous pouvez les ajouter manuellement.
            </p>
          )}

          <div className="space-y-2">
            {medicationItems.map((item) => (
              <div key={item.localId} className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50/50 p-3 mb-3 relative">
                <div className="absolute right-2 top-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-400 hover:text-destructive hover:bg-destructive/10"
                    onClick={() => removeMedication(item.localId)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-1.5 pr-8">
                  <Label className="text-xs text-muted-foreground font-medium">Médicament</Label>
                  <Input
                    className="bg-white"
                    placeholder="Nom du médicament"
                    value={item.medication_name}
                    onChange={(e) =>
                      updateMedication(item.localId, { medication_name: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground font-medium">Posologie</Label>
                  <Input
                    className="bg-white"
                    placeholder="Ex: 1 matin et soir"
                    value={item.dosage}
                    onChange={(e) => updateMedication(item.localId, { dosage: e.target.value })}
                  />
                </div>

                  <div className="space-y-1.5 w-1/2">
                    <Label className="text-xs text-muted-foreground font-medium">Quantité</Label>
                    <Input
                      className="bg-white"
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) =>
                        updateMedication(item.localId, {
                          quantity: Number(e.target.value) || 1,
                        })
                      }
                    />
                  </div>
              </div>
            ))}
          </div>
        </div>



      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 rounded-2xl border border-slate-200 bg-white p-3">
        <div className="space-y-2">
          <label htmlFor="executionDate" className="text-xs text-muted-foreground block mb-1">Échéance</label>
          <Input
            id="executionDate"
            type="datetime-local"
            value={executionDate}
            onChange={(e) => setExecutionDate(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="status" className="text-xs text-muted-foreground block mb-1">Statut</label>
          <Select
            value={status}
            onValueChange={(v) => setStatus(v as PrescriptionStatus)}
          >
            <SelectTrigger id="status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {/* 'expired' retiré : statut cron-only (trigger 0059 bloque
                  l'écriture manuelle). Réouverture toujours autorisée donc
                  to_serve/served/on_hold restent sélectionnables. */}
              {Object.entries(PRESCRIPTION_STATUS_LABELS)
                .filter(([key]) => key !== 'expired')
                .map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label htmlFor="priority" className="text-xs text-muted-foreground block mb-1">Priorité</label>
          <Select
            value={priority}
            onValueChange={(v) => setPriority(v as TaskPriority)}
          >
            <SelectTrigger id="priority">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(PRIORITY_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>



      <FormActions
        onCancel={onCancel}
        submitLabel={isEditing ? 'Mettre à jour' : "Créer l'ordonnance"}
        submitting={submitting}
        disabled={!patientRef.trim()}
        submitForm="prescription-form"
      />
    </form>
  )
}


// ============================================================================
// FILE: src/components/prescriptions/prescription-table.tsx
// ============================================================================
