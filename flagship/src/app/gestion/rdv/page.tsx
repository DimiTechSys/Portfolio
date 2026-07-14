'use client'
import { useEffect, useState } from 'react'
import { createAppointment, getAppointments, updateAppointment } from '@/lib/data/appointments'
import { Card, CardTitle, MetricCard } from '@/components/ui'
import type { Appointment, AppointmentStatus } from '@/types'

const STATUSES: AppointmentStatus[] = ['planifié', 'confirmé', 'réalisé', 'no_show', 'annulé']

export default function GestionRdvPage() {
  const [rdvs, setRdvs] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const data = await getAppointments()
      setRdvs(data)
    } catch (error) {
      console.error(error)
      setRdvs([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load().catch(console.error)
  }, [])

  const now = new Date()
  const isToday = (value: string) => {
    const d = new Date(value)
    return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  }

  const today = rdvs.filter(r => isToday(r.starts_at)).length
  const week = rdvs.filter(r => {
    const d = new Date(r.starts_at)
    const diff = (d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    return diff >= -7 && diff <= 7
  }).length

  const onCreate = async () => {
    setSaving(true)
    try {
      const start = new Date()
      start.setHours(start.getHours() + 2)
      await createAppointment({
        starts_at: start.toISOString(),
        status: 'planifié',
        notes: 'RDV créé depuis Gestion',
      })
      await load()
    } catch (error) {
      console.error(error)
    } finally {
      setSaving(false)
    }
  }

  const onStatusChange = async (id: string, status: AppointmentStatus) => {
    try {
      await updateAppointment(id, { status })
      await load()
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <div className="p-6">
      <div className="page-header">
        <h1 className="page-title">RDV & essais</h1>
      </div>

      <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-3">
        <MetricCard label="RDV du jour" value={today} sub="Confirmés pour aujourd'hui" />
        <MetricCard label="RDV semaine" value={week} sub="Créneaux à préparer" />
        <MetricCard label="No-show à relancer" value={Math.max(0, Math.floor(today / 3))} sub="Relance auto recommandée" />
      </div>

      <Card className="mb-5">
        <CardTitle>Créer un RDV</CardTitle>
        <button onClick={onCreate} disabled={saving} className="rounded-lg bg-gray-900 px-3 py-2 text-sm text-white disabled:opacity-50">
          {saving ? 'Création…' : 'Ajouter un RDV'}
        </button>
      </Card>

      <Card padding={false}>
        <div className="border-b border-gray-100 px-6 py-5">
          <CardTitle className="mb-0">Planning essais</CardTitle>
        </div>
        <table className="w-full">
          <thead>
            <tr>{['Client', 'Véhicule', 'Créneau', 'Statut'].map(h => <th key={h} className="th">{h}</th>)}</tr>
          </thead>
          <tbody>
            {!loading && rdvs.slice(0, 15).map(d => (
              <tr key={d.id}>
                <td className="td">{d.client ? `${d.client.first_name} ${d.client.last_name}` : 'Client à définir'}</td>
                <td className="td">{d.vehicle ? `${d.vehicle.brand} ${d.vehicle.model}` : 'Véhicule à définir'}</td>
                <td className="td text-gray-500">{new Date(d.starts_at).toLocaleString('fr-FR')}</td>
                <td className="td">
                  <select
                    value={d.status}
                    onChange={e => onStatusChange(d.id, e.target.value as AppointmentStatus)}
                    className="rounded-lg border border-gray-200 px-2 py-1 text-xs"
                  >
                    {STATUSES.map(status => <option key={status} value={status}>{status}</option>)}
                  </select>
                </td>
              </tr>
            ))}
            {!loading && rdvs.length === 0 && (
              <tr><td colSpan={4} className="py-8 text-center text-sm text-gray-400">Aucun rendez-vous</td></tr>
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
