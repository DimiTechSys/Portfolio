import Link from "next/link";
import { Section } from "@/components/ui/section";

const testimonials = [
  {
    quote:
      "Un contenu d'excellente qualité, des outils simples et efficaces, et une équipe très réactive.",
    author: "Corentin C. - Ostéopathe",
  },
  {
    quote:
      "Les trames permettent de gagner du temps pendant les consultations. Interface agréable et facturation efficace.",
    author: "Laurent M. - Ostéopathe",
  },
  {
    quote:
      "Ultra simple et malin. La nouvelle fonctionnalité pour remplir rapidement le bilan est excellente.",
    author: "@OmneKine - Kinésithérapeute",
  },
];

/** Libellés alignés sur la page d’accueil officielle (section ressources / outils). */
const flagshipTools = [
  {
    kicker: "logiciel ostéo, prise de notes et suivi",
    title: "Logiciel clinique",
    description:
      "Vos dossiers patients, raccourcis et suivi de consultation pour gagner du temps au cabinet.",
    className: "tool-clinic",
  },
  {
    kicker: "exemple de fiche ou dossier patient en ostéopathie",
    title: "Logiciel patient",
    description:
      "Logiciel de gestion des fiches patients personnalisable à votre pratique clinique.",
    className: "tool-patient",
  },
  {
    kicker: "facture d'ostéopathie en PDF",
    title: "Facturation",
    description:
      "Vos factures d'ostéopathie en PDF aux normes en quelques clics à envoyer par email.",
    className: "tool-billing",
  },
  {
    kicker: "exemple de raccourcis prise de notes de consultation en ostéopathie",
    title: "Trames",
    description:
      "Jetez un œil à la pratique clinique de vos collègues ostéos.",
    className: "tool-templates",
    href: "/trames",
  },
] as const;

export function FrHomePage() {
  return (
    <div className="fr-page">
      <header className="site-header">
        <div className="fr-container header-row">
          <div className="brand">osteopathes.pro</div>
          <nav className="top-nav" aria-label="Navigation principale">
            <a href="#">Logiciel clinique</a>
            <a href="#">Carte des ostéos</a>
            <a href="#">BDs</a>
            <a href="#">Tarifs</a>
            <a href="#">Blog</a>
            <Link href="/trames">Trames</Link>
          </nav>
          <div className="header-actions">
            <Link href="/inscription">Inscription</Link>
            <a href="/inscription">Connexion</a>
          </div>
        </div>
      </header>

      <Section className="hero">
        <p className="eyebrow">Engagés pour l&apos;ostéopathie</p>
        <h1>Écrivez moins notez plus</h1>
        <p className="lead">
          Vos dossiers patients sans effort grâce à notre système de prise de
          notes intelligent.
        </p>
        <div className="hero-cta">
          <a className="btn btn-primary" href="#">
            Découvrir gratuitement
          </a>
          <a className="btn btn-ghost" href="#">
            Plus d&apos;infos
          </a>
        </div>
        <p className="social-proof">Plus de 5 000 ostéos déjà inscrit·e·s</p>
        <div className="video-placeholder" aria-hidden>
          Démonstration vidéo
        </div>
      </Section>

      <Section className="testimonials">
        <div className="section-title">
          <h2>Ils en parlent le mieux</h2>
        </div>
        <div className="cards-grid">
          {testimonials.map((item) => (
            <article key={item.author} className="card testimonial-card">
              <p>{item.quote}</p>
              <span>{item.author}</span>
            </article>
          ))}
        </div>
      </Section>

      <Section className="flagship-tools">
        <div className="section-title flagship-heading">
          <p className="eyebrow">Ce qui fait la différence au quotidien</p>
          <h2>Les outils essentiels pour la clinique et l&apos;administratif</h2>
          <p className="flagship-lede">
            Logiciel clinique, dossier patient, facturation conforme et trames : le socle
            pour couvrir le cabinet et l&apos;administratif.
          </p>
        </div>
        <div className="tool-showcase-grid">
          {flagshipTools.map((tool, index) => (
            <article
              key={tool.title}
              className={`tool-card ${tool.className} ${index === 3 ? "tool-card-wide" : ""}`}
            >
              <div className="tool-card-overlay">
                <p className="tool-kicker">{tool.kicker}</p>
                <h3>{tool.title}</h3>
                <p>{tool.description}</p>
              </div>
              {"href" in tool && tool.href ? (
                <Link className="tool-card-link" href={tool.href}>
                  Ouvrir
                </Link>
              ) : null}
              <button className="tool-nav tool-nav-left" aria-label={`Voir ${tool.title}`}>
                ‹
              </button>
              <button className="tool-nav tool-nav-right" aria-label={`Voir ${tool.title}`}>
                ›
              </button>
            </article>
          ))}
        </div>
      </Section>

      <Section className="story">
        <h2>On veut se concentrer à 100% sur nos patient·e·s</h2>
        <p>
          Depuis 2012, l&apos;objectif est de proposer un logiciel qui s&apos;adapte à
          chaque pratique pour simplifier la clinique et le quotidien.
        </p>
        <div className="story-authors">
          <div className="author-chip">Klemen SEVER</div>
          <div className="author-chip">Konrad FLORKOW</div>
        </div>
      </Section>

      <Section className="features">
        <h2>Ne partez plus d&apos;une page blanche, prévoyez vos consultations</h2>
        <div className="cards-grid feature-grid">
          <article className="card">Des raccourcis personnalisables</article>
          <article className="card">Plus besoin de clavier</article>
          <article className="card">Le suivi en un coup d&apos;œil</article>
        </div>
      </Section>

      <Section className="services">
        <h2>Bien plus qu&apos;un logiciel</h2>
        <p>
          Le quotidien de l&apos;ostéo ne se limite pas à la clinique: administratif,
          comptabilité, pilotage de l&apos;activité et accompagnement.
        </p>
        <div className="cards-grid service-grid">
          <article className="card">Aide administrative</article>
          <article className="card">Installation</article>
          <article className="card">Économisez sur vos frais</article>
          <article className="card">Améliorez votre prise en charge</article>
        </div>
      </Section>

      <Section className="final-cta">
        <h2>Que préférez-vous ?</h2>
        <p>Découvrez par vous-même en créant un compte ou prenez RDV.</p>
        <div className="hero-cta">
          <a className="btn btn-primary" href="#">
            Demander une démo
          </a>
          <Link className="btn btn-ghost" href="/inscription">
            Créer un compte gratuit
          </Link>
        </div>
      </Section>

      <footer className="site-footer">
        <div className="fr-container footer-grid">
          <div>
            <div className="brand">osteopathes.pro</div>
            <p>Developpe avec passion par deux osteos.</p>
          </div>
          <div>
            <h3>A Propos</h3>
            <ul>
              <li>
                <a href="#">L&apos;equipe</a>
              </li>
              <li>
                <a href="#">Transparence</a>
              </li>
              <li>
                <a href="#">Contactez nous</a>
              </li>
            </ul>
          </div>
          <div>
            <h3>Legal</h3>
            <ul>
              <li>
                <a href="#">Mentions legales</a>
              </li>
              <li>
                <a href="#">Confidentialite</a>
              </li>
              <li>
                <a href="#">Politique cookies</a>
              </li>
            </ul>
          </div>
          <div>
            <h3>Votre cabinet</h3>
            <ul>
              <li>
                <a href="#">Dossiers patients</a>
              </li>
              <li>
                <a href="#">Votre site web</a>
              </li>
              <li>
                <Link href="/fr">Retour en haut</Link>
              </li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}
