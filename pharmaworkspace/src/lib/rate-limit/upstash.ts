import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

export const ocrRateLimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '1 m'),
  analytics: true,
  prefix: 'rl:ocr',
})

// M6 + L7 : limite l'amorçage de signup (insert acquisition + envoi OTP).
// Keyé IP+email pour ralentir l'énumération de comptes et le spam d'e-mails.
export const signupRateLimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(3, '10 m'),
  analytics: true,
  prefix: 'rl:signup',
})

// G9 : limiteur OTP réutilisable (renvoi de code, signInWithOtp).
export const otpRateLimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, '10 m'),
  analytics: true,
  prefix: 'rl:otp',
})

// L4 : exercice des droits RGPD (export / effacement). Keyé user.id.
export const legalRateLimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, '1 h'),
  analytics: true,
  prefix: 'rl:legal',
})
