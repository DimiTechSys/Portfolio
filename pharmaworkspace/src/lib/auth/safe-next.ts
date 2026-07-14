/**
 * M2 : neutralise les open redirects sur le paramètre `next`.
 *
 * On n'accepte qu'un chemin interne : commence par "/" mais pas "//"
 * (protocol-relative URL → host externe) et sans schéma (`https:`, `javascript:`…).
 * Tout le reste retombe sur `/dashboard`.
 */
export function safeNext(next: string | null | undefined): string {
  if (typeof next !== 'string') return '/dashboard'
  // "//evil.com" et "/\evil.com" sont des URLs protocol-relative côté navigateur.
  if (!next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\')) {
    return '/dashboard'
  }
  // Un schéma ne peut apparaître que dans le chemin (avant ? ou #) : on isole
  // cette partie pour ne pas rejeter un `:` légitime dans la query string.
  const pathOnly = next.split(/[?#]/, 1)[0]
  if (pathOnly.includes(':') || pathOnly.includes('\\')) {
    return '/dashboard'
  }
  return next
}
