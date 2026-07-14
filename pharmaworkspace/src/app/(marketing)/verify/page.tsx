"use client";

import {
  Suspense,
  useState,
  useRef,
  useEffect,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getAuthCallbackUrl } from "@/lib/auth/app-origin";
import { safeNext } from "@/lib/auth/safe-next";
import { getOtpErrorMessage } from "@/lib/auth/otp-error-message";
import { createClient } from "@/lib/supabase/client";
import posthog from "posthog-js";
import { notifyAnalyticsAllowed } from "@/lib/consent/cookie-consent";
import { finalizeLoginInvite } from "@/lib/invite/finalize-login-invite";

const CODE_LENGTH = 8;

function VerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const next = safeNext(searchParams.get("next"));

  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(""));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  function handleChange(index: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next_digits = [...digits];
    next_digits[index] = digit;
    setDigits(next_digits);

    if (digit && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, CODE_LENGTH);
    const next_digits = [...digits];
    pasted.split("").forEach((d, i) => {
      next_digits[i] = d;
    });
    setDigits(next_digits);
    const focusIdx = Math.min(pasted.length, CODE_LENGTH - 1);
    inputRefs.current[focusIdx]?.focus();
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const token = digits.join("");
    if (token.length !== CODE_LENGTH) {
      setError("Veuillez entrer les 8 chiffres.");
      return;
    }

    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token,
      type: "email",
    });

    setLoading(false);

    if (verifyError) {
      setError("Code invalide ou expiré. Veuillez réessayer.");
      setDigits(Array(CODE_LENGTH).fill(""));
      inputRefs.current[0]?.focus();
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      // CONSENT-01 : l'utilisateur vient de s'authentifier, l'analytics passe
      // sur la base intérêt légitime. Si PostHog n'avait pas été initialisé au
      // boot (visiteur sans consentement), l'init se fait maintenant, AVANT
      // identify/capture (la navigation post-login est SPA, sans full reload).
      notifyAnalyticsAllowed();
      posthog.identify(user.id, { email: user.email });
      posthog.capture("login_otp_verified", { email: user.email });

      // P4-05 : si l'utilisateur arrive d'un signup self-serve, finaliser
      // l'acquisition (UPDATE pharmacy_acquisition.confirmed_at). Idempotent,
      // non-bloquant (fire-and-forget), pattern identique à /auth/callback.
      const acquisitionId = user.user_metadata?.acquisition_id;
      if (typeof acquisitionId === "string" && acquisitionId.length > 0) {
        void fetch("/api/signup/confirm", { method: "POST" }).catch(() => {});
      }

      const invitationResult = await finalizeLoginInvite(supabase, user);
      if (invitationResult.error) {
        setError(invitationResult.error);
        setDigits(Array(CODE_LENGTH).fill(""));
        inputRefs.current[0]?.focus();
        return;
      }
    }

    router.push(next);
    router.refresh();
  }

  async function handleResend() {
    setError(null);
    const supabase = createClient();
    const { error: resendError } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: getAuthCallbackUrl() },
    });
    if (resendError) {
      setError(getOtpErrorMessage(resendError));
    }
  }

  useEffect(() => {
    if (!email) {
      router.replace("/login");
    }
  }, [email, router]);

  if (!email) {
    return null;
  }

  return (
    <section className="mx-auto max-w-md px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
        Vérification
      </h1>
      <p className="mt-2 text-slate-600">
        Entrez le code à 8 chiffres envoyé à{" "}
        <span className="font-medium text-slate-900">{email}</span>.
      </p>

      <form
        onSubmit={handleSubmit}
        className="mt-8 space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div
          className="grid grid-cols-8 gap-1.5 sm:gap-2"
          onPaste={handlePaste}
        >
          {digits.map((digit, i) => (
            <input
              key={i}
              ref={(el) => {
                inputRefs.current[i] = el;
              }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              disabled={loading}
              className="h-12 w-full rounded-lg border border-slate-300 px-0 text-center text-base font-semibold shadow-sm transition-colors focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20 disabled:opacity-50 sm:text-lg"
              autoFocus={i === 0}
            />
          ))}
        </div>

        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-teal-600 px-4 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-teal-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Vérification…" : "Valider"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-600">
        Pas reçu le code ?{" "}
        <button
          type="button"
          onClick={handleResend}
          className="font-medium text-teal-700 underline-offset-4 hover:underline"
        >
          Renvoyer
        </button>
      </p>
    </section>
  );
}

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <section className="mx-auto max-w-md px-4 py-16 sm:px-6 lg:px-8">
          <div className="h-48 animate-pulse rounded-2xl border border-slate-200 bg-slate-50" />
        </section>
      }
    >
      <VerifyContent />
    </Suspense>
  );
}
