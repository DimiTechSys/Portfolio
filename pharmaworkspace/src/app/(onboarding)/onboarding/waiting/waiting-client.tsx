'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'

type Props = {
  pharmacyId: string
  pharmacyName: string
}

const ACTIVE_STATUSES = new Set(['trialing', 'active', 'past_due'])
const BACKUP_POLL_INTERVAL_MS = 60_000

export function WaitingClient({ pharmacyId, pharmacyName }: Props) {
  const router = useRouter()
  const [signingOut, setSigningOut] = useState(false)

  // Stratégie de mise à jour :
  //   1. Realtime WebSocket (push instantané quand le titulaire active)
  //   2. Tick initial au mount (au cas où l'event est arrivé pile entre la
  //      query RSC du parent et la subscription Realtime)
  //   3. Backup polling 60s très espacé pour résilience si la WS drop (ex.
  //      reverse proxy timeout, switch wifi/4G).
  //
  // L'ancienne version poll 5s a été retirée : coût Supabase × N invités en
  // attente. Realtime est ~100× moins coûteux et latence ~instantanée.
  useEffect(() => {
    const supabase = createClient()
    let stop = false

    const tick = async () => {
      if (stop) return
      const { data } = await supabase
        .from('pharmacies')
        .select('subscription_status')
        .eq('id', pharmacyId)
        .maybeSingle()
      const status = (data?.subscription_status as string | null) ?? null
      if (status && ACTIVE_STATUSES.has(status)) {
        router.refresh()
      }
    }

    // 1. Tick initial : couvre la race "webhook arrive pendant la query RSC".
    void tick()

    // 2. Realtime subscription sur la row pharmacy spécifique.
    //    Filtre `id=eq.${pharmacyId}` = un seul event pertinent.
    const channel = supabase
      .channel(`pharmacy-status-${pharmacyId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'pharmacies',
          filter: `id=eq.${pharmacyId}`,
        },
        (payload) => {
          const newStatus = (
            payload.new as { subscription_status?: string | null }
          ).subscription_status
          if (newStatus && ACTIVE_STATUSES.has(newStatus)) {
            router.refresh()
          }
        },
      )
      .subscribe()

    // 3. Backup polling très espacé, au cas où Realtime se déconnecte.
    const backupInterval = setInterval(() => void tick(), BACKUP_POLL_INTERVAL_MS)

    return () => {
      stop = true
      clearInterval(backupInterval)
      void supabase.removeChannel(channel)
    }
  }, [pharmacyId, router])

  async function signOut() {
    setSigningOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <div className="rounded-full bg-slate-100 p-3 text-slate-600">
        <Loader2 className="h-7 w-7 animate-spin" aria-hidden="true" />
      </div>

      <div className="flex flex-col gap-1.5">
        <h1 className="text-xl font-semibold tracking-tight">
          En attente d&apos;activation
        </h1>
        <p className="text-sm text-muted-foreground">
          Le titulaire de <strong>{pharmacyName}</strong> finalise
          l&apos;activation de l&apos;abonnement. Vous serez automatiquement
          redirigé·e vers votre espace dès qu&apos;il aura terminé.
        </p>
      </div>

      <p className="text-xs text-muted-foreground">
        Mise à jour automatique en temps réel.
      </p>

      <button
        type="button"
        onClick={signOut}
        disabled={signingOut}
        className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground disabled:opacity-50"
      >
        {signingOut ? 'Déconnexion…' : 'Se déconnecter'}
      </button>
    </div>
  )
}
