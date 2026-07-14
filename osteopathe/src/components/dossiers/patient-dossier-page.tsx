"use client";

import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { TramesNavIconId } from "@/components/trames/trames-nav-icon";
import { TramesNavIcon } from "@/components/trames/trames-nav-icon";
import type { PatientCivility, PatientV2 } from "@/lib/dossiers-storage";
import { TrameNotesField } from "@/components/trame/trame-notes-field";
import { getPatientById, loadPatients, savePatients, touchLastVisit } from "@/lib/dossiers-storage";
import { formatPatientBirthDateFr, patientAgeFromBirthString } from "@/lib/patient-birth-date";
import { readTramesFromStorage } from "@/lib/trame-at-expand";
import { RichTextEditor } from "@/components/trame/rich-text-editor";

type Consultation = {
  id: string;
  patientId: string;
  title: string;
  notes: string;
  createdAt: string;
  /** Nom affiché après « par » (ex. maquette). */
  authorName?: string;
};

const DEFAULT_CONSULT_AUTHOR = "Anna Karenina";

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

function formatLongConsultDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

function DossierTabGlyph({ name }: { name: "admin" | "notes" | "pin" | "consult" | "clip" | "mail" }) {
  const c = { width: 16, height: 16, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.65 } as const;
  switch (name) {
    case "admin":
      return (
        <svg {...c} aria-hidden>
          <path d="M4 6h16v12H4zM8 6V4h8v2" />
          <path d="M9 12h6" />
        </svg>
      );
    case "notes":
      return (
        <svg {...c} aria-hidden>
          <path d="M8 4h10a1 1 0 0 1 1 1v14l-3-2-3 2V5a1 1 0 0 0-1-1H8a2 2 0 0 0-2 2v12" />
        </svg>
      );
    case "pin":
      return (
        <svg {...c} aria-hidden>
          <path d="M12 17v5M8 9h8l-1 8H9L8 9Z" />
          <path d="M10 9V5a2 2 0 1 1 4 0v4" />
        </svg>
      );
    case "consult":
      return (
        <svg {...c} aria-hidden>
          <path d="M12 21a9 9 0 1 0-9-9c0 1.5.4 3 1.1 4.3L3 21l4.7-1.1A9 9 0 0 0 12 21Z" />
        </svg>
      );
    case "clip":
      return (
        <svg {...c} aria-hidden>
          <path d="M21 11l-9 9a4 4 0 0 1-6-6l9-9a2 2 0 1 1 3 3l-9 9" />
        </svg>
      );
    case "mail":
      return (
        <svg {...c} aria-hidden>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="m3 7 9 6 9-6" />
        </svg>
      );
    default:
      return null;
  }
}

