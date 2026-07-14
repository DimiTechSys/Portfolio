'use client'

import { useEffect, useRef, useState } from 'react'
import { BrowserMultiFormatReader } from '@zxing/browser'
import { BarcodeFormat, DecodeHintType, NotFoundException } from '@zxing/library'
import { Button } from '@/components/ui/button'

interface BarcodeScannerProps {
  onDetected: (code: string) => void
  onClose: () => void
}

export function BarcodeScanner({ onDetected, onClose }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    let stopControls: { stop: () => void } | null = null

    const hints = new Map()
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.EAN_13])

    const reader = new BrowserMultiFormatReader(hints)

    const start = async () => {
      if (!videoRef.current) return
      try {
        const devices = await BrowserMultiFormatReader.listVideoInputDevices()
        const rear = devices.find((d) =>
          /back|rear|environment/gi.test(d.label)
        )
        const selectedDeviceId = rear?.deviceId

        const controls = await reader.decodeFromVideoDevice(
          selectedDeviceId,
          videoRef.current,
          (result, err, ctrl) => {
            if (!active) return
            if (result) {
              const code = result.getText()
              ctrl.stop()
              onDetected(code)
              return
            }
            if (err && !(err instanceof NotFoundException)) {
              setError('Impossible de lire le code-barres. Repositionnez la boîte.')
            }
          }
        )
        stopControls = controls
      } catch {
        setError("Accès caméra refusé ou indisponible sur cet appareil.")
      }
    }

    void start()

    return () => {
      active = false
      stopControls?.stop()
    }
  }, [onDetected])

  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-md border bg-black">
        <video ref={videoRef} className="h-[300px] w-full object-cover" muted playsInline />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-36 w-64 rounded-md border-2 border-emerald-400/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex justify-end">
        <Button type="button" variant="outline" onClick={onClose}>
          Fermer le scanner
        </Button>
      </div>
    </div>
  )
}
