import { createClient } from '@/lib/supabase/client'
import {
  addPrescriptionComment,
  createPrescription,
  deletePrescription,
  deletePrescriptionComment,
  getPrescriptionById,
  getPrescriptions,
  getPrescriptionsPaginated,
  searchPrescriptions,
  updatePrescription,
} from '@/lib/queries/prescriptions'
import {
  bulkCreatePrescriptionItems,
  createPrescriptionItem,
  deletePrescriptionItem,
  updatePrescriptionItem,
} from '@/lib/queries/prescription-items'

export const prescriptionsService = {
  getPrescriptions,
  getPrescriptionsPaginated,
  searchPrescriptions,
  getPrescriptionById,
  createPrescription,
  updatePrescription,
  deletePrescription,
  addPrescriptionComment,
  deletePrescriptionComment,
  createPrescriptionItem,
  updatePrescriptionItem,
  deletePrescriptionItem,
  bulkCreatePrescriptionItems,
  async getCurrentUserId() {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    return user?.id ?? null
  },
  async uploadPrescriptionAsset(file: File, userId: string, pharmacyId: string) {
    const supabase = createClient()
    const rawExt = file.name.split('.').pop() ?? 'bin'
    const extension = /^[a-z0-9]+$/i.test(rawExt) ? rawExt.toLowerCase() : 'bin'
    const filePath = `${pharmacyId}/${userId}/${Date.now()}.${extension}`

    const { error: uploadError } = await supabase.storage
      .from('prescriptions')
      .upload(filePath, file, { upsert: false })
    if (uploadError) throw new Error(uploadError.message)

    return filePath
  },
  async getSignedImageUrl(path: string) {
    if (!path) return null
    const supabase = createClient()
    const { data } = await supabase.storage.from('prescriptions').createSignedUrl(path, 3600)
    return data?.signedUrl ?? null
  },
}
