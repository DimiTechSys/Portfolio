"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { TramesNavIconId } from "@/components/trames/trames-nav-icon";
import { TramesNavIcon } from "@/components/trames/trames-nav-icon";
import { TramePreview } from "@/components/trame/trame-preview";
import { RichTextEditor } from "@/components/trame/rich-text-editor";

const sidebarItems = [
  { label: "Tableau de bord", href: "#", icon: "dashboard" satisfies TramesNavIconId, active: false },
  { label: "Dossiers", href: "/dossiers", icon: "folders" satisfies TramesNavIconId, active: false },
  { label: "Notes d'honoraires", href: "#", icon: "invoices" satisfies TramesNavIconId, active: false },
  { label: "Stats", href: "#", icon: "stats" satisfies TramesNavIconId, active: false },
  { label: "Trames", href: "/trames", icon: "trames" satisfies TramesNavIconId, active: true },
  { label: "Calculer ses revenus", href: "#", icon: "revenue" satisfies TramesNavIconId, active: false },
] as const;

type TrameRow = { id: string; name: string; command: string; description: string };

function loadTramesFromStorage(): TrameRow[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem("trames");
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as Array<{
      id?: string;
      name: string;
      command: string;
      description: string;
    }>;
    return parsed.map((item, index) => ({
      id: item.id ?? `${item.command || "trame"}-${index}`,
      name: item.name,
      command: item.command,
      description: item.description,
    }));
  } catch {
    return [];
  }
}

export function TramesPage() {
  const router = useRouter();
  /** Toujours [] au 1er rendu (SSR = client) pour éviter les erreurs d’hydratation ; rempli après mount. */
  const [rows, setRows] = useState<TrameRow[]>([]);
  const [hasLoadedTrames, setHasLoadedTrames] = useState(false);

  useEffect(() => {
    setRows(loadTramesFromStorage());
    setHasLoadedTrames(true);
  }, []);

  function onDeleteRow(rowId: string) {
    setRows((current) => {
      const next = current.filter((row) => row.id !== rowId);
      window.localStorage.setItem("trames", JSON.stringify(next));
      return next;
    });
  }

  useEffect(() => {
    if (!hasLoadedTrames) return;
    if (!rows.length) {
      router.replace("/trames/decouvrir");
    }
  }, [rows, router, hasLoadedTrames]);

  return (
    <div className="trames-shell">
      <aside className="trames-sidebar" aria-label="Menu">
        <div className="trames-brand">
          <span className="trames-logo" aria-hidden />
          <span>osteopathes.pro</span>
        </div>

        <button className="trames-add-cabinet" type="button">
          Ajouter un cabinet
        </button>

        <nav className="trames-nav">
          {sidebarItems.map((item) => (
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

      <div className="trames-main">
        <header className="trames-topbar">
          <h1 className="trames-title">Trames</h1>
          <div className="trames-top-actions">
            <button className="trames-top-btn" type="button">
              Personnaliser
            </button>
            <Link className="trames-top-btn trames-top-btn-primary" href="/trames/nouvelle">
              <span className="trames-plus" aria-hidden>
                +
              </span>
              Nouvelle Trame
            </Link>
          </div>
        </header>

        <main className="trames-content">
          <section className="trames-tabs">
            <button className="trames-tab is-active" type="button">
              Mes trames
            </button>
            <button className="trames-tab" type="button">
              Trames de la communauté
            </button>
          </section>

          <section className="trames-workbench">
            <div className="trames-help">
              <h2>Essayez tout de suite vos trames</h2>
              <p>Appelez vos trames en écrivant:</p>
              <div className="newtrame-code">@</div>
              <p>Utilisez les flèches du clavier pour choisir une suggestion:</p>
              <div className="trames-shortcuts">
                <span>↑</span>
                <span>↓</span>
              </div>
              <p>Valider la suggestion avec la flèche avant, tab ou entrée:</p>
              <div className="trames-shortcuts">
                <span>→</span>
                <span>↹</span>
                <span>↵</span>
              </div>
              <small>Attention, rien n&apos;est enregistré dans cet éditeur.</small>
            </div>
            <div className="newtrame-editor">
              <RichTextEditor 
                value="" 
                onChange={() => {}} 
                placeholder="Commencez par écrire '@' pour tester vos trames..." 
              />
            </div>
          </section>

          <section className="trames-list">
            <table>
              <thead>
                <tr>
                  <th>Commande</th>
                  <th>Aperçu du contenu</th>
                  <th aria-label="Supprimer une trame" />
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.id}
                    className="trames-row"
                    onClick={() => router.push(`/trames/nouvelle?id=${encodeURIComponent(row.id)}`)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        router.push(`/trames/nouvelle?id=${encodeURIComponent(row.id)}`);
                      }
                    }}
                  >
                    <td>@{row.command || "—"}</td>
                    <td>
                      <TramePreview content={(row as any).content || ""} />
                    </td>
                    <td className="trames-delete-cell">
                      <button
                        type="button"
                        className="trames-delete-btn"
                        aria-label={`Supprimer la trame ${row.command || "sans titre"}`}
                        title="Supprimer"
                        onClick={(event) => {
                          event.stopPropagation();
                          onDeleteRow(row.id);
                        }}
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <div className="trames-back">
            <Link href="/fr">← Retour au site public</Link>
          </div>
        </main>
      </div>
    </div>
  );
}
