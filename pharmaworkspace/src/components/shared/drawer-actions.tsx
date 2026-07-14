'use client'

type DrawerActionsProps = {
  canEdit?: boolean
  canDelete?: boolean
  onEdit?: () => void
  onDelete?: () => void
  editLabel?: string
}

// Boutons d'en-tête partagés par tous les DetailDrawer (tâches, ruptures,
// commandes, locations, ordonnances) : style pilule identique partout.
export function DrawerActions({
  canEdit = false,
  canDelete = false,
  onEdit,
  onDelete,
  editLabel = 'Éditer',
}: DrawerActionsProps): React.JSX.Element {
  return (
    <div className="flex shrink-0 flex-nowrap items-center justify-end gap-2">
      {canEdit ? (
        <button
          type="button"
          onClick={onEdit}
          className="rounded-full border border-slate-300 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
        >
          {editLabel}
        </button>
      ) : null}

      {canDelete ? (
        <button
          type="button"
          onClick={onDelete}
          className="rounded-full bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-500"
        >
          Supprimer
        </button>
      ) : null}
    </div>
  )
}
