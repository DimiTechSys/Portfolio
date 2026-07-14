import { loadPolicy } from '@/lib/legal/load-policy'
import { PolicyRenderer } from '@/components/legal/policy-renderer'

export const metadata = {
  title: 'Mentions Légales | PharmaWorkspace',
  alternates: { canonical: '/mentions-legales' },
  description:
    'Identification de l\'éditeur et des hébergeurs du site et du service PharmaWorkspace (LCEN).',
}

export default function MentionsLegalesPage() {
  const { metadata: meta, content } = loadPolicy('mentions-legales')

  return (
    <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <header className="border-b border-slate-200 pb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
          {meta.title}
        </h1>
        <p className="mt-3 text-sm text-slate-600">Version {meta.version}.</p>
      </header>

      <div className="mt-10">
        <PolicyRenderer content={content} />
      </div>
    </article>
  )
}
