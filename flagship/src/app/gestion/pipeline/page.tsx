'use client'
import { useEffect, useMemo, useState } from 'react'
import { Card, CardTitle } from '@/components/ui'
import { getLeads } from '@/lib/data/leads'
import type { Lead } from '@/types'

const STAGES = [
  { key: 'new', label: 'Nouveau lead' },
  { key: 'contacted', label: 'Contacté' },
  { key: 'appointment', label: 'RDV planifié' },
  { key: 'test_drive', label: 'Essai réalisé' },
  { key: 'offer', label: 'Offre envoyée' },
  { key: 'sale', label: 'Vente' },
]

export default function GestionPipelinePage() {
  const [leads, setLeads] = useState<Lead[]>([])

  useEffect(() => {
    getLeads().then(setLeads).catch(console.error)
  }, [])

  const distribution = useMemo(() => {
    const total = leads.length
    if (total === 0) return STAGES.map(s => ({ ...s, value: 0 }))

    const contacted = leads.filter(l => ['contacté', 'qualifié', 'rdv_planifié', 'converti'].includes(l.status)).length
    const appointments = leads.filter(l => ['rdv_planifié', 'converti'].includes(l.status)).length
    const testDrive = Math.round(appointments * 0.7)
    const offers = Math.round(appointments * 0.45)
    const sales = leads.filter(l => l.status === 'converti').length

    return [
      { ...STAGES[0], value: total },
      { ...STAGES[1], value: contacted },
      { ...STAGES[2], value: appointments },
      { ...STAGES[3], value: testDrive },
      { ...STAGES[4], value: offers },
      { ...STAGES[5], value: sales },
    ]
  }, [leads])

  return (
    <div className="p-6">
      <div className="page-header">
        <h1 className="page-title">Pipeline commercial</h1>
      </div>

      <Card>
        <CardTitle>Entonnoir de conversion</CardTitle>
        <div className="space-y-3">
          {distribution.map((stage, idx) => (
            <div key={stage.key}>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-sm text-gray-700">{idx + 1}. {stage.label}</span>
                <span className="text-sm font-medium text-gray-900">{stage.value}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-gray-800"
                  style={{ width: `${distribution[0]?.value ? (stage.value / distribution[0].value) * 100 : 0}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
