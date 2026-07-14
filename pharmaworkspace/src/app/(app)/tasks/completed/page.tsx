'use client'

import { Suspense } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'

import { TaskListView } from '@/components/tasks/task-list-view'
import { TaskDrawer } from '@/components/tasks/task-drawer'
import { InfiniteLoader } from '@/components/shared/infinite-loader'
import { useTaskSection } from '@/features/tasks'
import { usePageSize } from '@/hooks/use-page-size'
import type { TaskWithProfiles } from '@/types/index'

type Scope = 'my' | 'team'

function CompletedTasksContent() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const pageSize = usePageSize()

  const scope = (searchParams.get('scope') ?? 'my') as Scope

  // Section serveur (mine/team) filtrée sur status='done', paginée en keyset.
  // Corrige l'ancien bug : les tâches terminées au-delà de la 1re page n'apparaissaient pas.
  const {
    items: completedTasks,
    loading,
    isError,
    hasNextPage,
    fetchNextPage,
    fetchingNextPage,
    refresh,
  } = useTaskSection(scope === 'team' ? 'team' : 'mine', { status: 'done' }, pageSize)

  const openTask = (task: TaskWithProfiles) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('id', task.id)
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={() => router.push('/tasks')}
        className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
      >
        <ChevronLeft className="h-4 w-4" />
        Retour
      </button>

      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            {scope === 'team' ? "Tâches terminées de l'équipe" : 'Mes tâches terminées'}
          </p>
        </div>
      </div>

      <TaskListView
        tasks={completedTasks}
        loading={loading}
        onRowClick={openTask}
        emptyMessage="Aucune tâche terminée."
        hideAssignedToOnMobile={scope !== 'team'}
      />

      <InfiniteLoader
        hasNextPage={hasNextPage}
        isLoading={fetchingNextPage}
        isError={isError}
        onLoadMore={fetchNextPage}
      />

      <TaskDrawer onChanged={refresh} />
    </div>
  )
}

export default function CompletedTasksPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Chargement…</p>}>
      <CompletedTasksContent />
    </Suspense>
  )
}
