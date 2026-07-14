"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function SignupForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const emailError = submitted && !email.includes("@");
  const passwordError = submitted && password.length < 8;
  const confirmError = submitted && confirmPassword !== password;

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);

    if (emailError || passwordError || confirmError) {
      return;
    }

    router.push("/bienvenue");
  }

  const inputBase =
    "h-12 w-full rounded-lg border bg-white px-3 text-base text-[#14213d] shadow-sm outline-none transition placeholder:text-slate-400 focus:border-[#2b9d95] focus:ring-[3px] focus:ring-[rgba(43,157,149,0.22)]";
  const inputError =
    "border-[#f2a64f] ring-[3px] ring-[rgba(242,166,79,0.28)] focus:border-[#f2a64f] focus:ring-[rgba(242,166,79,0.35)]";

  return (
    <main className="flex min-h-screen flex-col items-center justify-start bg-[#e9edf2] px-4 py-10 font-sans text-[#14213d] sm:justify-center sm:py-14">
      <section className="w-full max-w-[440px] rounded-xl border border-[#d8dee7] bg-white p-8 shadow-[0_14px_34px_rgba(15,23,42,0.08)] sm:p-10">
        <h1 className="text-3xl font-bold leading-tight tracking-tight text-[#14213d] sm:text-[2rem]">
          Créer un compte
        </h1>
        <p className="mt-3 text-base leading-snug text-[#5c6a7e]">
          Renseignez votre adresse e-mail et votre mot de passe pour commencer.
        </p>

        <form className="mt-8 flex flex-col gap-6" onSubmit={onSubmit} noValidate>
          <div className="flex flex-col gap-2">
            <label htmlFor="email" className="text-[15px] font-medium text-[#14213d]">
              Adresse e-mail
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="nom@exemple.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className={`${inputBase} ${emailError ? inputError : "border-[#ccd5e1]"}`}
            />
            {emailError ? (
              <span className="text-[15px] text-[#e96610]">
                Veuillez renseigner un email valide.
              </span>
            ) : null}
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="password" className="text-[15px] font-medium text-[#14213d]">
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              placeholder="Minimum 8 caractères"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className={`${inputBase} ${passwordError ? inputError : "border-[#ccd5e1]"}`}
            />
            {passwordError ? (
              <span className="text-[15px] text-[#e96610]">
                Le mot de passe doit faire au moins 8 caractères.
              </span>
            ) : null}
          </div>

          <div className="flex flex-col gap-2">
            <label
              htmlFor="confirm-password"
              className="text-[15px] font-medium text-[#14213d]"
            >
              Confirmer le mot de passe
            </label>
            <input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              placeholder="Retapez votre mot de passe"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className={`${inputBase} ${confirmError ? inputError : "border-[#ccd5e1]"}`}
            />
            {confirmError ? (
              <span className="text-[15px] text-[#e96610]">
                Les mots de passe doivent être identiques.
              </span>
            ) : null}
          </div>

          <button
            type="submit"
            className="mt-2 h-12 w-full rounded-full bg-[#26333f] text-[15px] font-semibold text-white shadow-sm transition hover:bg-[#1c2630] sm:w-auto sm:min-w-[200px] sm:self-start"
          >
            Créer mon compte
          </button>
        </form>
      </section>
    </main>
  );
}
