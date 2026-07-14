'use client'

import type { TeamSessionDaySummary } from '@/lib/queries/sessions'
import { formatSessionClock, formatWorkedDuration } from '@/lib/sessions/time'

type TeamSessionsDayTableProps = {
  rows: TeamSessionDaySummary[]
  showTasks?: boolean
}

export function TeamSessionsDayTable({ rows, showTasks = false }: TeamSessionsDayTableProps) {
  if (rows.length === 0) return null

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[32rem] text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-xs font-medium uppercase tracking-wide text-slate-500">
            <th className="pb-2 pr-4">Collaborateur</th>
            <th className="pb-2 pr-4">Début</th>
            <th className="pb-2 pr-4">Fin</th>
            <th className="pb-2 pr-4">Temps travaillé</th>
            <th className="pb-2">Statut</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row) => (
            <tr key={row.user_id}>
              <td className="py-3 pr-4 font-medium text-slate-900">{row.display_name}</td>
              <td className="py-3 pr-4 text-slate-700">{formatSessionClock(row.started_at)}</td>
              <td className="py-3 pr-4 text-slate-700">
                {row.is_active ? 'En cours' : formatSessionClock(row.ended_at)}
              </td>
              <td className="py-3 pr-4 font-semibold text-emerald-700">
                {formatWorkedDuration(row.worked_minutes_today)}
                {showTasks ? (
                  <span className="ml-2 text-xs font-normal text-slate-500">
                    · {row.tasks_completed} tâche{row.tasks_completed > 1 ? 's' : ''}
                  </span>
                ) : null}
              </td>
              <td className="py-3">
                <span
                  className={
                    row.is_active
                      ? 'inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700'
                      : 'inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600'
                  }
                >
                  {row.is_active ? 'En session' : 'Terminée'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
