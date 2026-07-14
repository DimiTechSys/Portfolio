'use client'

import { useRef, useState } from 'react'
import { Camera, ImagePlus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { uploadRentalPhoto } from '@/features/rentals/services/rental-attachment.service'
import { createClient } from '@/lib/supabase/client'

type RentalPhotoUploadProps = {
  pharmacyId: string
  rentalId: string
  onUploaded: () => void
  disabled?: boolean
}

export function RentalPhotoUpload({
  pharmacyId,
  rentalId,
  onUploaded,
  disabled = false,
}: RentalPhotoUploadProps) {
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length || disabled) return

    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    setUploading(true)
    let ok = 0
    for (const file of Array.from(files)) {
      const result = await uploadRentalPhoto({
        pharmacyId,
        rentalId,
        file,
        uploadedBy: user?.id ?? null,
      })
      if (result.error) {
        toast.error(`${file.name} : ${result.error}`)
      } else {
        ok++
      }
    }
    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
    if (cameraInputRef.current) cameraInputRef.current.value = ''
    if (ok > 0) {
      toast.success(ok === 1 ? 'Photo ajoutée' : `${ok} photos ajoutées`)
      onUploaded()
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic"
        multiple
        hidden
        onChange={(e) => void handleFiles(e.target.files)}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={(e) => void handleFiles(e.target.files)}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled || uploading}
        onClick={() => fileInputRef.current?.click()}
      >
        {uploading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <ImagePlus className="mr-2 h-4 w-4" />
        )}
        Charger une photo
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled || uploading}
        onClick={() => cameraInputRef.current?.click()}
      >
        <Camera className="mr-2 h-4 w-4" />
        Prendre une photo
      </Button>
    </div>
  )
}
