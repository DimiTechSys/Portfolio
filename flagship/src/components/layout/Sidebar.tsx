'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, Car, Users, FileText,
  Instagram, TrendingUp, CreditCard, Settings, CalendarDays, Megaphone, Clock3, BarChart3,
} from 'lucide-react'

const NAV_MAIN = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
]

const NAV_GESTION = [
  { href: '/gestion', label: 'Vue gestion', icon: LayoutDashboard },
  { href: '/parc', label: 'Parc véhicules', icon: Car },
  { href: '/gestion/publications', label: 'Publications stock', icon: Megaphone },
  { href: '/crm', label: 'CRM clients', icon: Users },
  { href: '/gestion/leads', label: 'Leads entrants', icon: Users },
  { href: '/gestion/rdv', label: 'RDV & essais', icon: CalendarDays },
  { href: '/gestion/pipeline', label: 'Pipeline commercial', icon: TrendingUp },
  { href: '/gestion/reprises', label: 'Reprises', icon: FileText },
  { href: '/gestion/echeances', label: 'Tâches & échéances', icon: Clock3 },
  { href: '/gestion/reporting', label: 'Reporting business', icon: BarChart3 },
  { href: '/devis', label: 'RDV / Devis & factures', icon: FileText },
  { href: '/financement', label: 'Financement', icon: CreditCard },
]

const NAV_OPTIONS = [
  { href: '/social', label: 'Réseaux sociaux', icon: Instagram },
  { href: '/veille', label: 'Veille concurrence', icon: TrendingUp },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-80 bg-white border-r border-gray-200/80 flex flex-col flex-shrink-0 h-screen">
      <div className="px-7 py-7 border-b border-gray-200/80">
        <div className="text-2xl font-semibold text-gray-900">Flagship</div>
        <div className="text-lg text-gray-500 mt-2">Concession · Espace admin</div>
      </div>

      <nav className="flex-1 py-5 overflow-y-auto">
        <div className="px-6 py-2.5 text-base font-semibold text-gray-400 uppercase tracking-widest">
          Principal
        </div>
        {NAV_MAIN.map(({ href, label, icon: Icon }) => (
          <NavItem key={href} href={href} label={label} icon={Icon} active={pathname.startsWith(href)} />
        ))}

        <div className="px-6 py-2.5 mt-5 text-base font-semibold text-gray-400 uppercase tracking-widest">
          Gestion
        </div>
        {NAV_GESTION.map(({ href, label, icon: Icon }) => (
          <NavItem key={href} href={href} label={label} icon={Icon} active={pathname.startsWith(href)} />
        ))}

        <div className="px-6 py-2.5 mt-5 text-base font-semibold text-gray-400 uppercase tracking-widest">
          Options
        </div>
        {NAV_OPTIONS.map(({ href, label, icon: Icon }) => (
          <NavItem key={href} href={href} label={label} icon={Icon} active={pathname.startsWith(href)} />
        ))}
      </nav>

      <div className="border-t border-gray-200/80">
        <NavItem href="/settings" label="Paramètres" icon={Settings} active={pathname === '/settings'} />
      </div>
    </aside>
  )
}

function NavItem({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string
  label: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  active: boolean
}) {
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-4 px-7 py-3.5 text-[1.15rem] transition-colors',
        active
          ? 'text-gray-900 font-medium bg-gray-50 border-l-2 border-gray-900'
          : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50 border-l-2 border-transparent'
      )}
    >
      <Icon size={21} className={active ? 'opacity-100' : 'opacity-50'} />
      {label}
    </Link>
  )
}
