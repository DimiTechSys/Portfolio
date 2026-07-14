/** URL de l'app pour les redirections Supabase Auth (OTP / magic link). */
export function getAppOrigin(): string {
  if (typeof window !== 'undefined') {
    return window.location.origin
  }
  return process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ?? 'http://localhost:3000'
}

export function getAuthCallbackUrl(): string {
  return `${getAppOrigin()}/auth/callback`
}
