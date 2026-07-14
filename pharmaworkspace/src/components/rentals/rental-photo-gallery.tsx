'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import Image from 'next/image'
import { Loader2, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import { removeRentalPhoto } from '@/features/rentals/services/rental-attachment.service'
import { getRentalAttachments } from '@/lib/queries/rental-attachments'
import { useSignedUrl } from '@/lib/storage/get-signed-url'
import type { RentalAttachment } from '@/types/index'

function RentalPhotoThumb({
  attachment,
  canDelete,
  onDeleted,
  onPreview,
}: {
  attachment: RentalAttachment
  canDelete: boolean
  onDeleted: () => void
  onPreview: (url: string) => void
}) {
  const { data: signedUrl, isLoading } = useSignedUrl('attachments', attachment.storage_path)
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    setDeleting(true)
    const result = await removeRentalPhoto(attachment.id)
    setDeleting(false)
    if (result.error) {
      toast.error(result.error)
      return
    }
    toast.success('Photo supprimée')
    onDeleted()
  }

  return (
    <div className="group relative aspect-square overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
      {isLoading || !signedUrl ? (
        <div className="flex h-full items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
        </div>
      ) : (
        <button
          type="button"
          className="relative h-full w-full"
          aria-label={attachment.original_filename ?? 'Photo location'}
          onClick={() => onPreview(signedUrl)}
        >
          <Image
            src={signedUrl}
            alt={attachment.original_filename ?? 'Photo'}
            fill
            className="object-cover"
            unoptimized
          />
        </button>
      )}
      {canDelete && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute right-1 top-1 h-7 w-7 opacity-90"
              disabled={deleting}
              aria-label="Supprimer la photo"
              onClick={(e) => e.stopPropagation()}
            >
              {deleting ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Trash2 className="h-3 w-3" />
              )}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Supprimer cette photo ?</AlertDialogTitle>
              <AlertDialogDescription>
                L&apos;image sera retirée de la location et du stockage.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction onClick={() => void handleDelete()}>
                Supprimer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  )
}

type RentalPhotoGalleryProps = {
  rentalId: string
  canDelete?: boolean
}

export function RentalPhotoGallery({
  rentalId,
  canDelete = false,
}: RentalPhotoGalleryProps) {
  const qc = useQueryClient()
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const { data: attachments = [], isLoading } = useQuery({
    queryKey: ['rental-attachments', rentalId],
    queryFn: async () => {
      const r = await getRentalAttachments(rentalId)
      if (r.error) throw new Error(r.error)
      return r.data ?? []
    },
    enabled: !!rentalId,
  })

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ['rental-attachments', rentalId] })
  }

  if (isLoading) {
    return (
      <p className="text-sm text-muted-foreground flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        Chargement des photos…
      </p>
    )
  }

  if (attachments.length === 0) {
    return <p className="text-sm text-muted-foreground">Aucune photo pour cette location.</p>
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {attachments.map((att) => (
          <RentalPhotoThumb
            key={att.id}
            attachment={att}
            canDelete={canDelete}
            onDeleted={invalidate}
            onPreview={setPreviewUrl}
          />
        ))}
      </div>

      <Dialog open={!!previewUrl} onOpenChange={(open) => !open && setPreviewUrl(null)}>
        <DialogContent className="max-w-3xl border-0 bg-black/95 p-2 sm:p-4">
          <DialogTitle className="sr-only">Aperçu photo</DialogTitle>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2 z-10 text-white hover:bg-white/20"
            onClick={() => setPreviewUrl(null)}
            aria-label="Fermer"
          >
            <X className="h-5 w-5" />
          </Button>
          {previewUrl && (
            <div className="relative mx-auto aspect-[4/3] w-full max-h-[80vh]">
              <Image
                src={previewUrl}
                alt="Aperçu"
                fill
                className="object-contain"
                unoptimized
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
