"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { TramesNavIconId } from "@/components/trames/trames-nav-icon";
import { TramesNavIcon } from "@/components/trames/trames-nav-icon";
import type { PatientV2 } from "@/lib/dossiers-storage";
import { deletePatientById, loadPatients } from "@/lib/dossiers-storage";
import { calendarAgeFromDate, parsePatientBirthDateString } from "@/lib/patient-birth-date";

const sidebarPrimary = [
  { label: "Tableau de bord", href: "#", icon: "dashboard" satisfies TramesNavIconId, active: false },
  { label: "Dossiers", href: "/dossiers", icon: "folders" satisfies TramesNavIconId, active: true },
  { label: "Notes d'honoraires", href: "#", icon: "invoices" satisfies TramesNavIconId, active: false },
  { label: "Trames", href: "/trames", icon: "trames" satisfies TramesNavIconId, active: false },
] as const;

const sidebarBottom = [
  { label: "Paramètres", href: "#", icon: "settings" satisfies TramesNavIconId, active: false },
] as const;

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function parseSearchQuery(query: string) {
  const tokens = query.match(/\w+:\s*("[^"]+"|\S+)/gi) ?? [];
  const map = new Map<string, string>();
  for (const token of tokens) {
    const m = token.match(/^(\w+):\s*(.+)$/i);
    if (!m) continue;
    const key = m[1].toLowerCase();
    let val = m[2].trim();
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    map.set(key, val);
  }
  const remainder = tokens.reduce((acc, t) => acc.replace(t, ""), query).trim();
  return { map, freeText: remainder };
}

function patientDisplayName(patient: PatientV2) {
  const c = patient.civility === "M" || patient.civility === "Mme" ? `${patient.civility} ` : "";
  return `${c}${patient.lastName} ${patient.firstName}`.trim();
}

function patientMatches(patient: PatientV2, query: string) {
  const q = query.trim();
  if (!q) return true;

  const { map, freeText } = parseSearchQuery(q);
  const haystack =
    `${patient.civility === "M" || patient.civility === "Mme" ? patient.civility : ""} ${patient.lastName} ${patient.firstName} ${patient.phone} ${patient.email} ${patient.birthDate}`
      .trim()
      .toLowerCase();

  if (freeText && !haystack.includes(normalize(freeText))) return false;

  const nom = map.get("nom");
  if (nom && !normalize(patient.lastName).includes(normalize(nom))) return false;
  const prenom = map.get("prenom");
  if (prenom && !normalize(patient.firstName).includes(normalize(prenom))) return false;
  const tel = map.get("tel");
  if (tel && !normalize(patient.phone).includes(normalize(tel))) return false;
  const email = map.get("email");
  if (email && !normalize(patient.email).includes(normalize(email))) return false;
  const ddn = map.get("ddn");
  if (ddn && !normalize(patient.birthDate).includes(normalize(ddn))) return false;

  return true;
}

function formatBirth(patient: PatientV2) {
  if (!patient.birthDate) return "—";
  const d = parsePatientBirthDateString(patient.birthDate);
  if (!d) return patient.birthDate;
  const age = calendarAgeFromDate(d);
  return `${d.toLocaleDateString("fr-FR")} (${age} ans)`;
}

function formatLastVisit(patient: PatientV2) {
  if (!patient.lastVisitAt) return "—";
  const d = new Date(patient.lastVisitAt);
  if (Number.isNaN(d.getTime())) return "—";
  const count = patient.visitCount ?? 0;
  const suffix = count > 0 ? ` (${count})` : "";
  return `${d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}${suffix}`;
}

export function DossiersListPage() {
  const [patients, setPatients] = useState<PatientV2[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setPatients(loadPatients());
  }, []);

  const filtered = useMemo(() => patients.filter((p) => patientMatches(p, search)), [patients, search]);

  function onDeletePatient(patient: PatientV2) {
    const label = patientDisplayName(patient) || "ce patient";
    const ok = window.confirm(
      `Supprimer le dossier de ${label} ?\n\nCette action supprime aussi les consultations enregistrées pour ce patient.`,
    );
    if (!ok) return;
    deletePatientById(patient.id);
    setPatients(loadPatients());
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
          <h1 className="trames-title dossiers-prod-title">Dossiers</h1>
          <div className="trames-top-actions">
            <button className="trames-top-btn dossiers-ghost-btn" type="button">
              Personnaliser
            </button>
            <Link className="trames-top-btn dossiers-primary-btn" href="/dossiers/nouveau">
              <span className="trames-plus" aria-hidden>
                +
              </span>
              Nouveau patient
            </Link>
          </div>
        </header>

        <main className="trames-content dossiers-content dossiers-list-page">
          <section className="newtrame-panel dossiers-search-panel">
            <label className="newtrame-label" htmlFor="dossiers-search">
              Rechercher
            </label>
            <input
              id="dossiers-search"
              className="newtrame-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="nom:, prenom:, tel:, email:, ddn:"
            />
            <p className="dossiers-search-hint">
              Utilisez &quot;nom:&quot;, &quot;prenom:&quot;, &quot;tel:&quot;, &quot;email:&quot;, &quot;ddn:&quot; pour des recherches
              plus précises.
            </p>
          </section>

          <section className="dossiers-table-wrap">
            <table className="dossiers-table">
              <thead>
                <tr>
                  <th>Nom prénom</th>
                  <th>Date de naissance</th>
                  <th>Téléphone</th>
                  <th>Email</th>
                  <th>Dernière visite</th>
                  <th className="dossiers-table-actions" aria-label="Supprimer" />
                </tr>
              </thead>
              <tbody>
                {filtered.length ? (
                  filtered.map((patient) => (
                    <tr key={patient.id} className="dossiers-table-row">
                      <td>
                        <Link className="dossiers-table-link" href={`/dossiers/${encodeURIComponent(patient.id)}`}>
                          {patientDisplayName(patient)}
                        </Link>
                      </td>
                      <td>{formatBirth(patient)}</td>
                      <td>{patient.phone || "—"}</td>
                      <td>{patient.email || "—"}</td>
                      <td>{formatLastVisit(patient)}</td>
                      <td className="dossiers-table-actions">
                        <button
                          type="button"
                          className="dossiers-delete-btn"
                          aria-label={`Supprimer le dossier ${patientDisplayName(patient)}`}
                          title="Supprimer"
                          onClick={() => onDeletePatient(patient)}
                        >
                          ×
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="dossiers-empty-cell">
                      {patients.length ? "0 résultat" : "Aucun patient en ce moment."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            <p className="dossiers-result-count">{filtered.length} résultat{filtered.length > 1 ? "s" : ""}</p>
          </section>
        </main>
      </div>
    </div>
  );
}
