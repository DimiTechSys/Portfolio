import "./App.css";

function App() {
  return (
    <div className="container">

      {/* PAGE DE COUVERTURE */}
      <header className="cover">
        <h1>Portfolio – Futur Ingénieur en Robotique</h1>
        <h2>Dimitri Voissier</h2>
        <p className="date">Réalisé en Décembre 2025</p>
        <blockquote>
          « Concevoir, programmer, innover : cap vers l’ingénierie robotique »
        </blockquote>
      </header>

      {/* TABLE DES MATIÈRES */}
      <section id="toc">
        <h2>Table des matières</h2>
        <ol>
          <li><a href="#introduction">Introduction</a></li>
          <li><a href="#projects">Projets et réalisations</a></li>
          <li><a href="#conclusion">Conclusion et perspectives</a></li>
          <li><a href="#contact">Contact</a></li>
        </ol>
      </section>

      {/* INTRODUCTION */}
      <section id="introduction">
        <h2>Introduction</h2>
        <p>
          Étudiant en 4A à l’ESIEA, je me spécialise dans les systèmes embarqués,
          autonomes et la robotique. À travers mes projets académiques et
          personnels, j’ai développé une approche concrète de l’ingénierie,
          alliant programmation, électronique et résolution de problèmes.
          Ce portfolio a pour objectif de présenter mes réalisations techniques
          et de mettre en avant ma motivation à devenir ingénieur en robotique.
        </p>
      </section>

      {/* PROJETS */}
      <section id="projects">
        <h2>Projets et travaux réalisés</h2>

        <article className="project">
          <h3>Prototype de camion de pompier – Raspberry Pi</h3>
          <p><strong>Contexte :</strong> Projet fil rouge académique.</p>
          <p><strong>Objectifs :</strong> Concevoir un robot capable de se déplacer,
            d’interagir avec son environnement et d’être contrôlé à distance.</p>
          <p><strong>Processus :</strong> Programmation du Raspberry Pi, contrôle des
            moteurs, intégration de capteurs et mise en place d’une communication
            à distance.</p>
          <p><strong>Résultats :</strong> Prototype fonctionnel, amélioration du
            travail en équipe et du débogage en temps réel.</p>
        </article>

        <article className="project">
          <h3>Système de maison intelligente – Arduino</h3>
          <p><strong>Contexte :</strong> Projet orienté domotique et IoT.</p>
          <p><strong>Objectifs :</strong> Automatiser l’éclairage et surveiller
            l’environnement domestique.</p>
          <p><strong>Processus :</strong> Collecte de données capteurs, programmation
            Arduino, communication entre modules.</p>
          <p><strong>Résultats :</strong> Système fiable intégrant automatisation et
            sécurité.</p>
        </article>

        <article className="project">
          <h3>Casier intelligent connecté – ESP32 & Application Web</h3>
          <p><strong>Contexte :</strong> Projet mêlant embarqué et développement web.</p>
          <p><strong>Objectifs :</strong> Créer un système sécurisé connecté à une
            interface web.</p>
          <p><strong>Processus :</strong> Programmation ESP32, gestion des communications
            sans fil, développement front-end et back-end.</p>
          <p><strong>Résultats :</strong> Casier fonctionnel avec API embarquée et
            interface utilisateur complète.</p>
        </article>
      </section>

      {/* CONCLUSION */}
      <section id="conclusion">
        <h2>Conclusion et perspectives</h2>

        <h3>Compétences humaines développées</h3>
        <ul>
          <li>Travail en équipe</li>
          <li>Capacité d’adaptation</li>
          <li>Résolution de problèmes</li>
        </ul>

        <h3>Projection professionnelle</h3>
        <p>
          Je souhaite devenir un ingénieur en robotique capable de concevoir des
          systèmes intelligents, fiables et utiles, en combinant innovation
          technologique, rigueur scientifique et travail collaboratif.
        </p>
      </section>

      {/* CONTACT */}
      <section id="contact">
        <h2>Contact</h2>
        <p>Email : dimitri.voissier@gmail.com</p>
        <p>GitLab : https://gitlab.esiea.fr/Shoot2Poney</p>
      </section>

    </div>
  );
}

export default App;