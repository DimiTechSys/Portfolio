/** Message utilisateur pour les erreurs Supabase OTP (signInWithOtp). */
export function getOtpErrorMessage(error: { message?: string; status?: number }): string {
  const msg = error.message?.toLowerCase() ?? ''
  if (error.status === 429 || msg.includes('429') || msg.includes('too many')) {
    return 'Trop de tentatives (limite Supabase, pas la base de données). Attendez 1 minute ou utilisez le lien dev sur la page login.'
  }
  if (msg.includes('signup') && msg.includes('disabled')) {
    return 'Les inscriptions par email sont désactivées sur ce projet Supabase.'
  }
  return 'Impossible d\'envoyer le code. Vérifiez votre email.'
}
