/** Reporte un callback après le premier paint (idle) pour ne pas concurrencer le chargement critique. */
export function scheduleIdleTask(task: () => void, fallbackMs = 500): () => void {
  if (typeof window === 'undefined') {
    return () => {}
  }

  if ('requestIdleCallback' in window) {
    const id = window.requestIdleCallback(task, { timeout: 2_000 })
    return () => window.cancelIdleCallback(id)
  }

  const id = setTimeout(task, fallbackMs)
  return () => clearTimeout(id)
}
