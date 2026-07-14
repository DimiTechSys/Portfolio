'use client'

import React from 'react'
import {
  PlayCircle,
  Video,
  FileText,
  MoreVertical,
  Edit2,
  Trash2,
  Eye,
  EyeOff
} from 'lucide-react'
import { useSignedUrl } from '@/lib/storage/get-signed-url'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { cn } from '@/lib/utils'
import type { TrainingResource } from '@/types/index'

interface TrainingCardProps {
  resource: TrainingResource
  canManage: boolean
  onEdit: (resource: TrainingResource) => void
  onDelete: (resource: TrainingResource) => void
  onTogglePublish: (resource: TrainingResource) => void
  onPlay: (resource: TrainingResource) => void
}

export function TrainingCard({
  resource,
  canManage,
  onEdit,
  onDelete,
  onTogglePublish,
  onPlay,
}: TrainingCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false)

  const isVideo = resource.type === 'video'
  const isMemo = resource.type === 'memo'
  const isExternal = !!resource.url
  const isInternal = !!resource.storage_path
  const isPdf = React.useMemo(() => {
    const path = resource.storage_path || resource.url || ''
    return /\.pdf($|\?)/i.test(path)
  }, [resource.storage_path, resource.url])

  // YouTube thumbnail (external) is a public URL; internal thumbnails go through signed URL.
  const youtubeThumb = React.useMemo(() => {
    if (!resource.url) return null
    const ytMatch = resource.url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?/\s]+)/)
    return ytMatch ? `https://img.youtube.com/vi/${ytMatch[1]}/mqdefault.jpg` : null
  }, [resource.url])

  const looksLikeImage = React.useMemo(() => {
    const path = resource.storage_path || resource.url
    if (!path) return false
    return /\.(jpg|jpeg|png|webp|gif|heic|heif)$/i.test(path) ||
      Boolean(resource.url && !resource.url.includes('youtube') && !resource.url.includes('loom') && !resource.url.includes('vimeo'))
  }, [resource.storage_path, resource.url])

  const internalImagePath = isInternal && looksLikeImage ? resource.storage_path! : null
  const { data: internalImageSigned } = useSignedUrl('training-files', internalImagePath ?? undefined)
  const internalVideoPath = isVideo && isInternal && !looksLikeImage ? resource.storage_path! : null
  const { data: internalVideoSigned } = useSignedUrl('training-files', internalVideoPath ?? undefined)

  const imageUrl = youtubeThumb
    ?? internalImageSigned
    ?? (looksLikeImage && resource.url ? resource.url : null)

  return (
    <>
      <div 
        className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:border-slate-300 hover:shadow-md"
      >
        {/* Mobile View: List-like */}
        <div className="flex sm:hidden items-center p-3 gap-3">
          <div 
            onClick={(e) => {
              e.stopPropagation()
              onPlay(resource)
            }}
            className="flex flex-1 items-center gap-3 min-w-0"
          >
            <div className="flex items-center gap-2 shrink-0">
              <div className="shrink-0">
                {isVideo ? (
                  <div className="p-2 rounded-full bg-blue-50 text-blue-500 border border-blue-100 shadow-sm">
                    <Video size={18} />
                  </div>
                ) : isPdf ? (
                  <div className="p-2 rounded-full bg-red-50 text-red-500 border border-red-100 shadow-sm">
                    <FileText size={18} />
                  </div>
                ) : (
                  <div className="p-2 rounded-full bg-green-50 text-green-500 border border-green-100 shadow-sm">
                    <FileText size={18} />
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-slate-800 truncate">
                {resource.title}
              </h3>
              {resource.description && (
                <p className="text-xs text-slate-500 line-clamp-1">
                  {resource.description}
                </p>
              )}
              {!resource.is_published && (
                 <p className="text-[9px] font-bold text-amber-600 uppercase tracking-tighter mt-0.5">Brouillon</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {canManage && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onEdit(resource)
                  }}
                  className="p-1.5 text-slate-400 hover:text-teal-500 transition-colors"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowDeleteDialog(true)
                  }}
                  className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Desktop View: Card layout */}
        <div 
          className="hidden sm:block cursor-pointer"
          onClick={() => onPlay(resource)}
        >
          {/* Miniature Zone */}
          <div className={cn(
            "relative flex h-36 items-center justify-center transition-colors overflow-hidden",
            isVideo && isExternal && "bg-blue-50 group-hover:bg-blue-100",
            isVideo && isInternal && "bg-teal-50 group-hover:bg-teal-100",
            isMemo && isPdf && !imageUrl && "bg-red-50 group-hover:bg-red-100",
            isMemo && !isPdf && !imageUrl && "bg-green-50 group-hover:bg-green-100",
            isVideo && !imageUrl && isInternal && "bg-teal-50 group-hover:bg-teal-100",
            isVideo && !imageUrl && isExternal && "bg-blue-50 group-hover:bg-blue-100"
          )}>
            {imageUrl || (isVideo && isInternal) ? (
              <div className="relative h-full w-full">
                {imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={imageUrl}
                    alt={resource.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                ) : internalVideoSigned ? (
                  <video
                    src={internalVideoSigned}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    muted
                    playsInline
                    onLoadedMetadata={(e) => {
                      e.currentTarget.currentTime = 1
                    }}
                  />
                ) : null}
                {isVideo && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/10 transition-colors">
                    <PlayCircle className="h-10 w-10 text-white drop-shadow-lg" strokeWidth={1.5} />
                  </div>
                )}
              </div>
            ) : (
              <>
                {isVideo && isExternal && <PlayCircle className="h-10 w-10 text-blue-500" strokeWidth={1.5} />}
                {isVideo && isInternal && <Video className="h-10 w-10 text-teal-500" strokeWidth={1.5} />}
                {isMemo && isPdf && <FileText className="h-10 w-10 text-red-500" strokeWidth={1.5} />}
                {isMemo && !isPdf && <FileText className="h-10 w-10 text-green-500" strokeWidth={1.5} />}
              </>
            )}

            {imageUrl && (
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
            )
            }

            {/* Type Badge */}
            <div className={cn(
              "absolute bottom-3 left-3 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
              isVideo && isExternal && "bg-blue-100 text-blue-700",
              isVideo && isInternal && "bg-teal-100 text-teal-700",
              isMemo && isPdf && "bg-red-100 text-red-700",
              isMemo && !isPdf && "bg-green-100 text-green-700"
            )}>
              {resource.type === 'video' ? 'Vidéo' : isPdf ? 'PDF' : 'Mémo'}
            </div>

            {/* Unpublished Badge */}
            {!resource.is_published && canManage && (
              <div className="absolute right-3 top-3 flex items-center gap-1 rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700 shadow-sm ring-1 ring-amber-200">
                <EyeOff size={10} />
                Brouillon
              </div>
            )}
          </div>

          {/* Content Zone */}
          <div className="p-4">
            <h3 className="line-clamp-2 text-sm font-semibold text-slate-800 group-hover:text-teal-600 transition-colors">
              {resource.title}
            </h3>
            
            {resource.description && (
              <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                {resource.description}
              </p>
            )}

            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
              </div>

              {canManage && (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowDeleteDialog(true)
                    }}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-400 outline-none transition-colors hover:bg-red-50 hover:text-red-600"
                    aria-label="Supprimer cette ressource"
                    title="Supprimer"
                  >
                    <Trash2 size={15} strokeWidth={2} />
                  </button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <button className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 outline-none">
                      <MoreVertical size={14} />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation()
                      onEdit(resource)
                    }}>
                      <Edit2 className="mr-2 h-3.5 w-3.5" />
                      <span>Modifier</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation()
                      onTogglePublish(resource)
                    }}>
                      {resource.is_published ? (
                        <>
                          <EyeOff className="mr-2 h-3.5 w-3.5" />
                          <span>Dépublier</span>
                        </>
                      ) : (
                        <>
                          <Eye className="mr-2 h-3.5 w-3.5" />
                          <span>Publier</span>
                        </>
                      )}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette ressource ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. La ressource sera définitivement supprimée pour toute l&apos;équipe.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => onDelete(resource)}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
