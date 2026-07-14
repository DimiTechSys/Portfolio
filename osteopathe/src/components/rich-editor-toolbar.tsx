import type { MouseEvent, ReactNode } from "react";

export type RichEditorToolbarProps = {
  /**
   * Mode bulle : premier clic insère une bulle et active le mode (bouton enfoncé) ;
   * second clic désactive le mode pour continuer en texte normal.
   */
  bubbleModeActive?: boolean;
  onBubbleModeToggle?: () => void;
  /** Finalise : ne garde que les bulles conservées et le texte choisi. */
  onBroomFinalize?: () => void;
  broomActive?: boolean;
  onClearFormatting?: () => void;
};

/**
 * Barre d’outils : la plupart des actions sont décoratives sauf
 * « bulle » et « balai » lorsque les callbacks sont fournis.
 */
export function RichEditorToolbar({
  bubbleModeActive = false,
  onBubbleModeToggle,
  onBroomFinalize,
  broomActive = false,
  onClearFormatting,
}: RichEditorToolbarProps = {}) {
  const noop = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
  };
  const btn = (title: string, children: ReactNode, onClick?: () => void) => (
    <button
      type="button"
      className="dossiers-consult-tb-btn"
      title={title}
      onClick={
        onClick
          ? (e) => {
              e.preventDefault();
              onClick();
            }
          : noop
      }
    >
      {children}
    </button>
  );
  return (
    <div className="dossiers-consult-toolbar" role="toolbar" aria-label="Mise en forme et bulles">
      {btn(
        "Défaire",
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.65"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <polyline points="1 4 1 10 7 10" />
          <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
        </svg>,
      )}
      {btn(
        "Gras",
        <span className="dossiers-consult-tb-text" aria-hidden>
          B
        </span>,
      )}
      {btn(
        "Italique",
        <span className="dossiers-consult-tb-text dossiers-consult-tb-italic" aria-hidden>
          I
        </span>,
      )}
      {btn(
        "Souligné",
        <span className="dossiers-consult-tb-text dossiers-consult-tb-under" aria-hidden>
          U
        </span>,
      )}
      {btn(
        "Titre 1",
        <span className="dossiers-consult-tb-text dossiers-consult-tb-h-sub" aria-hidden>
          H<span className="dossiers-consult-tb-sub">1</span>
        </span>,
      )}
      {btn(
        "Titre 2",
        <span className="dossiers-consult-tb-text dossiers-consult-tb-h-sub" aria-hidden>
          H<span className="dossiers-consult-tb-sub">2</span>
        </span>,
      )}
      {btn(
        "Liste numérotée",
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" aria-hidden>
          <path strokeLinecap="round" d="M10 6h10M10 12h10M10 18h10" />
          <path strokeLinecap="round" d="M4 7V5M4 13v-2M4 19v-2" />
        </svg>,
      )}
      {btn(
        "Liste à puces",
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" aria-hidden>
          <path strokeLinecap="round" d="M9 6h12M9 12h12M9 18h12" />
          <path strokeLinecap="round" d="M4 6h.01M4 12h.01M4 18h.01" />
        </svg>,
      )}
      {btn(
        "Aligner à gauche",
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" aria-hidden>
          <path strokeLinecap="round" d="M4 6h16M4 12h10M4 18h14" />
        </svg>,
      )}
      {btn(
        "Centrer",
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" aria-hidden>
          <path strokeLinecap="round" d="M4 6h16M7 12h10M5 18h14" />
        </svg>,
      )}
      {btn(
        "Aligner à droite",
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" aria-hidden>
          <path strokeLinecap="round" d="M4 6h16M10 12h10M6 18h14" />
        </svg>,
      )}
      {btn(
        "Épingler",
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 17v5" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 9h6l-1 8h-4L9 9Z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 9V5.5a2 2 0 0 1 4 0V9" />
        </svg>,
      )}
      {btn(
        "Marquer comme important",
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 17v5" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 9h6l-1 8h-4L9 9Z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 9V5.5a2 2 0 0 1 4 0V9" />
          <path strokeLinecap="round" d="M12 4.2v2.2" />
          <circle cx="12" cy="7.4" r="0.55" fill="currentColor" stroke="none" />
        </svg>,
      )}
      {btn(
        "Insérer une image",
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" aria-hidden>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path strokeLinecap="round" strokeLinejoin="round" d="m8 13 3-3 3 4 3-5 4 6" />
        </svg>,
      )}
      {onBubbleModeToggle ? (
        <button
          type="button"
          className="dossiers-consult-tb-btn dossiers-consult-tb-btn--bubble-mode"
          aria-pressed={bubbleModeActive}
          title={
            bubbleModeActive
              ? "Désactiver le mode bulle : la suite s’écrira en texte normal"
              : "Activer le mode bulle : insère une option et reste actif tant que vous la remplissez (cliquez à nouveau pour le texte normal)"
          }
          onClick={(e) => {
            e.preventDefault();
            onBubbleModeToggle();
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" aria-hidden>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8 5h8a3 3 0 0 1 3 3v5a3 3 0 0 1-3 3h-3l-3 2.5V16H8a3 3 0 0 1-3-3V8a3 3 0 0 1 3-3z"
            />
            <path strokeLinecap="round" d="M9 9h6M9 12h4" />
          </svg>
        </button>
      ) : (
        btn(
          "Insérer une bulle d’option (saisir le texte dedans)",
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" aria-hidden>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8 5h8a3 3 0 0 1 3 3v5a3 3 0 0 1-3 3h-3l-3 2.5V16H8a3 3 0 0 1-3-3V8a3 3 0 0 1 3-3z"
            />
            <path strokeLinecap="round" d="M9 9h6M9 12h4" />
          </svg>,
          undefined,
        )
      )}
      {btn(
        "Effacer la mise en forme",
        <span className="dossiers-consult-tb-clear" aria-hidden>
          <span className="dossiers-consult-tb-clear-t">T</span>
          <span className="dossiers-consult-tb-clear-x">x</span>
        </span>,
        onClearFormatting,
      )}
      {onBroomFinalize && (
        <button
          type="button"
          className={`dossiers-consult-tb-btn ${broomActive ? "is-broom-active" : "is-disabled"}`}
          title="Finaliser avec le balai"
          onClick={(e) => {
            e.preventDefault();
            if (broomActive) onBroomFinalize();
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 20 9 15" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 11 3 9l6-6 4 4-6 6-2-2Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="m14 5 5 5" />
          </svg>
        </button>
      )}
    </div>
  );
}
