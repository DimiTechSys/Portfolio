'use client'
import { useEffect, useState } from 'react'
import { MetricCard } from '@/components/ui'
import { getDashboardStats } from '@/lib/data/vehicles'
import { formatPrice } from '@/lib/utils'
import type { DashboardStats } from '@/types'

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)

  useEffect(() => {
    getDashboardStats().then(setStats).catch(console.error)
  }, [])

  const s = stats
  const performanceRatio = s && s.sales_target > 0
    ? Math.round((s.sales_month / s.sales_target) * 100)
    : 0

  return (
    <div className="space-y-10 px-8 py-9 sm:px-11 sm:py-11">
      <div className="rounded-3xl border border-slate-200/70 bg-white/95 p-9 shadow-sm sm:p-10">
        <p className="text-lg font-semibold uppercase tracking-[0.08em] text-slate-500">Dashboard</p>
        <h1 className="mt-2.5 text-6xl font-semibold tracking-tight text-slate-900">Bonjour - voici votre journee</h1>
        <p className="mt-3.5 text-2xl text-slate-500">
          {new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())}
        </p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        <MetricCard
          label="Stock total"
          value={s?.stock_count ?? '—'}
          sub={`${s?.stock_disponible ?? 0} disponibles · ${s?.stock_reserve ?? 0} réservés`}
        />
        <MetricCard
          label="Nouveaux véhicules arrivés"
          value={s?.new_vehicles_arrived ?? '—'}
          sub="Entrées enregistrées ce mois"
        />
        <MetricCard
          label="Prises de RDV"
          value={s?.appointments_month ?? '—'}
          sub="RDV créés ce mois"
        />
        <MetricCard
          label="RDV du jour"
          value={s?.appointments_today ?? '—'}
          sub="Rendez-vous planifiés aujourd'hui"
        />
        <MetricCard
          label="Performance commerciale"
          value={s ? `${performanceRatio}%` : '—'}
          sub={s ? `${s.sales_month} ventes sur ${s.sales_target} · ${formatPrice(s.revenue_month)}` : undefined}
        />
        <MetricCard
          label="Prochaines échéances"
          value={s?.upcoming_deadlines ?? '—'}
          sub="À traiter dans les 7 prochains jours"
        />
      </div>

    </div>
  )
}
