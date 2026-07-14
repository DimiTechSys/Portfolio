'use client'
import { useEffect, useState } from 'react'
import { Card, CardTitle, MetricCard } from '@/components/ui'
import { createLead, getLeads, updateLead } from '@/lib/data/leads'
import type { LeadSource, LeadStatus, Lead } from '@/types'

const SOURCES: LeadSource[] = ['site', 'appel', 'whatsapp', 'email']
const STATUSES: LeadStatus[] = ['nouveau', 'contacté', 'qualifié', 'rdv_planifié', 'converti', 'perdu']

export default function GestionLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [createSource, setCreateSource] = useState<LeadSource>('site')
  const [createOwner, setCreateOwner] = useState('')
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const data = await getLeads()
      setLeads(data)
    } catch (error) {
      console.error(error)
      setLeads([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load().catch(console.error)
  }, [])

  const newCount = leads.filter(l => l.status === 'nouveau').length
  const contactedCount = leads.filter(l => l.status === 'contacté').length
  const rdvCount = leads.filter(l => l.status === 'rdv_planifié').length

  const onCreate = async () => {
    setSaving(true)
    try {
      await createLead({
        source: createSource,
        assigned_to: createOwner || null,
        notes: 'Lead créé depuis la vue Gestion',
      })
      setCreateOwner('')
      await load()
    } catch (error) {
      console.error(error)
    } finally {
      setSaving(false)
    }
  }

  const onStatusChange = async (id: string, status: LeadStatus) => {
    try {
      await updateLead(id, { status })
      await load()
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <div className="p-6">
      <div className="page-header">
        <h1 className="page-title">Leads entrants</h1>
      </div>

      <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-3">
        <MetricCard label="Nouveaux leads" value={newCount} sub="À rappeler rapidement" />
        <MetricCard label="Leads contactés" value={contactedCount} sub="Suivi commercial en cours" />
        <MetricCard label="Convertis en RDV" value={rdvCount} sub="Prêts pour essai ou offre" />
      </div>

      <Card className="mb-5">
        <CardTitle>Créer un lead</CardTitle>
        <div className="flex flex-wrap items-center gap-2">
          <select value={createSource} onChange={e => setCreateSource(e.target.value as LeadSource)} className="rounded-lg border border-gray-200 px-3 py-2 text-sm">
            {SOURCES.map(source => <option key={source} value={source}>{source}</option>)}
          </select>
          <input
            value={createOwner}
            onChange={e => setCreateOwner(e.target.value)}
            placeholder="Assigné à (optionnel)"
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
          />
          <button onClick={onCreate} disabled={saving} className="rounded-lg bg-gray-900 px-3 py-2 text-sm text-white disabled:opacity-50">
            {saving ? 'Création…' : 'Nouveau lead'}
          </button>
        </div>
      </Card>

      <Card padding={false}>
        <div className="border-b border-gray-100 px-6 py-5">
          <CardTitle className="mb-0">Inbox leads</CardTitle>
        </div>
        <table className="w-full">
          <thead>
            <tr>{['Client', 'Source', 'Statut', 'Assigné à', 'Date'].map(h => <th key={h} className="th">{h}</th>)}</tr>
          </thead>
          <tbody>
            {!loading && leads.map(l => (
              <tr key={l.id}>
                <td className="td font-medium">{l.client ? `${l.client.first_name} ${l.client.last_name}` : 'Lead sans client'}</td>
                <td className="td capitalize text-gray-600">{l.source}</td>
                <td className="td">
                  <select
                    value={l.status}
                    onChange={e => onStatusChange(l.id, e.target.value as LeadStatus)}
                    className="rounded-lg border border-gray-200 px-2 py-1 text-xs"
                  >
                    {STATUSES.map(status => <option key={status} value={status}>{status}</option>)}
                  </select>
                </td>
                <td className="td">{l.assigned_to || '—'}</td>
                <td className="td text-gray-500">{new Date(l.created_at).toLocaleDateString('fr-FR')}</td>
              </tr>
            ))}
            {!loading && leads.length === 0 && (
              <tr><td colSpan={5} className="py-8 text-center text-sm text-gray-400">Aucun lead</td></tr>
            )}
            {loading && (
              <tr><td colSpan={5} className="py-8 text-center text-sm text-gray-400">Chargement…</td></tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
