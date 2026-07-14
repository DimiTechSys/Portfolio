'use client'

import * as pdfjsLib from 'pdfjs-dist'

let workerConfigured = false

function ensurePdfWorker(): void {
  if (workerConfigured) return
  if (typeof window === 'undefined') return
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`
  workerConfigured = true
}

/**
 * Rend la 1re page d’un PDF en JPEG pour l’API OCR (Vision / Llava n’acceptent pas le PDF brut).
 */
export async function pdfFileToJpegFile(pdfFile: File): Promise<File> {
  ensurePdfWorker()
  const data = new Uint8Array(await pdfFile.arrayBuffer())
  const loadingTask = pdfjsLib.getDocument({ data })
  const pdf = await loadingTask.promise
  if (pdf.numPages < 1) {
    throw new Error('PDF sans page')
  }
  const page = await pdf.getPage(1)
  const scale = 2
  const viewport = page.getViewport({ scale })
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas indisponible')
  canvas.width = viewport.width
  canvas.height = viewport.height
  const renderTask = page.render({ canvasContext: ctx, viewport })
  await renderTask.promise
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Export image impossible'))),
      'image/jpeg',
      0.92
    )
  })
  return new File([blob], 'ordonnance-page1.jpg', { type: 'image/jpeg' })
}
