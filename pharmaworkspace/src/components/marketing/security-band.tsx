import Link from 'next/link'
import { ShieldCheck, Globe, Lock, Sparkles, ArrowRight } from 'lucide-react'
import type { ComponentType, SVGProps } from 'react'

type Pillar = {
  icon: ComponentType<SVGProps<SVGSVGElement>>
  title: string
  description: string
}

const PILLARS: Pillar[] = [
  {
    icon: ShieldCheck,
    title: 'RGPD conforme',
    description: 'DPA accepté à l’inscription, registre art. 30, droit à l’effacement intégré.',
  },
  {
    icon: Globe,
    title: 'Hébergement France',
    description: 'Supabase Paris, Vercel CDG. Aucun transfert de donnée patient hors UE.',
  },
  {
    icon: Lock,
    title: 'Chiffrement de bout en bout',
    description: 'TLS 1.3 en transit, AES-256 au repos, isolation Row-Level Security par officine.',
  },
  {
    icon: Sparkles,
    title: 'IA française Mistral',
    description: 'Notre OCR utilise un modèle français hébergé en France, jamais d’envoi outre-Atlantique.',
  },
]

export function SecurityBand() {
  return (
    <section className="relative overflow-hidden bg-slate-900 py-24 text-white sm:py-32">
      <div aria-hidden="true" className="grain absolute inset-0 opacity-50" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <span className="text-sm font-semibold uppercase tracking-wider text-teal-300">
            Sécurité &amp; conformité
          </span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-balance sm:text-5xl">
            Construit pour les exigences du métier.
          </h2>
          <p className="mt-6 text-lg text-pretty text-slate-300">
            Vous traitez des données patient. Nous avons conçu PharmaWorkspace pour que vous
            n’ayez jamais à vous inquiéter de leur sécurité ni de leur conformité.
          </p>
        </div>
        <div className="mx-auto mt-16 grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {PILLARS.map(({ icon: Icon, title, description }) => (
            <div key={title} className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-teal-500/20">
                <Icon className="h-5 w-5 text-teal-300" aria-hidden="true" />
              </div>
              <h3 className="mt-4 text-base font-semibold">{title}</h3>
              <p className="mt-1 text-sm text-slate-400">{description}</p>
            </div>
          ))}
        </div>
        <div className="mt-12 flex justify-center">
          <Link
            href="/securite"
            className="inline-flex items-center gap-2 text-sm font-medium text-teal-300 transition hover:text-teal-200"
          >
            Voir notre politique de sécurité complète
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  )
}
