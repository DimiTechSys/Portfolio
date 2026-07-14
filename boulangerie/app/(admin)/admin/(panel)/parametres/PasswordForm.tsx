"use client";

import { useActionState } from "react";
import { changePasswordAction, type PasswordState } from "@/app/actions/admin";

export default function PasswordForm() {
  const [state, action, pending] = useActionState<PasswordState, FormData>(
    changePasswordAction,
    null,
  );

  return (
    <form action={action} className="card p-6">
      <h2 className="text-2xl mb-4" style={{ fontFamily: "var(--font-serif)" }}>
        Mot de passe
      </h2>
      <div className="space-y-4">
        <div>
          <label className="label">Mot de passe actuel</label>
          <input name="current" type="password" className="field" required />
        </div>
        <div>
          <label className="label">Nouveau mot de passe</label>
          <input name="next" type="password" className="field" required />
        </div>
      </div>
      {state?.error && (
        <p className="mt-3 text-sm" style={{ color: "#b4471f" }}>{state.error}</p>
      )}
      {state?.ok && (
        <p className="mt-3 text-sm" style={{ color: "#2b7a4f" }}>Mot de passe mis à jour.</p>
      )}
      <button type="submit" className="btn btn-gold mt-5" disabled={pending}>
        Changer le mot de passe
      </button>
    </form>
  );
}
