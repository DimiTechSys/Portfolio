import { createClient } from "@supabase/supabase-js";
import { createClient as createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * Client Supabase pour les Route Handlers : préfère le JWT `Authorization: Bearer`
 * (fiable juste après setSession côté client), sinon cookies Next (fallback).
 */
export async function createClientForRouteHandler(request: Request) {
  const authHeader = request.headers.get("Authorization");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  if (authHeader?.startsWith("Bearer ")) {
    return createClient(url, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
  }

  return createServerSupabaseClient();
}
