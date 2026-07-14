export const CHAT_EDIT_WINDOW_MS = 15 * 60 * 1000

export function canEditMessage(createdAt: string, nowMs = Date.now()): boolean {
  const created = new Date(createdAt).getTime()
  if (Number.isNaN(created)) return false
  return nowMs - created <= CHAT_EDIT_WINDOW_MS
}

export function formatRelativeTime(iso: string, nowMs = Date.now()): string {
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return ''
  const diffSec = Math.floor((nowMs - then) / 1000)
  if (diffSec < 60) return "à l'instant"
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `il y a ${diffMin} min`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `il y a ${diffH} h`
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}

export function getAuthorDisplayName(
  author: { display_name: string | null; first_name: string | null; last_name: string | null } | null
): string {
  if (!author) return 'Utilisateur'
  const display = author.display_name?.trim()
  if (display) return display
  const first = author.first_name?.trim() ?? ''
  const last = author.last_name?.trim() ?? ''
  return `${first} ${last}`.trim() || 'Utilisateur'
}
