import type { LucideIcon } from 'lucide-react'

type SecuritySectionProps = {
  icon: LucideIcon
  title: string
  children: React.ReactNode
}

export function SecuritySection({ icon: Icon, title, children }: SecuritySectionProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-50 text-teal-600 ring-1 ring-teal-200">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">{title}</h2>
          <div className="mt-3 space-y-3 text-sm leading-relaxed text-slate-600">
            {children}
          </div>
        </div>
      </div>
    </section>
  )
}
