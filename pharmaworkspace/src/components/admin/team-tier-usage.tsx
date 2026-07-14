'use client'

import { useCallback, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, Loader2, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { getPharmacyTierUsage } from '@/lib/queries/pharmacy-tier-usage'
import { TIER_LABELS, type SubscriptionTier } from '@/lib/subscription'
import { toast } from 'sonner'

type TeamTierUsageProps = {
  pharmacyId: string | undefined
}

function formatLimit(limit: number): string {
  return Number.isFinite(limit) ? String(limit) : '∞'
}

function remainingLabel(remaining: number | null): string {
  if (remaining === null) return 'Places illimitées'
  if (remaining === 0) return 'Aucune place restante'
  if (remaining === 1) return '1 place restante'
  return `${remaining} places restantes`
}

function progressPercent(current: number, limit: number): number {
  if (!Number.isFinite(limit) || limit <= 0) return 0
  return Math.min(100, Math.round((current / limit) * 100))
}

export function TeamTierUsage({ pharmacyId }: TeamTierUsageProps) {
  const [portalLoading, setPortalLoading] = useState(false)

  const usageQuery = useQuery({
    queryKey: ['pharmacy-tier-usage', pharmacyId] as const,
    enabled: Boolean(pharmacyId),
    queryFn: async () => {
      const result = await getPharmacyTierUsage(pharmacyId!)
      if (result.error) throw new Error(result.error)
      return result.data!
    },
  })

  const openCustomerPortal = useCallback(async () => {
    setPortalLoading(true)
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const data = (await res.json()) as { portal_url?: string; error?: string }
      if (!res.ok || !data.portal_url) {
        toast.error('Impossible d’ouvrir le portail d’abonnement.')
        return
      }
      window.location.href = data.portal_url
    } catch {
      toast.error('Erreur réseau.')
    } finally {
      setPortalLoading(false)
    }
  }, [])

  if (!pharmacyId) return null

  if (usageQuery.isLoading) {
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-slate-200/70 bg-white p-4 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        Chargement du quota utilisateurs…
      </div>
    )
  }

  const usage = usageQuery.data
  if (!usage) return null

  const tierLabel =
    usage.tier != null ? TIER_LABELS[usage.tier as SubscriptionTier] : TIER_LABELS.po
  const isUnlimited = !Number.isFinite(usage.limit)
  const limitLabel = formatLimit(usage.limit)
  const percent = isUnlimited ? 0 : progressPercent(usage.currentCount, usage.limit)

  const showUpgrade = usage.level === 'warning' || usage.level === 'blocked'

  return (
    <div className="space-y-3 rounded-2xl border border-slate-200/70 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
            <Users className="h-5 w-5" aria-hidden />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-slate-900">
              {isUnlimited ? (
                <>
                  {usage.currentCount} utilisateur{usage.currentCount > 1 ? 's' : ''} ·{' '}
                  {tierLabel}
                </>
              ) : (
                <>
                  {usage.currentCount} / {limitLabel} utilisateurs · {tierLabel}
                </>
              )}
            </p>
            <p className="text-sm text-muted-foreground">{remainingLabel(usage.remaining)}</p>
            <p className="text-xs text-muted-foreground">
              {usage.activeCount}{' '}
              {usage.activeCount > 1 ? 'membres actifs' : 'membre actif'}
              {usage.pendingInviteCount > 0
                ? ` · ${usage.pendingInviteCount} invitation${usage.pendingInviteCount > 1 ? 's' : ''} en attente`
                : ''}
            </p>
          </div>
        </div>

        {showUpgrade ? (
          <Button
            type="button"
            variant={usage.level === 'blocked' ? 'destructive' : 'default'}
            size="sm"
            className="shrink-0"
            disabled={portalLoading}
            onClick={() => void openCustomerPortal()}
          >
            {portalLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Mettre à niveau
          </Button>
        ) : null}
      </div>

      {!isUnlimited ? (
        <Progress
          value={percent}
          className={`h-2 ${
            usage.level === 'blocked'
              ? '[&>div]:bg-red-500'
              : usage.level === 'warning'
                ? '[&>div]:bg-amber-500'
                : '[&>div]:bg-emerald-600'
          }`}
          aria-label="Quota utilisateurs"
        />
      ) : null}

      {showUpgrade ? (
        <div
          className={`flex gap-2 rounded-xl border p-3 text-sm ${
            usage.level === 'blocked'
              ? 'border-red-200 bg-red-50 text-red-900'
              : 'border-amber-200 bg-amber-50 text-amber-950'
          }`}
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <p>
            {usage.level === 'blocked'
              ? 'Limite atteinte pour votre formule. Révoquez une invitation ou mettez à niveau pour inviter.'
              : 'Vous approchez de la limite de votre formule. Pensez à mettre à niveau si vous recrutez.'}
          </p>
        </div>
      ) : null}
    </div>
  )
}
