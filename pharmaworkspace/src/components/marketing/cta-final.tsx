import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { HotlineCTA } from './hotline-cta'

export function CtaFinal() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-teal-600 via-teal-500 to-cyan-500 py-24 text-white sm:py-32">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(circle_at_top,white,transparent_60%)] opacity-10"
      />
      <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold tracking-tight text-balance sm:text-5xl lg:text-6xl">
          Prêt à libérer votre équipe ?
        </h2>
        <p className="mt-6 text-lg text-pretty text-teal-50 sm:text-xl">
          30 jours d’essai. 0 € prélevés avant J+30. Annulable en 2 clics.
        </p>
        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/signup?source=cta_final"
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-7 py-4 text-base font-semibold text-teal-700 shadow-lg transition hover:bg-teal-50 sm:w-auto"
          >
            Démarrer maintenant
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          <HotlineCTA
            variant="link"
            context="landing_cta_final"
            label="ou parler à notre équipe →"
            className="text-base font-medium text-white hover:text-teal-50"
          />
        </div>
      </div>
    </section>
  )
}
