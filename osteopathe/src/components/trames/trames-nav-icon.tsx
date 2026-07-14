export type TramesNavIconId =
  | "dashboard"
  | "folders"
  | "invoices"
  | "stats"
  | "trames"
  | "revenue"
  | "settings";

const common = {
  xmlns: "http://www.w3.org/2000/svg",
  width: 18,
  height: 18,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.65,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

/** Petites icônes linéaires pour le menu latéral (style proche du produit). */
export function TramesNavIcon({ id }: { id: TramesNavIconId }) {
  switch (id) {
    case "dashboard":
      return (
        <svg {...common} aria-hidden>
          <path d="M4 11.5 12 5.5l8 6V19a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-7.5Z" />
        </svg>
      );
    case "folders":
      return (
        <svg {...common} aria-hidden>
          <path d="M3 8a2 2 0 0 1 2-2h3l2 2h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8Z" />
        </svg>
      );
    case "invoices":
      return (
        <svg {...common} aria-hidden>
          <path d="M8 3h5l4 4v14a1 1 0 0 1-1 1H8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
          <path d="M12 3v4h4" />
          <path d="M9 13h6M9 17h4" />
        </svg>
      );
    case "stats":
      return (
        <svg {...common} aria-hidden>
          <path d="M4 20V10M12 20V4M20 20v-6" />
        </svg>
      );
    case "trames":
      return (
        <svg {...common} aria-hidden>
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
      );
    case "revenue":
      return (
        <svg {...common} aria-hidden>
          <rect x="4" y="3" width="16" height="18" rx="2" />
          <path d="M8 7h8M8 11h5M8 15h7" />
        </svg>
      );
    case "settings":
      return (
        <svg {...common} aria-hidden>
          <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c0 .66.39 1.26 1 1.51H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
        </svg>
      );
    default:
      return null;
  }
}
