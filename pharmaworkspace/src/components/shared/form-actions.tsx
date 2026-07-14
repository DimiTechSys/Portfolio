'use client'

import { createPortal } from 'react-dom'
import { useDrawerActionsSlot } from '@/components/shared/detail-drawer'

/**
 * Pied d'actions standard des formulaires (design system /annuaire) :
 * Annuler (outline slate) + Submit (teal).
 *
 * Dans un DetailDrawer : les boutons sont téléportés dans la barre de titre
 * (en haut), en pilules, à côté du bouton de fermeture. Hors drawer : barre
 * pleine largeur en bas du formulaire (comportement d'origine).
 */
export function FormActions({
  onCancel,
  submitLabel = 'Enregistrer',
  cancelLabel = 'Annuler',
  submitting = false,
  disabled = false,
  submitForm,
  onSubmit,
}: {
  onCancel: () => void
  submitLabel?: string
  cancelLabel?: string
  submitting?: boolean
  disabled?: boolean
  /** Si fourni, le bouton submit cible ce formulaire par id (au lieu d'être enfant du <form>). */
  submitForm?: string
  /** Si fourni, le submit se fait via onClick (pour les forms sans <form onSubmit>). */
  onSubmit?: () => void
}) {
  const slot = useDrawerActionsSlot()
  const submitProps = onSubmit
    ? ({ type: 'button', onClick: onSubmit } as const)
    : ({ type: 'submit', form: submitForm } as const)

  // Dans un drawer : pilules dans l'en-tête (portal).
  if (slot !== undefined) {
    if (slot === null) return null // slot pas encore monté

    return createPortal(
      <div className="flex shrink-0 flex-nowrap items-center justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="rounded-full border border-slate-300 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
        >
          {cancelLabel}
        </button>
        <button
          {...submitProps}
          disabled={disabled || submitting}
          className="rounded-full bg-teal-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-teal-700 disabled:opacity-60"
        >
          {submitting ? 'Enregistrement…' : submitLabel}
        </button>
      </div>,
      slot
    )
  }

  // Hors drawer : footer pleine largeur (comportement d'origine).
  return (
    <div className="flex gap-3 pt-2">
      <button
        type="button"
        onClick={onCancel}
        disabled={submitting}
        className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-60"
      >
        {cancelLabel}
      </button>
      <button
        {...submitProps}
        disabled={disabled || submitting}
        className="flex-1 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-teal-700 disabled:opacity-60"
      >
        {submitting ? 'Enregistrement…' : submitLabel}
      </button>
    </div>
  )
}
