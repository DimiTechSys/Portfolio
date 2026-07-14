"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { establishSessionFromCallbackUrl } from "@/lib/auth/establish-session-from-callback-url";
import { safeNext } from "@/lib/auth/safe-next";
import { finalizeLoginInvite } from "@/lib/invite/finalize-login-invite";

/**
 * Retour après clic sur le lien d’invitation / confirmation **Supabase**.
 * Les e-mails (invitation, magic link) renvoient souvent vers une autre machine que celle
 * qui a démarré le flux : il faut gérer token_hash + verifyOtp en plus de
 * exchangeCodeForSession(?code) PKCE. I1 : le flux implicite (#access_token) n'est
 * plus accepté (fixation de session), il est rejeté dans establishSessionFromCallbackUrl.
 */
function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // M2 : `next` validé (chemin interne uniquement) pour éviter l'open redirect.
  const next = safeNext(searchParams.get("next"));
  const [message, setMessage] = useState("Finalisation de la connexion…");

  useEffect(() => {
    if (typeof window === "undefined") return;

    async function run() {
      const href = window.location.href;

      const { error: exchangeError } =
        await establishSessionFromCallbackUrl(href);

      if (exchangeError) {
        setMessage("Échec de l'authentification.");
        router.replace(
          `/login?error=auth_callback_failed&details=${encodeURIComponent(
            exchangeError.message
          )}&next=${encodeURIComponent(next)}`
        );
        return;
      }

      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      // P4-05 : si l'utilisateur arrive d'un signup self-serve, finaliser
      // l'acquisition (UPDATE pharmacy_acquisition.confirmed_at).
      // Idempotent : skip silencieux si acquisition_id absent ou déjà confirmé.
      const acquisitionId = user?.user_metadata?.acquisition_id;
      if (typeof acquisitionId === "string" && acquisitionId.length > 0) {
        void fetch("/api/signup/confirm", { method: "POST" }).catch(() => {});
      }

      if (!user) {
        router.replace(next);
        router.refresh();
        return;
      }

      const invitationResult = await finalizeLoginInvite(supabase, user);
      if (invitationResult.error) {
        setMessage(invitationResult.error);
        router.replace("/login?error=invite_complete_failed");
        return;
      }

      router.replace(next);
      router.refresh();
    }

    void run();
  }, [router, next]);

  return (
    <div className="flex flex-col items-center gap-4 py-8 text-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <p className="py-8 text-center text-sm text-muted-foreground">
          Chargement…
        </p>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
