import { Suspense } from 'react'
import { TaskKanban } from '@/components/tasks/task-kanban'

export default function TasksBoardPage(): React.JSX.Element {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Chargement…</p>}>
      <TaskKanban />
    </Suspense>
  )
}
