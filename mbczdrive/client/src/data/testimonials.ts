export interface Testimonial {
  id: number;
  text: string;
  author: {
    name: string;
    title: string;
    initials: string;
  };
}

export const testimonials: Testimonial[] = [
  {
    id: 1,
    text: "Un service impeccable, ponctuel et professionnel. Le chauffeur était courtois et la Mercedes Classe S, un pur plaisir. Je recommande vivement pour les déplacements d'affaires.",
    author: {
      name: "Philippe Laurent",
      title: "Directeur Financier",
      initials: "PL"
    }
  },
  {
    id: 2,
    text: "Nous avons utilisé MBCZ Drive pour notre mariage. La Classe V était parfaite pour transporter toute la famille et le chauffeur a été d'une patience exemplaire. Un service 5 étoiles !",
    author: {
      name: "Sophie Dubois",
      title: "Jeune mariée",
      initials: "SD"
    }
  },
  {
    id: 3,
    text: "J'utilise régulièrement MBCZ Drive pour mes transferts aéroport. Jamais un retard, toujours un service irréprochable. La tranquillité d'esprit assurée.",
    author: {
      name: "Jean Moreau",
      title: "Entrepreneur",
      initials: "JM"
    }
  }
];
