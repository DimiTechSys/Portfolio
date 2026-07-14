import { loadPolicy } from '@/lib/legal/load-policy'
import { PolicyRenderer } from '@/components/legal/policy-renderer'

export const metadata = {
  title: 'Politique de Confidentialité | PharmaWorkspace',
  alternates: { canonical: '/privacy' },
  description:
    'Politique de confidentialité et information des personnes concernées (RGPD art. 13/14).',
}

export default function PrivacyPage() {
  const { metadata: meta, content } = loadPolicy('privacy')

  return (
    <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <header className="border-b border-slate-200 pb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
          {meta.title}
        </h1>
        <p className="mt-3 text-sm text-slate-600">
          Version {meta.version}, en vigueur depuis le {meta.version}.
        </p>
      </header>

      <div className="mt-10">
        <PolicyRenderer content={content} />
      </div>
    </article>
  )
}
