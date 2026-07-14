'use client'
import { useEffect, useState } from 'react'
import { getDashboardStats } from '@/lib/data/vehicles'
import { getDocumentStats } from '@/lib/data/documents'
import { Card, CardTitle, MetricCard } from '@/components/ui'
import { formatPrice } from '@/lib/utils'
import { getLeads } from '@/lib/data/leads'
import { getAppointments } from '@/lib/data/appointments'
import { getTasks } from '@/lib/data/tasks'

type ReportingData = {
  stock: number
  salesMonth: number
  salesTarget: number
  revenueMonth: number
  pendingDevis: number
  conversionRate: number
  leadsCount: number
  appointmentsCount: number
  tasksOpenCount: number
}

export default function GestionReportingPage() {
  const [data, setData] = useState<ReportingData | null>(null)

  useEffect(() => {
    async function load() {
      const [dash, doc, leads, appointments, tasks] = await Promise.all([
        getDashboardStats(),
        getDocumentStats(),
        getLeads(),
        getAppointments(),
        getTasks(),
      ])
      setData({
        stock: dash.stock_count,
        salesMonth: dash.sales_month,
        salesTarget: dash.sales_target,
        revenueMonth: dash.revenue_month,
        pendingDevis: doc.pending_count,
        conversionRate: doc.conversion_rate,
        leadsCount: leads.length,
        appointmentsCount: appointments.length,
        tasksOpenCount: tasks.filter(t => t.status !== 'done').length,
      })
    }
    load().catch(console.error)
  }, [])

  return (
    <div className="p-6">
      <div className="page-header">
        <h1 className="page-title">Reporting business</h1>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <MetricCard label="Stock actif" value={data?.stock ?? '—'} sub="Véhicules en portefeuille" />
        <MetricCard label="Ventes du mois" value={data?.salesMonth ?? '—'} sub={`Objectif: ${data?.salesTarget ?? '—'}`} />
        <MetricCard label="CA du mois" value={data ? formatPrice(data.revenueMonth) : '—'} />
        <MetricCard label="Leads actifs" value={data?.leadsCount ?? '—'} sub="Opportunités à traiter" />
        <MetricCard label="RDV planifiés" value={data?.appointmentsCount ?? '—'} sub="Suivi équipe commerciale" />
        <MetricCard label="Tâches ouvertes" value={data?.tasksOpenCount ?? '—'} sub="Actions non clôturées" />
        <MetricCard label="Devis en attente" value={data?.pendingDevis ?? '—'} sub="À relancer côté commerce" />
        <MetricCard label="Taux conversion devis" value={data ? `${data.conversionRate}%` : '—'} sub="Accepté + payé / devis" />
        <MetricCard
          label="Atteinte objectif"
          value={data && data.salesTarget > 0 ? `${Math.round((data.salesMonth / data.salesTarget) * 100)}%` : '—'}
          sub="Progression mensuelle"
        />
      </div>

      <Card className="mt-5">
        <CardTitle>Lecture rapide</CardTitle>
        <div className="text-sm text-gray-600">
          Ce reporting synthétise la rotation du stock, la performance commerciale et la conversion des devis.
          Il est conçu pour piloter les actions quotidiennes de l'équipe.
        </div>
      </Card>
    </div>
  )
}
