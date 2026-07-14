'use client'

import React, { Suspense, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { TaskAgendaView } from '@/components/tasks/task-agenda-view'

import { useTasks } from '@/features/tasks'
import { useOrders } from '@/features/orders'
import { useRentals } from '@/hooks/use-rentals'
import { useShortages } from '@/features/shortages'

const DESKTOP_MIN_WIDTH = 1024

function useAgendaAllowed() {
  const [allowed, setAllowed] = useState<boolean | null>(null)

  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${DESKTOP_MIN_WIDTH}px)`)
    const update = () => setAllowed(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  return allowed
}

function AgendaContent() {
  const router = useRouter()
  const allowed = useAgendaAllowed()

  const { tasks, loading: tasksLoading, error: tasksError } = useTasks()
  const { rentals, loading: rentalsLoading } = useRentals()
  const { orders, loading: ordersLoading } = useOrders(undefined, {
    disablePagination: true,
  })
  const { shortages, loading: shortagesLoading } = useShortages(undefined, {
    disablePagination: true,
  })

  const loading = tasksLoading || rentalsLoading || ordersLoading || shortagesLoading
  const error = tasksError

  useEffect(() => {
    if (allowed === false) {
      router.replace('/dashboard')
    }
  }, [allowed, router])

  if (allowed === null) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-sm text-muted-foreground">Chargement...</p>
      </div>
    )
  }

  if (allowed === false) {
    return null
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Agenda</h1>
          <p className="text-sm text-slate-500">
            Apercu global de toutes les activites de l&apos;officine.
          </p>
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Erreur de chargement.
        </div>
      ) : null}

      <div className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-sm">
        <TaskAgendaView
          tasks={tasks}
          rentals={rentals}
          orders={orders}
          shortages={shortages}
          loading={loading}
        />
      </div>
    </div>
  )
}

export default function AgendaPage(): React.JSX.Element {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Chargement...</p>}>
      <AgendaContent />
    </Suspense>
  )
}
