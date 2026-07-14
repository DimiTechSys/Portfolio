'use client'

import { cn } from '@/lib/utils'
import { ChevronDown, Minus, ChevronUp } from 'lucide-react'
import type { TaskPriority } from '@/types/index'

const LABELS: Record<TaskPriority, string> = {
  low:    'Basse',
  medium: 'Moyenne',
  high:   'Haute',
}

const STYLES: Record<TaskPriority, string> = {
  low:    'text-blue-600',
  medium: 'text-orange-600',
  high:   'text-red-600 font-semibold',
}

const ICONS: Record<TaskPriority, React.ElementType> = {
  low:    ChevronDown,
  medium: Minus,
  high:   ChevronUp,
}

export interface PriorityBadgeProps {
  priority: TaskPriority
  showIcon?: boolean
  size?: 'sm' | 'md'
  className?: string
}

export function PriorityBadge({
  priority,
  showIcon = true,
  size = 'md',
  className,
}: PriorityBadgeProps) {
  const label = LABELS[priority] ?? priority
  const style = STYLES[priority] ?? 'text-gray-600'
  const Icon = ICONS[priority] ?? Minus

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1',
        size === 'sm' ? 'text-xs' : 'text-sm',
        style,
        className
      )}
    >
      {showIcon && <Icon className="h-3.5 w-3.5" strokeWidth={2} />}
      {label}
    </span>
  )
}