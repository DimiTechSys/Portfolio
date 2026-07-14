const MAX_INPUT_BYTES = 10 * 1024 * 1024

export async function compressImage(
  file: File,
  maxDim = 1920,
  quality = 0.85
): Promise<Blob> {
  if (file.size > MAX_INPUT_BYTES) {
    throw new Error('Le fichier est trop volumineux (max 10 Mo)')
  }

  const img = await createImageBitmap(file)
  try {
    const scale = Math.min(maxDim / img.width, maxDim / img.height, 1)
    const w = Math.max(1, Math.round(img.width * scale))
    const h = Math.max(1, Math.round(img.height * scale))
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Compression impossible')
    ctx.drawImage(img, 0, 0, w, h)

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('Compression impossible'))),
        'image/jpeg',
        quality
      )
    })
    return blob
  } finally {
    img.close()
  }
}
