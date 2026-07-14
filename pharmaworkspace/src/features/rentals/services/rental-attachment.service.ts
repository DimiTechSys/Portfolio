import { compressImage } from '@/lib/images/compress'
import {
  deleteRentalAttachment,
  getRentalAttachmentById,
  insertRentalAttachment,
} from '@/lib/queries/rental-attachments'
import { createClient } from '@/lib/supabase/client'
import type { QueryResult, RentalAttachment } from '@/types/index'

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp'])

function rentalPhotoStoragePath(pharmacyId: string, rentalId: string): string {
  return `${pharmacyId}/rentals/${rentalId}/${crypto.randomUUID()}.jpg`
}

export async function uploadRentalPhoto(params: {
  pharmacyId: string
  rentalId: string
  file: File
  uploadedBy: string | null
}): Promise<QueryResult<RentalAttachment>> {
  const { pharmacyId, rentalId, file, uploadedBy } = params

  if (!ALLOWED_MIME.has(file.type) && !file.type.startsWith('image/')) {
    return { data: null, error: 'Format non supporté (JPEG, PNG ou WebP).' }
  }

  let blob: Blob
  try {
    blob = await compressImage(file)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Compression impossible'
    return { data: null, error: message }
  }

  if (blob.size > 10 * 1024 * 1024) {
    return { data: null, error: 'Image trop volumineuse après compression (max 10 Mo).' }
  }

  const storagePath = rentalPhotoStoragePath(pharmacyId, rentalId)
  const supabase = createClient()

  const { error: uploadError } = await supabase.storage
    .from('attachments')
    .upload(storagePath, blob, {
      cacheControl: '3600',
      upsert: false,
      contentType: 'image/jpeg',
    })

  if (uploadError) return { data: null, error: uploadError.message }

  return insertRentalAttachment({
    rental_id: rentalId,
    pharmacy_id: pharmacyId,
    storage_path: storagePath,
    mime_type: 'image/jpeg',
    size_bytes: blob.size,
    original_filename: file.name,
    uploaded_by: uploadedBy,
  })
}

export async function removeRentalPhoto(attachmentId: string): Promise<QueryResult<null>> {
  const rowResult = await getRentalAttachmentById(attachmentId)
  if (rowResult.error || !rowResult.data) {
    return { data: null, error: rowResult.error ?? 'Pièce jointe introuvable.' }
  }

  const supabase = createClient()
  const { error: storageError } = await supabase.storage
    .from('attachments')
    .remove([rowResult.data.storage_path])

  if (storageError) return { data: null, error: storageError.message }

  return deleteRentalAttachment(attachmentId)
}
