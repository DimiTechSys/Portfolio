'use client'

import { useState } from 'react'
import { Download, ShieldCheck, Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
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
import { useProfile } from '@/contexts/profile-context'
import { SUPPORT_EMAIL } from '@/config/constants'

// Exercice des droits RGPD côté utilisateur (art. 15/20 export, art. 17
// effacement). Câblé sur les routes existantes /api/legal/export et
// /api/legal/erase. L'effacement est une anonymisation contrôlée (cf. doctrine
// CNIL B2B), il déconnecte définitivement le compte.
export function PrivacySection() {
  const { signOut } = useProfile()
  const [exporting, setExporting] = useState(false)
  const [erasing, setErasing] = useState(false)

  const handleExport = async () => {
    setExporting(true)
    try {
      const res = await fetch('/api/legal/export')
      if (res.status === 429) {
        toast.error('Trop de demandes. Réessayez dans une heure.')
        return
      }
      if (!res.ok) {
        toast.error("L'export a échoué. Réessayez plus tard.")
        return
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const today = new Date().toISOString().slice(0, 10)
      const a = document.createElement('a')
      a.href = url
      a.download = `pharmaworkspace-export-${today}.json`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      toast.success('Vos données ont été exportées.')
    } catch {
      toast.error("L'export a échoué. Vérifiez votre connexion.")
    } finally {
      setExporting(false)
    }
  }

  const handleErase = async () => {
    setErasing(true)
    try {
      const res = await fetch('/api/legal/erase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      })
      if (res.status === 429) {
        toast.error('Trop de demandes. Réessayez dans une heure.')
        return
      }
      if (res.status === 409) {
        toast.error(
          "En tant que titulaire, vous ne pouvez pas supprimer votre compte ici : la pharmacie doit garder un responsable.",
        )
        return
      }
      if (!res.ok) {
        toast.error(`La suppression a échoué. Contactez ${SUPPORT_EMAIL}.`)
        return
      }
      toast.success('Votre compte a été supprimé. Déconnexion en cours…')
      await signOut()
    } catch {
      toast.error('La suppression a échoué. Vérifiez votre connexion.')
    } finally {
      setErasing(false)
    }
  }

  return (
    <div className="mx-auto mt-6 max-w-2xl">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-teal-600" aria-hidden />
          <h2 className="text-lg font-semibold text-slate-900">
            Mes données personnelles
          </h2>
        </div>
        <p className="mt-1 text-sm text-slate-500">
          Conformément au RGPD, vous pouvez à tout moment récupérer une copie de
          vos données ou demander leur suppression.
        </p>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            onClick={handleExport}
            disabled={exporting}
            className="rounded-full"
          >
            {exporting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Exporter mes données
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                type="button"
                variant="outline"
                disabled={erasing}
                className="rounded-full border-destructive/30 text-destructive hover:bg-destructive/5 hover:text-destructive"
              >
                {erasing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="mr-2 h-4 w-4" />
                )}
                Supprimer mon compte
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Supprimer définitivement votre compte ?</AlertDialogTitle>
                <AlertDialogDescription>
                  Vos informations personnelles (nom, photo) seront anonymisées et
                  vous serez déconnecté immédiatement, sans possibilité de revenir
                  en arrière. Les éléments créés pour la pharmacie restent tracés de
                  façon anonyme. Pensez à exporter vos données avant si besoin.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleErase}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Supprimer mon compte
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  )
}
