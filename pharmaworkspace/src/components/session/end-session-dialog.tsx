'use client'

import { Button } from '@/components/ui/button'

type EndSessionDialogProps = {
  open: boolean
  ending: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void | Promise<void>
}

export function EndSessionDialog({
  open,
  ending,
  onOpenChange,
  onConfirm,
}: EndSessionDialogProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        role="presentation"
        className="absolute inset-0 bg-black/50"
        onClick={() => !ending && onOpenChange(false)}
      />
      <div className="relative z-10 w-full max-w-md rounded-lg border bg-background p-6 shadow-lg">
        <h3 className="mb-1 text-lg font-semibold">Clôturer la session</h3>
        <p className="mb-6 text-sm text-muted-foreground">
          Confirmez la fin de votre session de travail.
        </p>
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={ending}
          >
            Annuler
          </Button>
          <Button type="button" onClick={() => void onConfirm()} disabled={ending}>
            {ending ? 'Clôture en cours…' : 'Clôturer'}
          </Button>
        </div>
      </div>
    </div>
  )
}
