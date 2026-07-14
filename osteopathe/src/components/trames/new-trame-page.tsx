"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { TramePreview } from "@/components/trame/trame-preview";
import { TramesNavIcon } from "@/components/trames/trames-nav-icon";

function estimateTimeGain(content: string) {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  if (!words) return null;
  const seconds = Math.min(90, Math.round(words * 0.45));
  return `${seconds}s`;
}

export function NewTramePage() {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [command, setCommand] = useState("");
  const [useInConsultations, setUseInConsultations] = useState(true);
  const [useInLetters, setUseInLetters] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const timeGain = useMemo(() => estimateTimeGain(content), [content]);
  const commandError = submitted && !command.trim();

  useEffect(() => {
    if (typeof window === "undefined") return;
    setEditingId(new URLSearchParams(window.location.search).get("id"));
  }, []);

  useEffect(() => {
    if (!editingId) return;
    const raw = window.localStorage.getItem("trames");
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as Array<{
        id?: string;
        name: string;
        description: string;
        content?: string;
        command: string;
        useInConsultations?: boolean;
        useInLetters?: boolean;
      }>;
      const found =
        parsed.find((item, index) => (item.id ?? `${item.command || "trame"}-${index}`) === editingId) ??
        null;
      if (!found) return;
      setName(found.name ?? "");
      setDescription(found.description ?? "");
      setContent(found.content ?? "");
      setCommand(found.command ?? "");
      setUseInConsultations(found.useInConsultations ?? true);
      setUseInLetters(found.useInLetters ?? false);
    } catch {
      // no-op
    }
  }, [editingId]);

  function onSave(event: FormEvent) {
    event.preventDefault();
    setSubmitted(true);
    if (!command.trim()) return;
    const newRow = {
      id: editingId ?? (typeof crypto !== "undefined" ? crypto.randomUUID() : `trame-${Date.now()}`),
      name: name.trim(),
      command: command.trim(),
      description: description.trim(),
      content: content.trim(),
      useInConsultations,
      useInLetters,
    };
    const raw = window.localStorage.getItem("trames");
    const existing = raw ? JSON.parse(raw) : [];
    const next = editingId
      ? existing.map((item: any) => (item.id === editingId ? newRow : item))
      : [newRow, ...existing];
    window.localStorage.setItem("trames", JSON.stringify(next));
    router.push("/trames");
  }

  return (
    <div className="trames-shell">
      <aside className="trames-sidebar">
        <div className="trames-brand">
          <div className="trames-logo" />
          <span>osteopathes.pro</span>
        </div>
        <button className="trames-add-cabinet">Ajouter un cabinet</button>
        <nav className="trames-nav">
          <Link href="/dashboard" className="trames-nav-item">
            <span className="trames-nav-icon"><TramesNavIcon id="dashboard" /></span>
            Tableau de bord
          </Link>
          <Link href="/dossiers" className="trames-nav-item">
            <span className="trames-nav-icon"><TramesNavIcon id="folders" /></span>
            Dossiers
          </Link>
          <Link href="/honoraires" className="trames-nav-item">
            <span className="trames-nav-icon"><TramesNavIcon id="invoices" /></span>
            Notes d&apos;honoraires
          </Link>
          <Link href="/stats" className="trames-nav-item">
            <span className="trames-nav-icon"><TramesNavIcon id="stats" /></span>
            Stats
          </Link>
          <Link href="/trames" className="trames-nav-item is-active">
            <span className="trames-nav-icon"><TramesNavIcon id="trames" /></span>
            Trames
          </Link>
          <Link href="/revenus" className="trames-nav-item">
            <span className="trames-nav-icon"><TramesNavIcon id="revenue" /></span>
            Calculer ses revenus
          </Link>
        </nav>
      </aside>

      <div className="trames-main">
        <header className="trames-topbar trames-topbar-new">
          <h1 className="trames-title-new">{editingId ? "Modifier la trame" : "Nouvelle Trame"}</h1>
          <button className="trames-save" type="submit" form="new-trame-form">
            <span className="trames-save-icon" />
            Enregistrer les modifications
          </button>
        </header>

        <main className="trames-content trames-content-new">
          <form id="new-trame-form" onSubmit={onSave} className="newtrame-grid">
            
            {/* Section 1: Temps gagné */}
            <section className="newtrame-row">
              <div className="newtrame-left">
                <h2>Temps gagné grâce à votre trame</h2>
                <p>La trame vous évite d&apos;écrire du texte répétitif. Faites des trames pour les motifs de consultations, les examens cliniques, les traitements, les conseils, etc.</p>
              </div>
              <div className="newtrame-right">
                <div className="newtrame-panel newtrame-panel-slim">
                  <div className="newtrame-panel-hint">
                    {timeGain ? "Gain de temps estimé :" : "Ecrivez du contenu pour voir le gain de temps estimé."}
                  </div>
                  {timeGain && (
                    <div className="newtrame-metric">
                      <span>TEMPS GAGNÉ</span>
                      <strong>{timeGain}</strong>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Section 2: Nom et description */}
            <section className="newtrame-row">
              <div className="newtrame-left">
                <h2>Nom et description de votre trame</h2>
                <p>Soyez libre de noter le processus de création de votre trame.</p>
              </div>
              <div className="newtrame-right">
                <div className="newtrame-panel">
                  <div className="newtrame-field">
                    <label className="newtrame-label">Nom</label>
                    <input 
                      className="newtrame-input" 
                      placeholder="ex: 1er RDV"
                      value={name}
                      onChange={e => setName(e.target.value)}
                    />
                  </div>
                  <div className="newtrame-field" style={{ marginTop: "1rem" }}>
                    <label className="newtrame-label">Description</label>
                    <textarea 
                      className="newtrame-textarea" 
                      placeholder="ex: Trame à utiliser pour un patient venant pour la 1ère fois. Contient le motif, les antécédents..."
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Section 3: Contenu */}
            <section className="newtrame-row">
              <div className="newtrame-left">
                <h2>Contenu de votre trame</h2>
                <p>Une trame vous permet de structurer vos notes. Notez ici le détail de votre trame avec la mise en forme souhaitée.</p>
              </div>
              <div className="newtrame-right">
                <div className="newtrame-editor">
                  <div className="newtrame-toolbar">
                    <button type="button" className="toolbar-btn" title="Défaire">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" /></svg>
                    </button>
                    <div className="sep" />
                    <button type="button" className="toolbar-btn" title="Gras"><strong>B</strong></button>
                    <button type="button" className="toolbar-btn italic" title="Italique">I</button>
                    <button type="button" className="toolbar-btn underline" title="Souligné">U</button>
                    <div className="sep" />
                    <button type="button" className="toolbar-btn" title="Titre 1">H1</button>
                    <button type="button" className="toolbar-btn" title="Titre 2">H2</button>
                    <div className="sep" />
                    <button type="button" className="toolbar-btn" title="Liste numérotée">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65"><path strokeLinecap="round" d="M10 6h10M10 12h10M10 18h10" /><path strokeLinecap="round" d="M4 7V5M4 13v-2M4 19v-2" /></svg>
                    </button>
                    <button type="button" className="toolbar-btn" title="Liste à puces">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65"><path strokeLinecap="round" d="M9 6h12M9 12h12M9 18h12" /><path strokeLinecap="round" d="M4 6h.01M4 12h.01M4 18h.01" /></svg>
                    </button>
                    <div className="sep" />
                    <button type="button" className="toolbar-btn" title="Aligner à gauche">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65"><path strokeLinecap="round" d="M4 6h16M4 12h10M4 18h14" /></svg>
                    </button>
                    <button type="button" className="toolbar-btn" title="Centrer">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65"><path strokeLinecap="round" d="M4 6h16M7 12h10M5 18h14" /></svg>
                    </button>
                    <button type="button" className="toolbar-btn" title="Aligner à droite">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65"><path strokeLinecap="round" d="M4 6h16M10 12h10M6 18h14" /></svg>
                    </button>
                    <div className="sep" />
                    <button type="button" className="toolbar-btn" title="Épingler">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65"><path strokeLinecap="round" strokeLinejoin="round" d="M12 17v5" /><path strokeLinecap="round" strokeLinejoin="round" d="M9 9h6l-1 8h-4L9 9Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M10 9V5.5a2 2 0 0 1 4 0V9" /></svg>
                    </button>
                    <button type="button" className="toolbar-btn" title="Important">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65"><path strokeLinecap="round" strokeLinejoin="round" d="M12 17v5" /><path strokeLinecap="round" strokeLinejoin="round" d="M9 9h6l-1 8h-4L9 9Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M10 9V5.5a2 2 0 0 1 4 0V9" /><path strokeLinecap="round" d="M12 4.2v2.2" /><circle cx="12" cy="7.4" r="0.55" fill="currentColor" stroke="none" /></svg>
                    </button>
                    <div className="sep" />
                    <button type="button" className="toolbar-btn" title="Bulle">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65"><path strokeLinecap="round" strokeLinejoin="round" d="M8 5h8a3 3 0 0 1 3 3v5a3 3 0 0 1-3 3h-3l-3 2.5V16H8a3 3 0 0 1-3-3V8a3 3 0 0 1 8-3z" /><path strokeLinecap="round" d="M9 9h6M9 12h4" /></svg>
                    </button>
                    <button type="button" className="toolbar-btn" title="Effacer mise en forme">Tx</button>
                  </div>
                  <textarea 
                    className="newtrame-editor-area" 
                    placeholder="ex: Motif: Antécédents:"
                    value={content}
                    onChange={e => setContent(e.target.value)}
                  />
                </div>
                <div style={{ marginTop: "1rem" }}>
                  <label className="newtrame-label">Prévisualisation des bulles</label>
                  <TramePreview content={content} />
                </div>
              </div>
            </section>

            {/* Section 4: Comment invoquer */}
            <section className="newtrame-row">
              <div className="newtrame-left">
                <h2>Comment invoquer votre trame dans le dossier ?</h2>
                <p>Une fois dans votre dossier, vous pourrez insérer votre trame en écrivant la syntaxe suivante :</p>
                <div className="newtrame-code">@&apos;commande&apos;</div>
                <p className="newtrame-muted">Si votre commande est &quot;1rdv&quot;, cela donne @1rdv.</p>
              </div>
              <div className="newtrame-right">
                <div className="newtrame-panel">
                  <label className="newtrame-label">Commande</label>
                  <input 
                    className={`newtrame-input ${commandError ? "is-error" : ""}`}
                    placeholder="ex: 1rdv"
                    value={command}
                    onChange={e => setCommand(e.target.value)}
                  />
                  {commandError && <p className="newtrame-error">Ce champ est requis.</p>}
                  
                  <div style={{ marginTop: "1rem" }}>
                    <p className="newtrame-label">Dans votre cas il vous faudra écrire :</p>
                    <div className="newtrame-command-pill">
                      <span className="at-icon">@</span>
                      {command || "..."}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 5: Contexte d'utilisation */}
            <section className="newtrame-row">
              <div className="newtrame-left">
                <h2>Contexte d&apos;utilisation de la trame</h2>
                <p>Pour vos consultations, pour les courriers ou les deux ?</p>
              </div>
              <div className="newtrame-right">
                <div className="newtrame-panel" style={{ display: "grid", gap: "0.5rem" }}>
                  <label className="newtrame-check">
                    <input type="checkbox" checked={useInConsultations} onChange={e => setUseInConsultations(e.target.checked)} />
                    Utiliser cette trame dans les consultations
                  </label>
                  <label className="newtrame-check">
                    <input type="checkbox" checked={useInLetters} onChange={e => setUseInLetters(e.target.checked)} />
                    Utiliser cette trame dans les courriers
                  </label>
                </div>
              </div>
            </section>

            <div className="newtrame-back">
              <Link href="/trames">← Retour aux trames</Link>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}

