import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { compressImage } from '@/lib/images/compress'

describe('compressImage', () => {
  const close = vi.fn()

  beforeEach(() => {
    vi.stubGlobal(
      'createImageBitmap',
      vi.fn(async () => ({
        width: 4000,
        height: 3000,
        close,
      }))
    )

    HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
      drawImage: vi.fn(),
    })) as unknown as typeof HTMLCanvasElement.prototype.getContext

    HTMLCanvasElement.prototype.toBlob = vi.fn(function (
      this: HTMLCanvasElement,
      callback: BlobCallback
    ) {
      callback(new Blob(['x'.repeat(100)], { type: 'image/jpeg' }))
    }) as typeof HTMLCanvasElement.prototype.toBlob
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns a jpeg blob under 10 MB', async () => {
    const file = new File(['pixels'], 'photo.png', { type: 'image/png' })
    const blob = await compressImage(file)
    expect(blob.type).toBe('image/jpeg')
    expect(blob.size).toBeLessThanOrEqual(10 * 1024 * 1024)
    expect(close).toHaveBeenCalled()
  })

  it('rejects files over 10 MB before decode', async () => {
    const huge = new File([new Uint8Array(10 * 1024 * 1024 + 1)], 'big.jpg', {
      type: 'image/jpeg',
    })
    await expect(compressImage(huge)).rejects.toThrow(/10 Mo/)
  })
})
