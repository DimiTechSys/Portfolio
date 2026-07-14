"use client";

import { useActionState } from "react";
import { loginAction, type LoginState } from "@/app/actions/admin";
import { Loader2, LogIn } from "lucide-react";

export default function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(
    loginAction,
    null,
  );

  return (
    <form action={action} className="card p-6">
      <label className="label" htmlFor="password">
        Mot de passe
      </label>
      <input
        id="password"
        name="password"
        type="password"
        className="field"
        placeholder="••••••••"
        autoFocus
        required
      />
      {state?.error && (
        <p className="mt-3 text-sm" style={{ color: "#b4471f" }}>
          {state.error}
        </p>
      )}
      <button type="submit" className="btn btn-gold mt-5 w-full" disabled={pending}>
        {pending ? (
          <>
            <Loader2 size={18} className="animate-spin" /> Connexion…
          </>
        ) : (
          <>
            <LogIn size={18} /> Se connecter
          </>
        )}
      </button>
    </form>
  );
}
