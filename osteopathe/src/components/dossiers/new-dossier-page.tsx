"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import type { TramesNavIconId } from "@/components/trames/trames-nav-icon";
import { TramesNavIcon } from "@/components/trames/trames-nav-icon";
import type { PatientCivility, PatientV2 } from "@/lib/dossiers-storage";
import { loadPatients, savePatients } from "@/lib/dossiers-storage";

const sidebarPrimary = [
  { label: "Tableau de bord", href: "#", icon: "dashboard" satisfies TramesNavIconId, active: false },
  { label: "Dossiers", href: "/dossiers", icon: "folders" satisfies TramesNavIconId, active: true },
  { label: "Notes d'honoraires", href: "#", icon: "invoices" satisfies TramesNavIconId, active: false },
  { label: "Trames", href: "/trames", icon: "trames" satisfies TramesNavIconId, active: false },
] as const;

const sidebarBottom = [
  { label: "Paramètres", href: "#", icon: "settings" satisfies TramesNavIconId, active: false },
] as const;

const COUNTRY_OPTIONS = [
  "France",
  "Belgique",
  "Suisse",
  "Luxembourg",
  "Allemagne",
  "Italie",
  "Espagne",
  "Portugal",
  "Royaume-Uni",
  "Pays-Bas",
  "Canada",
] as const;

