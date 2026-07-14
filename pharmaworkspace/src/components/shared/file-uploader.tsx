'use client'

import React, { useState, useRef } from 'react'
import { Paperclip, Loader2, X, File as FileIcon, Download } from 'lucide-react'
import { downloadAttachmentFile, openAttachmentInNewTab } from '@/lib/tasks/task-attachments'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { uploadAttachmentFile } from '@/lib/storage/upload-attachment'
import { SignedImage } from '@/components/shared/signed-image'
import { ImageLightbox } from '@/components/shared/image-lightbox'
import type { SignedBucket } from '@/lib/storage/get-signed-url'

export interface Attachment {
  path: string
  name: string
  type: string
}

interface FileUploaderProps {
  pharmacyId: string
  folderPath: string
  onUploaded: (attachment: Attachment) => void
}

export function FileUploader({ pharmacyId, folderPath, onUploaded }: FileUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : []
    if (files.length === 0) return

    setUploading(true)
    let added = 0
    try {
      for (const file of files) {
        const result = await uploadAttachmentFile(pharmacyId, folderPath, file)
        if ('error' in result) {
          toast.error(`${file.name} : ${result.error}`)
          continue
        }
        onUploaded(result.attachment)
        added++
      }
      if (added > 0) {
        toast.success(
          added === 1 ? 'Document ajouté' : `${added} documents ajoutés`
        )
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Erreur lors de l'upload du document"
      toast.error(message)
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <div className="flex items-center gap-2">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        multiple
        accept=".pdf,.doc,.docx,.xls,.xlsx,image/*"
      />
      
      {uploading ? (
        <div className="flex items-center gap-2 text-sm text-slate-500 bg-slate-50 border border-slate-200 rounded-full px-4 py-2 w-max">
          <Loader2 className="h-4 w-4 animate-spin" />
          Upload en cours...
        </div>
      ) : (
        <Button 
          type="button" 
          variant="outline" 
          size="sm" 
          className="rounded-full" 
          onClick={() => fileInputRef.current?.click()}
        >
          <Paperclip className="h-4 w-4 mr-2" />
          Ajouter un document
        </Button>
      )}
    </div>
  )
}

export function AttachmentList({
  attachments,
  onDelete,
  bucket = 'attachments',
}: {
  attachments: Attachment[]
  onDelete?: (index: number) => void
  bucket?: SignedBucket
}) {
  // Aperçu image plein écran (in-app, jamais de nouvel onglet).
  const [previewPath, setPreviewPath] = useState<string | null>(null)

  if (!attachments || attachments.length === 0) return null

  return (
    <>
      <div className="flex flex-col gap-2 mt-2">
        {attachments.map((att, i) => {
          const deleteButton = onDelete ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-slate-400 hover:text-red-500 shrink-0"
              onClick={(e) => {
                e.stopPropagation()
                onDelete(i)
              }}
              aria-label="Supprimer la pièce jointe"
            >
              <X className="h-4 w-4" />
            </Button>
          ) : null

          const downloadButton = (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 shrink-0 rounded-full px-3 text-xs"
              onClick={(e) => {
                e.stopPropagation()
                void downloadAttachmentFile(att)
              }}
            >
              <Download className="h-3.5 w-3.5 mr-1" />
              Télécharger
            </Button>
          )

          // Image : vignette VISIBLE inline + clic → aperçu plein écran in-app.
          if (att.type === 'image') {
            return (
              <div
                key={`${att.path}-${i}`}
                className="overflow-hidden rounded-lg border border-slate-200 bg-white"
              >
                <button
                  type="button"
                  onClick={() => setPreviewPath(att.path)}
                  className="block w-full cursor-zoom-in bg-slate-50"
                  aria-label={`Agrandir ${att.name}`}
                >
                  <SignedImage
                    bucket={bucket}
                    path={att.path}
                    alt={att.name}
                    className="max-h-56 w-full object-contain"
                  />
                </button>
                <div className="flex items-center gap-2 border-t border-slate-100 px-2 py-1.5">
                  <span
                    className="min-w-0 flex-1 truncate text-xs font-medium text-slate-600"
                    title={att.name}
                  >
                    {att.name}
                  </span>
                  {downloadButton}
                  {deleteButton}
                </div>
              </div>
            )
          }

          // Non-image (PDF/doc) : ligne compacte, ouverture dans un nouvel onglet.
          return (
            <div
              key={`${att.path}-${i}`}
              className="flex items-center gap-2 p-2 border border-slate-200 rounded-lg bg-white w-full cursor-pointer hover:bg-slate-50 transition-colors"
              onClick={() => void openAttachmentInNewTab(att)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  void openAttachmentInNewTab(att)
                }
              }}
            >
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <FileIcon className="h-4 w-4 text-slate-400 shrink-0" />
                <span className="text-sm truncate text-slate-700 font-medium" title={att.name}>
                  {att.name}
                </span>
              </div>
              {downloadButton}
              {deleteButton}
            </div>
          )
        })}
      </div>

      {previewPath ? (
        <ImageLightbox bucket={bucket} path={previewPath} onClose={() => setPreviewPath(null)} />
      ) : null}
    </>
  )
}
