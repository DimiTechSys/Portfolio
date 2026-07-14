"use client";

import { Suspense, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { getAuthCallbackUrl } from "@/lib/auth/app-origin";
import { safeNext } from "@/lib/auth/safe-next";
import { getOtpErrorMessage } from "@/lib/auth/otp-error-message";
import { createClient } from "@/lib/supabase/client";
import posthog from "posthog-js";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeNext(searchParams.get("next"));
  const callbackError = searchParams.get("error");
  const prefilledEmail = searchParams.get("email") ?? "";

  const [email, setEmail] = useState(prefilledEmail);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    callbackError === "auth_callback_failed"
      ? "L'authentification a échoué. Veuillez réessayer."
      : null
  );

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        // G9 : la connexion ne crée plus de compte à la volée. La création
        // passe exclusivement par /signup (consentements CGS/DPA obligatoires).
        shouldCreateUser: false,
        emailRedirectTo: getAuthCallbackUrl(),
        data: {},
      },
    });

    setLoading(false);

    if (otpError) {
      setError(getOtpErrorMessage(otpError));
      return;
    }

    posthog.capture("login_otp_requested", { email: email.trim().toLowerCase() });

    // Navigate to verify with the email in query params
    const params = new URLSearchParams({ email: email.trim().toLowerCase() });
    if (next !== "/dashboard") params.set("next", next);
    router.push(`/verify?${params.toString()}`);
  }

  return (
    <section className="mx-auto max-w-md px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
        Connexion
      </h1>
      <p className="mt-2 text-slate-600">
        Entrez votre email pour recevoir un code de connexion à 8 chiffres.
      </p>

      <form
        onSubmit={handleSubmit}
        className="mt-8 space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <label className="block">
          <span className="text-sm font-medium text-slate-900">
            Email professionnel
          </span>
          <input
            id="email"
            type="email"
            placeholder="vous@officine.fr"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
            autoComplete="email"
            disabled={loading}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm transition-colors focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20 disabled:opacity-50"
          />
        </label>

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
          {loading ? "Envoi en cours…" : "Recevoir le code"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-600">
        Pas encore de compte ?{" "}
        <Link
          href="/signup"
          className="font-medium text-teal-700 underline-offset-4 hover:underline"
        >
          Créer un compte gratuit
        </Link>
      </p>
    </section>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <section className="mx-auto max-w-md px-4 py-16 sm:px-6 lg:px-8">
          <div className="h-48 animate-pulse rounded-2xl border border-slate-200 bg-slate-50" />
        </section>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
