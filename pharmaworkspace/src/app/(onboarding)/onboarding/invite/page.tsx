'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { revokeInvitation } from '@/lib/queries/admin'
import { getPharmacyTierUsage, type PharmacyTierUsage } from '@/lib/queries/pharmacy-tier-usage'
import { getInviteSlotsRemaining } from '@/lib/subscription'
import { capture } from '@/lib/analytics/posthog'
import { ONBOARDING_EVENTS } from '@/lib/analytics/events'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { ROLE_LABELS } from '@/config/constants'
import { INVITABLE_ROLES, isInvitableRole } from '@/lib/auth/roles'
import { WizardBackLink } from '@/components/onboarding/back-link'
import { Loader2, Mail, Plus, Trash2, X } from 'lucide-react'

// Le rôle 'titulaire' est exclu : un titulaire est créé à la création de la
// pharma, il n'y en a qu'un par officine. Le backend `/api/invitations/create-native`
// rejette explicitement role='titulaire' (rôle non invitable).
type InvitableRole = (typeof INVITABLE_ROLES)[number]

type Row = {
  /** Set quand la row vient de la DB (hydration) ou vient d'être créée par sendInvite.
   *  Nécessaire pour révoquer via revokeInvitation(id). */
  invitationId?: string
  email: string
  role: InvitableRole
  status: 'idle' | 'sending' | 'sent' | 'error'
  message?: string
}

const EMPTY_ROW: Row = { email: '', role: 'preparateur', status: 'idle' }

