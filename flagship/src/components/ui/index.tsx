'use client'
import { cn, STATUS_COLORS, STATUS_LABELS } from '@/lib/utils'
import { forwardRef } from 'react'

// ─── Badge ───────────────────────────────────────────────────
export function Badge({
  status,
  className,
}: {
  status: string
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-lg px-3.5 py-2 text-lg font-medium',
        STATUS_COLORS[status] ?? 'bg-gray-100 text-gray-600',
        className
      )}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  )
}

// ─── Button ──────────────────────────────────────────────────
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'ghost' | 'danger'
  size?: 'sm' | 'md'
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'default', size = 'md', className, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center gap-2 font-medium rounded-xl border transition-colors cursor-pointer disabled:opacity-50',
          size === 'sm' && 'px-4 py-2.5 text-lg',
          size === 'md' && 'px-6 py-3 text-xl',
          variant === 'default' &&
            'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900',
          variant === 'primary' &&
            'bg-gray-900 border-gray-900 text-white hover:bg-gray-700',
          variant === 'ghost' &&
            'bg-transparent border-transparent text-gray-500 hover:bg-gray-100',
          variant === 'danger' &&
            'bg-red-50 border-red-200 text-red-700 hover:bg-red-100',
          className
        )}
        {...props}
      >
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'

// ─── Card ────────────────────────────────────────────────────
export function Card({
  children,
  className,
  padding = true,
}: {
  children: React.ReactNode
  className?: string
  padding?: boolean
}) {
  return (
    <div
      className={cn(
        'rounded-3xl border border-slate-200/80 bg-white shadow-sm',
        padding && 'p-8 sm:p-9',
        className
      )}
    >
      {children}
    </div>
  )
}

export function CardTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('mb-4 text-lg font-semibold uppercase tracking-[0.08em] text-slate-500', className)}>
      {children}
    </div>
  )
}

// ─── Input ───────────────────────────────────────────────────
export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'w-full px-6 py-3.5 text-xl border border-gray-200 rounded-xl bg-white',
        'placeholder:text-gray-400 focus:outline-none focus:border-gray-400 transition-colors',
        className
      )}
      {...props}
    />
  )
)
Input.displayName = 'Input'

// ─── Select ──────────────────────────────────────────────────
export const Select = forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        'w-full px-6 py-3.5 text-xl border border-gray-200 rounded-xl bg-white',
        'focus:outline-none focus:border-gray-400 transition-colors cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </select>
  )
)
Select.displayName = 'Select'

// ─── Textarea ────────────────────────────────────────────────
export const Textarea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        'w-full px-6 py-4 text-xl border border-gray-200 rounded-xl bg-white resize-y',
        'placeholder:text-gray-400 focus:outline-none focus:border-gray-400 transition-colors',
        className
      )}
      rows={3}
      {...props}
    />
  )
)
Textarea.displayName = 'Textarea'

// ─── Plate ───────────────────────────────────────────────────
export function Plate({ children }: { children: string }) {
  return (
    <span className="font-mono text-base bg-gray-100 border border-gray-200 px-2.5 py-1.5 rounded-md">
      {children}
    </span>
  )
}

// ─── Metric card ─────────────────────────────────────────────
export function MetricCard({
  label,
  value,
  sub,
}: {
  label: string
  value: string | number
  sub?: string
}) {
  return (
    <div className="rounded-3xl border border-slate-200/80 bg-white p-8 shadow-sm sm:p-9">
      <div className="mb-1 text-lg font-semibold uppercase tracking-[0.08em] text-slate-500">{label}</div>
      <div className="text-6xl font-semibold tracking-tight text-slate-900">{value}</div>
      {sub && <div className="mt-3 text-xl text-slate-500">{sub}</div>}
    </div>
  )
}

// ─── Avatar ──────────────────────────────────────────────────
const AVATAR_COLORS = [
  'bg-blue-50 text-blue-700',
  'bg-green-50 text-green-700',
  'bg-amber-50 text-amber-700',
  'bg-teal-50 text-teal-700',
  'bg-purple-50 text-purple-700',
]

export function Avatar({
  firstName,
  lastName,
  size = 'md',
}: {
  firstName: string
  lastName: string
  size?: 'sm' | 'md' | 'lg'
}) {
  const idx = (firstName.charCodeAt(0) + lastName.charCodeAt(0)) % AVATAR_COLORS.length
  const color = AVATAR_COLORS[idx]
  const initials = (firstName[0] + lastName[0]).toUpperCase()

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-medium flex-shrink-0',
        color,
        size === 'sm' && 'w-11 h-11 text-lg',
        size === 'md' && 'w-14 h-14 text-xl',
        size === 'lg' && 'h-[4.5rem] w-[4.5rem] text-2xl'
      )}
    >
      {initials}
    </div>
  )
}

// ─── Empty state ─────────────────────────────────────────────
export function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-gray-400">
      <div className="text-xl">{message}</div>
    </div>
  )
}

// ─── Section title ───────────────────────────────────────────
export function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-3 text-lg font-medium text-gray-400 uppercase tracking-wider">
      {children}
    </div>
  )
}
