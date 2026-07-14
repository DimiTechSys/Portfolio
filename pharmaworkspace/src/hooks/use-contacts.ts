'use client'

import { useCallback, useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useProfile } from '@/contexts/profile-context'
import {
  getContacts,
  createContact as createContactQuery,
  updateContact as updateContactQuery,
  deleteContact as deleteContactQuery,
} from '@/lib/queries/contacts'
import type {
  Contact,
  NewContact,
  UpdateContact,
} from '@/types/index'

export function useContacts() {
  const { pharmacy, profile } = useProfile()
  const queryClient = useQueryClient()
  const pharmacyId = pharmacy?.id ?? null

  const query = useQuery({
    queryKey: ['contacts', pharmacyId] as const,
    enabled: Boolean(pharmacyId),
    queryFn: async () => {
      const result = await getContacts(pharmacyId!)
      if (result.error) throw new Error(result.error)
      return result.data ?? []
    },
  })

  const contacts = useMemo<Contact[]>(() => query.data ?? [], [query.data])

  const invalidate = useCallback(
    () => queryClient.invalidateQueries({ queryKey: ['contacts', pharmacyId] }),
    [queryClient, pharmacyId]
  )

  const createMutation = useMutation({
    mutationFn: async (payload: Omit<NewContact, 'pharmacy_id' | 'created_by'>) => {
      if (!pharmacy || !profile) throw new Error('Profil ou officine manquant.')
      const result = await createContactQuery({
        ...payload,
        pharmacy_id: pharmacy.id,
        created_by: profile.id,
      })
      if (result.error) throw new Error(result.error)
      return result.data
    },
    onSuccess: () => void invalidate(),
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: UpdateContact }) => {
      const result = await updateContactQuery(id, payload)
      if (result.error) throw new Error(result.error)
      return result.data
    },
    onSuccess: () => void invalidate(),
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteContactQuery(id)
      if (result.error) throw new Error(result.error)
    },
    onSuccess: () => void invalidate(),
  })

  const createContact = useCallback(
    (payload: Omit<NewContact, 'pharmacy_id' | 'created_by'>) => createMutation.mutateAsync(payload),
    [createMutation]
  )
  const updateContact = useCallback(
    (id: string, payload: UpdateContact) => updateMutation.mutateAsync({ id, payload }),
    [updateMutation]
  )
  const deleteContact = useCallback(
    (id: string) => deleteMutation.mutateAsync(id),
    [deleteMutation]
  )

  const error =
    (query.error as Error | null)?.message ??
    (createMutation.error as Error | null)?.message ??
    (updateMutation.error as Error | null)?.message ??
    (deleteMutation.error as Error | null)?.message ??
    null

  return {
    contacts,
    loading: query.isLoading,
    error,
    createContact,
    updateContact,
    deleteContact,
    refresh: invalidate,
  }
}
