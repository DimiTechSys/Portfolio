'use client'

import { useSignedUrl, type SignedBucket } from '@/lib/storage/get-signed-url'

type SignedImageProps = {
  bucket?: SignedBucket
  path: string | null | undefined
} & Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'>

export function SignedImage({ bucket = 'attachments', path, alt = '', ...imgProps }: SignedImageProps) {
  const { data: url } = useSignedUrl(bucket, path ?? undefined)
  if (!url) return null
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt={alt} {...imgProps} />
}
