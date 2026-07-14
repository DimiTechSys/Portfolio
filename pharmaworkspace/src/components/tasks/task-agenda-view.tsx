'use client'

import React, { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, CalendarOff, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  buildAgendaItems,
  formatWeekLabel,
  formatMonthLabel,
  getItemsForDay,
  getItemsWithoutDate,
  getMondayOfWeek,
  getWeekDays,
  getMonthDays,
  isSameMonthOffset,
  isPast,
  isToday,
} from '@/lib/agenda-utils'
import type {
  AgendaItem,
  AgendaItemType,
  OrderWithDetails,
  Rental,
  Shortage,
  TaskWithProfiles,
} from '@/types/index'

// ─── Props ───────────────────────────────────────────────────────────────────

interface TaskAgendaViewProps {
  tasks: TaskWithProfiles[]
  rentals: Rental[]
  orders: OrderWithDetails[]
  shortages: Shortage[]
  loading: boolean
}

// ─── Color config ────────────────────────────────────────────────────────────

function getCardStyle(item: AgendaItem): {
  borderColor: string
  bg: string
  labelText: string
  labelColor: string
} {
  if (item.type === 'task') {
    switch (item.priority) {
      case 'high':
        return { borderColor: '#ef4444', bg: '#fff8f8', labelText: 'Tâche · Haute', labelColor: 'text-red-600' }
      case 'medium':
        return { borderColor: '#f97316', bg: '#fff9f5', labelText: 'Tâche · Moyenne', labelColor: 'text-orange-600' }
      case 'low':
        return { borderColor: '#eab308', bg: '#fefdf0', labelText: 'Tâche · Basse', labelColor: 'text-yellow-600' }
      default:
        return { borderColor: '#94a3b8', bg: 'white', labelText: 'Tâche', labelColor: 'text-slate-500' }
    }
  }
  if (item.type === 'rental') {
    return { borderColor: '#8b5cf6', bg: '#faf8ff', labelText: 'Location', labelColor: 'text-violet-600' }
  }
  if (item.type === 'shortage') {
    return { borderColor: '#3b82f6', bg: '#f5f9ff', labelText: 'Rupture', labelColor: 'text-blue-600' }
  }
  // order
  return { borderColor: '#0d9488', bg: '#f0fdf9', labelText: 'Commande', labelColor: 'text-teal-600' }
}

// ─── AgendaItemCard ──────────────────────────────────────────────────────────

interface AgendaItemCardProps {
  item: AgendaItem
  isPastDate?: boolean
}

function AgendaItemCard({ item, isPastDate }: AgendaItemCardProps) {
  const style = getCardStyle(item)
  return (
    <div
      className={cn(
        'rounded-lg border-t border-r border-b border-slate-200 border-l-[3px] p-2 cursor-default transition-opacity hover:opacity-80',
        isPastDate && 'opacity-60'
      )}
      style={{ borderLeftColor: style.borderColor, backgroundColor: style.bg }}
    >
      <p className={cn('text-[10px] font-semibold uppercase tracking-wide mb-0.5', style.labelColor)}>
        {style.labelText}
      </p>
      <p className="text-xs font-medium text-slate-800 line-clamp-2">{item.title}</p>
      {item.meta && (
        <p className="text-[10px] text-slate-500 mt-1 truncate">{item.meta}</p>
      )}
    </div>
  )
}

function AgendaItemDotCard({ item, isPastDate }: AgendaItemCardProps) {
  const style = getCardStyle(item)
  return (
    <div
      className={cn(
        'group flex items-center gap-1.5 rounded px-1.5 py-1 hover:bg-slate-100 transition-colors cursor-default',
        isPastDate && 'opacity-50'
      )}
      title={`${style.labelText}: ${item.title}`}
    >
      <span className="shrink-0 h-2 w-2 rounded-full" style={{ backgroundColor: style.borderColor }} />
      <span className="truncate text-[10px] font-medium text-slate-700 group-hover:text-slate-900">{item.title}</span>
    </div>
  )
}


// ─── Filter pills config ────────────────────────────────────────────────────

