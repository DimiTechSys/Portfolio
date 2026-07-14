'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export type SignedBucket = 'attachments' | 'training-files' | 'prescriptions'

const SIGNED_URL_TTL_SECONDS = 3600
// React Query staleTime stays < TTL so re-renders consuming the same path get a
// cached URL while the signed URL is still valid (refreshes ~10 min before expiry).
const SIGNED_URL_STALE_MS = 50 * 60 * 1000
const SIGNED_URL_GC_MS = 60 * 60 * 1000

export async function getSignedAttachmentUrl(
  bucket: SignedBucket,
  path: string,
  expiresIn = SIGNED_URL_TTL_SECONDS
): Promise<string | null> {
  const supabase = createClient()
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn)
  if (error || !data) return null
  return data.signedUrl
}

export function useSignedUrl(bucket: SignedBucket, path: string | null | undefined) {
  return useQuery({
    queryKey: ['signedUrl', bucket, path],
    queryFn: () => getSignedAttachmentUrl(bucket, path!),
    enabled: !!path,
    staleTime: SIGNED_URL_STALE_MS,
    gcTime: SIGNED_URL_GC_MS,
  })
}
