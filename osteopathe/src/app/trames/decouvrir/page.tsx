import type { Metadata } from "next";
import Link from "next/link";
import type { TramesNavIconId } from "@/components/trames/trames-nav-icon";
import { TramesNavIcon } from "@/components/trames/trames-nav-icon";

export const metadata: Metadata = {
  title: "Trames | Demarrer",
};

const sidebarItems = [
  { label: "Tableau de bord", href: "#", icon: "dashboard" satisfies TramesNavIconId, active: false },
  { label: "Dossiers", href: "/dossiers", icon: "folders" satisfies TramesNavIconId, active: false },
  { label: "Notes d'honoraires", href: "#", icon: "invoices" satisfies TramesNavIconId, active: false },
  { label: "Stats", href: "#", icon: "stats" satisfies TramesNavIconId, active: false },
  { label: "Trames", href: "/trames", icon: "trames" satisfies TramesNavIconId, active: true },
  { label: "Calculer ses revenus", href: "#", icon: "revenue" satisfies TramesNavIconId, active: false },
] as const;

export default function TramesDecouvrirPage() {
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
              Créer ma première trame
            </Link>
          </div>
        </header>

        <main className="trames-content">
          <section className="trames-hero">
            <h2>Écrivez moins, notez plus</h2>
            <p>
              Les trames sont des raccourcis vous permettant d&apos;ajouter vos{" "}
              <span className="trames-link">@plans</span> de consultations, vos{" "}
              <span className="trames-link">@tests</span>, vos{" "}
              <span className="trames-link">@traitements</span>. Utilisable à n&apos;importe quel
              moment en fonction du patient et de vos besoins.
            </p>
            <div className="trames-hero-actions">
              <Link className="trames-cta trames-cta-primary" href="/trames/nouvelle">
                Créer ma première trame
              </Link>
              <a className="trames-cta" href="#">
                Prendre RDV pour une démo
              </a>
            </div>
            <p className="trames-hero-note">
              Totalement gratuit et disponible pour tous les membres, abonnés ou non.
            </p>
          </section>

          <section className="trames-callout">
            <div>
              <h3>Découvrez les trames des autres ostéopathes</h3>
              <p>
                Chaque trame peut être partagée avec les collègues. Découvrez les trames créées
                par notre communauté.
              </p>
            </div>
            <button className="trames-cta trames-cta-primary" type="button">
              Trames de la communauté
            </button>
          </section>
        </main>
      </div>
    </div>
  );
}