export default function InviteTeamPage() {
  const router = useRouter()
  const [rows, setRows] = useState<Row[]>([{ ...EMPTY_ROW }])
  const [continuing, setContinuing] = useState(false)
  const [tierUsage, setTierUsage] = useState<PharmacyTierUsage | null>(null)
  const [pharmacyId, setPharmacyId] = useState<string | null>(null)

  // Hydrate l'UI avec les invitations en cours (en attente d'acceptation, non
  // expirées) pour éviter les doubles envois si l'utilisateur revient sur cette
  // étape via le wizard back link. Chaque invitation existante apparaît en
  // mode `sent` (champs grisés, bouton désactivé). Plus une row vide à la fin
  // pour permettre d'ajouter de nouveaux invités.
  useEffect(() => {
    const supabase = createClient()
    void (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('pharmacy_id')
        .eq('id', user.id)
        .maybeSingle()
      if (!profile?.pharmacy_id) return
      setPharmacyId(profile.pharmacy_id)

      const { data: existing } = await supabase
        .from('invitations')
        .select('id, email, role')
        .eq('pharmacy_id', profile.pharmacy_id)
        .is('accepted_at', null)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: true })

      const usageResult = await getPharmacyTierUsage(profile.pharmacy_id)
      if (usageResult.data) setTierUsage(usageResult.data)

      if (existing && existing.length > 0) {
        const sentRows: Row[] = existing.map((inv) => {
          // Coerce role en `Role` valide ; fallback 'preparateur' pour
          // invitations historiques qui auraient un rôle hors set (ex. 'titulaire'
          // résiduel avant qu'on retire l'option). Le backend refuse déjà ces
          // créations désormais.
          const role: InvitableRole = isInvitableRole(inv.role as string)
            ? (inv.role as InvitableRole)
            : 'preparateur'
          return {
            invitationId: inv.id as string,
            email: inv.email as string,
            role,
            status: 'sent',
          }
        })
        const remaining = usageResult.data
          ? getInviteSlotsRemaining(usageResult.data.tier, usageResult.data.currentCount)
          : 1
        setRows(
          remaining > 0 ? [...sentRows, { ...EMPTY_ROW }] : sentRows
        )
      }
    })()
  }, [])

  const refreshTierUsage = async (pharmacyId: string) => {
    const usageResult = await getPharmacyTierUsage(pharmacyId)
    if (usageResult.data) setTierUsage(usageResult.data)
    return usageResult.data
  }

  function updateRow(idx: number, patch: Partial<Row>) {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)))
  }

  function addRow() {
    if (!tierUsage?.canInvite) return
    const idleRows = rows.filter((r) => r.status !== 'sent').length
    const slotsLeft = getInviteSlotsRemaining(tierUsage.tier, tierUsage.currentCount)
    if (idleRows >= slotsLeft) return
    setRows((prev) => [...prev, { ...EMPTY_ROW }])
  }

  function removeRow(idx: number) {
    setRows((prev) => prev.filter((_, i) => i !== idx))
  }

  async function sendInvite(idx: number, e: FormEvent) {
    e.preventDefault()
    const row = rows[idx]
    const email = row.email.trim().toLowerCase()
    if (!email || row.status === 'sending' || row.status === 'sent') return

    updateRow(idx, { status: 'sending', message: undefined })

    try {
      const res = await fetch('/api/invitations/create-native', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role: row.role }),
      })
      if (!res.ok) {
        const body = (await res.json().catch(() => ({ error: 'Erreur' }))) as {
          error?: string
          message?: string
        }
        updateRow(idx, {
          status: 'error',
          message:
            body.message ??
            (body.error === 'tier_limit_reached'
              ? 'Limite d’utilisateurs atteinte pour votre formule.'
              : body.error) ??
            'Erreur lors de l’envoi.',
        })
        return
      }
      const payload = (await res.json().catch(() => ({}))) as {
        invitation_id?: string
      }
      updateRow(idx, {
        invitationId: payload.invitation_id,
        status: 'sent',
        message: undefined,
      })
      capture(ONBOARDING_EVENTS.first_invite_sent, { role: row.role })
      if (pharmacyId) await refreshTierUsage(pharmacyId)
    } catch {
      updateRow(idx, { status: 'error', message: 'Erreur réseau. Réessayez.' })
    }
  }

  async function revokeRow(idx: number) {
    const row = rows[idx]
    if (!row.invitationId) {
      // Pas d'id : la row vient sûrement d'un état idle/error, on retire juste de l'UI.
      removeRow(idx)
      return
    }
    const { error } = await revokeInvitation(row.invitationId)
    if (error) {
      toast.error('Échec de la révocation. Réessayez.')
      return
    }
    toast.success(`Invitation à ${row.email} révoquée`)
    setRows((prev) => {
      const filtered = prev.filter((_, i) => i !== idx)
      return filtered.length === 0 ? [{ ...EMPTY_ROW }] : filtered
    })
  }

  async function continueToActivate() {
    setContinuing(true)
    const sentCount = rows.filter((r) => r.status === 'sent').length
    try {
      const supabase = createClient()
      await supabase.auth.updateUser({
        data: { onboarding_invites_handled: true },
      })
      if (sentCount === 0) {
        capture(ONBOARDING_EVENTS.onboarding_invites_skipped)
      }
      router.push('/onboarding/activate')
      router.refresh()
    } catch {
      setContinuing(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <WizardBackLink href="/onboarding/profile" label="Profil" />
      <div className="flex flex-col gap-1.5">
        <h1 className="text-xl font-semibold tracking-tight">Invitez votre équipe</h1>
        <p className="text-sm text-muted-foreground">
          Vos collègues pourront participer dès leur inscription. Vous pouvez aussi passer
          cette étape et inviter plus tard depuis l’administration.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        {rows.map((row, idx) => {
          // Une row déjà envoyée ne peut pas être retirée de l'UI : la suppression
          // ne supprimerait pas l'invitation côté DB et la row reviendrait au
          // prochain mount. Pour révoquer une invitation, passer par /admin après
          // l'onboarding.
          const canRemove =
            rows.length > 1 && row.status !== 'sending' && row.status !== 'sent'
          const isLocked = row.status === 'sending' || row.status === 'sent'

          return (
            <form
              key={idx}
              onSubmit={(e) => sendInvite(idx, e)}
              className="flex flex-col gap-2 rounded-lg border border-border bg-background p-3"
            >
              <div className="grid grid-cols-1 items-center gap-2 sm:grid-cols-[1fr_auto_auto_auto]">
                <div className="min-w-0">
                  <Label htmlFor={`email-${idx}`} className="sr-only">
                    Email
                  </Label>
                  <Input
                    id={`email-${idx}`}
                    type="email"
                    placeholder="collegue@officine.fr"
                    value={row.email}
                    onChange={(e) =>
                      updateRow(idx, { email: e.target.value, status: 'idle', message: undefined })
                    }
                    disabled={isLocked}
                  />
                </div>
                <select
                  value={row.role}
                  onChange={(e) =>
                    updateRow(idx, { role: e.target.value as InvitableRole })
                  }
                  disabled={isLocked}
                  className="h-8 rounded-md border border-input bg-background px-2 text-sm disabled:opacity-50"
                  aria-label={`Rôle pour la ligne ${idx + 1}`}
                >
                  {INVITABLE_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {ROLE_LABELS[r]}
                    </option>
                  ))}
                </select>
                {row.status === 'sent' ? (
                  // Row déjà envoyée → bouton revoke (rouge) avec confirmation.
                  // Aligné avec le pattern admin members-table (DELETE invitations).
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        aria-label="Révoquer l’invitation"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Révoquer cette invitation ?</AlertDialogTitle>
                        <AlertDialogDescription>
                          L&apos;invitation envoyée à <strong>{row.email}</strong> sera annulée.
                          Le lien dans l&apos;email reçu par le destinataire ne fonctionnera plus.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => revokeRow(idx)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Révoquer
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                ) : (
                  <Button
                    type="submit"
                    variant="default"
                    disabled={isLocked || !row.email.trim()}
                    size="sm"
                    className="h-8 w-8 p-0"
                    aria-label="Envoyer l’invitation"
                  >
                    {row.status === 'sending' ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Mail className="h-4 w-4" />
                    )}
                  </Button>
                )}
                {row.status === 'sent' ? (
                  // Placeholder pour garder l'alignement grid. Le revoke prend la place du X.
                  <span className="h-8 w-8" aria-hidden />
                ) : canRemove ? (
                  <button
                    type="button"
                    onClick={() => removeRow(idx)}
                    className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    aria-label="Supprimer cette ligne"
                  >
                    <X className="h-4 w-4" />
                  </button>
                ) : (
                  <span className="h-8 w-8" aria-hidden />
                )}
              </div>
              {row.message && (
                <p
                  className={`text-xs ${row.status === 'error' ? 'text-destructive' : 'text-muted-foreground'}`}
                  role={row.status === 'error' ? 'alert' : undefined}
                >
                  {row.message}
                </p>
              )}
            </form>
          )
        })}

        {tierUsage?.canInvite !== false ? (
          <button
            type="button"
            onClick={addRow}
            disabled={
              !tierUsage ||
              rows.filter((r) => r.status !== 'sent').length >=
                getInviteSlotsRemaining(tierUsage.tier, tierUsage.currentCount)
            }
            className="flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-border bg-background p-2 text-sm text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            Ajouter un autre collègue
          </button>
        ) : null}
      </div>

      <Button
        type="button"
        onClick={continueToActivate}
        disabled={continuing}
        className="w-full"
      >
        {continuing ? 'Patientez…' : 'Continuer'}
      </Button>
    </div>
  )
}
