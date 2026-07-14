'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import type { TaskWithProfiles } from '@/types/index'

interface TaskProgressBarProps {
  tasks?: TaskWithProfiles[]
  loading: boolean
  // Compteurs serveur (exacts à grosse volumétrie). Prioritaires sur `tasks`.
  counts?: { high: number; medium: number; low: number }
}

export function TaskProgressBar({ tasks, loading, counts }: TaskProgressBarProps) {
  if (loading) {
    return (
      <div className="animate-pulse rounded-2xl bg-white border border-slate-200 shadow-sm px-4 py-3">
        <div className="flex justify-between">
          <div className="h-3 w-24 rounded bg-slate-200" />
          <div className="h-3 w-16 rounded bg-slate-200" />
        </div>
        <div className="mt-4 flex gap-4">
          <div className="h-10 flex-1 rounded bg-slate-100" />
          <div className="h-10 flex-1 rounded bg-slate-100" />
          <div className="h-10 flex-1 rounded bg-slate-100" />
        </div>
        <div className="mt-4 h-1.5 w-full rounded-full bg-slate-100" />
      </div>
    )
  }

  const list = tasks ?? []
  const high = counts ? counts.high : list.filter((t) => t.priority === 'high' && t.status !== 'done').length
  const medium = counts ? counts.medium : list.filter((t) => t.priority === 'medium' && t.status !== 'done').length
  const low = counts ? counts.low : list.filter((t) => t.priority === 'low' && t.status !== 'done').length
  const todoTotal = high + medium + low

  const highWidth = todoTotal > 0 ? (high / todoTotal) * 100 : 0
  const mediumWidth = todoTotal > 0 ? (medium / todoTotal) * 100 : 0
  const lowWidth = todoTotal > 0 ? (low / todoTotal) * 100 : 0

  return (
    <div className="rounded-2xl bg-white border border-slate-200 shadow-sm px-4 py-3">
      {/* Ligne haute */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase text-slate-500">
          Mes tâches à faire
        </span>
      </div>

      {/* Ligne KPIs */}
      <div className="mt-2.5 flex items-center">
        <div className="flex flex-1 flex-col items-center text-center">
          <span
            className={cn(
              'text-xl font-bold text-slate-900',
              high > 0 && 'text-red-500'
            )}
          >
            {high}
          </span>
          <span className="text-[9px] uppercase tracking-wide text-slate-500">
            Urgence haute
          </span>
        </div>

        <div className="mx-4 h-7 w-[1px] bg-slate-100" />

        <div className="flex flex-1 flex-col items-center text-center">
          <span
            className={cn(
              'text-xl font-bold text-slate-900',
              medium > 0 && 'text-orange-500'
            )}
          >
            {medium}
          </span>
          <span className="text-[9px] uppercase tracking-wide text-slate-500">
            Urgence moyenne
          </span>
        </div>

        <div className="mx-4 h-7 w-[1px] bg-slate-100" />

        <div className="flex flex-1 flex-col items-center text-center">
          <span
            className={cn(
              'text-xl font-bold text-slate-900',
              low > 0 && 'text-blue-600'
            )}
          >
            {low}
          </span>
          <span className="text-[9px] uppercase tracking-wide text-slate-500">
            Urgence basse
          </span>
        </div>
      </div>

      {/* Barre de progression fine */}
      <div className="mt-3.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div className="flex h-full w-full">
          {highWidth > 0 && (
            <div
              className="h-full bg-red-500 transition-all duration-500"
              style={{ width: `${highWidth}%` }}
            />
          )}
          {mediumWidth > 0 && (
            <div
              className="h-full bg-orange-400 transition-all duration-500"
              style={{ width: `${mediumWidth}%` }}
            />
          )}
          {lowWidth > 0 && (
            <div
              className="h-full bg-blue-500 transition-all duration-500"
              style={{ width: `${lowWidth}%` }}
            />
          )}
        </div>
      </div>
    </div>
  )
}
