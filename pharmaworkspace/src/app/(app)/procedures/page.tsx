'use client'

import React, { useMemo, useState } from 'react'
import { Plus, FileText, Search } from 'lucide-react'
import { useProfile } from '@/contexts/profile-context'
import { useTraining } from '@/hooks/use-training'
import { TrainingCard } from '@/components/formation/training-card'
import { TrainingForm } from '@/components/formation/training-form'
import { TrainingResourceViewer } from '@/components/formation/training-video-player'
import { getSignedAttachmentUrl } from '@/lib/storage/get-signed-url'
import { cn } from '@/lib/utils'
import type { TrainingResource } from '@/types/index'

export default function ProceduresPage() {
  const { profile, canWrite } = useProfile()
  const { resources, loading, createResource, updateResource, deleteResource } = useTraining()

  const [activeFilter, setActiveFilter] = useState<'all' | 'video' | 'memo'>('all')
  const [showForm, setShowForm] = useState(false)
  const [selectedResource, setSelectedResource] = useState<TrainingResource | undefined>()
  const [playingResource, setPlayingResource] = useState<TrainingResource | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const filteredResources = useMemo(() => {
    return resources.filter((resource) => {
      const matchType = activeFilter === 'all' || resource.type === activeFilter
      const q = searchQuery.trim().toLowerCase()
      const matchSearch =
        !q ||
        resource.title.toLowerCase().includes(q) ||
        (resource.description ?? '').toLowerCase().includes(q)
      return matchType && matchSearch
    })
  }, [resources, activeFilter, searchQuery])

  const openCreateForm = () => {
    setSelectedResource(undefined)
    setShowForm(true)
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4 pb-8 lg:max-w-7xl lg:space-y-6 lg:pb-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight">Qualité &amp; proc</h1>
          <p className="text-sm text-muted-foreground">
            Procédures, documents et vidéos opérationnels de l&apos;officine.
          </p>
        </div>
        {canWrite ? (
          <button
            type="button"
            onClick={openCreateForm}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white shadow-lg transition-transform active:scale-95"
            aria-label="Ajouter une procédure"
          >
            <Plus className="h-6 w-6" />
          </button>
        ) : null}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar lg:mb-2">
        {[
          { id: 'all', label: 'Tous' },
          { id: 'memo', label: 'Documents / Images' },
          { id: 'video', label: 'Vidéos' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveFilter(tab.id as 'all' | 'video' | 'memo')}
            className={cn(
              'whitespace-nowrap rounded-full border px-3 py-2 text-xs font-medium transition-all',
              activeFilter === tab.id
                ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          placeholder="Rechercher une procédure..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-11 w-full rounded-xl border border-slate-200 bg-white py-2 pl-10 pr-4 text-sm shadow-sm outline-none transition-colors placeholder:text-slate-500 focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
        />
      </div>

      {loading ? (
        <div className="space-y-3 lg:grid lg:grid-cols-3 lg:gap-6 lg:space-y-0">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-2xl border border-slate-200 bg-white lg:h-64"
            />
          ))}
        </div>
      ) : filteredResources.length === 0 ? (
        <div className="flex min-h-[280px] items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-white/80 p-8 text-center">
          <div className="max-w-sm">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-300">
              <FileText size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Aucune procédure pour le moment</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">
              Ajoutez des fichiers Word/PDF, images ou vidéos comme base documentaire.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3 lg:grid lg:grid-cols-3 lg:gap-6 lg:space-y-0">
          {filteredResources.map((resource) => (
            <TrainingCard
              key={resource.id}
              resource={resource}
              canManage={canWrite}
              onEdit={(r) => {
                setSelectedResource(r)
                setShowForm(true)
              }}
              onDelete={deleteResource}
              onTogglePublish={(r) => updateResource(r.id, { is_published: !r.is_published })}
              onPlay={(r) => {
                const isVideo = r.type === 'video'
                const isImage = /\.(jpg|jpeg|png|webp|gif|heic|heif)$/i.test(
                  r.storage_path || r.url || ''
                )
                const isPdf = (r.storage_path || r.url || '').toLowerCase().endsWith('.pdf')

                if (isVideo || isImage || isPdf) {
                  setPlayingResource(r)
                  return
                }

                if (r.url) {
                  window.open(r.url, '_blank')
                  return
                }
                if (r.storage_path) {
                  void getSignedAttachmentUrl('training-files', r.storage_path).then((signed) => {
                    if (signed) window.open(signed, '_blank')
                  })
                }
              }}
            />
          ))}
        </div>
      )}

      <TrainingForm
        open={showForm}
        onClose={() => setShowForm(false)}
        resource={selectedResource}
        onSave={
          selectedResource
            ? async (data) => {
                await updateResource(selectedResource.id, data)
              }
            : async (data) => {
                await createResource(data)
              }
        }
        pharmacyId={profile?.pharmacy_id || ''}
        profileId={profile?.id || ''}
      />

      <TrainingResourceViewer
        resource={playingResource}
        open={!!playingResource}
        onClose={() => setPlayingResource(null)}
        onEdit={(r) => {
          setSelectedResource(r)
          setShowForm(true)
        }}
        onDelete={deleteResource}
        canManage={profile?.role === 'titulaire' || profile?.role === 'adjoint'}
        canDelete={profile?.role === 'titulaire'}
      />
    </div>
  )
}
