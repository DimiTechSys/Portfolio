import { Suspense } from 'react'
import Link from 'next/link'
import { SignupForm } from '@/components/marketing/signup-form'
import { HotlineCTA } from '@/components/marketing/hotline-cta'

export const metadata = {
  title: 'Démarrer un essai gratuit | PharmaWorkspace',
  alternates: { canonical: '/signup' },
  description:
    "30 jours d'essai gratuit. IBAN requis (mandat SEPA) pour valider votre compte, aucun prélèvement avant J+30. Hébergement France, RGPD.",
}

export default function SignupPage() {
  return (
    <section className="mx-auto max-w-md px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
        Démarrer votre essai sans frais
      </h1>
      <p className="mt-2 text-slate-600">
        30 jours d’accès complet. 0 € prélevé avant J+30, annulable en 2 clics.
      </p>
      <div className="mt-8">
        {/* useSearchParams() côté client nécessite un boundary Suspense en RSC. */}
        <Suspense
          fallback={
            <div className="h-48 animate-pulse rounded-2xl border border-slate-200 bg-slate-50" />
          }
        >
          <SignupForm />
        </Suspense>
      </div>
      <p className="mt-6 text-center text-sm text-slate-600">
        Vous avez déjà un compte ?{' '}
        <Link
          href="/login"
          className="font-medium text-teal-700 underline-offset-4 hover:underline"
        >
          Se connecter
        </Link>
      </p>
      <div className="mt-8 text-center text-sm text-slate-600">
        Une question avant de démarrer ?{' '}
        <HotlineCTA context="signup_page" variant="link" />
      </div>
    </section>
  )
}
