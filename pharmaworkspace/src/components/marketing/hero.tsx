import Link from 'next/link'
import { ArrowRight, ShieldCheck } from 'lucide-react'
import { RotatingText } from '@/components/ui/rotating-text'
import { HotlineCTA } from './hotline-cta'

export function Hero() {
  return (
    <section className="relative gradient-hero">
      <div className="mx-auto max-w-7xl px-4 pt-16 pb-16 sm:px-6 sm:pt-24 sm:pb-20 lg:px-8 lg:pt-32">
        <div className="mb-8 flex justify-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-medium text-teal-800">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-teal-500" />
            </span>
            Bêta privée · 30 jours d’essai · sans engagement
          </span>
        </div>

        <h1 className="mx-auto max-w-5xl text-center text-4xl font-bold tracking-[-0.04em] text-balance text-slate-900 sm:text-6xl lg:text-7xl">
          Toute la coordination de votre officine,
          <RotatingText
            words={[
              'dans un seul espace.',
              'sans rien oublier.',
              'en temps réel.',
              'pour toute l’équipe.',
            ]}
            className="bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent"
          />
        </h1>

        <p className="mx-auto mt-8 max-w-2xl text-center text-lg text-pretty text-slate-600 sm:text-xl">
          L’espace partagé des équipes officinales françaises. Tâches, ordonnances, ruptures, locations,
          transmissions : tout converge enfin au même endroit, accessible sur mobile et desktop.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
          <Link
            href="/signup?source=hero"
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-900 px-7 py-4 text-base font-medium text-white shadow-lg transition hover:bg-slate-800 sm:w-auto"
          >
            Démarrer 30 jours gratuits
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          <HotlineCTA
            variant="ghost"
            context="landing_hero"
            label="Parler à notre équipe"
            className="w-full border-slate-300 px-7 py-4 text-base text-slate-900 hover:bg-slate-50 sm:w-auto"
          />
        </div>

        <p className="mt-6 flex items-center justify-center gap-2 text-center text-sm text-slate-500">
          <ShieldCheck className="h-4 w-4 text-teal-600" aria-hidden="true" />
          IBAN renseigné à l’inscription (mandat SEPA) · 0&nbsp;€ prélevé pendant 30 jours · Annulable en 2 clics
        </p>
      </div>
    </section>
  )
}
