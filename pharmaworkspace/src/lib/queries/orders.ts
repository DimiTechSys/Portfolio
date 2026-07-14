// src/lib/queries/orders.ts
import { createClient } from '@/lib/supabase/client'
import { logAudit } from '@/lib/audit/log'
import { AUDIT_ACTIONS, AUDIT_TARGET_TYPES } from '@/lib/audit/actions'
import {
  applyKeysetCursor,
  sliceKeysetPage,
  type KeysetCursor,
} from '@/lib/queries/keyset-pagination'
import type {
  Order,
  NewOrder,
  UpdateOrder,
  OrderWithDetails,
  NewOrderItem,
  Supplier,
  OrderStatus,
  QueryResult,
} from '@/types/index'

// ── Commandes ────────────────────────────────────────────────

export async function getOrders(
  pharmacyId: string,
  filters?: { status?: OrderStatus; supplierId?: string }
): Promise<QueryResult<OrderWithDetails[]>> {
  const supabase = createClient()

  // Liste : colonnes de jointure minimales (nom fournisseur affiché, items.length
  // pour le compteur). Le détail complet est chargé par getOrderById dans le drawer.
  let query = supabase
    .from('orders')
    .select(`
      *,
      supplier:suppliers!supplier_id (id, name, contact_name, phone, email),
      items:order_items (id)
    `)
    .eq('pharmacy_id', pharmacyId)
    .order('created_at', { ascending: false })

  if (filters?.status) query = query.eq('status', filters.status)
  if (filters?.supplierId) query = query.eq('supplier_id', filters.supplierId)

  const { data, error } = await query
  if (error) return { data: null, error: error.message }
  return { data: data as unknown as OrderWithDetails[], error: null }
}

export async function getOrdersPaginated(
  pharmacyId: string,
  cursor?: KeysetCursor,
  limit = 50,
  filters?: { status?: OrderStatus; supplierId?: string }
): Promise<QueryResult<{ items: OrderWithDetails[]; nextCursor: KeysetCursor | null }>> {
  const supabase = createClient()

  // Liste paginée : jointures minimales (cf. getOrders). Détail complet via getOrderById.
  let query = supabase
    .from('orders')
    .select(`
      *,
      supplier:suppliers!supplier_id (id, name, contact_name, phone, email),
      items:order_items (id)
    `)
    .eq('pharmacy_id', pharmacyId)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(limit + 1)

  if (filters?.status) query = query.eq('status', filters.status)
  if (filters?.supplierId) query = query.eq('supplier_id', filters.supplierId)

  query = applyKeysetCursor(query, cursor)

  const { data, error } = await query
  if (error) return { data: null, error: error.message }

  const rows = (data as unknown as OrderWithDetails[]) ?? []
  return { data: sliceKeysetPage(rows, limit), error: null }
}