const FILTER_CONFIG: {
  value: AgendaItemType | 'all'
  label: string
  dotColor?: string
  activeBg: string
  activeBorder: string
}[] = [
  { value: 'all', label: 'Tous', activeBg: 'bg-slate-700', activeBorder: 'border-slate-700' },
  { value: 'task', label: 'Tâches', dotColor: 'bg-red-500', activeBg: 'bg-red-500', activeBorder: 'border-red-500' },
  { value: 'rental', label: 'Locations', dotColor: 'bg-violet-500', activeBg: 'bg-violet-500', activeBorder: 'border-violet-500' },
  { value: 'shortage', label: 'Ruptures', dotColor: 'bg-blue-500', activeBg: 'bg-blue-500', activeBorder: 'border-blue-500' },
  { value: 'order', label: 'Commandes', dotColor: 'bg-teal-600', activeBg: 'bg-teal-600', activeBorder: 'border-teal-600' },
]

// ─── Legend config ───────────────────────────────────────────────────────────

const LEGEND_ITEMS = [
  { color: 'bg-red-500', label: 'Tâche haute' },
  { color: 'bg-orange-400', label: 'Tâche moyenne' },
  { color: 'bg-yellow-400', label: 'Tâche basse' },
  { color: 'bg-violet-500', label: 'Location' },
  { color: 'bg-blue-500', label: 'Rupture' },
  { color: 'bg-teal-600', label: 'Commande' },
]

// ─── Day format helper ───────────────────────────────────────────────────────

const dayNameFmt = new Intl.DateTimeFormat('fr-FR', { weekday: 'short' })

function formatDayName(date: Date): string {
  return dayNameFmt.format(date).toUpperCase()
}

function getIsoWeekNumber(date: Date): number {
  const copy = new Date(date)
  copy.setHours(0, 0, 0, 0)
  copy.setDate(copy.getDate() + 3 - ((copy.getDay() + 6) % 7))
  const week1 = new Date(copy.getFullYear(), 0, 4)
  week1.setDate(week1.getDate() + 3 - ((week1.getDay() + 6) % 7))
  return 1 + Math.round((copy.getTime() - week1.getTime()) / 604800000)
}

function toWeekInputValue(date: Date): string {
  const week = String(getIsoWeekNumber(date)).padStart(2, '0')
  return `${date.getFullYear()}-W${week}`
}

function getMondayFromWeekValue(value: string): Date | null {
  const match = value.match(/^(\d{4})-W(\d{2})$/)
  if (!match) return null
  const year = Number(match[1])
  const week = Number(match[2])
  if (!Number.isFinite(year) || !Number.isFinite(week)) return null

  const jan4 = new Date(year, 0, 4)
  const jan4Day = (jan4.getDay() + 6) % 7
  const firstMonday = new Date(jan4)
  firstMonday.setDate(jan4.getDate() - jan4Day)

  const monday = new Date(firstMonday)
  monday.setDate(firstMonday.getDate() + (week - 1) * 7)
  monday.setHours(0, 0, 0, 0)
  return monday
}

// ─── Main component ─────────────────────────────────────────────────────────

