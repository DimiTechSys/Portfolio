'use client'

import { useMemo, type ReactNode } from 'react'
import { ChevronLeft, ChevronRight, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatWeekLabel } from '@/lib/agenda-utils'
import {
  getProfileDisplayName,
  type WeekSegmentMinutes,
} from '@/lib/queries/planning'
import {
  PLANNING_CELL_STYLES,
  resolvePlanningCellStatus,
  dateKeyInLeaveRange,
  toDateKey,
} from '@/lib/planning/cell-status'
import { SHIFT_KIND_STYLES, formatShiftRange } from '@/lib/planning/shift-kinds'
import type {
  LeaveRequestWithProfiles,
  Profile,
  ShiftAssignmentWithTemplate,
  ShiftKind,
  ShiftTemplate,
} from '@/types/index'

type PlanningWeekViewProps = {
  members: Profile[]
  leaves: LeaveRequestWithProfiles[]
  assignments: ShiftAssignmentWithTemplate[]
  segmentMinutes: WeekSegmentMinutes
  weekRange: ReturnType<typeof import('@/lib/queries/planning').getWeekRange>
  weekOffset: number
  onWeekOffsetChange: (offset: number) => void
  loading?: boolean
  // Mode titulaire : affectation directe sur la grille.
  editable?: boolean
  templates?: ShiftTemplate[]
  onAssign?: (userId: string, dateKey: string, templateId: string) => void
  onUnassign?: (assignmentId: string) => void
  onCancelLeave?: (leaveId: string) => void
  onRemovePresence?: (userId: string, day: Date) => void
}

const DAY_LABELS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const CHIP_BASE =
  'inline-flex min-w-[4.5rem] justify-center rounded-md px-2 py-1 text-xs font-medium'

