import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * Label de champ standard (design system /annuaire) : uppercase, slate-400.
 * À utiliser dans TOUS les formulaires pour l'uniformité.
 */
export function FormLabel({
  children,
  required,
  className,
}: {
  children: ReactNode
  required?: boolean
  className?: string
}) {
  return (
    <label
      className={cn(
        'mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-400',
        className
      )}
    >
      {children}
      {required && <span className="text-red-500"> *</span>}
    </label>
  )
}
