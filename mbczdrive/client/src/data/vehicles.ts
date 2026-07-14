export interface Vehicle {
  id: string;
  name: string;
  className: string;
  image: string;
  features: {
    icon: string;
    text: string;
  }[];
  description: string;
}

export const vehicles: Vehicle[] = [
  {
    id: "e-class",
    name: "Mercedes-Benz Classe E",
    className: "Classe E",
    image: "/class-e.JPG",
    features: [
      { icon: "users", text: "Capacité: 3 passagers" },
      { icon: "suitcase", text: "Bagages: 2 grandes valises" },
      { icon: "wifi", text: "WiFi et chargeurs à bord" },
      { icon: "snowflake", text: "Climatisation bi-zone" }
    ],
    description: "Idéal pour les déplacements d'affaires et les trajets urbains. Élégance et confort pour 3 passagers."
  },
  {
    id: "v-class",
    name: "Mercedes-Benz Classe V",
    className: "Classe V",
    image: "/class-v.jpg",
    features: [
      { icon: "users", text: "Capacité: 6-7 passagers" },
      { icon: "suitcase", text: "Bagages: 4-5 grandes valises" },
      { icon: "wifi", text: "WiFi, chargeurs et tablettes" },
      { icon: "glass-cheers", text: "Mini-bar et espace conférence" }
    ],
    description: "Parfait pour les groupes et familles. Espace généreux et aménagement modulable pour un confort optimal."
  },
  {
    id: "s-class",
    name: "Mercedes-Benz Classe S",
    className: "Classe S",
    image: "/class-s.JPG",
    features: [
      { icon: "users", text: "Capacité: 3 passagers" },
      { icon: "suitcase", text: "Bagages: 2 grandes valises" },
      { icon: "massage", text: "Sièges massants, climatisés" },
      { icon: "shield-alt", text: "Voyager en toute sérénité" }
    ],
    description: "L'ultime expérience de luxe automobile. Notre limousine phare pour les clients les plus exigeants."
  }
];
