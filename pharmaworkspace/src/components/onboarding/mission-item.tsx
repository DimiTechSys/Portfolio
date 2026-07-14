'use client'

import Link from 'next/link'
import { Check, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Mission } from '@/lib/onboarding/missions'

type MissionItemProps = {
  mission: Mission
  onCtaClick?: (missionId: string) => void
  onFeedbackClick?: () => void
}

export function MissionItem({ mission, onCtaClick, onFeedbackClick }: MissionItemProps) {
  const isDone = mission.status === 'done'

  return (
    <li
      className="flex items-center gap-3 py-2"
      title={mission.tooltip}
      data-mission-id={mission.id}
      data-mission-status={mission.status}
    >
      <span
        aria-hidden="true"
        className={cn(
          'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors duration-300',
          isDone
            ? 'border-teal-600 bg-teal-600 text-white'
            : 'border-slate-300 bg-white'
        )}
      >
        {isDone && <Check className="h-3 w-3" strokeWidth={3} />}
      </span>

      <span
        className={cn(
          'flex-1 text-sm transition-colors',
          isDone ? 'text-slate-400 line-through' : 'text-slate-700'
        )}
      >
        {mission.label}
      </span>

      {!isDone && mission.cta && 'href' in mission.cta && (
        <Link
          href={mission.cta.href}
          onClick={() => onCtaClick?.(mission.id)}
          className="inline-flex shrink-0 items-center gap-1 rounded-full border border-teal-200 bg-teal-50 px-2.5 py-1 text-xs font-medium text-teal-700 transition-colors hover:bg-teal-100"
        >
          <span>Faire</span>
          <ArrowRight className="h-3 w-3" aria-hidden="true" />
        </Link>
      )}

      {!isDone && mission.cta && 'feedback' in mission.cta && (
        <button
          type="button"
          onClick={() => {
            onCtaClick?.(mission.id)
            onFeedbackClick?.()
          }}
          className="inline-flex shrink-0 items-center gap-1 rounded-full border border-teal-200 bg-teal-50 px-2.5 py-1 text-xs font-medium text-teal-700 transition-colors hover:bg-teal-100"
        >
          <span>Donner mon avis</span>
          <ArrowRight className="h-3 w-3" aria-hidden="true" />
        </button>
      )}
    </li>
  )
}
