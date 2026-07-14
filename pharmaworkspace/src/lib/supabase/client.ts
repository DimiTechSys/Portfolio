// src/lib/supabase/client.ts
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        // I1 : PKCE explicite. @supabase/ssr force déjà 'pkce', mais on le fige
        // ici pour ne pas dépendre d'un défaut de lib et signaler l'intention :
        // l'app n'accepte que le flux code (verifier/challenge), pas le flux
        // implicite (#access_token dans le hash, vecteur de fixation de session).
        flowType: "pkce",
      },
    }
  );
}