function routePatientId(params: { id?: string | string[] }) {
  const raw = params?.id;
  const segment = typeof raw === "string" ? raw : Array.isArray(raw) && raw[0] ? String(raw[0]) : "";
  if (!segment) return "";
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

export function PatientDossierPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const patientId = routePatientId(params);

  const [patient, setPatient] = useState<PatientV2 | null>(null);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [tab, setTab] = useState<"admin" | "notes" | "pinned" | "consult" | "files" | "mail">("consult");
  const [showConsultForm, setShowConsultForm] = useState(false);

  const [adminCivility, setAdminCivility] = useState<PatientCivility>("");
  const [adminLastName, setAdminLastName] = useState("");
  const [adminFirstName, setAdminFirstName] = useState("");
  const [adminBirthDate, setAdminBirthDate] = useState("");
  const [adminSocial, setAdminSocial] = useState("");
  const [adminRecommended, setAdminRecommended] = useState("");
  const [adminComment, setAdminComment] = useState("");
  const [adminCountry, setAdminCountry] = useState("France");
  const [adminAddress, setAdminAddress] = useState("");
  const [adminAddress2, setAdminAddress2] = useState("");
  const [adminPostal, setAdminPostal] = useState("");
  const [adminCity, setAdminCity] = useState("");
  const [adminPhone, setAdminPhone] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminSaveHint, setAdminSaveHint] = useState<{ msg: string; tone: "ok" | "err" } | null>(null);

  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const notesRef = useRef<HTMLTextAreaElement | null>(null);
  const pendingCaretRef = useRef<number | null>(null);

  useEffect(() => {
    setPatient(getPatientById(patientId) ?? null);

    const rawConsultations = window.localStorage.getItem("consultations");
    if (rawConsultations) {
      try {
        const parsed = JSON.parse(rawConsultations) as Consultation[];
        setConsultations(parsed.filter((c) => c.patientId === patientId));
      } catch {
        setConsultations([]);
      }
    } else {
      setConsultations([]);
    }
  }, [patientId]);

  useEffect(() => {
    if (!patient) return;
    setAdminCivility(patient.civility === "Mme" ? "Mme" : patient.civility === "M" ? "M" : "");
    setAdminLastName(patient.lastName);
    setAdminFirstName(patient.firstName);
    setAdminBirthDate(patient.birthDate);
    setAdminSocial(patient.socialSecurity ?? "");
    setAdminRecommended(patient.recommendedBy ?? "");
    setAdminComment(patient.comment ?? "");
    setAdminCountry(patient.country?.trim() || "France");
    setAdminAddress(patient.address);
    setAdminAddress2(patient.address2 ?? "");
    setAdminPostal(patient.postalCode);
    setAdminCity(patient.city);
    setAdminPhone(patient.phone);
    setAdminEmail(patient.email);
  }, [patient]);

  useEffect(() => {
    if (tab !== "admin") setAdminSaveHint(null);
  }, [tab]);

  function onNotesChange(value: string) {
    setNotes(value);
  }

  function persistConsultations(nextForPatient: Consultation[]) {
    const raw = window.localStorage.getItem("consultations");
    const existing = raw ? ((JSON.parse(raw) as Consultation[]) ?? []) : [];
    const withoutCurrentPatient = existing.filter((item) => item.patientId !== patientId);
    const nextAll = [...nextForPatient, ...withoutCurrentPatient];
    window.localStorage.setItem("consultations", JSON.stringify(nextAll));
    setConsultations(nextForPatient);
  }

  function onCreateConsultation(event: FormEvent) {
    event.preventDefault();
    if (!notes.trim()) return;
    const newConsultation: Consultation = {
      id: typeof crypto !== "undefined" ? crypto.randomUUID() : `consult-${Date.now()}`,
      patientId,
      title: title.trim(),
      notes: notes.trim(),
      createdAt: new Date().toISOString(),
      authorName: DEFAULT_CONSULT_AUTHOR,
    };
    persistConsultations([newConsultation, ...consultations]);
    touchLastVisit(patientId);
    setPatient(getPatientById(patientId));
    setTitle("");
    setNotes("");
    setShowConsultForm(false);
  }

  function onSaveAdmin(event: FormEvent) {
    event.preventDefault();
    if (!patient) return;
    if (
      !adminLastName.trim() ||
      !adminFirstName.trim() ||
      !adminBirthDate.trim() ||
      !adminPhone.trim() ||
      !adminEmail.trim()
    ) {
      setAdminSaveHint({
        msg: "Complétez au minimum : nom, prénom, date de naissance, téléphone et email.",
        tone: "err",
      });
      window.setTimeout(() => setAdminSaveHint(null), 4500);
      return;
    }
    const updated: PatientV2 = {
      ...patient,
      civility: adminCivility === "M" || adminCivility === "Mme" ? adminCivility : undefined,
      lastName: adminLastName.trim(),
      firstName: adminFirstName.trim(),
      birthDate: adminBirthDate.trim(),
      socialSecurity: adminSocial.trim() || undefined,
      recommendedBy: adminRecommended.trim() || undefined,
      comment: adminComment.trim() || undefined,
      country: adminCountry.trim() || "France",
      address: adminAddress.trim(),
      address2: adminAddress2.trim() || undefined,
      postalCode: adminPostal.trim(),
      city: adminCity.trim(),
      phone: adminPhone.trim(),
      email: adminEmail.trim(),
    };
    const all = loadPatients();
    const idx = all.findIndex((p) => p.id === patient.id);
    if (idx === -1) {
      setAdminSaveHint({
        msg: "Patient introuvable dans le stockage local. Rechargez la page.",
        tone: "err",
      });
      window.setTimeout(() => setAdminSaveHint(null), 5000);
      return;
    }
    const next = [...all];
    next[idx] = updated;
    savePatients(next);
    setPatient(updated);
    router.push("/dossiers");
  }

  if (!patient) {
    return (
      <main className="dossiers-missing">
        <p>Dossier introuvable.</p>
        <Link href="/dossiers">Retour aux dossiers</Link>
      </main>
    );
  }

  const age = patient.birthDate ? patientAgeFromBirthString(patient.birthDate) : null;
  const titleCiv =
    tab === "admin"
      ? adminCivility === "M" || adminCivility === "Mme"
        ? `${adminCivility} `
        : ""
      : patient.civility === "M" || patient.civility === "Mme"
        ? `${patient.civility} `
        : "";
  const titleFirst = tab === "admin" ? adminFirstName : patient.firstName;
  const titleLast = tab === "admin" ? adminLastName : patient.lastName;
  const headerDisplayName = `${titleCiv}${titleFirst} ${titleLast}`.replace(/\s+/g, " ").trim();
  const birthForSubtitle = (tab === "admin" ? adminBirthDate : patient.birthDate)?.trim() ?? "";

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
        <header className="trames-topbar dossiers-patient-topbar dossiers-topbar">
          <div>
            <h1 className="trames-title dossiers-patient-title dossiers-patient-name-teal">
              {headerDisplayName
                ? `${headerDisplayName}${age !== null ? `, ${age} ans` : ""}`
                : "Patient"}
            </h1>
            <p className="dossiers-patient-sub">
              {birthForSubtitle ? <>Né(e) le {formatPatientBirthDateFr(birthForSubtitle)}</> : "Date de naissance non renseignée"}
            </p>
          </div>
          <div className="trames-top-actions dossiers-patient-actions">
            {tab === "admin" ? (
              <>
                <button className="trames-top-btn dossiers-primary-btn dossiers-save-btn" type="submit" form="dossiers-admin-form">
                  <span className="dossiers-save-btn-icon" aria-hidden>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65">
                      <rect x="8" y="2" width="8" height="4" rx="1" />
                      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                    </svg>
                  </span>
                  Enregistrer
                </button>
                {adminSaveHint ? (
                  <span
                    className={`dossiers-admin-save-hint ${adminSaveHint.tone === "ok" ? "is-ok" : "is-err"}`}
                    role="status"
                    aria-live="polite"
                  >
                    {adminSaveHint.msg}
                  </span>
                ) : null}
                <Link className="trames-top-btn dossiers-ghost-btn" href="/dossiers">
                  Retour
                </Link>
              </>
            ) : (
              <>
                <button className="trames-top-btn dossiers-ghost-btn" type="button">
                  Ajouter une mutuelle
                </button>
                <button
                  className="trames-top-btn dossiers-primary-btn"
                  type="button"
                  onClick={() => {
                    setTab("consult");
                    setShowConsultForm(true);
                  }}
                >
                  + Nouvelle consultation
                </button>
                <button className="trames-top-btn dossiers-ghost-btn" type="button" aria-label="Plus d'options">
                  …
                </button>
                <Link className="trames-top-btn dossiers-ghost-btn" href="/dossiers">
                  Retour
                </Link>
              </>
            )}
          </div>
        </header>

        <main
          className={`trames-content dossiers-content dossiers-patient${
            tab === "consult" && showConsultForm ? " dossiers-patient-consult-edit" : ""
          }`}
        >
          <nav className="dossiers-tabs dossiers-tabs-with-icons" aria-label="Sections du dossier">
            <button
              type="button"
              className={`dossiers-tab ${tab === "admin" ? "is-active" : ""}`}
              onClick={() => setTab("admin")}
            >
              <span className="dossiers-tab-inner">
                <span className="dossiers-tab-glyph" aria-hidden>
                  <DossierTabGlyph name="admin" />
                </span>
                Administratif
              </span>
            </button>
            <button
              type="button"
              className={`dossiers-tab ${tab === "notes" ? "is-active" : ""}`}
              onClick={() => setTab("notes")}
            >
              <span className="dossiers-tab-inner">
                <span className="dossiers-tab-glyph" aria-hidden>
                  <DossierTabGlyph name="notes" />
                </span>
                Notes
              </span>
            </button>
            <button
              type="button"
              className={`dossiers-tab ${tab === "pinned" ? "is-active" : ""}`}
              onClick={() => setTab("pinned")}
            >
              <span className="dossiers-tab-inner">
                <span className="dossiers-tab-glyph" aria-hidden>
                  <DossierTabGlyph name="pin" />
                </span>
                Épinglé
              </span>
            </button>
            <button
              type="button"
              className={`dossiers-tab ${tab === "consult" ? "is-active" : ""}`}
              onClick={() => setTab("consult")}
            >
              <span className="dossiers-tab-inner">
                <span className="dossiers-tab-glyph" aria-hidden>
                  <DossierTabGlyph name="consult" />
                </span>
                Consultations
                <span className="dossiers-tab-badge">{consultations.length}</span>
              </span>
            </button>
            <button
              type="button"
              className={`dossiers-tab ${tab === "files" ? "is-active" : ""}`}
              onClick={() => setTab("files")}
            >
              <span className="dossiers-tab-inner">
                <span className="dossiers-tab-glyph" aria-hidden>
                  <DossierTabGlyph name="clip" />
                </span>
                Pièces jointes
                <span className="dossiers-tab-badge">0</span>
              </span>
            </button>
            <button
              type="button"
              className={`dossiers-tab ${tab === "mail" ? "is-active" : ""}`}
              onClick={() => setTab("mail")}
            >
              <span className="dossiers-tab-inner">
                <span className="dossiers-tab-glyph" aria-hidden>
                  <DossierTabGlyph name="mail" />
                </span>
                Courrier
                <span className="dossiers-tab-badge">0</span>
              </span>
            </button>
          </nav>

          {tab === "admin" ? (
            <form
              id="dossiers-admin-form"
              className="dossiers-admin-form"
              onSubmit={(e) => {
                e.preventDefault();
                onSaveAdmin(e);
              }}
            >
              <div className="dossiers-admin-layout">
                <div className="dossiers-admin-left">
                  <section className="dossiers-new-card" aria-label="Identité">
                    <div className="dossiers-new-card-grid dossiers-new-card-grid-2">
                      <div className="dossiers-new-field">
                        <label className="dossiers-new-label" htmlFor="admin-lastName">
                          Nom
                        </label>
                        <div className="dossiers-new-nom-combo">
                          <select
                            id="admin-civility"
                            className="dossiers-new-nom-civility dossiers-new-select"
                            aria-label="Civilité"
                            value={adminCivility}
                            onChange={(e) => setAdminCivility(e.target.value as PatientCivility)}
                          >
                            <option value="">N/A</option>
                            <option value="M">M</option>
                            <option value="Mme">Mme</option>
                          </select>
                          <input
                            id="admin-lastName"
                            className="dossiers-new-nom-input"
                            value={adminLastName}
                            onChange={(e) => setAdminLastName(e.target.value)}
                            autoComplete="family-name"
                            placeholder="Nom de famille"
                          />
                        </div>
                      </div>
                      <div className="dossiers-new-field">
                        <label className="dossiers-new-label" htmlFor="admin-firstName">
                          Prénom
                        </label>
                        <input
                          id="admin-firstName"
                          className="newtrame-input"
                          value={adminFirstName}
                          onChange={(e) => setAdminFirstName(e.target.value)}
                          autoComplete="given-name"
                        />
                      </div>
                      <div className="dossiers-new-field">
                        <div className="dossiers-new-label-row">
                          <label className="dossiers-new-label dossiers-new-label-inline" htmlFor="admin-birthDate">
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
                          id="admin-birthDate"
                          className="newtrame-input"
                          value={adminBirthDate}
                          onChange={(e) => setAdminBirthDate(e.target.value)}
                          placeholder="jj/mm/aaaa ou aaaa-mm-jj"
                          autoComplete="bday"
                        />
                      </div>
                      <div className="dossiers-new-field">
                        <label className="dossiers-new-label" htmlFor="admin-social">
                          N° de sécurité sociale <span className="dossiers-optional">(Optionnel)</span>
                        </label>
                        <input
                          id="admin-social"
                          className="newtrame-input"
                          value={adminSocial}
                          onChange={(e) => setAdminSocial(e.target.value)}
                          autoComplete="off"
                        />
                      </div>
                    </div>
                  </section>

                  <section className="dossiers-new-card" aria-label="Recommandation">
                    <div className="dossiers-new-card-grid dossiers-new-card-grid-2">
                      <div className="dossiers-new-field">
                        <label className="dossiers-new-label" htmlFor="admin-recommended">
                          Recommandé par
                        </label>
                        <select
                          id="admin-recommended"
                          className="newtrame-input dossiers-new-select"
                          value={adminRecommended}
                          onChange={(e) => setAdminRecommended(e.target.value)}
                        >
                          <option value="">Choisissez...</option>
                          <option value="doctolib">Prise de RDV (Doctolib, etc.)</option>
                          <option value="patient">Patient</option>
                          <option value="collegue">Collègue</option>
                          <option value="internet">Internet</option>
                        </select>
                      </div>
                      <div className="dossiers-new-field">
                        <label className="dossiers-new-label" htmlFor="admin-comment">
                          Commentaire
                        </label>
                        <input
                          id="admin-comment"
                          className="newtrame-input"
                          value={adminComment}
                          onChange={(e) => setAdminComment(e.target.value)}
                        />
                      </div>
                    </div>
                  </section>

                  <section className="dossiers-new-card dossiers-admin-linked" aria-label="Dossiers liés">
                    <h3 className="dossiers-admin-card-title">Dossiers liés</h3>
                    <button type="button" className="dossiers-admin-link-add">
                      + Ajouter un lien
                    </button>
                    <p className="dossiers-admin-linked-empty">Aucun dossier lié</p>
                  </section>
                </div>

                <section className="dossiers-new-card dossiers-admin-address-card" aria-label="Adresse et contact">
                  <div className="dossiers-new-card-inner">
                    <div className="dossiers-new-row dossiers-new-row-pays">
                      <div className="dossiers-new-field dossiers-new-field--pays">
                        <label className="dossiers-new-label" htmlFor="admin-country">
                          Pays
                        </label>
                        <select
                          id="admin-country"
                          className="newtrame-input dossiers-new-select"
                          value={adminCountry}
                          onChange={(e) => setAdminCountry(e.target.value)}
                        >
                          {!COUNTRY_OPTIONS.includes(adminCountry as (typeof COUNTRY_OPTIONS)[number]) &&
                          adminCountry ? (
                            <option value={adminCountry}>{adminCountry}</option>
                          ) : null}
                          {COUNTRY_OPTIONS.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="dossiers-new-field dossiers-new-field--adresse">
                        <label className="dossiers-new-label" htmlFor="admin-address">
                          Adresse
                        </label>
                        <input
                          id="admin-address"
                          className="newtrame-input"
                          value={adminAddress}
                          onChange={(e) => setAdminAddress(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="dossiers-new-field dossiers-new-field--full">
                      <label className="dossiers-new-label" htmlFor="admin-address2">
                        Complément d&apos;adresse <span className="dossiers-optional">(Optionnel)</span>
                      </label>
                      <input
                        id="admin-address2"
                        className="newtrame-input"
                        value={adminAddress2}
                        onChange={(e) => setAdminAddress2(e.target.value)}
                      />
                    </div>

                    <div className="dossiers-new-row dossiers-new-row-cp">
                      <div className="dossiers-new-field dossiers-new-field--cp">
                        <label className="dossiers-new-label" htmlFor="admin-postal">
                          Code postal
                        </label>
                        <input
                          id="admin-postal"
                          className="newtrame-input"
                          value={adminPostal}
                          onChange={(e) => setAdminPostal(e.target.value)}
                          autoComplete="postal-code"
                        />
                      </div>
                      <div className="dossiers-new-field dossiers-new-field--city">
                        <label className="dossiers-new-label" htmlFor="admin-city">
                          Commune
                        </label>
                        <input
                          id="admin-city"
                          className="newtrame-input"
                          value={adminCity}
                          onChange={(e) => setAdminCity(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="dossiers-new-row dossiers-new-row-contact">
                      <div className="dossiers-new-field">
                        <label className="dossiers-new-label" htmlFor="admin-phone">
                          Téléphone
                        </label>
                        <input
                          id="admin-phone"
                          className="newtrame-input"
                          value={adminPhone}
                          onChange={(e) => setAdminPhone(e.target.value)}
                          autoComplete="tel"
                        />
                      </div>
                      <div className="dossiers-new-field">
                        <label className="dossiers-new-label" htmlFor="admin-email">
                          Email
                        </label>
                        <input
                          id="admin-email"
                          type="email"
                          className="newtrame-input"
                          value={adminEmail}
                          onChange={(e) => setAdminEmail(e.target.value)}
                          autoComplete="email"
                        />
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            </form>
          ) : null}

          {tab === "notes" ? (
            <section className="newtrame-panel dossiers-tab-panel">
              <h2 className="dossiers-heading">Notes</h2>
              <p className="newtrame-muted">À venir.</p>
            </section>
          ) : null}

          {tab === "pinned" ? (
            <section className="newtrame-panel dossiers-tab-panel">
              <h2 className="dossiers-heading">Épinglé</h2>
              <p className="newtrame-muted">À venir.</p>
            </section>
          ) : null}

          {tab === "files" ? (
            <section className="newtrame-panel dossiers-tab-panel">
              <h2 className="dossiers-heading">Pièces jointes</h2>
              <p className="newtrame-muted">À venir.</p>
            </section>
          ) : null}

          {tab === "mail" ? (
            <section className="newtrame-panel dossiers-tab-panel">
              <h2 className="dossiers-heading">Courrier</h2>
              <p className="newtrame-muted">À venir.</p>
            </section>
          ) : null}

          {tab === "consult" ? (
            <section
              className={`dossiers-consult-layout${showConsultForm ? " dossiers-consult-layout--editing" : ""}`}
            >
              {showConsultForm ? (
                <form onSubmit={onCreateConsultation} className="dossiers-consult-editor dossiers-consult-editor--fill">
                  <input
                    id="consult-title"
                    className="dossiers-consult-title-input"
                    value={title}
                    onChange={(e) => setAdminLastName(e.target.value)}
                    placeholder="Titre (optionnel)"
                    aria-label="Titre (optionnel)"
                  />

                  <div className="dossiers-consult-rte-card dossiers-consult-rte-card--grow">
                    <RichTextEditor
                      value={notes}
                      onChange={onNotesChange}
                      placeholder="Écrivez le contenu ici..."
                    />
                  </div>

                  <div className="dossiers-form-actions dossiers-consult-footer-actions">
                    <button className="trames-top-btn dossiers-ghost-btn" type="button" onClick={() => setShowConsultForm(false)}>
                      Annuler
                    </button>
                    <button className="trames-top-btn dossiers-primary-btn" type="submit">
                      Enregistrer la consultation
                    </button>
                  </div>
                </form>
              ) : consultations.length ? (
                <div className="newtrame-panel dossiers-consult-history">
                  <h2 className="dossiers-heading">Historique</h2>
                  <ul className="dossiers-consult-list">
                    {consultations.map((consultation) => (
                      <li key={consultation.id} className="dossiers-consult-item">
                        <p className="dossiers-consult-meta dossiers-consult-meta--compact">
                          Consultation du {formatLongConsultDate(consultation.createdAt)} par{" "}
                          {consultation.authorName ?? "Praticien"}
                        </p>
                        {consultation.title ? <strong className="dossiers-consult-item-title">{consultation.title}</strong> : null}
                        <p className="dossiers-consult-item-notes">{consultation.notes}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="newtrame-panel dossiers-empty-consult">
                  <div className="dossiers-empty-icon" aria-hidden />
                  <h2 className="dossiers-heading">Ce dossier n&apos;a pas encore de consultation.</h2>
                  <p className="newtrame-muted">Créez une consultation pour ajouter des informations</p>
                  <p className="dossiers-empty-footnote">
                    Une consultation vous permet de noter l&apos;anamnèse, le bilan, le traitement et les conseils de votre séance.
                  </p>
                </div>
              )}
            </section>
          ) : null}
        </main>
      </div>
    </div>
  );
}
