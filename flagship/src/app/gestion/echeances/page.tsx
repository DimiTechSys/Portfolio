'use client'
import { useEffect, useState } from 'react'
import { Card, CardTitle, MetricCard } from '@/components/ui'
import { createTask, getTasks, updateTask } from '@/lib/data/tasks'
import type { TaskItem, TaskPriority, TaskStatus } from '@/types'

const PRIORITIES: TaskPriority[] = ['haute', 'moyenne', 'basse']
const STATUSES: TaskStatus[] = ['todo', 'in_progress', 'done']

export default function GestionEcheancesPage() {
  const [items, setItems] = useState<TaskItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const data = await getTasks()
      setItems(data)
    } catch (error) {
      console.error(error)
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load().catch(console.error)
  }, [])

  const onCreate = async () => {
    setSaving(true)
    try {
      const due = new Date()
      due.setDate(due.getDate() + 2)
      await createTask({
        title: 'Nouvelle tâche back-office',
        due_at: due.toISOString(),
        priority: 'moyenne',
      })
      await load()
    } catch (error) {
      console.error(error)
    } finally {
      setSaving(false)
    }
  }

  const onUpdate = async (id: string, updates: Partial<TaskItem>) => {
    try {
      await updateTask(id, updates)
      await load()
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <div className="p-6">
      <div className="page-header">
        <h1 className="page-title">Tâches & échéances</h1>
      </div>

      <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-3">
        <MetricCard label="Échéances semaine" value={items.length} sub="Actions à traiter rapidement" />
        <MetricCard label="Priorité haute" value={items.filter(i => i.priority === 'haute').length} sub="Impact direct sur ventes" />
        <MetricCard label="Dossiers à relancer" value={Math.max(0, Math.floor(items.length / 2))} sub="Relance commerciale conseillée" />
      </div>

      <Card className="mb-5">
        <CardTitle>Créer une tâche</CardTitle>
        <button onClick={onCreate} disabled={saving} className="rounded-lg bg-gray-900 px-3 py-2 text-sm text-white disabled:opacity-50">
          {saving ? 'Création…' : 'Ajouter tâche'}
        </button>
      </Card>

      <Card>
        <CardTitle>Planning des échéances</CardTitle>
        <div className="space-y-2">
          {!loading && items.slice(0, 15).map(item => (
            <div key={item.id} className="flex items-center justify-between rounded-xl border border-gray-100 px-4 py-3">
              <div className="text-sm text-gray-700">{item.title}</div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-500">{item.due_at ? new Date(item.due_at).toLocaleDateString('fr-FR') : '—'}</span>
                <select
                  value={item.priority}
                  onChange={e => onUpdate(item.id, { priority: e.target.value as TaskPriority })}
                  className="rounded-md border border-gray-200 px-2 py-1 text-xs"
                >
                  {PRIORITIES.map(priority => <option key={priority} value={priority}>{priority}</option>)}
                </select>
                <select
                  value={item.status}
                  onChange={e => onUpdate(item.id, { status: e.target.value as TaskStatus })}
                  className="rounded-md border border-gray-200 px-2 py-1 text-xs"
                >
                  {STATUSES.map(status => <option key={status} value={status}>{status}</option>)}
                </select>
              </div>
            </div>
          ))}
          {!loading && items.length === 0 && (
            <div className="rounded-xl border border-dashed border-gray-200 px-4 py-6 text-sm text-gray-500">
              Aucune échéance remontée.
            </div>
          )}
          {loading && (
            <div className="rounded-xl border border-dashed border-gray-200 px-4 py-6 text-sm text-gray-500">
              Chargement…
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