export function PlanningWeekView({
  members,
  leaves,
  assignments,
  segmentMinutes,
  weekRange,
  weekOffset,
  onWeekOffsetChange,
  loading = false,
  editable = false,
  templates = [],
  onAssign,
  onUnassign,
  onCancelLeave,
  onRemovePresence,
}: PlanningWeekViewProps) {
  const { days, monday, sunday } = weekRange
  const todayKey = toDateKey(new Date())

  const leavesByUser = useMemo(() => {
    const map = new Map<string, LeaveRequestWithProfiles[]>()
    for (const leave of leaves) {
      const list = map.get(leave.requester_id) ?? []
      list.push(leave)
      map.set(leave.requester_id, list)
    }
    return map
  }, [leaves])

  const shiftsByCell = useMemo(() => {
    const map = new Map<string, ShiftAssignmentWithTemplate[]>()
    for (const a of assignments) {
      const key = `${a.user_id}|${a.date}`
      const list = map.get(key) ?? []
      list.push(a)
      map.set(key, list)
    }
    return map
  }, [assignments])

  if (loading) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
        Chargement du planning…
      </div>
    )
  }

  if (members.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
        Aucun collaborateur dans l&apos;équipe.
      </div>
    )
  }

  const shiftChip = (a: ShiftAssignmentWithTemplate, removable: boolean) => {
    const k = (a.template?.kind ?? 'custom') as ShiftKind
    const content = (
      <>
        <span className="max-w-[6rem] truncate">{a.template?.name ?? 'Shift'}</span>
        {a.template ? (
          <span className="text-[10px] font-normal opacity-80">
            {formatShiftRange(a.template.start_time, a.template.end_time)}
          </span>
        ) : null}
      </>
    )
    if (removable) {
      return (
        <button
          key={a.id}
          type="button"
          onClick={() => onUnassign?.(a.id)}
          title="Retirer ce shift"
          className={`relative inline-flex min-w-[4.5rem] flex-col items-center rounded-md px-2 py-1 pr-4 text-xs font-medium ${SHIFT_KIND_STYLES[k]}`}
        >
          {content}
          <X className="absolute right-1 top-1 h-3 w-3 opacity-60" />
        </button>
      )
    }
    return (
      <span
        key={a.id}
        className={`inline-flex min-w-[4.5rem] flex-col items-center rounded-md px-2 py-1 text-xs font-medium ${SHIFT_KIND_STYLES[k]}`}
        title={a.template?.name ?? 'Shift'}
      >
        {content}
      </span>
    )
  }

  const addShiftButton = (memberId: string, dateKey: string) => {
    if (templates.length === 0) return null
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-slate-200 text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-600"
            aria-label="Assigner un shift"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {templates.map((t) => (
            <DropdownMenuItem
              key={t.id}
              onClick={() => onAssign?.(memberId, dateKey, t.id)}
              className="flex items-center gap-2"
            >
              <span className={`h-3 w-3 shrink-0 rounded ${SHIFT_KIND_STYLES[t.kind]}`} />
              <span className="truncate font-medium">{t.name}</span>
              <span className="ml-auto shrink-0 text-xs tabular-nums text-slate-400">
                {formatShiftRange(t.start_time, t.end_time)}
              </span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  const renderCell = (memberId: string, day: Date) => {
    const dateKey = toDateKey(day)
    const userLeaves = leavesByUser.get(memberId) ?? []
    const cellShifts = shiftsByCell.get(`${memberId}|${dateKey}`) ?? []
    const badgedMinutes = segmentMinutes[memberId]?.[dateKey] ?? 0
    const status = resolvePlanningCellStatus({
      dateKey,
      scheduled: cellShifts.length > 0,
      badgedMinutes,
      leaves: userLeaves,
    })
    const leaveCellStatus =
      status === 'leave_approved'
        ? 'leave_approved'
        : status === 'leave_pending'
          ? 'leave_pending'
          : null
    const coveringLeave = leaveCellStatus
      ? (userLeaves.find(
          (l) =>
            l.status === (leaveCellStatus === 'leave_approved' ? 'approved' : 'pending') &&
            dateKeyInLeaveRange(dateKey, l)
        ) ?? null)
      : null

    // Affichage ADDITIF : congé + shift(s) + présent peuvent coexister sur une
    // même journée — on empile tous les statuts présents (au lieu d'en montrer
    // un seul par priorité).
    const nodes: ReactNode[] = []

    if (leaveCellStatus) {
      const style = PLANNING_CELL_STYLES[leaveCellStatus]
      nodes.push(
        editable ? (
          <button
            key="leave"
            type="button"
            onClick={() => coveringLeave && onCancelLeave?.(coveringLeave.id)}
            title="Annuler ce congé"
            className={`relative inline-flex items-center rounded-md py-0.5 pl-1.5 pr-5 text-[11px] font-medium ${style.bg}`}
          >
            {style.label}
            <X className="absolute right-0.5 top-1/2 h-3 w-3 -translate-y-1/2 opacity-60" />
          </button>
        ) : (
          <span key="leave" className={`${CHIP_BASE} ${style.bg}`}>
            {style.label}
          </span>
        )
      )
    }

    cellShifts.forEach((a) => nodes.push(shiftChip(a, editable)))

    if (badgedMinutes > 0) {
      nodes.push(
        editable ? (
          <button
            key="present"
            type="button"
            onClick={() => onRemovePresence?.(memberId, day)}
            title="Supprimer le pointage de ce jour"
            className="relative inline-flex items-center rounded-md bg-emerald-100 py-0.5 pl-1.5 pr-5 text-[11px] font-medium text-emerald-800"
          >
            {PLANNING_CELL_STYLES.badged.label}
            <X className="absolute right-0.5 top-1/2 h-3 w-3 -translate-y-1/2 opacity-60" />
          </button>
        ) : (
          <span key="present" className={`${CHIP_BASE} ${PLANNING_CELL_STYLES.badged.bg}`}>
            {PLANNING_CELL_STYLES.badged.label}
          </span>
        )
      )
    }

    // ── Lecture seule (membres) ──
    if (!editable) {
      if (nodes.length === 0) {
        return (
          <span className={`${CHIP_BASE} ${PLANNING_CELL_STYLES.off.bg}`}>
            {PLANNING_CELL_STYLES.off.label}
          </span>
        )
      }
      return <div className="flex flex-col items-center gap-1">{nodes}</div>
    }

    // ── Titulaire : statuts empilés + bouton + à droite ──
    return (
      <div className="flex items-center justify-center gap-1.5">
        <div className="flex flex-col items-center gap-1">{nodes}</div>
        {addShiftButton(memberId, dateKey)}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => onWeekOffsetChange(weekOffset - 1)}
            aria-label="Semaine précédente"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => onWeekOffsetChange(weekOffset + 1)}
            aria-label="Semaine suivante"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium text-slate-900">
            {formatWeekLabel(monday, sunday)}
          </span>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onWeekOffsetChange(0)}
          disabled={weekOffset === 0}
        >
          Aujourd&apos;hui
        </Button>
      </div>

      {/* Desktop : timeline (collaborateurs en lignes, jours en colonnes) */}
      <div className="hidden overflow-x-auto rounded-lg border border-slate-200 bg-white lg:block">
        <div className="min-w-[52rem]">
          {/* En-tête jours */}
          <div className="grid grid-cols-[12rem_repeat(7,minmax(0,1fr))] border-b border-slate-200">
            <div className="px-3 py-2 text-xs font-medium uppercase tracking-wide text-slate-500">
              Collaborateur
            </div>
            {days.map((day, index) => {
              const isToday = toDateKey(day) === todayKey
              return (
                <div
                  key={toDateKey(day)}
                  className={`border-l border-slate-200 px-2 py-2 text-center text-xs font-medium uppercase tracking-wide ${
                    isToday ? 'bg-teal-50/60 text-teal-700' : 'text-slate-500'
                  }`}
                >
                  {DAY_LABELS[index]}
                  <div className="text-[10px] font-normal normal-case text-slate-400">
                    {day.getDate()}/{day.getMonth() + 1}
                  </div>
                </div>
              )
            })}
          </div>
          {/* Lanes collaborateurs */}
          {members.map((member) => (
            <div
              key={member.id}
              className="grid grid-cols-[12rem_repeat(7,minmax(0,1fr))] border-b border-slate-100 last:border-b-0"
            >
              <div className="flex items-center px-3 py-2 text-sm font-medium text-slate-900">
                {getProfileDisplayName(member)}
              </div>
              {days.map((day) => {
                const isToday = toDateKey(day) === todayKey
                return (
                  <div
                    key={toDateKey(day)}
                    className={`flex min-h-14 items-center justify-center border-l border-slate-200 p-1.5 ${
                      isToday ? 'bg-teal-50/40' : ''
                    }`}
                  >
                    {renderCell(member.id, day)}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4 lg:hidden">
        {days.map((day, index) => (
          <div
            key={toDateKey(day)}
            className="rounded-lg border border-slate-200 bg-white p-4"
          >
            <h3 className="mb-3 text-sm font-semibold text-slate-900">
              {DAY_LABELS[index]} {day.getDate()}/{day.getMonth() + 1}
            </h3>
            <ul className="space-y-2">
              {members.map((member) => (
                <li
                  key={member.id}
                  className="flex items-center justify-between gap-3 text-sm"
                >
                  <span className="font-medium text-slate-800">
                    {getProfileDisplayName(member)}
                  </span>
                  <span className="text-right">{renderCell(member.id, day)}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 text-xs text-slate-600">
        {Object.values(PLANNING_CELL_STYLES).map((style) => (
          <span key={style.label} className="inline-flex items-center gap-1.5">
            <span className={`inline-block h-3 w-3 rounded border border-slate-300 ${style.bg}`} />
            {style.label}
          </span>
        ))}
      </div>
    </div>
  )
}