export function NewDossierPage() {
  const router = useRouter();
  const [submitted, setSubmitted] = useState(false);

  const [civility, setCivility] = useState<PatientCivility>("");
  const [lastName, setLastName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [socialSecurity, setSocialSecurity] = useState("");
  const [recommendedBy, setRecommendedBy] = useState("");
  const [comment, setComment] = useState("");

  const [country, setCountry] = useState("France");
  const [address, setAddress] = useState("");
  const [address2, setAddress2] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("+33");
  const [email, setEmail] = useState("");

  const lastNameError = submitted && !lastName.trim();
  const firstNameError = submitted && !firstName.trim();
  const birthDateError = submitted && !birthDate.trim();
  const phoneError = submitted && !phone.trim();
  const emailError = submitted && !email.trim();

  const livePreviewParts = [
    civility === "M" || civility === "Mme" ? civility : "",
    firstName.trim(),
    lastName.trim(),
  ].filter(Boolean);
  const livePreview = livePreviewParts.join(" ");
  function onSave(event: FormEvent) {
    event.preventDefault();
    setSubmitted(true);
    if (lastNameError || firstNameError || birthDateError || phoneError || emailError) return;

    const newPatient: PatientV2 = {
      id: typeof crypto !== "undefined" ? crypto.randomUUID() : `patient-${Date.now()}`,
      civility: civility === "M" || civility === "Mme" ? civility : undefined,
      lastName: lastName.trim(),
      firstName: firstName.trim(),
      birthDate: birthDate.trim(),
      socialSecurity: socialSecurity.trim() || undefined,
      recommendedBy: recommendedBy.trim() || undefined,
      comment: comment.trim() || undefined,
      country: country.trim() || "France",
      address: address.trim(),
      address2: address2.trim() || undefined,
      postalCode: postalCode.trim(),
      city: city.trim(),
      phone: phone.trim(),
      email: email.trim(),
      createdAt: new Date().toISOString(),
    };

    const existing = loadPatients();
    savePatients([newPatient, ...existing]);
    router.push(`/dossiers/${encodeURIComponent(newPatient.id)}`);
  }

  return (
    <div className="trames-shell dossiers-app-shell">
      <aside className="trames-sidebar dossiers-sidebar" aria-label="Menu">
        <div className="trames-brand dossiers-brand">
          <span className="trames-logo" aria-hidden />
          <span>osteopathes.pro</span>
        </div>
        <nav className="trames-nav dossiers-nav">
          {sidebarPrimary.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className={`trames-nav-item ${item.active ? "is-active" : ""}`}
            >
              <span className="trames-nav-icon" aria-hidden>
                <TramesNavIcon id={item.icon} />
              </span>
              {item.label}
            </a>
          ))}
          <div className="dossiers-nav-spacer" aria-hidden />
          {sidebarBottom.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className={`trames-nav-item ${item.active ? "is-active" : ""}`}
            >
              <span className="trames-nav-icon" aria-hidden>
                <TramesNavIcon id={item.icon} />
              </span>
              {item.label}
            </a>
          ))}
        </nav>
      </aside>

      <div className="trames-main dossiers-main">
        <header className="trames-topbar dossiers-topbar">
          <h1 className="trames-title dossiers-prod-title" aria-live="polite">
            {livePreview || "Nouveau patient"}
          </h1>
          <div className="trames-top-actions">
            <Link className="trames-top-btn dossiers-ghost-btn" href="/dossiers">
              Annuler
            </Link>
            <button className="trames-top-btn dossiers-primary-btn" type="submit" form="new-dossier-form">
              Enregistrer
            </button>
          </div>
        </header>

        <main className="trames-content dossiers-content dossiers-new-page">
          <form id="new-dossier-form" onSubmit={onSave} className="dossiers-new-layout">
            <section className="dossiers-new-card dossiers-new-card--identity" aria-label="Identité">
              <div className="dossiers-new-card-grid dossiers-new-card-grid-2">
                <div className="dossiers-new-field">
                  <label className="dossiers-new-label" htmlFor="lastName">
                    Nom
                  </label>
                  <div className={`dossiers-new-nom-combo ${lastNameError ? "is-error" : ""}`}>
                    <select
                      id="civility"
                      className="dossiers-new-nom-civility dossiers-new-select"
                      aria-label="Civilité"
                      value={civility}
                      onChange={(e) => setCivility(e.target.value as PatientCivility)}
                    >
                      <option value="">N/A</option>
                      <option value="M">M</option>
                      <option value="Mme">Mme</option>
                    </select>
                    <input
                      id="lastName"
                      className="dossiers-new-nom-input"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      autoComplete="family-name"
                      placeholder="Nom de famille"
                    />
                  </div>
                </div>

                <div className="dossiers-new-field">
                  <label className="dossiers-new-label" htmlFor="firstName">
                    Prénom
                  </label>
                  <input
                    id="firstName"
                    className={`newtrame-input ${firstNameError ? "is-error" : ""}`}
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    autoComplete="given-name"
                  />
                </div>

                <div className="dossiers-new-field">
                  <div className="dossiers-new-label-row">
                    <label className="dossiers-new-label dossiers-new-label-inline" htmlFor="birthDate">
                      Date de naissance
                    </label>
                    <button
                      type="button"
                      className="dossiers-new-help"
                      title="Formats acceptés : jj/mm/aaaa ou aaaa-mm-jj"
                      aria-label="Aide : formats de date acceptés (jj/mm/aaaa ou aaaa-mm-jj)"
                    >
                      ?
                    </button>
                  </div>
                  <input
                    id="birthDate"
                    className={`newtrame-input ${birthDateError ? "is-error" : ""}`}
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    placeholder="jj/mm/aaaa ou aaaa-mm-jj"
                    autoComplete="bday"
                  />
                </div>

                <div className="dossiers-new-field">
                  <label className="dossiers-new-label" htmlFor="socialSecurity">
                    N° de sécurité sociale <span className="dossiers-optional">(Optionnel)</span>
                  </label>
                  <input
                    id="socialSecurity"
                    className="newtrame-input"
                    value={socialSecurity}
                    onChange={(e) => setSocialSecurity(e.target.value)}
                    autoComplete="off"
                  />
                </div>
              </div>
            </section>

            <section className="dossiers-new-card dossiers-new-card--referral" aria-label="Recommandation">
              <div className="dossiers-new-card-grid dossiers-new-card-grid-2">
                <div className="dossiers-new-field">
                  <label className="dossiers-new-label" htmlFor="recommendedBy">
                    Recommandé par
                  </label>
                  <select
                    id="recommendedBy"
                    className="newtrame-input dossiers-new-select"
                    value={recommendedBy}
                    onChange={(e) => setRecommendedBy(e.target.value)}
                  >
                    <option value="">Choisissez...</option>
                    <option value="doctolib">Prise de RDV (Doctolib, etc.)</option>
                    <option value="patient">Patient</option>
                    <option value="collegue">Collègue</option>
                    <option value="internet">Internet</option>
                  </select>
                </div>
                <div className="dossiers-new-field">
                  <label className="dossiers-new-label" htmlFor="comment">
                    Commentaire
                  </label>
                  <input id="comment" className="newtrame-input" value={comment} onChange={(e) => setComment(e.target.value)} />
                </div>
              </div>
            </section>

            <section className="dossiers-new-card dossiers-new-card--address" aria-label="Adresse et contact">
              <div className="dossiers-new-card-inner">
                <div className="dossiers-new-row dossiers-new-row-pays">
                  <div className="dossiers-new-field dossiers-new-field--pays">
                    <label className="dossiers-new-label" htmlFor="country">
                      Pays
                    </label>
                    <select
                      id="country"
                      className="newtrame-input dossiers-new-select"
                      value={COUNTRY_OPTIONS.includes(country as (typeof COUNTRY_OPTIONS)[number]) ? country : "France"}
                      onChange={(e) => setCountry(e.target.value)}
                    >
                      {COUNTRY_OPTIONS.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="dossiers-new-field dossiers-new-field--adresse">
                    <label className="dossiers-new-label" htmlFor="address">
                      Adresse
                    </label>
                    <input id="address" className="newtrame-input" value={address} onChange={(e) => setAddress(e.target.value)} />
                  </div>
                </div>

                <div className="dossiers-new-field dossiers-new-field--full">
                  <label className="dossiers-new-label" htmlFor="address2">
                    Complément d&apos;adresse <span className="dossiers-optional">(Optionnel)</span>
                  </label>
                  <input id="address2" className="newtrame-input" value={address2} onChange={(e) => setAddress2(e.target.value)} />
                </div>

                <div className="dossiers-new-row dossiers-new-row-cp">
                  <div className="dossiers-new-field dossiers-new-field--cp">
                    <label className="dossiers-new-label" htmlFor="postalCode">
                      Code postal
                    </label>
                    <input
                      id="postalCode"
                      className="newtrame-input"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      autoComplete="postal-code"
                    />
                  </div>
                  <div className="dossiers-new-field dossiers-new-field--city">
                    <label className="dossiers-new-label" htmlFor="city">
                      Commune
                    </label>
                    <input id="city" className="newtrame-input" value={city} onChange={(e) => setCity(e.target.value)} />
                  </div>
                </div>

                <div className="dossiers-new-row dossiers-new-row-contact">
                  <div className="dossiers-new-field">
                    <label className="dossiers-new-label" htmlFor="phone">
                      Téléphone
                    </label>
                    <input
                      id="phone"
                      className={`newtrame-input ${phoneError ? "is-error" : ""}`}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      autoComplete="tel"
                    />
                  </div>
                  <div className="dossiers-new-field">
                    <label className="dossiers-new-label" htmlFor="email">
                      Email
                    </label>
                    <input
                      id="email"
                      type="email"
                      className={`newtrame-input ${emailError ? "is-error" : ""}`}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                    />
                  </div>
                </div>

              </div>
            </section>
          </form>
        </main>
      </div>
    </div>
  );
}