export async function getOrderById(
  id: string
): Promise<QueryResult<OrderWithDetails>> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      supplier:suppliers!supplier_id (*),
      items:order_items (*)
    `)
    .eq('id', id)
    .single()

  if (error) return { data: null, error: error.message }
  return { data: data as unknown as OrderWithDetails, error: null }
}

export async function createOrder(
  payload: NewOrder,
  items: Omit<NewOrderItem, 'order_id' | 'pharmacy_id'>[]
): Promise<QueryResult<Order>> {
  const supabase = createClient()

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert(payload)
    .select()
    .single()

  if (orderError || !order) return { data: null, error: orderError?.message ?? 'Erreur création commande' }

  if (items.length > 0) {
    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(
        items.map(item => ({
          ...item,
          order_id: order.id,
          pharmacy_id: payload.pharmacy_id,
        }))
      )
    if (itemsError) return { data: null, error: itemsError.message }
  }

  // Move newly uploaded attachments from temp to permanent
  if (order.attachments && Array.isArray(order.attachments) && order.attachments.length > 0) {
    let attachmentsUpdated = false
    const newAttachments = [...order.attachments]

    for (let i = 0; i < newAttachments.length; i++) {
      const att = newAttachments[i]
      const oldPath: string | undefined = att?.path
      if (oldPath && oldPath.startsWith(`${payload.pharmacy_id}/temp/orders/`)) {
        const fileName = oldPath.split('/').pop()
        if (fileName) {
          const newPath = `${payload.pharmacy_id}/orders/${order.id}/${fileName}`
          const { error: moveError } = await supabase.storage.from('attachments').move(oldPath, newPath)

          if (!moveError) {
            newAttachments[i] = { ...att, path: newPath }
            attachmentsUpdated = true
          }
        }
      }
    }

    if (attachmentsUpdated) {
      const { data: updatedOrder } = await supabase
        .from('orders')
        .update({ attachments: newAttachments })
        .eq('id', order.id)
        .select()
        .single()

      if (updatedOrder) {
        order.attachments = updatedOrder.attachments
      }
    }
  }

  void logAudit({
    action: AUDIT_ACTIONS.orderCreated,
    target_type: AUDIT_TARGET_TYPES.order,
    target_id: order.id,
    pharmacy_id: order.pharmacy_id,
    metadata: { status: order.status, items_count: items.length },
  })

  return { data: order, error: null }
}

export async function updateOrder(
  id: string,
  payload: UpdateOrder
): Promise<QueryResult<Order>> {
  const supabase = createClient()

  if (payload.status === 'sent' && !payload.ordered_at) {
    payload.ordered_at = new Date().toISOString()
  }
  if (payload.status === 'received' && !payload.received_at) {
    payload.received_at = new Date().toISOString()
  }

  const { data, error } = await supabase
    .from('orders')
    .update(payload)
    .eq('id', id)
    .select()
    .single()

  if (error) return { data: null, error: error.message }

  void logAudit({
    action: AUDIT_ACTIONS.orderUpdated,
    target_type: AUDIT_TARGET_TYPES.order,
    target_id: data.id,
    pharmacy_id: data.pharmacy_id,
    metadata: { status: data.status },
  })

  return { data, error: null }
}

export async function deleteOrder(
  id: string
): Promise<QueryResult<null>> {
  const supabase = createClient()
  const { error } = await supabase
    .from('orders')
    .delete()
    .eq('id', id)

  if (error) return { data: null, error: error.message }

  void logAudit({
    action: AUDIT_ACTIONS.orderDeleted,
    target_type: AUDIT_TARGET_TYPES.order,
    target_id: id,
  })

  return { data: null, error: null }
}

// ── Fournisseurs ──────────────────────────────────────────────

export async function getSuppliers(
  pharmacyId: string
): Promise<QueryResult<Supplier[]>> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('suppliers')
    .select('*')
    .eq('pharmacy_id', pharmacyId)
    .order('name', { ascending: true })

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

export async function createSupplier(
  payload: Omit<Supplier, 'id' | 'created_at'>
): Promise<QueryResult<Supplier>> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('suppliers')
    .insert(payload)
    .select()
    .single()

  if (error) return { data: null, error: error.message }

  void logAudit({
    action: AUDIT_ACTIONS.supplierCreated,
    target_type: AUDIT_TARGET_TYPES.supplier,
    target_id: data.id,
    pharmacy_id: data.pharmacy_id,
    metadata: { name: data.name },
  })

  return { data, error: null }
}

export async function updateSupplier(
  id: string,
  payload: Partial<Omit<Supplier, 'id' | 'created_at' | 'pharmacy_id'>>
): Promise<QueryResult<Supplier>> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('suppliers')
    .update(payload)
    .eq('id', id)
    .select()
    .single()

  if (error) return { data: null, error: error.message }

  void logAudit({
    action: AUDIT_ACTIONS.supplierUpdated,
    target_type: AUDIT_TARGET_TYPES.supplier,
    target_id: data.id,
    pharmacy_id: data.pharmacy_id,
    metadata: { name: data.name },
  })

  return { data, error: null }
}

export async function deleteSupplier(
  id: string
): Promise<QueryResult<null>> {
  const supabase = createClient()
  const { error } = await supabase
    .from('suppliers')
    .delete()
    .eq('id', id)

  if (error) return { data: null, error: error.message }

  void logAudit({
    action: AUDIT_ACTIONS.supplierDeleted,
    target_type: AUDIT_TARGET_TYPES.supplier,
    target_id: id,
  })

  return { data: null, error: null }
}