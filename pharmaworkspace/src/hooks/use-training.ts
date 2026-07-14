'use client'

import { useCallback, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useProfile } from '@/contexts/profile-context'
import {
  getTrainingResources,
  createTrainingResource,
  updateTrainingResource,
  deleteTrainingResource,
  uploadResourceFile,
  deleteResourceFile,
} from '@/lib/queries/training'
import type { TrainingResource } from '@/types/index'
import { toast } from 'sonner'

export function useTraining() {
  const { profile, canWrite } = useProfile()
  const queryClient = useQueryClient()
  const pharmacyId = profile?.pharmacy_id ?? null

  const query = useQuery({
    queryKey: ['training', pharmacyId, canWrite] as const,
    enabled: Boolean(pharmacyId),
    queryFn: async () => {
      const { data, error } = await getTrainingResources(pharmacyId!, canWrite)
      if (error) throw new Error(error)
      return data ?? []
    },
  })

  const resources = useMemo<TrainingResource[]>(() => query.data ?? [], [query.data])

  const invalidate = useCallback(
    () => queryClient.invalidateQueries({ queryKey: ['training', pharmacyId] }),
    [queryClient, pharmacyId]
  )

  const createResource = useCallback(
    async (payload: Omit<TrainingResource, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await createTrainingResource(payload)
      if (error) {
        toast.error(
          error.length > 160
            ? `Erreur lors de la création : ${error.slice(0, 160)}…`
            : `Erreur lors de la création : ${error}`
        )
        throw new Error(error)
      }
      toast.success('Ressource créée')
      await invalidate()
      return data
    },
    [invalidate]
  )

  const updateResource = useCallback(
    async (id: string, payload: Partial<TrainingResource>) => {
      const { data, error } = await updateTrainingResource(id, payload)
      if (error) {
        toast.error('Erreur lors de la mise à jour')
        throw new Error(error)
      }
      toast.success('Ressource mise à jour')
      await invalidate()
      return data
    },
    [invalidate]
  )

  const deleteResource = useCallback(
    async (resource: TrainingResource) => {
      try {
        if (resource.storage_path) {
          await deleteResourceFile(resource.storage_path)
        }
        const { error } = await deleteTrainingResource(resource.id)
        if (error) throw new Error(error)
        toast.success('Ressource supprimée')
        await invalidate()
      } catch {
        toast.error('Erreur lors de la suppression')
      }
    },
    [invalidate]
  )

  const uploadFile = useCallback(
    async (file: File, type: 'video' | 'memo') => {
      if (!pharmacyId) throw new Error('Pharmacy ID missing')
      return uploadResourceFile(file, pharmacyId, type)
    },
    [pharmacyId]
  )

  return {
    resources,
    loading: query.isLoading,
    refresh: invalidate,
    createResource,
    updateResource,
    deleteResource,
    uploadFile,
  }
}
