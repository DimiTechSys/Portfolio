'use client'

import React, { useMemo } from 'react'
import Image from 'next/image'
import { DetailDrawer } from '@/components/shared/detail-drawer'
import { DrawerActions } from '@/components/shared/drawer-actions'
import { ExternalLink, PlayCircle, Download } from 'lucide-react'
import { useSignedUrl, getSignedAttachmentUrl } from '@/lib/storage/get-signed-url'
import type { TrainingResource } from '@/types/index'

interface TrainingResourceViewerProps {
  resource: TrainingResource | null
  open: boolean
  onClose: () => void
  onEdit?: (resource: TrainingResource) => void
  onDelete?: (resource: TrainingResource) => void
  canManage?: boolean
  canDelete?: boolean
}

export function TrainingResourceViewer({
  resource,
  open,
  onClose,
  onEdit,
  onDelete,
  canManage = false,
  canDelete = false,
}: TrainingResourceViewerProps) {
  const internalPath = resource?.storage_path ?? null
  const { data: internalSignedUrl } = useSignedUrl('training-files', internalPath ?? undefined)

  const resourceData = useMemo(() => {
    if (!resource) return null

    const path = resource.storage_path || resource.url
    if (!path) return null

    const isImage = /\.(jpg|jpeg|png|webp|gif|heic|heif)$/i.test(path) ||
                   (resource.type === 'memo' && resource.url && !resource.url.includes('youtube') && !resource.url.includes('loom') && !resource.url.includes('vimeo') && !path.endsWith('.pdf'))

    if (isImage) {
      const url = resource.storage_path ? internalSignedUrl : resource.url
      if (!url) return null
      return { type: 'image' as const, url }
    }

    if (resource.type === 'video') {
      if (resource.storage_path) {
        if (!internalSignedUrl) return null
        return { type: 'native_video' as const, url: internalSignedUrl }
      }

      if (resource.url) {
        const url = resource.url
        const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?/\s]+)/)
        if (ytMatch) {
          return {
            type: 'iframe' as const,
            url: `https://www.youtube.com/embed/${ytMatch[1]}?rel=0&modestbranding=1`,
          }
        }

        const loomMatch = url.match(/loom\.com\/(?:share|embed)\/([^&?/\s]+)/)
        if (loomMatch) {
          return {
            type: 'iframe' as const,
            url: `https://www.loom.com/embed/${loomMatch[1]}`,
          }
        }

        const vimeoMatch = url.match(/vimeo\.com\/([^&?/\s]+)/)
        if (vimeoMatch) {
          return {
            type: 'iframe' as const,
            url: `https://player.vimeo.com/video/${vimeoMatch[1]}`,
          }
        }

        return { type: 'external' as const, url }
      }
    }

    if (resource.type === 'memo' && (path.endsWith('.pdf') || resource.url?.includes('.pdf'))) {
      const url = resource.storage_path ? internalSignedUrl : resource.url
      if (!url) return null
      return { type: 'pdf' as const, url }
    }

    const url = resource.storage_path ? internalSignedUrl : (resource.url || '#')
    if (!url) return null
    return { type: 'external' as const, url }
  }, [resource, internalSignedUrl])

  if (!resource) return null

  return (
    <DetailDrawer
      open={open}
      onClose={onClose}
      title={resource.title}
      subtitle={resource.description ?? undefined}
      width="lg"
      actions={
        (canManage && onEdit) || (canDelete && onDelete) ? (
          <DrawerActions
            canEdit={canManage && Boolean(onEdit)}
            canDelete={canDelete && Boolean(onDelete)}
            onEdit={() => {
              onClose()
              onEdit?.(resource)
            }}
            onDelete={() => {
              onClose()
              onDelete?.(resource)
            }}
          />
        ) : undefined
      }
    >
      <div className="space-y-6">
          {/* Media Zone */}
          <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-slate-900 shadow-xl ring-1 ring-slate-200 flex items-center justify-center">
            {resourceData?.type === 'native_video' && (
              <video
                autoPlay
                controls
                controlsList="nodownload"
                className="h-full w-full object-contain"
                src={resourceData.url}
              >
                Votre navigateur ne supporte pas la lecture vidéo.
              </video>
            )}

            {resourceData?.type === 'iframe' && (
              <iframe
                src={resourceData.url}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="h-full w-full border-none"
                title={resource.title}
              />
            )}

            {resourceData?.type === 'image' && (
              <Image
                src={resourceData.url}
                alt={resource.title}
                fill
                sizes="(max-width: 768px) 100vw, 768px"
                className="object-contain bg-slate-50"
              />
            )}

            {resourceData?.type === 'pdf' && (
               <iframe 
                 src={`${resourceData.url}#toolbar=0`} 
                 className="h-full w-full border-none bg-white"
                 title={resource.title}
               />
            )}

            {resourceData?.type === 'external' && (
              <div className="flex h-full flex-col items-center justify-center p-8 text-center bg-slate-800 text-white">
                <PlayCircle className="mb-4 h-16 w-16 text-teal-400 opacity-50" strokeWidth={1} />
                <p className="mb-6 text-sm text-slate-300">
                  Cette plateforme ne supporte pas l&apos;aperçu direct de ce format.
                </p>
                <a
                  href={resourceData.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-teal-500 hover:scale-105 active:scale-95 shadow-lg shadow-teal-900/40"
                >
                  Ouvrir le document
                  <ExternalLink size={16} />
                </a>
              </div>
            )}
          </div>

          {/* Details Zone */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <div className="h-4 w-1 bg-teal-500 rounded-full" />
                Détails de la ressource
              </h4>
              {resource.storage_path && (
                <button
                  type="button"
                  onClick={async () => {
                    const signed = await getSignedAttachmentUrl('training-files', resource.storage_path!)
                    if (signed) window.open(signed, '_blank', 'noopener,noreferrer')
                  }}
                  className="flex items-center gap-1.5 text-[10px] font-bold text-teal-600 hover:text-teal-700 bg-teal-50 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <Download size={12} />
                  Télécharger
                </button>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-3 sm:p-4 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Source</p>
                <p className="text-xs sm:text-sm font-semibold text-slate-900 truncate">
                  {resource.storage_path ? 'Officine (Interne)' : (resource.url ? new URL(resource.url).hostname : 'Inconnu')}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-3 sm:p-4 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Date</p>
                <p className="text-xs sm:text-sm font-semibold text-slate-900">
                  {new Date(resource.created_at).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })}
                </p>
              </div>
            </div>

            {resource.description && (
               <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                 <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Description complète</p>
                 <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                   {resource.description}
                 </p>
               </div>
            )}
          </div>
      </div>
    </DetailDrawer>
  )
}
