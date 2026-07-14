'use client'

import { Suspense, useMemo } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { useLeaveRequests } from '@/features/planning'
import { LeaveRequestCard } from '@/components/planning/leave-request-card'
import { LeaveRequestForm } from '@/components/planning/leave-request-form'
import { useProfile } from '@/contexts/profile-context'
import { Button } from '@/components/ui/button'
import { getLeaveRequestsForUser } from '@/lib/queries/planning'
import { useQuery } from '@tanstack/react-query'

function PlanningRequestsContent() {
  const { pharmacy, profile, role } = useProfile()
  const queryClient = useQueryClient()
  const searchParams = useSearchParams()
  const highlightId = searchParams.get('highlight')
  const isTitulaire = role === 'titulaire'

  const pendingQuery = useLeaveRequests({ mineOnly: false })
  const mineQuery = useQuery({
    queryKey: ['leave-requests-mine', pharmacy?.id, profile?.id] as const,
    enabled: Boolean(pharmacy?.id && profile?.id),
    queryFn: async () => {
      const result = await getLeaveRequestsForUser(pharmacy!.id, profile!.id)
      if (result.error) throw new Error(result.error)
      return result.data ?? []
    },
  })

  const refresh = () => {
    void pendingQuery.refetch()
    void mineQuery.refetch()
    void queryClient.invalidateQueries({ queryKey: ['planning-week'] })
  }

  const titulaireView = useMemo(
    () => (isTitulaire ? (pendingQuery.data ?? []) : []),
    [isTitulaire, pendingQuery.data]
  )
  const myRequests = mineQuery.data ?? []

  return (
    <div className="space-y-6 pb-24 lg:pb-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            {isTitulaire ? 'Demandes de congés' : 'Mes demandes de congés'}
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            {isTitulaire
              ? 'Validez ou refusez les demandes en attente.'
              : 'Suivez l’historique de vos demandes.'}
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/planning">Retour au planning</Link>
        </Button>
      </div>

      {isTitulaire ? (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            À valider ({titulaireView.length})
          </h2>
          {pendingQuery.isLoading ? (
            <p className="text-sm text-slate-500">Chargement…</p>
          ) : titulaireView.length === 0 ? (
            <p className="rounded-lg border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
              Aucune demande en attente.
            </p>
          ) : (
            titulaireView.map((request) => (
              <LeaveRequestCard
                key={request.id}
                request={request}
                canReview
                highlighted={highlightId === request.id}
                onUpdated={refresh}
              />
            ))
          )}
        </section>
      ) : (
        <>
          <LeaveRequestForm onSuccess={refresh} />
          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Historique
            </h2>
            {mineQuery.isLoading ? (
              <p className="text-sm text-slate-500">Chargement…</p>
            ) : myRequests.length === 0 ? (
              <p className="rounded-lg border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
                Vous n&apos;avez pas encore de demande.
              </p>
            ) : (
              myRequests.map((request) => (
                <LeaveRequestCard
                  key={request.id}
                  request={request}
                  canCancel={request.status === 'pending'}
                  highlighted={highlightId === request.id}
                  onUpdated={refresh}
                />
              ))
            )}
          </section>
        </>
      )}
    </div>
  )
}

export default function PlanningRequestsPage() {
  return (
    <Suspense fallback={<p className="p-6 text-sm text-slate-500">Chargement…</p>}>
      <PlanningRequestsContent />
    </Suspense>
  )
}
