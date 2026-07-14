'use client'
import { useEffect, useState } from 'react'
import { Card, CardTitle, MetricCard } from '@/components/ui'
import { createTradeIn, getTradeIns, updateTradeIn } from '@/lib/data/trade-ins'
import { formatPrice } from '@/lib/utils'
import type { TradeIn, TradeInStatus } from '@/types'

const STATUSES: TradeInStatus[] = ['nouveau', 'expertise', 'offre_envoyée', 'négociation', 'acceptée', 'refusée']

export default function GestionReprisesPage() {
  const [reprises, setReprises] = useState<TradeIn[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const data = await getTradeIns()
      setReprises(data)
    } catch (error) {
      console.error(error)
      setReprises([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load().catch(console.error)
  }, [])

  const onCreate = async () => {
    setSaving(true)
    try {
      await createTradeIn({
        brand: 'Marque',
        model: 'Modèle',
        status: 'nouveau',
        notes: 'Dossier créé depuis Gestion',
      })
      await load()
    } catch (error) {
      console.error(error)
    } finally {
      setSaving(false)
    }
  }

  const onStatusChange = async (id: string, status: TradeInStatus) => {
    try {
      await updateTradeIn(id, { status })
      await load()
    } catch (error) {
      console.error(error)
    }
  }

  const avg = reprises.length > 0
    ? reprises.reduce((sum, r) => sum + Number(r.estimated_value ?? 0), 0) / reprises.length
    : 0

  return (
    <div className="p-6">
      <div className="page-header">
        <h1 className="page-title">Reprises</h1>
      </div>

      <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-3">
        <MetricCard label="Dossiers en cours" value={reprises.length} sub="À suivre cette semaine" />
        <MetricCard label="Expertises planifiées" value={reprises.filter(r => r.status === 'expertise').length} sub="Contrôles techniques / carrosserie" />
        <MetricCard label="Valeur moyenne reprise" value={formatPrice(avg)} sub="Estimation sur dossiers actifs" />
      </div>

      <Card className="mb-5">
        <CardTitle>Nouveau dossier reprise</CardTitle>
        <button onClick={onCreate} disabled={saving} className="rounded-lg bg-gray-900 px-3 py-2 text-sm text-white disabled:opacity-50">
          {saving ? 'Création…' : 'Créer dossier'}
        </button>
      </Card>

      <Card padding={false}>
        <div className="border-b border-gray-100 px-6 py-5">
          <CardTitle className="mb-0">Pipeline reprises</CardTitle>
        </div>
        <table className="w-full">
          <thead>
            <tr>{['Client', 'Véhicule repris', 'Estimation', 'Statut'].map(h => <th key={h} className="th">{h}</th>)}</tr>
          </thead>
          <tbody>
            {!loading && reprises.map(r => (
              <tr key={r.id}>
                <td className="td font-medium">{r.client ? `${r.client.first_name} ${r.client.last_name}` : 'Client à définir'}</td>
                <td className="td">{r.brand} {r.model}</td>
                <td className="td">{r.estimated_value ? formatPrice(r.estimated_value) : '—'}</td>
                <td className="td">
                  <select
                    value={r.status}
                    onChange={e => onStatusChange(r.id, e.target.value as TradeInStatus)}
                    className="rounded-lg border border-gray-200 px-2 py-1 text-xs"
                  >
                    {STATUSES.map(status => <option key={status} value={status}>{status}</option>)}
                  </select>
                </td>
              </tr>
            ))}
            {!loading && reprises.length === 0 && (
              <tr><td colSpan={4} className="py-8 text-center text-sm text-gray-400">Aucun dossier reprise</td></tr>
            )}
            {loading && (
              <tr><td colSpan={4} className="py-8 text-center text-sm text-gray-400">Chargement…</td></tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