function TaskAgendaViewInner({
  tasks,
  rentals,
  orders,
  shortages,
  loading,
}: TaskAgendaViewProps) {
  const [dateOffset, setDateOffset] = useState(0)
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week')
  const [activeFilter, setActiveFilter] = useState<AgendaItemType | 'all'>('all')

  const monday = getMondayOfWeek(dateOffset)
  const weekDays = getWeekDays(monday)
  const sunday = weekDays[6]
  
  const monthDays = getMonthDays(dateOffset)
  const activeDays = viewMode === 'week' ? weekDays : monthDays

  const allItems = useMemo(
    () => buildAgendaItems(tasks, rentals, orders, shortages),
    [tasks, rentals, orders, shortages]
  )

  const filteredItems = useMemo(
    () => (activeFilter === 'all' ? allItems : allItems.filter((i) => i.type === activeFilter)),
    [allItems, activeFilter]
  )

  // Counters for pills (based on current visible days + no-date)
  const periodItems = useMemo(
    () => activeDays.flatMap((d) => getItemsForDay(allItems, d)),
    // eslint-disable-next-line react-hooks/preserve-manual-memoization -- activeDays is recomputed from dateOffset; identity is stable per render.
    [activeDays, allItems]
  )
  const noDateItems = useMemo(() => getItemsWithoutDate(allItems), [allItems])
  const allPeriodItems = useMemo(() => [...periodItems, ...noDateItems], [periodItems, noDateItems])

  function getCount(type: AgendaItemType | 'all'): number {
    if (type === 'all') return allPeriodItems.length
    return allPeriodItems.filter((i) => i.type === type).length
  }

  // eslint-disable-next-line react-hooks/preserve-manual-memoization -- monday is derived from dateOffset; stable per render.
  const weekPickerValue = useMemo(() => toWeekInputValue(monday), [monday])
  const monthPickerValue = useMemo(() => {
    const now = new Date()
    const selected = new Date(now.getFullYear(), now.getMonth() + dateOffset, 1)
    return `${selected.getFullYear()}-${String(selected.getMonth() + 1).padStart(2, '0')}`
  }, [dateOffset])

  const handleWeekPick = (value: string) => {
    const pickedMonday = getMondayFromWeekValue(value)
    if (!pickedMonday) return
    const currentMonday = getMondayOfWeek(0)
    const diffWeeks = Math.round((pickedMonday.getTime() - currentMonday.getTime()) / 604800000)
    setDateOffset(diffWeeks)
  }

  const handleMonthPick = (value: string) => {
    const match = value.match(/^(\d{4})-(\d{2})$/)
    if (!match) return
    const year = Number(match[1])
    const month = Number(match[2])
    if (!Number.isFinite(year) || !Number.isFinite(month)) return
    const now = new Date()
    const currentAbs = now.getFullYear() * 12 + now.getMonth()
    const pickedAbs = year * 12 + (month - 1)
    setDateOffset(pickedAbs - currentAbs)
  }

  // ── Loading skeleton ──
  if (loading) {
    return (
      <div className="flex gap-4">
        <div className="flex-1 space-y-3 min-w-0">
          <div className="flex items-center justify-between">
            <div className="h-8 w-20 animate-pulse rounded-lg bg-slate-200" />
            <div className="h-4 w-32 animate-pulse rounded bg-slate-200" />
            <div className="h-8 w-20 animate-pulse rounded-lg bg-slate-200" />
          </div>
          <div className="w-full min-w-0">
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="min-w-0">
                  <div className="mb-1.5 h-12 animate-pulse rounded-lg border border-slate-200 bg-white sm:h-14" />
                  <div className="space-y-2">
                    <div className="h-14 animate-pulse rounded-lg border border-slate-200 bg-white" />
                    <div className="h-14 animate-pulse rounded-lg border border-slate-200 bg-white" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="w-[280px] shrink-0 animate-pulse rounded-xl bg-slate-100" />
      </div>
    )
  }

  return (
    <div className="flex gap-4 items-start">
      {/* ── Left Area: Main Agenda ── */}
      <div className="flex-1 space-y-4 min-w-0">
        
        {/* Navigation & Controls */}
        <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-2 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:gap-2">
          <button
            onClick={() => setDateOffset((w) => w - 1)}
            className="flex shrink-0 items-center gap-1 self-start rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-500 transition-colors hover:bg-slate-50 sm:self-auto"
          >
            <ChevronLeft size={16} />
            Préc.
          </button>

          <div className="flex min-w-0 flex-1 flex-wrap items-center justify-center gap-x-3 gap-y-2">
            <span className="shrink-0 text-center text-sm font-semibold text-slate-800">
              {viewMode === 'week' ? formatWeekLabel(monday, sunday) : formatMonthLabel(dateOffset)}
            </span>
            <div className="flex items-center gap-1.5">
              {viewMode === 'week' ? (
                <input
                  type="week"
                  value={weekPickerValue}
                  onChange={(event) => handleWeekPick(event.target.value)}
                  className="h-8 max-w-full shrink rounded-md border border-slate-200 bg-white px-2 text-xs font-medium text-slate-600"
                  aria-label="Choisir une semaine"
                />
              ) : (
                <input
                  type="month"
                  value={monthPickerValue}
                  onChange={(event) => handleMonthPick(event.target.value)}
                  className="h-8 max-w-full shrink rounded-md border border-slate-200 bg-white px-2 text-xs font-medium text-slate-600"
                  aria-label="Choisir un mois"
                />
              )}
              <div className="flex shrink-0 items-center rounded-lg border border-slate-200 bg-slate-100 p-0.5">
                <button
                  onClick={() => { setViewMode('week'); setDateOffset(0); }}
                  className={cn(
                    'rounded-md px-2.5 py-1 text-xs font-semibold transition-all sm:px-3',
                    viewMode === 'week' ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  )}
                >
                  Semaine
                </button>
                <button
                  onClick={() => { setViewMode('month'); setDateOffset(0); }}
                  className={cn(
                    'rounded-md px-2.5 py-1 text-xs font-semibold transition-all sm:px-3',
                    viewMode === 'month' ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  )}
                >
                  Mois
                </button>
              </div>
            </div>
            {dateOffset !== 0 && (
              <button
                onClick={() => setDateOffset(0)}
                className="shrink-0 rounded-lg border border-teal-500 px-3 py-1 text-sm font-medium text-teal-600 transition-colors hover:bg-teal-50"
              >
                Aujourd&apos;hui
              </button>
            )}
          </div>

          <button
            onClick={() => setDateOffset((w) => w + 1)}
            className="flex shrink-0 items-center gap-1 self-end rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-500 transition-colors hover:bg-slate-50 sm:self-auto"
          >
            Suiv.
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Filters and Legends */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            {FILTER_CONFIG.map((f) => {
              const count = getCount(f.value)
              const isActive = activeFilter === f.value
              const isEmpty = count === 0
              return (
                <button
                  key={f.value}
                  onClick={() => setActiveFilter(f.value)}
                  className={cn(
                    'flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border cursor-pointer transition-colors',
                    isActive
                      ? `${f.activeBg} ${f.activeBorder} text-white`
                      : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300',
                    isEmpty && !isActive && 'opacity-50'
                  )}
                >
                  {f.dotColor && !isActive && (
                    <span className={cn('inline-block h-2 w-2 rounded-full', f.dotColor)} />
                  )}
                  {f.label}
                  {count > 0 && (
                    <span className={cn(
                      'ml-0.5',
                      isActive ? 'text-white/80' : 'text-slate-400'
                    )}>
                      ({count})
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          <div className="flex flex-wrap gap-4">
            {LEGEND_ITEMS.map((l) => (
              <div key={l.label} className="flex items-center gap-1.5 text-xs text-slate-400">
                <span className={cn('inline-block h-2 w-2 rounded-sm', l.color)} />
                {l.label}
              </div>
            ))}
          </div>
        </div>

        {/* ── Grid Rendering ── */}
        {viewMode === 'week' ? (
          // Week View : 7 colonnes fluides, sans scroll horizontal
          <div className="w-full min-w-0 pb-4">
            <div className="grid w-full grid-cols-7 gap-1 sm:gap-1.5 md:gap-2">
              {weekDays.map((day) => {
                const dayItems = getItemsForDay(filteredItems, day)
                const today = isToday(day)
                const past = isPast(day)
                return (
                  <div key={day.toISOString()} className="min-w-0">
                    <div
                      className={cn(
                        'mb-1.5 rounded-lg border px-1 py-1.5 text-center sm:rounded-xl sm:px-1.5 sm:py-2',
                        today ? 'border-teal-200 bg-teal-50' : 'border-slate-200 bg-white'
                      )}
                    >
                      <p
                        className={cn(
                          'text-[10px] font-semibold uppercase leading-tight tracking-wide sm:text-xs',
                          today ? 'text-teal-600' : 'text-slate-400'
                        )}
                      >
                        {formatDayName(day)}
                      </p>
                      <p
                        className={cn(
                          'text-lg font-semibold leading-tight sm:text-xl',
                          today ? 'text-teal-600' : past ? 'text-slate-300' : 'text-slate-800'
                        )}
                      >
                        {day.getDate()}
                      </p>
                      {dayItems.length > 0 && (
                        <p className="text-[10px] text-slate-400 sm:text-xs">
                          {dayItems.length} élément{dayItems.length > 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                    <div className="flex min-h-[100px] flex-col gap-1.5 sm:min-h-[120px] sm:gap-2">
                      {dayItems.length === 0 ? (
                        <div className="text-center text-xs text-slate-300 py-4">-</div>
                      ) : (
                        dayItems.map((item) => (
                          <AgendaItemCard key={item.id} item={item} isPastDate={past} />
                        ))
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          // Month View
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col">
            <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
              {['LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM', 'DIM'].map(d => (
                <div key={d} className="py-2.5 text-center text-[10px] font-bold text-slate-500 uppercase tracking-widest border-r border-slate-200 last:border-r-0">
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 auto-rows-[minmax(100px,auto)]">
              {monthDays.map((day, idx) => {
                const dayItems = getItemsForDay(filteredItems, day)
                const today = isToday(day)
                const past = isPast(day)
                const isCurrentMonth = isSameMonthOffset(day, dateOffset)
                
                return (
                  <div 
                    key={day.toISOString()} 
                    className={cn(
                      'p-1.5 border-r border-b border-slate-200 relative',
                      !isCurrentMonth ? 'bg-slate-50/50' : 'bg-white',
                      (idx + 1) % 7 === 0 ? 'border-r-0' : '',
                      today && 'bg-teal-50/30'
                    )}
                  >
                    <div className="flex items-center justify-between px-1 mb-1">
                      <span className={cn(
                        "text-xs font-semibold h-6 w-6 flex items-center justify-center rounded-full",
                        today ? "bg-teal-600 text-white" : 
                        !isCurrentMonth ? "text-slate-400" : 
                        past ? "text-slate-400" : "text-slate-700"
                      )}>
                        {day.getDate()}
                      </span>
                      {dayItems.length > 0 && (
                        <span className="text-[9px] font-medium text-slate-400">
                          {dayItems.length}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col gap-0.5 mt-1 max-h-[85px] overflow-hidden">
                      {dayItems.map(item => (
                        <AgendaItemDotCard key={item.id} item={item} isPastDate={past} />
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Right Area: Non-dated elements panel ── */}
      {(() => {
        const noDate = getItemsWithoutDate(filteredItems)
        return (
          <div className="w-[280px] shrink-0 sticky top-6 max-h-[calc(100vh-3rem)] flex flex-col rounded-2xl border border-slate-200 bg-slate-50 shadow-sm overflow-hidden">
             <div className="p-4 border-b border-slate-200 bg-white flex flex-col items-center justify-center relative overflow-hidden">
                <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-teal-400 to-blue-500" />
                <CalendarOff size={20} className="text-slate-400 mb-2" />
                <h3 className="text-sm font-bold uppercase tracking-widest text-slate-700">
                  Sans Date
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Éléments en attente
                </p>
                {noDate.length > 0 && (
                  <span className="mt-2 inline-flex items-center rounded-full bg-slate-200 px-2.5 py-0.5 text-[10px] font-semibold text-slate-700">
                    {noDate.length} {noDate.length > 1 ? 'éléments' : 'élément'}
                  </span>
                )}
             </div>

             <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2 relative">
               {noDate.length === 0 ? (
                  <div className="text-center text-xs text-slate-400 py-8 px-4 flex flex-col items-center gap-2">
                    <CheckCircle className="h-6 w-6 text-slate-300" />
                    Tout est planifié !
                  </div>
               ) : (
                 noDate.map((item) => (
                   <AgendaItemCard key={item.id} item={item} />
                 ))
               )}
             </div>
          </div>
        )
      })()}

    </div>
  )
}

export const TaskAgendaView = React.memo(TaskAgendaViewInner)

