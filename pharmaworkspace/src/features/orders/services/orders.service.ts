import { createClient } from '@/lib/supabase/client'
import {
  createOrder,
  createSupplier,
  deleteOrder,
  deleteSupplier,
  getOrderById,
  getOrders,
  getOrdersPaginated,
  getSuppliers,
  updateOrder,
  updateSupplier,
} from '@/lib/queries/orders'

export const ordersService = {
  getOrders,
  getOrdersPaginated,
  getOrderById,
  createOrder,
  updateOrder,
  deleteOrder,
  getSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  async getCurrentUserId() {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    return user?.id ?? null
  },
}
