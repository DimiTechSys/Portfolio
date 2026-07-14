import { createClient } from '@supabase/supabase-js'

/** Server-only anon client for auth actions that do not use the user cookie (e.g. signInWithOtp from a route handler). */
export function createAnonClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }
  return createClient(url, key)
}
