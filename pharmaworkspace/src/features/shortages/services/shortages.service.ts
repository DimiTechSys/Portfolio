import { createClient } from '@/lib/supabase/client'
import {
  checkDrugShortageByName,
  getActiveDrugShortages,
  getDrugShortageByCip13,
  listDrugShortagesForPicker,
  searchDrugShortages,
} from '@/lib/queries/drug-shortages'
import {
  createShortage,
  deleteShortage,
  getShortageById,
  getShortages,
  getShortagesPaginated,
  searchShortages,
  updateShortage,
} from '@/lib/queries/shortages'

export const shortagesService = {
  getShortages,
  getShortagesPaginated,
  searchShortages,
  getShortageById,
  createShortage,
  updateShortage,
  deleteShortage,
  getDrugShortageByCip13,
  listDrugShortagesForPicker,
  searchDrugShortages,
  checkDrugShortageByName,
  getActiveDrugShortages,
  async getCurrentUserId() {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    return user?.id ?? null
  },
}
