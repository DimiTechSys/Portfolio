// Détection + récupération des erreurs de chargement de chunk JS.
// Cas classique post-déploiement : un onglet ouvert référence d'anciens chunks
// (hash) qui n'existent plus après le nouveau build → le lazy-load 404
// (ChunkLoadError), ce qui peut cascader en boucle de re-render (RangeError:
// Maximum call stack). Un reload récupère le nouveau manifest de chunks.

const RELOAD_KEY = 'pw_chunk_reload_at'
const CHUNK_RE =
  /ChunkLoadError|Loading chunk|Failed to load chunk|Importing a module script failed|(Failed to fetch|error loading) dynamically imported module/i

export function isChunkLoadError(err: unknown): boolean {
  if (!err) return false
  if (typeof err === 'string') return CHUNK_RE.test(err)
  const e = err as { name?: unknown; message?: unknown }
  if (e.name === 'ChunkLoadError') return true
  return typeof e.message === 'string' && CHUNK_RE.test(e.message)
}

/**
 * Recharge la page au plus UNE fois par fenêtre de 10s (garde anti-boucle : si le
 * reload ne corrige pas, on n'insiste pas). Retourne true si un reload a été déclenché.
 */
export function reloadOnceForChunkError(): boolean {
  if (typeof window === 'undefined') return false
  let last = 0
  try {
    last = Number(sessionStorage.getItem(RELOAD_KEY) ?? 0)
  } catch {
    // sessionStorage indisponible → on tente quand même un reload unique.
  }
  const now = Date.now()
  if (now - last < 10_000) return false
  try {
    sessionStorage.setItem(RELOAD_KEY, String(now))
  } catch {
    // ignore
  }
  window.location.reload()
  return true
}
