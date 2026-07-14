'use client'

import Image from 'next/image'
import { useCallback, useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { DetailDrawer } from '@/components/shared/detail-drawer'
import { DrawerActions } from '@/components/shared/drawer-actions'
import { StatusBadge } from '@/components/shared/status-badge'
import { PriorityBadge } from '@/components/shared/priority-badge'
import { PrescriptionForm } from '@/components/prescriptions/prescription-form'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Trash2, CheckCircle2 } from 'lucide-react'
import { useProfile } from '@/contexts/profile-context'
import { prescriptionsService } from '@/features/prescriptions'
import type {
  PrescriptionWithComments,
  PrescriptionItem,
  UpdatePrescription,
} from '@/types/index'

type PrescriptionDrawerProps = {
  prescriptionId: string | null
  open: boolean
  onClose: () => void
  onUpdate: (id: string, payload: UpdatePrescription) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

export function PrescriptionDrawer({
  prescriptionId,
  open,
  onClose,
  onUpdate,
  onDelete,
}: PrescriptionDrawerProps) {
  const { profile, pharmacy, isAdmin, canWriteTasks } = useProfile()
  const pharmacyId = pharmacy?.id ?? null
  const [prescription, setPrescription] =
    useState<PrescriptionWithComments | null>(null)
  const [loading, setLoading] = useState(false)
  const [editing, setEditing] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)
  const [imageOpen, setImageOpen] = useState(false)
  const [imageUrl, setImageUrl] = useState<string | null>(null)

  const isPdf = prescription?.image_url?.toLowerCase().endsWith('.pdf')

  useEffect(() => {
    if (!prescription?.image_url) return
    let cancelled = false
    void prescriptionsService.getSignedImageUrl(prescription.image_url).then((signedUrl) => {
        if (cancelled) return
        if (signedUrl) setImageUrl(signedUrl)
        else setImageUrl(null)
      })
    return () => {
      cancelled = true
    }
  }, [prescription?.image_url])

  const fetchDetail = useCallback(async () => {
    if (!prescriptionId) return
    setLoading(true)
    const result = await prescriptionsService.getPrescriptionById(prescriptionId)
    if (result.data) {
      setPrescription(result.data)
    }
    setLoading(false)
  }, [prescriptionId])

  useEffect(() => {
    if (open && prescriptionId) {
      const timeoutId = setTimeout(() => {
        setEditing(false)
        setCommentText('')
        void fetchDetail()
      }, 0)
      return () => clearTimeout(timeoutId)
    }
  }, [open, prescriptionId, fetchDetail])

  const handleUpdate = useCallback(
    async (payload: UpdatePrescription) => {
      if (!prescriptionId) return
      await onUpdate(prescriptionId, payload)
      setEditing(false)
      await fetchDetail()
    },
    [prescriptionId, onUpdate, fetchDetail]
  )

  const handleDelete = useCallback(async () => {
    if (!prescriptionId) return
    if (!window.confirm('Supprimer cette ordonnance ?')) return
    await onDelete(prescriptionId)
    onClose()
  }, [prescriptionId, onDelete, onClose])

  const handleAddComment = useCallback(async () => {
    if (!prescriptionId || !pharmacyId || !commentText.trim()) return
    setSubmittingComment(true)
    await prescriptionsService.addPrescriptionComment(
      prescriptionId,
      pharmacyId,
      commentText.trim()
    )
    setCommentText('')
    setSubmittingComment(false)
    await fetchDetail()
  }, [prescriptionId, pharmacyId, commentText, fetchDetail])

  const handleDeleteComment = useCallback(
    async (commentId: string) => {
      if (!window.confirm('Supprimer ce commentaire ?')) return
      await prescriptionsService.deletePrescriptionComment(commentId)
      await fetchDetail()
    },
    [fetchDetail]
  )

  const canDeleteComment = (authorId: string) =>
    profile?.id === authorId || isAdmin





  const actions = (
    <DrawerActions
      canEdit={canWriteTasks}
      canDelete={isAdmin}
      onEdit={() => setEditing(true)}
      onDelete={handleDelete}
    />
  )

  return (
    <DetailDrawer
      open={open}
      onClose={onClose}
      title={
        prescription
          ? `Ordonnance : ${prescription.patient_ref}`
          : 'Ordonnance'
      }
      actions={!editing ? actions : undefined}
      width="lg"
    >
      {loading && (
        <p className="text-sm text-muted-foreground">Chargement…</p>
      )}

      {!loading && prescription && !editing && (
        <div className="space-y-6">
          {canWriteTasks && prescription.status !== 'served' && (
            <button
              type="button"
              onClick={() => handleUpdate({ status: 'served' })}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-500"
            >
              <CheckCircle2 className="h-4 w-4" />
              Marquer comme servie
            </button>
          )}

          {/* Metadata grid */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Patient</p>
              <p className="text-sm font-medium">{prescription.patient_ref}</p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground">Prescripteur</p>
              <p className="text-sm font-medium">{prescription.prescriber_name ?? '-'}</p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground">Date de prescription</p>
              <p className="text-sm">
                {prescription.prescribed_date
                  ? new Date(prescription.prescribed_date).toLocaleDateString('fr-FR')
                  : '-'}
              </p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground">Date d&apos;expiration</p>
              <p
                className={cn(
                  'text-sm font-medium',
                  prescription.expiry_date &&
                    prescription.status !== 'served' &&
                    prescription.status !== 'expired' &&
                    new Date(prescription.expiry_date).getTime() < new Date().getTime()
                    ? 'text-red-600'
                    : 'text-slate-900'
                )}
              >
                {prescription.expiry_date
                  ? new Date(prescription.expiry_date).toLocaleDateString('fr-FR')
                  : '-'}
              </p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground">Statut</p>
              <div className="mt-1">
                <StatusBadge status={prescription.status} />
              </div>
            </div>

            <div>
              <p className="text-xs text-muted-foreground">Priorité</p>
              <div className="mt-1">
                <PriorityBadge priority={prescription.priority} />
              </div>
            </div>

            <div>
              <p className="text-xs text-muted-foreground">Créée le</p>
              <p className="text-sm">
                {new Date(prescription.created_at).toLocaleDateString('fr-FR')}
              </p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground">Échéance</p>
              {prescription.execution_date ? (
                <p className={cn(
                  "text-sm font-medium",
                  prescription.status !== 'served' && new Date(prescription.execution_date).getTime() < new Date().getTime() 
                    ? "text-red-600" 
                    : "text-amber-700"
                )}>
                  {new Date(prescription.execution_date).toLocaleString('fr-FR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  }).replace(':', 'h')}
                </p>
              ) : (
                <p className="text-sm text-slate-500">-</p>
              )}
            </div>
          </div>

          {/* Prescription image */}
          {prescription.image_url && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Ordonnance</h3>
              {imageUrl ? (
                isPdf ? (
                  <div className="flex flex-col items-start gap-2">
                    <iframe src={`${imageUrl}#view=FitH`} className="w-full h-64 border rounded-md bg-slate-50" title="Ordonnance PDF" />
                    <Button variant="outline" size="sm" onClick={() => setImageOpen(true)}>Agrandir le PDF</Button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="overflow-hidden rounded-md border"
                    onClick={() => setImageOpen(true)}
                  >
                    <Image
                      src={imageUrl}
                      alt="Ordonnance"
                      width={640}
                      height={360}
                      className="h-auto w-full object-cover"
                    />
                  </button>
                )
              ) : null}
            </div>
          )}

          {/* Medications */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Médicaments</h3>

            {(prescription.items ?? []).length === 0 && (
              <p className="text-sm text-muted-foreground">Aucun médicament associé.</p>
            )}

            <div className="space-y-2">
              {(prescription.items ?? []).map((item: PrescriptionItem) => (
                <div key={item.id} className="rounded-md border border-slate-200 bg-white p-2 text-sm space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="font-medium">{item.medication_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.dosage ?? 'Dosage non renseigné'} · Qté {item.quantity}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>



          {/* Comments */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Commentaires</h3>

            {prescription.comments.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Aucun commentaire.
              </p>
            )}

            <div className="space-y-2">
              {prescription.comments.map((comment) => (
                <div
                  key={comment.id}
                  className="rounded-md border border-slate-200 bg-white p-3 text-sm"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium">
                      {comment.author.display_name}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {new Date(comment.created_at).toLocaleString('fr-FR')}
                      </span>
                      {canDeleteComment(comment.author.id) && (
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>
                  <p>{comment.content}</p>
                </div>
              ))}
            </div>

            {/* Add comment */}
            <div className="flex gap-2 mt-3">
              <Textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Ajouter un commentaire…"
                rows={2}
                className="flex-1"
              />
              <Button
                size="sm"
                onClick={handleAddComment}
                disabled={submittingComment || !commentText.trim()}
                className="self-end"
              >
                Envoyer
              </Button>
            </div>
          </div>
        </div>
      )}

      {!loading && prescription && editing && (
        <PrescriptionForm
          defaultValues={prescription}
          onSubmit={async (payload) => {
            await handleUpdate(payload as UpdatePrescription)
          }}
          onCancel={() => setEditing(false)}
        />
      )}

      {prescription?.image_url && imageOpen && imageUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setImageOpen(false)}
        >
          <div className="relative flex max-h-[90vh] max-w-[90vw] items-center justify-center overflow-hidden rounded-md">
            {isPdf ? (
              <iframe
                src={imageUrl}
                className="h-[85vh] w-[85vw] bg-white rounded-md"
                title="Ordonnance PDF plein écran"
              />
            ) : (
              <Image
                src={imageUrl}
                alt="Ordonnance plein écran"
                width={1400}
                height={1000}
                className="h-auto w-auto max-h-[90vh] max-w-[90vw] object-contain"
              />
            )}
          </div>
        </div>
      )}
    </DetailDrawer>
  )
}
