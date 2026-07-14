"use client";

import { FormEvent, useState } from "react";

const professionChoices = [
  "Étudiant·e en ostéopathie",
  "Ostéopathe",
  "Autre profession",
];

const interestChoices = [
  "Projet pro & installation",
  "Logiciel clinique",
  "Développement d'activité",
  "Améliorer sa pratique",
  "Bons plans et réductions",
  "Autre (précisez)",
];

export function WelcomeOnboarding() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [profession, setProfession] = useState<string | null>(null);
  const [interest, setInterest] = useState<string | null>("Logiciel clinique");
  const [accepted, setAccepted] = useState(true);
  const [submitted, setSubmitted] = useState(false);

  const firstNameError = submitted && !firstName.trim();
  const lastNameError = submitted && !lastName.trim();

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
    if (firstNameError || lastNameError || !profession || !accepted) {
      return;
    }
  }

  const inputBase =
    "h-[50px] w-full rounded-[10px] border bg-white px-3 text-[17px] text-[#14213d] shadow-sm outline-none transition placeholder:text-slate-400 focus:border-[#2b9d95] focus:ring-[3px] focus:ring-[rgba(43,157,149,0.16)]";
  const inputErr =
    "border-[#f2a64f] ring-[3px] ring-[rgba(242,166,79,0.25)] focus:border-[#f2a64f]";

  const pillBase =
    "min-h-[58px] rounded-[10px] border px-3 text-center text-[15px] leading-snug text-[#132542] transition";

  return (
    <main className="min-h-screen bg-[#e9edf2] px-4 py-8 font-sans text-[#14213d] sm:py-12">
      <section className="mx-auto w-full max-w-[940px] rounded-xl border border-[#d8dee7] bg-white p-6 shadow-[0_14px_34px_rgba(15,23,42,0.08)] sm:p-10">
        <h1 className="text-[clamp(1.6rem,4vw,2.85rem)] font-bold leading-[1.12] tracking-tight">
          👋 Bienvenue sur osteopathes.pro
        </h1>

        <div className="mt-4 flex">
          <div className="h-11 w-11 rounded-full border-2 border-white bg-gradient-to-br from-[#8ea2c9] to-[#2d3d5b]" />
          <div className="-ml-2 h-11 w-11 rounded-full border-2 border-white bg-gradient-to-br from-[#f3c971] to-[#8f5e1e]" />
        </div>

        <p className="mt-4 text-[clamp(1.05rem,1.7vw,1.35rem)] leading-[1.35] text-[#2c3e59]">
          Nous sommes Klemen et Konrad, amis, ostéopathes et créateurs de ce site que nous
          avons conçu pour nos collègues et pour nous.{" "}
          <a href="#" className="text-[#0e918c] underline-offset-2 hover:underline">
            En savoir plus sur nous
          </a>
        </p>
        <p className="mt-3 text-[clamp(1.05rem,1.7vw,1.35rem)] leading-[1.35] text-[#2c3e59]">
          Personnalisons votre compte ensemble.
        </p>

        <form className="mt-8 flex flex-col gap-8" onSubmit={onSubmit} noValidate>
          <div>
            <h2 className="text-[clamp(1.35rem,2.8vw,1.9rem)] font-bold tracking-tight">
              Comment vous appelez-vous ?
            </h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <label htmlFor="firstName" className="text-[17px] text-[#14213d]">
                  Prénom
                </label>
                <input
                  id="firstName"
                  placeholder="Votre prénom, par ex. Julie"
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                  className={`${inputBase} ${firstNameError ? inputErr : "border-[#ccd5e1]"}`}
                />
                {firstNameError ? (
                  <p className="text-[16px] text-[#e96610]">Veuillez renseigner votre prénom.</p>
                ) : null}
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="lastName" className="text-[17px] text-[#14213d]">
                  Nom
                </label>
                <input
                  id="lastName"
                  placeholder="Votre nom, par ex. Dupont"
                  value={lastName}
                  onChange={(event) => setLastName(event.target.value)}
                  className={`${inputBase} ${lastNameError ? inputErr : "border-[#ccd5e1]"}`}
                />
                {lastNameError ? (
                  <p className="text-[16px] text-[#e96610]">Veuillez renseigner votre nom.</p>
                ) : null}
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-[clamp(1.35rem,2.8vw,1.9rem)] font-bold tracking-tight">
              Quelle est votre profession ?
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {professionChoices.map((choice) => (
                <button
                  key={choice}
                  type="button"
                  className={`${pillBase} border-[#cad3df] bg-white hover:border-[#95a6bf] ${
                    profession === choice
                      ? "border-[#1e40af] bg-[#1e40af] text-white shadow-[0_10px_22px_rgba(30,64,175,0.28)]"
                      : ""
                  }`}
                  onClick={() => setProfession(choice)}
                >
                  {choice}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-[clamp(1.35rem,2.8vw,1.9rem)] font-bold tracking-tight">
              Que recherchez-vous sur osteopathes.pro ?
            </h2>
            <p className="mt-1 text-[1.02rem] text-[#617693]">On est très attentifs à vos attentes</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {interestChoices.map((choice) => (
                <button
                  key={choice}
                  type="button"
                  className={`${pillBase} border-[#cad3df] bg-white hover:border-[#95a6bf] ${
                    interest === choice
                      ? "border-[#1e40af] bg-[#1e40af] text-white shadow-[0_10px_22px_rgba(30,64,175,0.28)]"
                      : ""
                  }`}
                  onClick={() => setInterest(choice)}
                >
                  {choice}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-[#d7dfeb] pt-6">
            <div className="flex gap-3 sm:gap-4">
              <input
                id="consent"
                type="checkbox"
                checked={accepted}
                onChange={(event) => setAccepted(event.target.checked)}
                className="mt-1 h-4 w-4 shrink-0 accent-[#1e40af]"
              />
              <label htmlFor="consent" className="text-[15px] leading-[1.45] text-[#253a58]">
                Je reconnais avoir lu et compris les{" "}
                <a href="#" className="text-[#0e918c] underline-offset-2 hover:underline">
                  conditions générales
                </a>{" "}
                et la{" "}
                <a href="#" className="text-[#0e918c] underline-offset-2 hover:underline">
                  politique de confidentialité
                </a>{" "}
                et je les accepte sans réserve.
              </label>
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              className="h-12 w-full rounded-lg bg-[#1e40af] px-10 text-[15px] font-semibold text-white shadow-md transition hover:bg-[#1d4ed8] sm:w-auto"
            >
              Continuer
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
