'use client'
import Link from 'next/link'
import { Card, CardTitle } from '@/components/ui'
import {
  Megaphone,
  Users,
  CalendarDays,
  TrendingUp,
  FileText,
  Clock3,
  BarChart3,
} from 'lucide-react'

const modules = [
  { href: '/gestion/publications', label: 'Publications stock', sub: 'Préparer et piloter les annonces du stock', icon: Megaphone },
  { href: '/gestion/leads', label: 'Leads entrants', sub: 'Centraliser et prioriser les opportunités', icon: Users },
  { href: '/gestion/rdv', label: 'RDV & essais', sub: 'Planifier les essais et suivre la présence', icon: CalendarDays },
  { href: '/gestion/pipeline', label: 'Pipeline commercial', sub: 'Suivre les étapes de conversion', icon: TrendingUp },
  { href: '/gestion/reprises', label: 'Reprises', sub: 'Gérer les dossiers de reprise VO', icon: FileText },
  { href: '/gestion/echeances', label: 'Tâches & échéances', sub: 'Voir les actions urgentes de la semaine', icon: Clock3 },
  { href: '/gestion/reporting', label: 'Reporting business', sub: 'Piloter conversion, marge et rotation', icon: BarChart3 },
]

export default function GestionPage() {
  return (
    <div className="p-6">
      <div className="page-header">
        <h1 className="page-title">Gestion back-office</h1>
      </div>

      <Card className="mb-5">
        <CardTitle>Modules activés</CardTitle>
        <p className="text-gray-500">
          Cet espace centralise les fonctions opérationnelles de Flagship pour piloter les ventes,
          les reprises, les rendez-vous et les échéances.
        </p>
      </Card>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {modules.map(({ href, label, sub, icon: Icon }) => (
          <Link key={href} href={href}>
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-colors hover:bg-slate-50">
              <div className="mb-3 inline-flex rounded-xl bg-slate-100 p-2 text-slate-700">
                <Icon size={18} />
              </div>
              <div className="text-lg font-medium text-slate-900">{label}</div>
              <div className="mt-1 text-sm text-slate-500">{sub}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
