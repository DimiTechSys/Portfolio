'use client'

import React, { Suspense, useEffect, useMemo, useState } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Plus, List, LayoutDashboard } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

import { useTasks, useTaskSections, type TaskSectionResult } from '@/features/tasks'
import { useProfile } from '@/contexts/profile-context'
import { TaskProgressBar } from '@/components/tasks/task-progress-bar'
import { TaskListView } from '@/components/tasks/task-list-view'
import { TaskKanbanView } from '@/components/tasks/task-kanban-view'
import { TaskDrawer } from '@/components/tasks/task-drawer'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { TaskPriority, TaskStatus, TaskWithProfiles } from '@/types/index'

type ViewMode = 'list' | 'kanban'

const TASK_PRIORITY_FILTERS: { value: TaskPriority | 'all'; label: string }[] = [
  { value: 'all', label: 'Toutes' },
  { value: 'high', label: 'Haute' },
  { value: 'medium', label: 'Moyenne' },
  { value: 'low', label: 'Basse' },
]

const PRIORITY_RANK: Record<string, number> = { high: 0, medium: 1, low: 2 }
const STATUS_RANK: Record<string, number> = { todo: 0, cancelled: 1, done: 2 }

function sortByPriority(a: TaskWithProfiles, b: TaskWithProfiles): number {
  const statusDiff = (STATUS_RANK[a.status] ?? 9) - (STATUS_RANK[b.status] ?? 9)
  if (statusDiff !== 0) return statusDiff
  const prioDiff = (PRIORITY_RANK[a.priority] ?? 99) - (PRIORITY_RANK[b.priority] ?? 99)
  if (prioDiff !== 0) return prioDiff
  const aDate = a.due_date ? new Date(a.due_date).getTime() : Number.MAX_SAFE_INTEGER
  const bDate = b.due_date ? new Date(b.due_date).getTime() : Number.MAX_SAFE_INTEGER
  return aDate - bDate
}

function LoadMore({ section }: { section: TaskSectionResult }) {
  if (!section.hasNextPage) return null
  return (
    <div className="flex justify-center pt-1">
      <button
        type="button"
        onClick={() => void section.fetchNextPage()}
        disabled={section.fetchingNextPage}
        className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:opacity-50"
      >
        {section.fetchingNextPage ? 'Chargement…' : 'Charger plus'}
      </button>
    </div>
  )
}

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(false)
  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 1024)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])
  return isDesktop
}

