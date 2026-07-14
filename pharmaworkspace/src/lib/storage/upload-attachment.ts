import { createClient } from '@/lib/supabase/client'
import type { Attachment } from '@/components/shared/file-uploader'

export const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024 // 10 MB

export async function uploadAttachmentFile(
  pharmacyId: string,
  folderPath: string,
  file: File
): Promise<{ attachment: Attachment } | { error: string }> {
  if (file.size > MAX_ATTACHMENT_SIZE) {
    return { error: 'Le fichier est trop volumineux (max 10 Mo)' }
  }

  const supabase = createClient()
  const safeName = file.name.replace(/[^a-zA-Z0-9.\-]/g, '_')
  const path = `${pharmacyId}/${folderPath}/${Date.now()}_${safeName}`

  const { error } = await supabase.storage
    .from('attachments')
    .upload(path, file, { cacheControl: '3600', upsert: false })

  if (error) return { error: error.message }

  return {
    attachment: {
      path,
      name: file.name,
      type: file.type.startsWith('image/') ? 'image' : 'document',
    },
  }
}
