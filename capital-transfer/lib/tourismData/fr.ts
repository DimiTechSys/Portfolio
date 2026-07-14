import { TourismExperience } from '../tourismDataTypes';

export const fr: Record<string, TourismExperience> = {
  'families': {
    id: 'families',
    image: '/images/tourism/families-1.png',
    badge: 'Famille',
    title: 'Visites Privées de Paris en Famille',
    subtitle: 'Nous créons des expériences inoubliables pour les familles, riches en découvertes, en joie et en émerveillement.',
    description: 'Paris en Famille : Nous proposons une multitude d\'activités ludiques et de visites privées pour les familles avec enfants. Nous concevons une visite personnalisée pour faire le bonheur de chacun, en toute sérénité. Vivez un voyage sur-mesure organisé par une agence locale. Dès votre arrivée, Paris vous captivera — non seulement par ses monuments emblématiques, mais par son esprit, son charme et sa beauté. Avec nous, votre famille ne fera pas que visiter Paris, vous vous y connecterez véritablement.',
    sections: [
      {
        title: 'Des Visites Sur-Mesure pour les Familles',
        content: 'Chaque famille est unique, chaque visite l\'est tout autant. Nous adaptons votre itinéraire en fonction de l\'âge, des intérêts et du rythme de vos enfants, pour que chaque journée soit passionnante, équilibrée et joyeuse pour tous. Qu\'il s\'agisse de la première fois que votre enfant voit la Tour Eiffel, de l\'exploration d\'un jardin secret ou d\'une dégustation de pâtisseries lors d\'un tour culinaire, nous veillons à ce que la magie opère.',
        image: '/images/tourism/families-1.png'
      },
      {
        title: 'Au-delà des Circuits Classiques',
        content: 'Monter à la Tour Eiffel — ce n\'est que le début. Paris mérite mieux qu\'un coup d\'œil rapide, et votre famille mérite mieux qu\'une visite standard. Grâce à nos visites guidées privées et nos activités familiales, vous explorerez la ville comme de vrais Parisiens, accompagnés de guides passionnés qui savent captiver aussi bien les enfants que les adultes.',
        image: '/images/tourism/families-eiffel.png'
      },
      {
        title: 'Explorez le Meilleur de Paris — Ensemble',
        content: 'Des trésors du Louvre à l\'art fantaisiste de Montmartre, de la splendeur de Versailles aux joyaux cachés connus seuls des locaux, chaque étape de votre voyage est minutieusement planifiée et livrée avec joie.',
        list: [
          'La Tour Eiffel et la Seine',
          'Le Louvre et le Musée d’Orsay expliqués aux enfants',
          'Notre-Dame et les aventures du Quartier Latin',
          'Montmartre et le Sacré-Cœur',
          'Journée d\'excursion en famille à Versailles',
          'Ateliers culturels interactifs et cuisine kid-friendly'
        ],
        image: '/images/tourism/versailles-hall.png'
      },
      {
        title: 'Activités et Attractions Kid-Friendly',
        content: 'Vous voyagez à Paris en famille ? Rassurez-vous, la ville regorge d\'activités. Des musées interactifs aux balades en bateau sur le Canal de l’Ourcq, il y a de quoi émerveiller chaque jeune explorateur.',
        list: [
          'Zoos, aquariums et parcs d\'attractions',
          'Forêts immenses et jardins avec aires de jeux',
          'Parcs à thème comme Disneyland Paris',
          'Musées d\'art, de sciences et d\'histoire avec des parcours dédiés',
          'Restaurants, cafés et boutiques adaptés aux enfants'
        ]
      },
      {
        title: 'Prêts à Planifier votre Aventure Familiale ?',
        content: 'Vos vacances à Paris en famille sont bien plus qu\'un voyage — c\'est la célébration de votre temps passé ensemble dans l\'une des plus belles villes du monde. Laissez-nous organiser votre itinéraire pour que vous puissiez profiter de chaque instant. Nous gérons la logistique, les billets et le rythme pour que vous puissiez simplement être présents et créer des souvenirs impérissables.'
      }
    ],
    highlights: ['Guides experts pédagogues', 'Billets coupe-file', 'Rythme flexible', 'Sièges auto inclus', 'Itinéraires 100% personnalisés'],
    price: 0,
    pricingOptions: [
      { name: 'Visite à pied en famille de 3 heures', price: 'dès 450 €' },
      { name: 'Visite en voiture en famille de 4 heures', price: 'dès 950 €' },
      { name: 'Forfait Famille Journée Complète (8h)', price: 'dès 1 600 €' }
    ]
  },
  'private-tour': {
    id: 'private-tour',
    image: '/images/tourism/private-tour.png',
    badge: 'Signature',
    title: 'Tour Privé Guidé de Paris Sur-Mesure',
    subtitle: 'Découvrez l\'âme de la Ville Lumière avec un guide expert dédié.',
    description: 'Vivez une immersion totale dans l\'histoire et la culture parisienne. Loin des circuits touristiques classiques, nos guides licenciés vous dévoilent les secrets les mieux gardés de la capitale, des grands monuments aux ruelles dérobées. Votre tour privé est entièrement personnalisable, conçu autour de vos intérêts uniques pour vous offrir une connexion authentique et profonde avec Paris.',
    sections: [
      {
        title: 'Un Voyage Sur-Mesure',
        content: 'Aucun voyageur ne se ressemble, c\'est pourquoi nous refusons les itinéraires préconçus. Nous personnalisons votre visite selon vos passions — qu\'il s\'agisse d\'art, d\'histoire, de mode ou d\'architecture — garantissant un moment enchanteur et un rythme parfait.',
        image: '/louvre.jpg'
      },
      {
        title: 'Au-delà des Incontournables',
        content: 'Bien que nous vous fassions découvrir les monuments emblématiques, nous vous emmenons également hors des sentiers battus. Découvrez le Paris authentique aux côtés de locaux passionnés qui connaissent l\'histoire derrière chaque pierre et les légendes de chaque coin de rue.',
        image: '/guide-prive.jpg'
      },
      {
        title: 'Les Trésors de la Capitale',
        content: 'Découvrez les icônes de Paris sous un jour complètement nouveau, guidé par de véritables experts.',
        list: [
          'Le Louvre et ses chefs-d\'œuvre en toute sérénité',
          'La majestueuse cathédrale Notre-Dame et son île',
          'Le Quartier Latin et ses mystères médiévaux cachés',
          'Montmartre, le Sacré-Cœur et le village des artistes',
          'Croisière privée sur la Seine avec champagne'
        ],
        image: '/images/tourism/inside-louvre.jpg'
      },
      {
        title: 'Logistique Sans Faille',
        content: 'Oubliez la navigation, l\'achat de billets et les files d\'attente interminables. Nous nous occupons de chaque détail, de votre prise en charge à l\'hôtel à l\'accès prioritaire aux monuments. Votre seul travail : profiter de la beauté de Paris.'
      }
    ],
    highlights: ['Guide licencié expert', 'Accès coupe-file', 'Itinéraire entièrement flexible', 'Prise en charge à l\'hôtel', 'Recommandations personnalisées'],
    price: 0,
    pricingOptions: [
      { name: 'Visite privée à pied de 3 heures', price: 'dès 360 €' },
      { name: 'Visite privée en voiture de 4 heures', price: 'dès 950 €' },
      { name: '3h à pied + 2h au Louvre', price: 'dès 850 €' },
      { name: '4h en voiture + 2h au Louvre', price: 'dès 1450 €' },
      { name: 'Excursion d\'une journée à Versailles', price: 'dès 1 250 €' },
      { name: 'Excursion d\'une journée en Normandie', price: 'dès 1 650 €' },
      { name: 'Excursion d\'une journée en Champagne', price: 'dès 1 650 €' }
    ]
  },
  'car-tour': {
    id: 'car-tour',
    image: '/images/tourism/car-tour.png',
    badge: 'Premium',
    title: 'Circuit Privé Premium en Voiture',
    subtitle: 'Le confort absolu pour explorer Paris sans effort et avec élégance.',
    description: 'Installez-vous confortablement à bord de l\'une de nos berlines de prestige ou vans de luxe. Votre chauffeur et votre guide expert vous accompagneront à travers les plus belles avenues de Paris, offrant des vues imprenables sur les monuments tout en vous contant leur riche histoire. C\'est le tourisme dans sa forme la plus raffinée, alliant transport de luxe et découverte culturelle haut de gamme.',
    sections: [
      {
        title: 'Élégance et Sérénité',
        content: 'Évitez la foule, la fatigue de la marche et les transports en commun. Profitez du luxe d\'un véhicule récent, climatisé, équipé d\'une connexion Wi-Fi et de rafraîchissements, vous permettant de visiter la ville en toute tranquillité.',
        image: '/images/tourism/car-interior.png'
      },
      {
        title: 'Paris à Votre Rythme',
        content: 'Vous souhaitez vous arrêter pour une photo au Trocadéro ou prendre un café dans une célèbre brasserie parisienne ? Votre chauffeur est à votre entière disposition. C\'est vous qui dictez le tempo de votre journée.',
        image: '/images/tourism/versailles-hall.png'
      },
      {
        title: 'Vues Panoramiques de la Ville',
        content: 'Découvrez la splendeur architecturale de Paris depuis le confort de votre siège.',
        list: [
          'Les Champs-Élysées et l\'Arc de Triomphe',
          'La Place de la Concorde et la Madeleine',
          'Les Invalides et le Pont Alexandre III',
          'L\'élégant quartier du Marais et la Place des Vosges'
        ],
        image: '/images/tourism/car-tour.png'
      }
    ],
    highlights: ['Berline ou van de luxe', 'Chauffeur-guide bilingue', 'Rafraîchissements et Wi-Fi', 'Service porte-à-porte', 'Arrêts photos à la demande'],
    price: 0,
    pricingOptions: [
      { name: 'Demi-journée de 4h en Classe S', price: 'dès 750 €' },
      { name: 'Demi-journée de 4h en Classe V', price: 'dès 850 €' },
      { name: 'Journée complète de 8h en Classe S', price: 'dès 1 400 €' }
    ]
  },
  'museums': {
    id: 'museums',
    image: '/images/tourism/inside-louvre.jpg',
    badge: 'Culture',
    title: 'Visites Exclusives des Musées de Paris',
    subtitle: 'L\'art et l\'histoire sans la foule ni les files d\'attente.',
    description: 'Accédez de manière privilégiée aux plus grands musées du monde avec un historien de l\'art expert. Du Louvre au Musée d\'Orsay, plongez au cœur de l\'histoire de l\'art à travers des visites privées captivantes, hautement éducatives et adaptées à vos intérêts.',
    sections: [
      {
        title: 'Expertise et Passion',
        content: 'Nos guides experts ne se contentent pas de vous montrer des œuvres ; ils leur donnent vie. Découvrez les histoires fascinantes, le contexte historique et les secrets cachés derrière chaque coup de pinceau des maîtres.',
        image: '/images/tourism/inside-louvre.jpg'
      },
      {
        title: 'Accès Privilégié',
        content: 'Grâce à nos billets coupe-file et à notre connaissance approfondie de la disposition des musées, vous ne perdrez pas une minute. Profitez de votre temps entièrement immergé dans l\'art, en contournant complètement les files d\'attente massives.',
        image: '/images/tourism/musee-orsay.jpg'
      },
      {
        title: 'Expériences Muséales Organisées',
        content: 'Nous proposons des visites dans toutes les grandes institutions parisiennes :',
        list: [
          'Le Louvre : La Joconde, la Vénus de Milo et les ailes secrètes',
          'Musée d\'Orsay : Le berceau de l\'Impressionnisme',
          'Centre Pompidou : Chefs-d\'œuvre modernes et contemporains',
          'Musée de l\'Orangerie : Les Nymphéas de Monet',
          'Musée Rodin : Jardins de sculptures et intimité'
        ],
        image: '/images/tourism/chapelle-stained-glass.jpg'
      }
    ],
    highlights: ['Billets coupe-file inclus', 'Guide historien de l\'art', 'Groupe privé uniquement', 'Parcours artistiques thématiques', 'Rythme optimal'],
    price: 0,
    pricingOptions: [
      { name: 'Visite des chefs-d\'œuvre du Louvre (2h)', price: 'dès 400 €' },
      { name: 'Visite Orsay & Orangerie (3h)', price: 'dès 550 €' },
      { name: 'Visite Histoire de l\'Art (Plusieurs Musées, 4h)', price: 'dès 800 €' }
    ]
  },
  'day-trips': {
    id: 'day-trips',
    image: '/images/tourism/mont-saint-michel.jpg',
    badge: 'Exclusif',
    title: 'Excursions de Luxe depuis Paris',
    subtitle: 'Évadez-vous de la ville pour une journée et découvrez les joyaux de la campagne française.',
    description: 'Au-delà du boulevard périphérique parisien se trouvent des trésors architecturaux et naturels. Nous vous emmenons en voyage vers Versailles, Giverny, la Champagne ou les plages de Normandie dans un confort royal, accompagné d\'un guide expert.',
    sections: [

      {
        title: 'Le Château de Versailles',
        content: 'Revivez la splendeur de la cour du Roi-Soleil. De la majestueuse Galerie des Glaces et des Grands Appartements aux jardins à la française méticuleusement entretenus, laissez-vous éblouir par la grandeur de la monarchie française.',
        image: '/images/tourism/versailles.png'
      },
      {
        title: 'Normandie et Giverny',
        content: 'Découvrez les jardins enchanteurs de Claude Monet et son célèbre bassin aux nymphéas à Giverny, ou rendez-vous sur les plages historiques du Débarquement et les superbes falaises d\'Étretat pour une expérience historique et visuelle profonde.',
        image: '/images/tourism/mont-saint-michel.jpg'
      },
      {
        title: 'Châteaux de la Loire',
        content: 'Entrez dans un conte de fées en explorant les majestueux châteaux de Chambord, Chenonceau et Amboise, entourés de paysages verdoyants et d\'histoire royale.',
        image: '/images/tourism/chateau-loire3.jpg'
      }
    ],
    highlights: ['Véhicule haut de gamme', 'Excursion d\'une journée entière', 'Prise en charge à domicile', 'Guide expert local', 'Accès coupe-file aux monuments'],
    price: 0,
    pricingOptions: [
      { name: 'Demi-journée à Versailles (4h)', price: 'dès 650 €' },
      { name: 'Journée complète à Versailles (8h)', price: 'dès 1 200 €' },
      { name: 'Châteaux de la Loire (10h)', price: 'dès 1 800 €' },
      { name: 'Mont Saint-Michel (12h)', price: 'dès 2 200 €' }
    ]
  },
  'night': {
    id: 'night',
    image: '/images/tourism/night-eiffel.png',
    badge: 'Signature',
    title: 'Illuminations de Paris by Night',
    subtitle: 'La Ville Lumière comme vous ne l\'avez jamais vue auparavant.',
    description: 'Lorsque le soleil se couche, Paris mérite vraiment son nom. Vivez la magie d\'une visite nocturne où chaque monument devient un chef-d\'œuvre de lumière. Un moment suspendu dans le temps, idéal pour créer des souvenirs inoubliables en soirée.',
    sections: [
      {
        title: 'Le Scintillement des Monuments',
        content: 'La Tour Eiffel scintillante, les majestueux ponts illuminés, l\'Opéra Garnier flamboyant... Paris la nuit possède une aura unique que nous vous invitons à découvrir confortablement installé dans un véhicule de luxe.',
        image: '/images/tourism/night-eiffel.png'
      },
      {
        title: 'Champagne et Lumières de la Ville',
        content: 'Pour rendre ce moment absolument parfait, une bouteille bien fraîche de champagne premium peut être servie à bord, vous permettant de trinquer avec vos proches devant les plus beaux panoramas du monde.',
        image: '/images/tourism/cave-champagne.jpg'
      },
      {
        title: 'Itinéraire Nocturne',
        content: 'Nos parcours nocturnes sont soigneusement conçus pour un impact visuel maximal :',
        list: [
          'L\'Avenue des Champs-Élysées de nuit',
          'La Pyramide du Louvre éclatante',
          'Notre-Dame illuminée contre le ciel sombre',
          'Montmartre pour une vue panoramique nocturne de la ville'
        ],
        image: '/night_tour_paris.png'
      }
    ],
    highlights: ['Circuit illuminé', 'Ambiance intime', 'Arrêts photos nocturnes', 'Option Champagne Premium', 'Cadre romantique'],
    price: 0,
    pricingOptions: [
      { name: 'Visite Illuminations de Paris (2h)', price: 'dès 350 €' },
      { name: 'Visite (3h) avec Champagne', price: 'dès 500 €' }
    ]
  },
  'gastro': {
    id: 'gastro',
    image: '/images/tourism/gastronomie1.jpg',
    badge: 'Gastronomie',
    title: 'Expérience Culinaire Étoilée Michelin',
    subtitle: 'L\'excellence culinaire française apportée directement à vous.',
    description: 'Paris est la capitale incontestée de la gastronomie mondiale. Nous vous ouvrons les portes des restaurants les plus prestigieux et gérons vos transferts avec la plus grande élégance, garantissant un voyage culinaire sans faille du début à la fin.',
    sections: [
      {
        title: 'Réservations Privilégiées',
        content: 'Obtenir une table dans l\'un des meilleurs restaurants parisiens peut être un défi. Grâce à notre réseau exclusif, nous vous aidons à obtenir des tables dans des établissements très prisés et souvent complets. Notre concierge s\'occupe de tout.',
        image: '/images/tourism/gastronomie1.jpg'
      },
      {
        title: 'Une Soirée Sans Faille',
        content: 'Votre chauffeur privé vous dépose juste devant l\'entrée du restaurant et vous attend pour la fin de votre dîner. Aucun stress pour trouver un taxi tard le soir, juste le pur plaisir de la dégustation.',
        image: '/images/tourism/gastronomie2.jpg'
      },
      {
        title: 'Tours Culinaires',
        content: 'Au-delà du dîner, nous proposons également des visites gourmandes en journée :',
        list: [
          'Dégustation de macarons et pâtisseries à Saint-Germain',
          'Masterclass de vins et fromages dans des caves anciennes',
          'Visites de marchés avec un chef professionnel',
          'Cours de cuisine privés dans un appartement parisien'
        ],
        image: '/gastro_dining_paris.png'
      }
    ],
    highlights: ['Conciergerie culinaire dédiée', 'Accès étoilé Michelin', 'Temps d\'attente chauffeur inclus', 'Conseils gourmets', 'Transferts fluides'],
    price: 0,
    pricingOptions: [
      { name: 'Service de réservation Concierge', price: 'dès 150 €' },
      { name: 'Visite Gastronomique à pied (3h)', price: 'dès 350 €' },
      { name: 'Visite de marché privé & Déjeuner de Chef', price: 'dès 600 €' }
    ]
  },
  'champagne': {
    id: 'champagne',
    image: '/images/tourism/reims-champagne.jpg',
    badge: 'VIP',
    title: 'Tour VIP de la Région Champagne',
    subtitle: 'Une immersion pétillante au cœur des vignobles.',
    description: 'Partez à la découverte de la région Champagne, mondialement célèbre. Visitez les caves anciennes des plus grandes maisons et dégustez des millésimes exceptionnels directement à la source, tout en voyageant dans un luxe inégalé.',
    sections: [
      {
        title: 'Les Grandes Maisons de Champagne',
        content: 'Moët & Chandon, Veuve Clicquot, Ruinart, Taittinger... Nous organisons vos visites privées dans les domaines les plus prestigieux, classés au patrimoine mondial de l\'UNESCO, en vous donnant accès à des salles de dégustation exclusives.',
        image: '/images/tourism/reims-champagne.jpg'
      },
      {
        title: 'Terroir et Authenticité',
        content: 'Au-delà des marques célèbres, nous vous présentons des vignerons indépendants et familiaux pour une approche plus confidentielle et authentique du métier, au milieu des vignes verdoyantes vallonnées.',
        image: 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=1200&q=85&auto=format&fit=crop'
      },
      {
        title: 'Une Journée de Luxe',
        content: 'Votre excursion d\'une journée comprend :',
        list: [
          'Transport privé de luxe depuis votre hôtel à Paris',
          'Visite guidée de la cathédrale de Reims',
          'Déjeuner gastronomique dans les vignes',
          'Plusieurs dégustations de champagne premium'
        ],
        image: '/images/tourism/cellar-tours.webp'
      }
    ],
    highlights: ['Visites exclusives de caves', 'Dégustations privées', 'Guide œnologue', 'Transport de luxe', 'Déjeuner gastronomique inclus'],
    price: 0,
    pricingOptions: [
      { name: 'Excursion VIP Moët & Chandon', price: 'dès 1 600 €' },
      { name: 'Visite Veuve Clicquot & Ruinart', price: 'dès 1 800 €' },
      { name: 'Accès Exclusif Dom Pérignon', price: 'dès 2 500 €' }
    ]
  },
  'couple': {
    id: 'couple',
    image: '/images/tourism/romantic-ceremony.jpg',
    badge: 'Romantique',
    title: 'Paris Romantique pour les Couples',
    subtitle: 'Écrivez votre propre chapitre romantique dans la Ville de l\'Amour.',
    description: 'En tant que capitale incontestée de la romance, Paris offre des décors de rêve pour les couples. Nous créons pour vous une parenthèse enchantée, loin du tumulte, pour célébrer votre union, un anniversaire ou simplement pour vous retrouver avec votre partenaire.',
    sections: [
      {
        title: 'Moments Magiques',
        content: 'Un dîner aux chandelles sur un bateau privé, une promenade sur les quais de la Seine au coucher du soleil, ou la découverte des recoins cachés et intimes de Montmartre. Nous connaissons les secrets les plus romantiques de la ville.',
        image: '/images/tourism/romantic-ceremony.jpg'
      },
      {
        title: 'Surprises Sur-Mesure',
        content: 'Vous prévoyez une demande en mariage ? Un anniversaire important ? Notre concierge organise les fleurs, le champagne, le photographe et chaque détail méticuleux pour que la surprise soit absolue et le moment parfait.',
        image: '/images/tourism/rooftop-proposal1.jpg'
      },
      {
        title: 'Expériences Romantiques',
        content: 'Laissez-nous planifier des moments inoubliables rien que pour vous deux :',
        list: [
          'Tour privé en voiture vintage au crépuscule',
          'Journée spa exclusive pour les couples',
          'Séance photo romantique professionnelle près de la Tour Eiffel',
          'Dîner privé dans un jardin parisien secret'
        ],
        image: '/images/tourism/eiffel-tower-evening-stockcake.webp'
      }
    ],
    highlights: ['Lieux confidentiels', 'Concierge romance dédié', 'Planification de surprises', 'Service discret', 'Options de photographie'],
    price: 0,
    pricingOptions: [
      { name: 'Visite romantique en voiture vintage (2h)', price: 'dès 450 €' },
      { name: 'Visite (4h) + Séance photo pro', price: 'dès 850 €' },
      { name: 'Forfait Demande en mariage (Organisation complète)', price: 'dès 2 000 €' }
    ]
  },
  'solo': {
    id: 'solo',
    image: '/images/tourism/solo-cafe.png',
    badge: 'Solo',
    title: 'Expérience Paris pour Voyageur Solo',
    subtitle: 'Liberté totale, accompagné par un expert local.',
    description: 'Voyager seul est l\'occasion parfaite de vivre Paris à votre propre rythme. Profitez de l\'expertise de votre chauffeur-guide privé pour découvrir la ville comme un local, en toute sécurité et avec un confort maximal.',
    sections: [
      {
        title: 'Astuces et Secrets d\'Initié',
        content: 'Où manger le meilleur croissant ? Quel est le meilleur endroit pour photographier le lever du soleil ? Votre guide partage ses adresses préférées et des astuces d\'initiés que vous ne trouverez dans aucun guide.',
        image: '/images/tourism/solo-1.png'
      },
      {
        title: 'Sécurité et Liberté',
        content: 'Bénéficiez d\'un accompagnement rassurant tout en conservant une liberté totale de mouvement. Nous nous adaptons entièrement à vos envies du moment—que vous souhaitiez passer trois heures dans un musée ou faire les boutiques dans Le Marais.',
        image: '/images/tourism/chanel-store.jpg'
      },
      {
        title: 'Connectez-vous à la Ville',
        content: 'Les visites en solo sont hautement interactives :',
        list: [
          'Flânez dans les marchés locaux et discutez avec les artisans',
          'Suivez une masterclass privée (cuisine, création de parfum)',
          'Découvrez des passages cachés et des cafés littéraires',
          'Sentez-vous en sécurité avec un guide dévoué qui veille sur vous'
        ],
        image: '/images/tourism/boulevard-haussmann.jpg'
      }
    ],
    highlights: ['Itinéraire très flexible', 'Astuces d\'initiés locaux', 'Accompagnement VIP', 'Sécurité et confort absolus', 'Assistance photographie'],
    price: 0,
    pricingOptions: [
      { name: 'Découverte Demi-journée (4h)', price: 'dès 400 €' },
      { name: 'Expérience Locale Journée complète (8h)', price: 'dès 750 €' }
    ]
  },
  'historical': {
    id: 'historical',
    image: '/images/tourism/notre-dame.jpg',
    badge: 'Patrimoine',
    title: 'Visite Historique Approfondie de Paris',
    subtitle: 'Plongez dans les 2 000 ans d\'histoire fascinante de la capitale.',
    description: 'De la cité romaine de Lutèce à la métropole moderne, Paris a survécu à des siècles de bouleversements, de révolutions et de renaissances. Traversez les époques à travers son architecture, ses monuments et les récits palpitants de nos guides historiens.',
    sections: [
      {
        title: 'L\'Héritage des Rois',
        content: 'Découvrez l\'Île de la Cité, le véritable berceau de Paris, et les grandes places royales (Place des Vosges, Place Vendôme) qui ont façonné le visage de la France et de sa monarchie à travers les âges.',
        image: '/images/tourism/notre-dame.jpg'
      },
      {
        title: 'Révolution et Modernité',
        content: 'Comprenez comment la Révolution française et les travaux urbains massifs du baron Haussmann ont transformé Paris d\'un labyrinthe médiéval en la ville lumière et de grands boulevards que nous connaissons aujourd\'hui.',
        image: '/images/tourism/musee-orsay.jpg'
      },
      {
        title: 'Promenades Historiques Thématiques',
        content: 'Choisissez une époque qui vous passionne :',
        list: [
          'Paris Romain et Médiéval : Les origines',
          'La Révolution Française : Sur les traces de Marie-Antoinette',
          'La Seconde Guerre Mondiale : L\'Occupation et la Libération',
          'La Belle Époque : L\'âge d\'or de l\'art et des cabarets'
        ],
        image: '/images/tourism/chapelle-stained-glass.jpg'
      }
    ],
    highlights: ['Guide historien', 'Sites du patrimoine UNESCO', 'Accès exclusif', 'Récits captivants', 'Choix thématiques'],
    price: 0,
    pricingOptions: [
      { name: 'Visite historique à pied (3h)', price: 'dès 350 €' },
      { name: 'Visite historique en voiture (4h)', price: 'dès 600 €' }
    ]
  },
  'custom': {
    id: 'custom',
    image: '/custom_luxury_paris.png',
    badge: 'Sur-mesure',
    title: 'Forfait Paris Entièrement Sur-Mesure',
    subtitle: 'Votre imagination est notre seule limite.',
    description: 'Avez-vous une envie particulière ? Un projet de voyage complexe ? Notre équipe de conciergerie est à votre entière disposition pour concevoir une expérience 100 % personnalisée, unique au monde, façonnée exactement selon vos spécifications.',
    sections: [
      {
        title: 'Conception Artisanale',
        content: 'Nous prenons le temps de discuter avec vous pour comprendre profondément vos attentes, votre style de voyage et vos rêves, créant ainsi un programme qui reflète parfaitement qui vous êtes.',
        image: '/custom_luxury_paris.png'
      },
      {
        title: 'Logistique Sans Faille',
        content: 'Quels que soient vos besoins—coordination de plusieurs véhicules de luxe, sécurisation de lieux hautement privés, organisation de la sécurité ou d\'événements privés—nous garantissons une coordination au millimètre près.',
        image: '/images/tourism/car-interior.png'
      },
      {
        title: 'Possibilités Illimitées',
        content: 'Si vous pouvez en rêver, nous pouvons l\'organiser :',
        list: [
          'Visites privées après la fermeture des grands musées',
          'Transferts en hélicoptère vers des châteaux',
          'Expériences de personal shopping avec un styliste',
          'Croisières en yacht privé sur la Seine'
        ],
        image: '/images/tourism/versailles.png'
      }
    ],
    highlights: ['Concierge senior dédié', 'Flexibilité totale', 'Services illimités', 'Exclusivité absolue', 'Exécution sans faille'],
    price: 0,
    pricingPackages: [
      {
        name: 'Demande Spécifique',
        price: 'Sur devis',
        description: 'Forfait totalement sur-mesure avec options, visites et services de votre choix selon vos envies.'
      },
      {
        name: 'Forfait VIP',
        price: 'Dès 4 000 Euros',
        description: 'Assistance en ligne durant tout le séjour, itinéraire complet, billets coupe-file pour les musées et réservation d\'activités de loisirs, recommandations d\'hôtels et de restaurants avec réservation, guide touristique privé et chauffeur privé, transfert aéroport.'
      },
      {
        name: 'Forfait Grands Classiques',
        price: 'Dès 3 000 Euros',
        description: 'Assistance en ligne durant tout le séjour, itinéraire complet, réservation de visite privée du Louvre et de Versailles, recommandations d\'hôtels et de restaurants avec réservation, guide privé à Paris, transfert aéroport.'
      },
      {
        name: 'Forfait Service Complet',
        price: 'Dès 1 500 Euros',
        description: 'Itinéraire complet et assistance en ligne, réservation d\'activités, recommandations d\'hôtels et de restaurants avec réservation, guide touristique privé.'
      },
      {
        name: 'Forfait Premium',
        price: 'Dès 650 Euros',
        description: 'Assistance en ligne durant tout le séjour, itinéraire complet, recommandations d\'hôtels et de restaurants avec réservation.'
      }
    ]
  }
};
