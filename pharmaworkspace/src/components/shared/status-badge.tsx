'use client'

import { cn } from '@/lib/utils'
import type {
  TaskStatus,
  PrescriptionStatus,
  OrderStatus,
  RentalStatus,
  ShortageStatus,
} from '@/types/index'

type AnyStatus = TaskStatus | PrescriptionStatus | OrderStatus | RentalStatus | ShortageStatus

const LABELS: Record<string, string> = {
  // TaskStatus
  todo:        'À faire',
  done:        'Terminé',
  cancelled:   'Annulé',
  // PrescriptionStatus
  to_serve:    'À traiter',
  served:      'Traités',
  expired:     'Expiré ?',
  on_hold:     'En attente',
  // OrderStatus
  draft:       'Brouillon',
  sent:        'Envoyée',
  received:    'Reçue',
  // RentalStatus
  active:      'En cours',
  returned:    'Retournée',
  overdue:     'En retard',
  // ShortageStatus
  open:              'Nouvelle rupture',
  resolved:          'Résolue',
  substitute_found:  'Substitut trouvé',
}

const STYLES: Record<string, string> = {
  todo:             'bg-gray-100 text-gray-600',
  done:             'bg-gray-900 text-white',
  cancelled:        'bg-gray-50 text-gray-400',
  to_serve:         'bg-gray-100 text-gray-700',
  served:           'bg-gray-900 text-white',
  expired:          'bg-gray-50 text-gray-400',
  on_hold:          'bg-gray-200 text-gray-600',
  draft:            'bg-gray-100 text-gray-600',
  sent:             'bg-slate-100 text-slate-700',
  received:         'bg-gray-900 text-white',
  active:           'bg-slate-100 text-slate-700',
  returned:         'bg-gray-900 text-white',
  overdue:          'bg-gray-800 text-white',
  open:             'bg-gray-100 text-gray-700',
  resolved:         'bg-gray-900 text-white',
  substitute_found: 'bg-teal-100 text-teal-800',
}

export interface StatusBadgeProps {
  status: AnyStatus
  size?: 'sm' | 'md'
  className?: string
}

export function StatusBadge({ status, size = 'md', className }: StatusBadgeProps) {
  const label = LABELS[status] ?? status
  const style = STYLES[status] ?? 'bg-gray-100 text-gray-600'

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs',
        style,
        className
      )}
    >
      {label}
    </span>
  )
}