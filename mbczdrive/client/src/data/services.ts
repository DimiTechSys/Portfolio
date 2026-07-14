export interface Service {
  id: string;
  title: string;
  description: string;
  image: string;
}

export const services: Service[] = [
  {
    id: "airport",
    title: "Transferts aéroport/gare",
    description: "Arrivées et départs sans stress avec notre service ponctuel de transfert aéroport. Votre chauffeur vous attendra avec une plaque nominative.",
    image: "https://imagedelivery.net/IwZOeeGEmDj8EVSTRphTwA/www.transfeero.com/2023/10/new_promo_4.jpg/dpr=2,w=650,fit=crop"
  },
  {
    id: "event",
    title: "Événements spéciaux",
    description: "Mariages, galas, soirées - arrivez avec style et élégance. Nos chauffeurs en costume assurent une expérience mémorable.",
    image: "https://images.unsplash.com/photo-1469371670807-013ccf25f16a?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80"
  },
  {
    id: "business",
    title: "Services d'affaires",
    description: "Transport professionnel pour vos rendez-vous d'affaires. WiFi, eau minérale et presse du jour disponibles à bord.",
    image: "https://local-fr-public.s3.eu-west-3.amazonaws.com/prod/webtool/userfiles/37708/mise-a-disposition/mise-a-disposition2.jpeg"
  },
  {
    id: "tour",
    title: "Tours privés",
    description: "Découvrez la ville avec un tour personnalisé et un chauffeur connaissant parfaitement la région et ses points d'intérêt.",
    image: "/private-tour.JPG"
  }
];
