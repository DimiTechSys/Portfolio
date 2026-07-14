import type {
  AgendaItem,
  AgendaItemPriority,
  AgendaItemType,
  OrderWithDetails,
  Rental,
  Shortage,
  TaskWithProfiles,
} from '@/types/index'

// ─── Date helpers ────────────────────────────────────────────────────────────

export function getMondayOfWeek(weekOffset: number): Date {
  const now = new Date()
  const day = now.getDay() // 0=Sun … 6=Sat
  const diffToMonday = (day + 6) % 7 // how many days since Monday
  const monday = new Date(now)
  monday.setDate(now.getDate() - diffToMonday + weekOffset * 7)
  monday.setHours(0, 0, 0, 0)
  return monday
}

export function getWeekDays(mondayDate: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(mondayDate)
    d.setDate(mondayDate.getDate() + i)
    d.setHours(0, 0, 0, 0)
    return d
  })
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

export function normalizeDate(raw: string | Date | null | undefined): Date | null {
  if (raw == null) return null
  const d = raw instanceof Date ? raw : new Date(raw)
  if (isNaN(d.getTime())) return null
  return d
}

export function isToday(date: Date): boolean {
  return isSameDay(date, new Date())
}

export function isPast(date: Date): boolean {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(date)
  target.setHours(0, 0, 0, 0)
  return target < today
}

export function formatWeekLabel(monday: Date, sunday: Date): string {
  const dayFmt = new Intl.DateTimeFormat('fr-FR', { day: 'numeric' })
  const monthFmt = new Intl.DateTimeFormat('fr-FR', { month: 'short' })
  const yearFmt = new Intl.DateTimeFormat('fr-FR', { year: 'numeric' })

  const monDay = dayFmt.format(monday)
  const sunDay = dayFmt.format(sunday)
  const sunMonth = monthFmt.format(sunday)
  const sunYear = yearFmt.format(sunday)

// Same month?
  if (monday.getMonth() === sunday.getMonth()) {
    return `${monDay} – ${sunDay} ${sunMonth} ${sunYear}`
  }
  const monMonth = monthFmt.format(monday)
  return `${monDay} ${monMonth} – ${sunDay} ${sunMonth} ${sunYear}`
}

export function getMonthDays(monthOffset: number): Date[] {
  const targetDate = new Date()
  targetDate.setMonth(targetDate.getMonth() + monthOffset)
  
  const year = targetDate.getFullYear()
  const month = targetDate.getMonth()
  
  const firstDayOfMonth = new Date(year, month, 1)
  const lastDayOfMonth = new Date(year, month + 1, 0)
  
  const firstDayOfWeek = firstDayOfMonth.getDay() // 0=Sun ... 6=Sat
  const diffToMonday = (firstDayOfWeek + 6) % 7
  const startPadDate = new Date(year, month, 1 - diffToMonday)
  
  const lastDayOfWeek = lastDayOfMonth.getDay()
  const diffToSunday = (7 - lastDayOfWeek) % 7
  const endPadDate = new Date(year, month + 1, diffToSunday === 0 ? 0 : diffToSunday) 
  
  const days: Date[] = []
  const current = new Date(startPadDate)
  current.setHours(0,0,0,0)
  
  const end = new Date(endPadDate)
  end.setHours(0,0,0,0)
  
  while (current <= end) {
    days.push(new Date(current))
    current.setDate(current.getDate() + 1)
  }
  
  return days
}

export function formatMonthLabel(monthOffset: number): string {
  const target = new Date()
  target.setMonth(target.getMonth() + monthOffset)
  const monthStr = new Intl.DateTimeFormat('fr-FR', { month: 'long' }).format(target)
  return `${monthStr.charAt(0).toUpperCase() + monthStr.slice(1)} ${target.getFullYear()}`
}

export function isSameMonthOffset(date: Date, monthOffset: number): boolean {
  const target = new Date()
  target.setMonth(target.getMonth() + monthOffset)
  return date.getFullYear() === target.getFullYear() && date.getMonth() === target.getMonth()
}

// ─── Item builders ───────────────────────────────────────────────────────────

export function buildAgendaItems(
  tasks: TaskWithProfiles[],
  rentals: Rental[],
  orders: OrderWithDetails[],
  shortages: Shortage[]
): AgendaItem[] {
  const items: AgendaItem[] = []

  // Tasks: exclude done & cancelled
  for (const t of tasks) {
    if (t.status === 'done' || t.status === 'cancelled') continue
    items.push({
      id: `task-${t.id}`,
      type: 'task',
      title: t.title,
      meta: t.assigned_to_profile?.display_name ?? 'Non assigné',
      priority: (t.priority as AgendaItemPriority) ?? null,
      date: normalizeDate(t.due_date),
      status: t.status,
      originalId: t.id,
    })
  }

  // Rentals: exclude returned
  for (const r of rentals) {
    if (r.status === 'returned') continue
    items.push({
      id: `rental-${r.id}`,
      type: 'rental',
      title: r.equipment,
      meta: r.client_name ?? '',
      priority: null,
      date: normalizeDate(r.expected_return),
      status: r.status,
      originalId: r.id,
    })
  }

  // Orders: exclude received
  for (const o of orders) {
    if (o.status === 'received') continue
    items.push({
      id: `order-${o.id}`,
      type: 'order',
      title: o.supplier?.name ?? 'Commande',
      meta: o.items?.length ? `${o.items.length} référence(s)` : '',
      priority: null,
      date: normalizeDate(o.ordered_at),
      status: o.status,
      originalId: o.id,
    })
  }

  // Shortages: exclude resolved, always null date
  for (const s of shortages) {
    if (s.status === 'resolved') continue
    items.push({
      id: `shortage-${s.id}`,
      type: 'shortage',
      title: s.product_name,
      meta: s.substitute ? `Alt. : ${s.substitute}` : 'Aucune alternative',
      priority: null,
      date: null,
      status: s.status,
      originalId: s.id,
    })
  }

  return items
}

// ─── Sort helpers ────────────────────────────────────────────────────────────

const TYPE_ORDER: Record<AgendaItemType, number> = {
  task: 0,
  order: 1,
  rental: 2,
  shortage: 3,
}

const PRIORITY_ORDER: Record<string, number> = {
  high: 0,
  medium: 1,
  low: 2,
}

function compareItems(a: AgendaItem, b: AgendaItem): number {
  // 1. Compare by type
  const typeA = TYPE_ORDER[a.type]
  const typeB = TYPE_ORDER[b.type]
  if (typeA !== typeB) return typeA - typeB

  // 2. If same type = task → compare by priority
  if (a.type === 'task' && b.type === 'task') {
    const prioA = a.priority ? PRIORITY_ORDER[a.priority] ?? 3 : 3
    const prioB = b.priority ? PRIORITY_ORDER[b.priority] ?? 3 : 3
    if (prioA !== prioB) return prioA - prioB
  }

  // 3. Fallback: alphabetical
  return a.title.localeCompare(b.title, 'fr-FR')
}

// ─── Filter + sort accessors ─────────────────────────────────────────────────

export function getItemsForDay(items: AgendaItem[], day: Date): AgendaItem[] {
  return items
    .filter((i) => i.date !== null && isSameDay(i.date, day))
    .sort(compareItems)
}

export function getItemsWithoutDate(items: AgendaItem[]): AgendaItem[] {
  return items.filter((i) => i.date === null).sort(compareItems)
}
