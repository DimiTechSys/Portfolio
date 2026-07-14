import { createClient } from '@/lib/supabase/client'
import type { Document, DocumentLine } from '@/types'

export async function getDocuments(filters?: {
  type?: string
  status?: string
  search?: string
}) {
  const supabase = createClient()
  let query = supabase
    .from('documents')
    .select('*, client:clients(*), vehicle:vehicles(*)')
    .order('created_at', { ascending: false })

  if (filters?.type) query = query.eq('type', filters.type)
  if (filters?.status && filters.status !== 'tous') query = query.eq('status', filters.status)

  const { data, error } = await query
  if (error) throw error
  return data as Document[]
}

export async function getDocument(id: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('documents')
    .select('*, client:clients(*), vehicle:vehicles(*)')
    .eq('id', id)
    .single()
  if (error) throw error
  return data as Document
}

export async function createDocument(doc: {
  type: 'devis' | 'facture'
  client_id: string
  vehicle_id?: string
  lines: DocumentLine[]
  tva_rate?: number
  deposit_percent?: number
  notes?: string
  expires_at?: string
}) {
  const supabase = createClient()

  const amount_ht = doc.lines.reduce((s, l) => s + l.total_ht, 0)
  const tva_rate = doc.tva_rate ?? 20
  const amount_ttc = amount_ht * (1 + tva_rate / 100)

  const { data, error } = await supabase
    .from('documents')
    .insert({
      ...doc,
      amount_ht,
      tva_rate,
      amount_ttc,
      status: 'brouillon',
    })
    .select('*, client:clients(*), vehicle:vehicles(*)')
    .single()
  if (error) throw error
  return data as Document
}

export async function updateDocument(id: string, updates: Partial<Document>) {
  const supabase = createClient()

  if (updates.lines) {
    const amount_ht = updates.lines.reduce((s, l) => s + l.total_ht, 0)
    const tva_rate = updates.tva_rate ?? 20
    updates.amount_ht = amount_ht
    updates.amount_ttc = amount_ht * (1 + tva_rate / 100)
  }

  const { data, error } = await supabase
    .from('documents')
    .update(updates)
    .eq('id', id)
    .select('*, client:clients(*), vehicle:vehicles(*)')
    .single()
  if (error) throw error
  return data as Document
}

export async function convertToInvoice(devisId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('documents')
    .update({ type: 'facture', status: 'envoyé' })
    .eq('id', devisId)
    .select('*, client:clients(*), vehicle:vehicles(*)')
    .single()
  if (error) throw error
  return data as Document
}

export async function markAsPaid(id: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('documents')
    .update({ status: 'payé', paid_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as Document
}

export async function generatePaymentLink(documentId: string, type: 'deposit' | 'full') {
  const token = Math.random().toString(36).substring(2, 10)
  const link = `${process.env.NEXT_PUBLIC_APP_URL}/pay/${documentId}/${type}/${token}`

  const supabase = createClient()
  await supabase.from('documents').update({ payment_link: link }).eq('id', documentId)

  return link
}

export async function getDocumentStats() {
  const supabase = createClient()
  const { data } = await supabase
    .from('documents')
    .select('type, status, amount_ttc, created_at')

  const docs = data || []
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const inThisMonth = (d: string) => new Date(d) >= startOfMonth

  const pending = docs.filter(d => d.type === 'devis' && d.status === 'en_attente')
  const paidThisMonth = docs.filter(d => d.status === 'payé' && inThisMonth(d.created_at))
  const pendingValue = pending.reduce((s, d) => s + Number(d.amount_ttc), 0)
  const totalPaid = paidThisMonth.reduce((s, d) => s + Number(d.amount_ttc), 0)

  const totalDevis = docs.filter(d => d.type === 'devis').length
  const accepted = docs.filter(d => ['accepté', 'payé'].includes(d.status)).length
  const conversionRate = totalDevis > 0 ? Math.round((accepted / totalDevis) * 100) : 0

  return {
    pending_count: pending.length,
    pending_value: pendingValue,
    paid_month_count: paidThisMonth.length,
    paid_month_total: totalPaid,
    conversion_rate: conversionRate,
  }
}
