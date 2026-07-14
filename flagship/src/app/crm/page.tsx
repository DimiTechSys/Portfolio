'use client'
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { getClients } from '@/lib/data/clients'
import { Avatar, Badge, Button, EmptyState, Input } from '@/components/ui'
import { Plus, Search } from 'lucide-react'
import type { Client } from '@/types'

const FILTERS = ['tous', 'prospect', 'actif', 'fidèle', 'inactif'] as const

export default function CRMPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('tous')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getClients({ status: filterStatus, search: search || undefined })
      setClients(data)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [search, filterStatus])

  useEffect(() => {
    const t = setTimeout(load, 200)
    return () => clearTimeout(t)
  }, [load])

  return (
    <div className="p-6">
      <div className="page-header">
        <h1 className="page-title">CRM clients</h1>
        <Link href="/crm/nouveau"><Button variant="primary"><Plus size={14} /> Nouveau client</Button></Link>
      </div>

      <div className="flex items-center gap-2 mb-5 flex-wrap">
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-2 text-gray-400" />
          <Input placeholder="Nom, email…" value={search} onChange={e => setSearch(e.target.value)} className="pl-8 w-52" />
        </div>
        <div className="flex gap-1">
          {FILTERS.map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 text-xs rounded-lg border capitalize transition-colors ${filterStatus === s ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}>
              {s === 'tous' ? 'Tous' : s}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-gray-400">Chargement…</p>
      ) : clients.length === 0 ? (
        <EmptyState message="Aucun client trouvé" />
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {clients.map(c => <ClientCard key={c.id} client={c} />)}
        </div>
      )}
    </div>
  )
}

function ClientCard({ client: c }: { client: Client }) {
  return (
    <Link href={`/crm/${c.id}`}>
      <div className="bg-white border border-gray-200/80 rounded-xl p-4 hover:bg-gray-50 transition-colors cursor-pointer">
        <div className="flex items-center gap-3 mb-3">
          <Avatar firstName={c.first_name} lastName={c.last_name} />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-gray-900 truncate">{c.first_name} {c.last_name}</div>
            <div className="text-xs text-gray-400 truncate">{c.city}</div>
          </div>
          <Badge status={c.status} />
        </div>
        <div className="border-t border-gray-100 pt-3 flex justify-between text-xs text-gray-400">
          <span>{c.total_purchases ?? 0} achat{(c.total_purchases ?? 0) > 1 ? 's' : ''}</span>
          <span className="font-medium text-gray-600">
            {c.total_revenue ? new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(c.total_revenue) : '—'}
          </span>
          <span className="truncate max-w-[100px]">{c.email}</span>
        </div>
      </div>
    </Link>
  )
}
