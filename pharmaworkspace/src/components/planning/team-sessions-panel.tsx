'use client'

import { useCallback, useEffect, useState } from 'react'
import { useProfile } from '@/contexts/profile-context'
import { TeamSessionsDayTable } from '@/components/session/team-sessions-day-table'
import {
  getTodayTeamSessionsSummary,
  type TeamSessionDaySummary,
} from '@/lib/queries/sessions'

export function TeamSessionsPanel() {
  const { profile, pharmacy, role } = useProfile()
  const pharmacyId = profile?.pharmacy_id ?? pharmacy?.id ?? null
  const [rows, setRows] = useState<TeamSessionDaySummary[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!pharmacyId || role !== 'titulaire') {
      setRows([])
      setLoading(false)
      return
    }
    setLoading(true)
    const result = await getTodayTeamSessionsSummary(pharmacyId)
    if (!result.error) {
      setRows(result.data ?? [])
    }
    setLoading(false)
  }, [pharmacyId, role])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- load() triggers setRows/setLoading; the alternative (inlining) duplicates the interval handler below.
    void load()
  }, [load])

  useEffect(() => {
    if (!pharmacyId) return
    const intervalId = setInterval(() => void load(), 30_000)
    return () => clearInterval(intervalId)
  }, [pharmacyId, load])

  if (role !== 'titulaire') return null

  return (
    <section className="rounded-3xl border border-slate-200/70 bg-white p-4 shadow-sm">
      <div>
        <h2 className="text-lg font-medium text-slate-900">Pointage équipe : aujourd&apos;hui</h2>
        <p className="text-sm text-slate-500">
          Sessions clôturées et en cours : horaires et temps travaillé (pauses non comptées).
        </p>
      </div>

      {loading ? (
        <p className="mt-4 text-sm text-muted-foreground">Chargement…</p>
      ) : rows.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">Aucun pointage aujourd&apos;hui.</p>
      ) : (
        <div className="mt-4">
          <TeamSessionsDayTable rows={rows} showTasks />
        </div>
      )}
    </section>
  )
}
