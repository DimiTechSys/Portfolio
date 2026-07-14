'use client'
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { getDocuments, getDocumentStats } from '@/lib/data/documents'
import { Badge, Button, MetricCard, Plate } from '@/components/ui'
import { formatPrice, formatDate } from '@/lib/utils'
import { Plus } from 'lucide-react'
import type { Document } from '@/types'

const STATUS_FILTERS = ['tous', 'brouillon', 'envoyé', 'en_attente', 'payé', 'expiré']

export default function DevisPage() {
  const [docs, setDocs] = useState<Document[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [typeTab, setTypeTab] = useState<'devis' | 'facture'>('devis')
  const [filterStatus, setFilterStatus] = useState('tous')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [d, s] = await Promise.all([
        getDocuments({ type: typeTab, status: filterStatus }),
        getDocumentStats(),
      ])
      setDocs(d)
      setStats(s)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [typeTab, filterStatus])

  useEffect(() => { load() }, [load])

  return (
    <div className="p-6">
      <div className="page-header">
        <h1 className="page-title">Devis & factures</h1>
        <div className="flex gap-2">
          <Link href="/devis/nouveau?type=devis"><Button>+ Nouveau devis</Button></Link>
          <Link href="/devis/nouveau?type=facture"><Button variant="primary">+ Nouvelle facture</Button></Link>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-3 gap-3 mb-5">
          <MetricCard label="Devis en attente" value={stats.pending_count} sub={`Valeur : ${formatPrice(stats.pending_value)}`} />
          <MetricCard label="Facturés ce mois" value={stats.paid_month_count} sub={`Total : ${formatPrice(stats.paid_month_total)}`} />
          <MetricCard label="Taux de conversion" value={`${stats.conversion_rate}%`} />
        </div>
      )}

      {/* Type tabs */}
      <div className="flex border-b border-gray-200 mb-4">
        {(['devis', 'facture'] as const).map(t => (
          <button key={t} onClick={() => setTypeTab(t)}
            className={`px-4 py-2 text-sm capitalize border-b-2 -mb-px transition-colors ${typeTab === t ? 'text-gray-900 border-gray-900 font-medium' : 'text-gray-400 border-transparent hover:text-gray-700'}`}>
            {t === 'devis' ? 'Devis' : 'Factures'}
          </button>
        ))}
      </div>

      {/* Status filters */}
      <div className="flex gap-1 mb-4">
        {STATUS_FILTERS.map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={`px-3 py-1.5 text-xs rounded-lg border capitalize transition-colors ${filterStatus === s ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}>
            {s === 'tous' ? 'Tous' : s}
          </button>
        ))}
      </div>

      <div className="table-container">
        <table className="w-full" style={{ tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: '110px' }} /><col style={{ width: '140px' }} /><col style={{ width: '180px' }} />
            <col style={{ width: '100px' }} /><col style={{ width: '100px' }} /><col style={{ width: '100px' }} />
            <col style={{ width: '90px' }} /><col style={{ width: '80px' }} />
          </colgroup>
          <thead>
            <tr>{['Réf.','Client','Véhicule','Montant HT','Montant TTC','Date','Statut',''].map(h => <th key={h} className="th">{h}</th>)}</tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="py-10 text-center text-sm text-gray-400">Chargement…</td></tr>
            ) : docs.length === 0 ? (
              <tr><td colSpan={8} className="py-10 text-center text-sm text-gray-400">Aucun document</td></tr>
            ) : (
              docs.map(d => (
                <tr key={d.id} className="tr-hover" onClick={() => window.location.href = `/devis/${d.id}`}>
                  <td className="td"><Plate>{d.reference}</Plate></td>
                  <td className="td font-medium">{d.client ? `${d.client.first_name} ${d.client.last_name}` : '—'}</td>
                  <td className="td text-gray-500">{d.vehicle ? `${d.vehicle.brand} ${d.vehicle.model}` : '—'}</td>
                  <td className="td">{formatPrice(d.amount_ht)}</td>
                  <td className="td font-medium">{formatPrice(d.amount_ttc)}</td>
                  <td className="td text-gray-400">{formatDate(d.created_at)}</td>
                  <td className="td"><Badge status={d.status} /></td>
                  <td className="td"><Button size="sm">Voir</Button></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
