'use client'

export function MissionProgressBar({
  done,
  total,
}: {
  done: number
  total: number
}) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0

  return (
    <div className="flex items-center gap-3">
      <div
        role="progressbar"
        aria-valuenow={done}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-label={`${done} mission${done > 1 ? 's' : ''} sur ${total} terminée${done > 1 ? 's' : ''}`}
        className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200"
      >
        <div
          className="h-full rounded-full bg-teal-600 transition-all duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="shrink-0 text-xs font-medium tabular-nums text-slate-600">
        {done}/{total}
      </span>
    </div>
  )
}