function TasksContent() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const isDesktop = useIsDesktop()
  const { profile } = useProfile()

  // View state with localStorage persistence
  const [view, setView] = useState<ViewMode>(() => {
    if (typeof window === 'undefined') return 'list'
    const stored = localStorage.getItem('pharmaworkspace_tasks_view')
    if (stored === 'kanban') return 'kanban'
    return 'list'
  })

  const handleViewChange = (v: ViewMode) => {
    setView(v)
    localStorage.setItem('pharmaworkspace_tasks_view', v)
  }

  const effectiveView: ViewMode = view === 'kanban' && !isDesktop ? 'list' : view
  const isListView = effectiveView === 'list'

  // Filtres (poussés côté serveur, plus de filtrage sur un flux paginé)
  const selectedStatus = (searchParams.get('status') ?? '') as TaskStatus | ''
  const selectedPriority = (searchParams.get('priority') ?? '') as TaskPriority | ''
  const highlightTaskId = searchParams.get('highlight')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(search.trim()), 300)
    return () => window.clearTimeout(t)
  }, [search])

  useEffect(() => {
    if (!highlightTaskId) return
    const t = window.setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())
      params.delete('highlight')
      const href = params.toString() ? `${pathname}?${params.toString()}` : pathname
      router.replace(href, { scroll: false })
    }, 2000)
    return () => window.clearTimeout(t)
  }, [highlightTaskId, pathname, router, searchParams])

  const filters = useMemo(
    () => ({
      status: selectedStatus || undefined,
      priority: selectedPriority || undefined,
      search: debouncedSearch || undefined,
    }),
    [selectedStatus, selectedPriority, debouncedSearch]
  )

  // Vue liste : sections paginées côté serveur. Vue kanban : liste plate (useTasks),
  // qui fournit aussi les mutations. Une seule des deux requêtes est active à la fois.
  const { sections, counts, countsLoading, error: sectionsError } = useTaskSections(filters, {
    enabled: isListView,
  })
  const {
    tasks: flatTasks,
    loading: flatLoading,
    error: flatError,
    refresh,
    updateTask,
    hasNextPage: flatHasNextPage,
    fetchNextPage: flatFetchNextPage,
    fetchingNextPage: flatFetchingNextPage,
  } = useTasks(undefined, { enabled: !isListView })

  const error = sectionsError ?? flatError

  // Tri d'affichage (priorité/échéance) sur les lignes chargées de chaque section.
  const myAssignedTasks = useMemo(
    () => [...sections.mine.items].sort(sortByPriority),
    [sections.mine.items]
  )
  const freeTasks = useMemo(
    () => [...sections.free.items].sort(sortByPriority),
    [sections.free.items]
  )
  const teamTasks = useMemo(
    () => [...sections.team.items].sort(sortByPriority),
    [sections.team.items]
  )

  // Kanban : filtrage client sur la liste plate (comportement inchangé, desktop only).
  const kanbanFilteredTasks = useMemo(() => {
    const byStatus = selectedStatus
      ? flatTasks.filter((task) => task.status === selectedStatus)
      : flatTasks.filter((task) => task.status !== 'done')
    const byPriority = selectedPriority
      ? byStatus.filter((task) => task.priority === selectedPriority)
      : byStatus
    const q = debouncedSearch.toLowerCase()
    if (!q) return byPriority
    return byPriority.filter(
      (task) =>
        task.title.toLowerCase().includes(q) ||
        (task.description ?? '').toLowerCase().includes(q)
    )
  }, [flatTasks, selectedStatus, selectedPriority, debouncedSearch])

  const myCompletedTasksCount = counts.myDone
  const teamCompletedTasksCount = counts.teamDone

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    try {
      await updateTask(taskId, { status: newStatus })
      toast.success('Statut mis à jour')
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Erreur lors de la mise à jour du statut'
      )
    }
  }

  const handleQuickDone = async (task: TaskWithProfiles) => {
    if (task.status === 'done' || task.status === 'cancelled') return
    if (!task.assigned_to) return
    await handleStatusChange(task.id, 'done')
  }

  const handleTakeTask = async (task: TaskWithProfiles) => {
    if (!profile?.id) return
    try {
      await updateTask(task.id, { assigned_to: profile.id })
      toast.success('Tâche prise en charge')
    } catch {
      toast.error('Erreur lors de la prise en charge')
    }
  }

  const openTask = (task: TaskWithProfiles) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('id', task.id)
    router.push(`${pathname}?${params.toString()}`)
  }

  const openMyCompletedTasks = () => {
    router.push('/tasks/completed?scope=my')
  }

  const openTeamCompletedTasks = () => {
    router.push('/tasks/completed?scope=team')
  }

  const setStatusFilter = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value === 'all') params.delete('status')
    else params.set('status', value)
    const href = params.toString() ? `${pathname}?${params.toString()}` : pathname
    router.push(href)
  }

  const setPriorityFilter = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value === 'all') params.delete('priority')
    else params.set('priority', value)
    const href = params.toString() ? `${pathname}?${params.toString()}` : pathname
    router.push(href)
  }

  const statusValue = selectedStatus || 'all'
  const priorityValue = selectedPriority || 'all'

  return (
    <div className="space-y-4">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Tâches</h1>
          <p className="text-sm text-slate-500">
            Gérez les tâches de l&apos;officine.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Toggle (Desktop only) */}
          <div className="hidden items-center gap-1 rounded-lg bg-slate-100 p-1 lg:flex">
            <button
              onClick={() => handleViewChange('list')}
              className={cn(
                'rounded-md p-1.5 transition-all',
                effectiveView === 'list'
                  ? 'bg-white border border-slate-200 shadow-sm text-teal-600'
                  : 'bg-transparent text-slate-400'
              )}
              title="Vue liste"
              aria-label="Basculer vers la vue liste"
              aria-pressed={effectiveView === 'list'}
            >
              <List size={15} />
            </button>
            <button
              onClick={() => handleViewChange('kanban')}
              className={cn(
                'rounded-md p-1.5 transition-all',
                effectiveView === 'kanban'
                  ? 'bg-white border border-slate-200 shadow-sm text-teal-600'
                  : 'bg-transparent text-slate-400'
              )}
              title="Vue kanban"
              aria-label="Basculer vers la vue kanban"
              aria-pressed={effectiveView === 'kanban'}
            >
              <LayoutDashboard size={15} />
            </button>
          </div>

          <button
            onClick={() => router.push(`${pathname}?id=new`)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white shadow-lg transition-transform active:scale-95"
            aria-label="Créer une nouvelle tâche"
          >
            <Plus className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* ── Progress Bar ── */}
      <TaskProgressBar counts={counts.myActive} loading={countsLoading} />

      {/* ── Search Bar ── */}
      <div className="relative">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher une tâche..."
          className="h-11 rounded-xl border-slate-200 bg-white pl-4 pr-10 shadow-sm focus:border-teal-500 focus:ring-teal-500"
        />
      </div>

      {/* ── Filters : desktop = selects, mobile = 2 lignes de boutons ── */}
      <div className="hidden flex-wrap gap-3 lg:flex">
        <Select value={statusValue} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[220px] bg-white">
            <SelectValue placeholder="Filtrer par statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="todo">A faire</SelectItem>
            <SelectItem value="done">Terminé</SelectItem>
          </SelectContent>
        </Select>

        <Select value={priorityValue} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-[220px] bg-white">
            <SelectValue placeholder="Filtrer par priorite" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les priorites</SelectItem>
            <SelectItem value="high">Haute</SelectItem>
            <SelectItem value="medium">Moyenne</SelectItem>
            <SelectItem value="low">Basse</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-3 lg:hidden">
        <div>
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            Priorité
          </p>
          <div className="-mx-1 overflow-x-auto px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex w-max gap-2 pb-1">
            {TASK_PRIORITY_FILTERS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setPriorityFilter(value)}
                className={cn(
                  'rounded-full border px-3 py-2 text-xs font-medium transition-all',
                  priorityValue === value
                    ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                    : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50'
                )}
              >
                {label}
              </button>
            ))}
            </div>
          </div>
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {/* ── Main View ── */}
      {effectiveView === 'list' && (
        <div className="space-y-6">
          <section className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600">
                Mes tâches assignées
              </h2>
              <button
                type="button"
                onClick={openMyCompletedTasks}
                className="inline-flex items-center gap-1 text-xs font-medium lg:hidden"
              >
                <span className="text-slate-500">{myCompletedTasksCount} terminée(s)</span>
                <span className="text-teal-600 underline underline-offset-2">Afficher</span>
              </button>
            </div>
            <TaskListView
              tasks={myAssignedTasks}
              loading={sections.mine.loading}
              onRowClick={openTask}
              onQuickDone={handleQuickDone}
              emptyMessage="Aucune tâche assignée à moi."
              highlightRowId={highlightTaskId}
              hideAssignedToOnMobile
            />
            <LoadMore section={sections.mine} />
          </section>
          <section className="space-y-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600">
              Tâches libres
            </h2>
            <TaskListView
              tasks={freeTasks}
              loading={sections.free.loading}
              onRowClick={openTask}
              onQuickDone={handleQuickDone}
              onTakeTask={handleTakeTask}
              emptyMessage="Aucune tâche libre."
              highlightRowId={highlightTaskId}
              showTakeButtonOnMobile
            />
            <LoadMore section={sections.free} />
          </section>
          <section className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600">
                Tâches de l&apos;équipe
              </h2>
              <button
                type="button"
                onClick={openTeamCompletedTasks}
                className="inline-flex items-center gap-1 text-xs font-medium lg:hidden"
              >
                <span className="text-slate-500">{teamCompletedTasksCount} terminée(s)</span>
                <span className="text-teal-600 underline underline-offset-2">Afficher</span>
              </button>
            </div>
            <TaskListView
              tasks={teamTasks}
              loading={sections.team.loading}
              onRowClick={openTask}
              onQuickDone={handleQuickDone}
              emptyMessage="Vous n'avez pas encore de tâche en cours. Créez la première pour démarrer la transmission d'équipe."
              highlightRowId={highlightTaskId}
            />
            <LoadMore section={sections.team} />
          </section>
        </div>
      )}
      {effectiveView === 'kanban' && isDesktop && (
        <div className="space-y-4">
          <TaskKanbanView
            tasks={kanbanFilteredTasks}
            loading={flatLoading}
            onStatusChange={handleStatusChange}
          />
          {flatHasNextPage ? (
            <div className="flex justify-center pt-2">
              <button
                type="button"
                onClick={() => void flatFetchNextPage()}
                disabled={flatFetchingNextPage}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:opacity-50"
              >
                {flatFetchingNextPage ? 'Chargement…' : 'Charger plus'}
              </button>
            </div>
          ) : null}
        </div>
      )}
      {/* ── Global Drawer ── */}
      <TaskDrawer onChanged={refresh} />
    </div>
  )
}

export default function TasksPage(): React.JSX.Element {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Chargement…</p>}>
      <TasksContent />
    </Suspense>
  )
}
