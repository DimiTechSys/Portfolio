import { loadPolicy } from '@/lib/legal/load-policy'
import { PolicyRenderer } from '@/components/legal/policy-renderer'
import { HotlineCTA } from '@/components/marketing/hotline-cta'

export const metadata = {
  title: 'Sécurité & RGPD | PharmaWorkspace',
  alternates: { canonical: '/securite' },
  description:
    "Hébergement France, OCR EU, chiffrement TLS, RLS Postgres, DPO désigné, conformité RGPD complète. Tout ce qu'un titulaire d'officine doit savoir avant de signer.",
}

export default function SecurityPage() {
  const { metadata: meta, content } = loadPolicy('securite')

  return (
    <>
      <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <header className="border-b border-slate-200 pb-8">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
            {meta.title}
          </h1>
          <p className="mt-3 text-sm text-slate-600">
            Mis à jour le {meta.version}.
          </p>
        </header>

        <div className="mt-10">
          <PolicyRenderer content={content} />
        </div>
      </article>

      <HotlineCTA context="securite_page_footer" />
    </>
  )
}
