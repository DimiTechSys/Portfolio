import { createClient } from '@/lib/supabase/client'
import { logAudit } from '@/lib/audit/log'
import { AUDIT_ACTIONS, AUDIT_TARGET_TYPES } from '@/lib/audit/actions'
import type { TrainingResource, QueryResult } from '@/types/index'

/**
 * Clé objet Storage (S3 / Supabase) : ASCII uniquement.
 * Les noms en cyrillique ou autres scripts ne sont pas supportés dans la clé : on garde
 * uniquement une extension latine sûre + timestamp + UUID ; le nom d’origine reste visible via `File.name` en UI.
 */
export function buildTrainingStorageObjectKey(
  pharmacyId: string,
  type: 'video' | 'memo',
  originalFileName: string
): string {
  const lastDot = originalFileName.lastIndexOf('.')
  const rawExt = lastDot >= 0 ? originalFileName.slice(lastDot) : ''
  const ext = rawExt.toLowerCase().replace(/[^.a-z0-9]/g, '')
  const safeExt = /^\.[a-z0-9]{1,12}$/.test(ext) ? ext : ''
  const id =
    typeof globalThis.crypto !== 'undefined' &&
    typeof globalThis.crypto.randomUUID === 'function'
      ? globalThis.crypto.randomUUID()
      : `${Math.random().toString(36).slice(2, 14)}${Math.random().toString(36).slice(2, 14)}`
  return `${pharmacyId}/${type}/${Date.now()}_${id}${safeExt}`
}

/**
 * Récupère les ressources de formation d'une pharmacie.
 * Filtre par is_published pour les rôles non-gestionnaires.
 */
export async function getTrainingResources(
  pharmacyId: string,
  includeUnpublished: boolean = false
): Promise<QueryResult<TrainingResource[]>> {
  const supabase = createClient()
  
  let query = supabase
    .from('training_resources')
    .select('*')
    .eq('pharmacy_id', pharmacyId)

  if (!includeUnpublished) {
    query = query.eq('is_published', true)
  }

  const { data, error } = await query.order('order_index', { ascending: true })

  if (error) {
    return { data: null, error: error.message }
  }

  return { data: data as TrainingResource[], error: null }
}

/**
 * Crée une nouvelle ressource de formation.
 */
export async function createTrainingResource(
  data: Omit<TrainingResource, 'id' | 'created_at' | 'updated_at'>
): Promise<QueryResult<TrainingResource>> {
  const supabase = createClient()
  const { data: result, error } = await supabase
    .from('training_resources')
    .insert(data)
    .select()
    .single()

  if (error) {
    return { data: null, error: error.message }
  }

  void logAudit({
    action: AUDIT_ACTIONS.trainingCreated,
    target_type: AUDIT_TARGET_TYPES.trainingResource,
    target_id: result.id,
    pharmacy_id: result.pharmacy_id,
    metadata: { title: result.title, type: result.type },
  })

  return { data: result as TrainingResource, error: null }
}

/**
 * Met à jour une ressource de formation.
 */
export async function updateTrainingResource(
  id: string,
  data: Partial<TrainingResource>
): Promise<QueryResult<TrainingResource>> {
  const supabase = createClient()
  const { data: result, error } = await supabase
    .from('training_resources')
    .update(data)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return { data: null, error: error.message }
  }

  void logAudit({
    action: AUDIT_ACTIONS.trainingUpdated,
    target_type: AUDIT_TARGET_TYPES.trainingResource,
    target_id: result.id,
    pharmacy_id: result.pharmacy_id,
    metadata: { title: result.title },
  })

  return { data: result as TrainingResource, error: null }
}

/**
 * Supprime une ressource de formation.
 */
export async function deleteTrainingResource(id: string): Promise<QueryResult<void>> {
  const supabase = createClient()
  const { error } = await supabase.from('training_resources').delete().eq('id', id)

  if (error) {
    return { data: null, error: error.message }
  }

  void logAudit({
    action: AUDIT_ACTIONS.trainingDeleted,
    target_type: AUDIT_TARGET_TYPES.trainingResource,
    target_id: id,
  })

  return { data: undefined, error: null }
}

/**
 * Upload un fichier (vidéo ou PDF) vers Supabase Storage.
 */
export async function uploadResourceFile(
  file: File,
  pharmacyId: string,
  type: 'video' | 'memo'
): Promise<string> {
  const supabase = createClient()
  const path = buildTrainingStorageObjectKey(pharmacyId, type, file.name)

  const { error } = await supabase.storage
    .from('training-files')
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (error) {
    throw new Error(error.message)
  }

  return path
}

/**
 * Supprime un fichier de Supabase Storage.
 */
export async function deleteResourceFile(storagePath: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.storage.from('training-files').remove([storagePath])
  if (error) {
    throw new Error(error.message)
  }
}
