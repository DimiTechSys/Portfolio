import { TourismExperience } from '../tourismDataTypes';

export const en: Record<string, TourismExperience> = {
  'families': {
    id: 'families',
    image: '/images/tourism/families-1.png',
    badge: 'Family',
    title: 'Paris Private Tours For Families',
    subtitle: 'We craft unforgettable Paris experiences for families, filled with discovery, joy, and wonder.',
    description: 'Paris Tours for Families : We offer lots of fun activities and private tours for families with kids. We create a personalized visit for your family in order to make everyone happy, with serenity. Experience a personalized trip from a local company. From the moment you arrive, Paris will captivate you — not just with its iconic monuments and world-famous art, but with its spirit, charm, and beauty. With us, your family won’t just visit Paris — you’ll truly connect with it.',
    sections: [
      {
        title: 'Tailored Tours in Paris for Families',
        content: 'Every family is unique, and so is every tour. We customize your itinerary based on your children’s age, interests, and pace, making sure each day is engaging, balanced, and full of joy for every family member. Whether it’s your child’s first time seeing the Eiffel Tower, exploring a secret garden, or tasting authentic French pastries during a food tour, we ensure that Paris feels like magic.',
        image: '/images/tourism/families-1.png'
      },
      {
        title: 'Go Beyond the Tourist Checklist',
        content: 'Climbing the Eiffel Tower — but that’s just the beginning. Paris deserves more than a quick glance, and your family deserves more than a standard tour. With our private guided tours in Paris and family-friendly activities, you’ll explore the city like a true Parisian, with tours by passionate locals who know how to engage kids and adults alike.',
        image: '/images/tourism/families-2.png'
      },
      {
        title: 'Explore the Best of Paris — Together',
        content: 'From the Louvre’s treasures to the whimsical art of Montmartre, from the splendor of Versailles palace to hidden gems only locals know — every step of your journey is thoughtfully planned and joyfully delivered.',
        list: [
          'Eiffel Tower & Seine River',
          'Louvre & Musée d’Orsay for kids',
          'Notre-Dame cathedral & Latin Quarter adventures',
          'Montmartre & Sacré-Cœur',
          'Versailles Family Day Trip',
          'Hands-on cultural workshops & kid-friendly cuisine'
        ],
        image: '/images/tourism/families-1.png'
      },
      {
        title: 'Kid-Friendly Activities and Attractions',
        content: 'Traveling to Paris with your family? Fear not, as the city offers an array of kid-friendly activities. From interactive museums to boat rides along the Canal de l’Ourcq, there is something to captivate every young explorer.',
        list: [
          'Zoos, aquariums, and funfairs',
          'Gigantic woods and gardens with playgrounds',
          'Amusement parks such as Disneyland Paris',
          'Museums of art, sciences, history with activities dedicated to kids',
          'Kid-friendly restaurants, cafés, and boutiques'
        ]
      },
      {
        title: 'Ready to Plan Your Paris Family Adventure?',
        content: 'Your Paris for Kids vacation is more than a trip — it’s a celebration of time together in one of the most beautiful cities in the world. Let us handle the planning of your Paris travel itinerary while you enjoy every moment with your family. We take care of logistics, tickets, pacing, and personalization, so you can simply be present and create lifelong memories.'
      }
    ],
    highlights: ['Kid-friendly expert guides', 'Skip-the-line tickets', 'Flexible pacing', 'Child seats included in transport', 'Customized family itineraries'],
    price: 0,
    pricingOptions: [
      { name: '3-hour Family Walking Tour', price: 'from €450' },
      { name: '4-hour Family Driving Tour', price: 'from €950' },
      { name: 'Full Day Family Package (8h)', price: 'from €1,600' }
    ]
  },
  'private-tour': {
    id: 'private-tour',
    image: '/images/tourism/private-tour.png',
    badge: 'Signature',
    title: 'Bespoke Private Guided Tours of Paris',
    subtitle: 'Discover the soul of the City of Light with a dedicated expert guide.',
    description: 'Experience total immersion in Parisian history and culture. Far from classic tourist circuits, our licensed guides reveal the best-kept secrets of the capital, from grand monuments to hidden alleyways. Your private tour is entirely customizable, designed around your unique interests to deliver an authentic, deep connection with Paris.',
    sections: [
      {
        title: 'A Tailor-Made Journey',
        content: 'No two travelers are alike, which is why we do not offer cookie-cutter itineraries. We customize your tour based on your passions—whether it\'s art, history, fashion, or architecture—ensuring every moment is enchanting and perfectly paced.',
        image: '/louvre.jpg'
      },
      {
        title: 'Beyond the Must-Sees',
        content: 'While we ensure you experience the iconic landmarks, we also take you off the beaten path. Discover authentic Paris alongside passionate locals who know the stories behind every stone and the legends of every street corner.',
        image: '/guide-prive.jpg'
      },
      {
        title: 'Treasures of the Capital',
        content: 'Experience the icons of Paris in a completely new light, guided by true experts.',
        list: [
          'The Louvre and its masterpieces in complete serenity',
          'The majestic Notre-Dame Cathedral and its island',
          'The Latin Quarter and its hidden medieval mysteries',
          'Montmartre, the Sacré-Cœur, and the artists\' village',
          'Private boat cruise on the Seine with champagne'
        ],
        image: '/musee.jpg'
      },
      {
        title: 'Seamless Logistics',
        content: 'Forget about navigation, ticketing, and waiting in lines. We handle every detail, from luxury hotel pickup to skip-the-line access at major monuments, so your only job is to enjoy the beauty of Paris.'
      }
    ],
    highlights: ['Licensed expert guide', 'Skip-the-line access', 'Fully flexible itinerary', 'Luxury hotel pickup', 'Bespoke recommendations'],
    price: 0,
    pricingOptions: [
      { name: '3-hour private walking tour', price: 'from €360' },
      { name: '4-hour private driving tour', price: 'from €950' },
      { name: '3h walking tour + 2h Louvre', price: 'from €850' },
      { name: '4h driving tour + 2h Louvre', price: 'from €1450' },
      { name: 'Versailles Day Trip', price: 'from €1,250' },
      { name: 'Normandy Day Trip', price: 'from €1,650' },
      { name: 'Champagne Day Trip', price: 'from €1,650' }
    ]
  },
  'car-tour': {
    id: 'car-tour',
    image: '/images/tourism/car-tour.png',
    badge: 'Premium',
    title: 'Premium Private Car Tour of Paris',
    subtitle: 'The absolute comfort to explore Paris effortlessly and elegantly.',
    description: 'Settle comfortably into one of our prestige sedans or luxury vans. Your chauffeur and expert guide will accompany you through the most beautiful avenues of Paris, offering breathtaking views of the monuments while narrating their rich history. This is sightseeing at its most refined, combining luxury transportation with high-end cultural discovery.',
    sections: [
      {
        title: 'Elegance and Serenity',
        content: 'Avoid the crowds, the fatigue of walking, and public transportation. Enjoy the luxury of a recent, air-conditioned vehicle equipped with Wi-Fi and refreshments, allowing you to visit the city in total tranquility.',
        image: '/images/tourism/car-tour.png'
      },
      {
        title: 'Paris at Your Own Pace',
        content: 'Want to stop for a photo at the Trocadéro or grab a coffee at a famous Parisian café? Your chauffeur is entirely at your disposal. You dictate the tempo of your day.',
        image: '/images/tourism/versailles-hall.png'
      },
      {
        title: 'Panoramic City Views',
        content: 'Discover the architectural splendor of Paris from the comfort of your seat.',
        list: [
          'The Champs-Élysées and the Arc de Triomphe',
          'Place de la Concorde and the Madeleine',
          'The Invalides and the Alexander III Bridge',
          'The elegant Marais district and Place des Vosges'
        ],
        image: '/images/tourism/car-tour.png'
      }
    ],
    highlights: ['Luxury sedan or van', 'Bilingual chauffeur-guide', 'Refreshments & Wi-Fi', 'Door-to-door service', 'Photo stops on demand'],
    price: 0,
    pricingOptions: [
      { name: '4h Half-Day Tour in S-Class', price: 'from €750' },
      { name: '4h Half-Day Tour in V-Class', price: 'from €850' },
      { name: '8h Full-Day Tour in S-Class', price: 'from €1,400' }
    ]
  },
  'museums': {
    id: 'museums',
    image: '/images/tourism/inside-louvre.jpg',
    badge: 'Culture',
    title: 'Exclusive Paris Museums Tours',
    subtitle: 'Art and history without the crowds or waiting lines.',
    description: 'Gain privileged access to the world’s greatest museums with an expert art historian. From the Louvre to the Musée d\'Orsay, dive deep into the history of art through captivating and highly educational private tours tailored to your interests.',
    sections: [
      {
        title: 'Expertise and Passion',
        content: 'Our expert guides do more than just show you artworks; they bring them to life. Learn the fascinating stories, the historical context, and the hidden secrets behind every brushstroke of the masters.',
        image: '/images/tourism/inside-louvre.jpg'
      },
      {
        title: 'Privileged Access',
        content: 'Thanks to our skip-the-line tickets and deep knowledge of museum layouts, you won’t waste a single minute. Enjoy your time fully immersed in the art, completely bypassing the massive tourist queues.',
        image: '/images/tourism/musee-orsay.jpg'
      },
      {
        title: 'Curated Museum Experiences',
        content: 'We offer tours across all major Parisian institutions:',
        list: [
          'The Louvre: Mona Lisa, Venus de Milo, and hidden wings',
          'Musée d\'Orsay: The cradle of Impressionism',
          'Centre Pompidou: Modern and contemporary masterpieces',
          'Musée de l\'Orangerie: Monet’s Water Lilies',
          'Musée Rodin: Sculpture gardens and intimacy'
        ],
        image: '/images/tourism/chapelle-stained-glass.jpg'
      }
    ],
    highlights: ['Skip-the-line tickets included', 'Art historian guide', 'Private group only', 'Thematic artistic routes', 'Optimal pacing'],
    price: 0,
    pricingOptions: [
      { name: '2h Louvre Masterpieces Tour', price: 'from €400' },
      { name: '3h Orsay & Orangerie Tour', price: 'from €550' },
      { name: '4h Art History Tour (Multiple Museums)', price: 'from €800' }
    ]
  },
  'day-trips': {
    id: 'day-trips',
    image: '/images/tourism/mont-saint-michel.jpg',
    badge: 'Exclusive',
    title: 'Luxury Day Trips from Paris',
    subtitle: 'Escape the city for a day to discover the jewels of the French countryside.',
    description: 'Beyond the Parisian ring road lie architectural and natural treasures. We take you on a journey to Versailles, Giverny, the Champagne region, or the Normandy beaches in royal comfort, complete with an expert guide.',
    sections: [
      {
        title: 'Journey Beyond Paris',
        content: 'Leave the hustle of the city behind and discover the stunning landscapes, royal palaces, and historical sites that make France so extraordinary.',
        image: '/images/tourism/chateau-loire2.jpg'
      },
      {
        title: 'Seamless Escapes',
        content: 'We organize every detail of your day trip—from luxury transportation to expert local guides and curated dining experiences—ensuring a stress-free and enriching adventure.',
        image: '/images/tourism/chateau-loire3.jpg'
      },
      {
        title: 'Iconic Destinations',
        content: 'Our private excursions include the most sought-after locations:',
        list: [
          'Palace of Versailles and its gardens',
          'Mont Saint-Michel and the Normandy coast',
          'The D-Day Landing Beaches',
          'The Châteaux of the Loire Valley',
          'Fontainebleau and Vaux-le-Vicomte'
        ],
        image: '/images/tourism/mont-saint-michel.jpg'
      }
    ],
    highlights: ['High-end luxury vehicle', 'Full-day excursion', 'Door-to-door pickup', 'Local expert guide', 'Skip-the-line monument access'],
    price: 0,
    pricingOptions: [
      { name: 'Versailles Half-Day (4h)', price: 'from €650' },
      { name: 'Versailles Full-Day (8h)', price: 'from €1,200' },
      { name: 'Loire Valley Castles (10h)', price: 'from €1,800' },
      { name: 'Mont Saint-Michel (12h)', price: 'from €2,200' }
    ]
  },
  'night': {
    id: 'night',
    image: '/images/tourism/night-eiffel.png',
    badge: 'Signature',
    title: 'Paris by Night Illumination Tour',
    subtitle: 'The City of Light as you have never seen it before.',
    description: 'When the sun sets, Paris truly earns its name. Experience the magic of a nocturnal tour where every monument becomes a masterpiece of light. A suspended moment in time, ideal for creating unforgettable evening memories.',
    sections: [
      {
        title: 'The City of Lights Revealed',
        content: 'When the sun sets, Paris transforms into a dazzling spectacle of illuminated monuments, glowing bridges, and sparkling streets.',
        image: '/images/tourism/night-eiffel.png'
      },
      {
        title: 'Champagne and City Lights',
        content: 'To make this moment absolutely perfect, a chilled bottle of premium champagne can be served on board, allowing you to toast with your loved ones in front of the most beautiful panoramas in the world.',
        image: '/images/tourism/eiffel-tower-evening-stockcake.webp'
      },
      {
        title: 'Evening Itinerary',
        content: 'Our night routes are carefully crafted for maximum visual impact:',
        list: [
          'Avenue des Champs-Élysées at night',
          'The glowing Louvre Pyramid',
          'Notre-Dame illuminated against the dark sky',
          'Montmartre for a panoramic night view of the city'
        ],
        image: '/night_tour_paris.png'
      }
    ],
    highlights: ['Illuminated circuit', 'Intimate atmosphere', 'Night photography stops', 'Premium Champagne option', 'Romantic setting'],
    price: 0,
    pricingOptions: [
      { name: '2h Illumination Tour', price: 'from €350' },
      { name: '3h Illumination Tour with Champagne', price: 'from €500' }
    ]
  },
  'gastro': {
    id: 'gastro',
    image: '/images/tourism/gastronomie1.jpg',
    badge: 'Gastronomy',
    title: 'Michelin-Starred Dining Experience',
    subtitle: 'French culinary excellence brought directly to you.',
    description: 'Paris is the undisputed gastronomy capital of the world. We open the doors to the most prestigious restaurants and handle your transfers with the utmost elegance, ensuring your culinary journey is flawless from start to finish.',
    sections: [
      {
        title: 'Culinary Excellence',
        content: 'France is the epicenter of world gastronomy. We secure tables at the most exclusive Michelin-starred restaurants, where chefs create art on a plate.',
        image: '/images/tourism/gastronomie1.jpg'
      },
      {
        title: 'Privileged Reservations',
        content: 'Securing a table at a top Parisian restaurant can be challenging. Thanks to our exclusive network, we help you obtain tables at highly sought-after, fully booked establishments. Our concierge handles every detail.',
        image: '/images/tourism/gastronomie2.jpg'
      },
      {
        title: 'Culinary Tours',
        content: 'Beyond dinner, we also offer daytime gourmet tours:',
        list: [
          'Macaron and pastry tasting in Saint-Germain',
          'Wine and cheese masterclasses in ancient cellars',
          'Market tours with a professional chef',
          'Private cooking classes in a Parisian apartment'
        ],
        image: '/gastro_dining_paris.png'
      }
    ],
    highlights: ['Dedicated culinary concierge', 'Michelin-star access', 'Chauffeur wait time included', 'Gourmet advice', 'Seamless transfers'],
    price: 0,
    pricingOptions: [
      { name: 'Concierge Reservation Service', price: 'from €150' },
      { name: 'Gourmet Walking Tour (3h)', price: 'from €350' },
      { name: 'Private Market Tour & Chef Lunch', price: 'from €600' }
    ]
  },
  'champagne': {
    id: 'champagne',
    image: '/images/tourism/reims-champagne.jpg',
    badge: 'VIP',
    title: 'Champagne Region VIP Tour',
    subtitle: 'A sparkling immersion in the heart of the vineyards.',
    description: 'Set off to discover the world-famous Champagne region. Visit the ancient cellars of the greatest houses and taste exceptional vintages directly at the source, all while traveling in unparalleled luxury.',
    sections: [
      {
        title: 'The Heart of Bubbly',
        content: 'Travel to the picturesque Champagne region, home to the world’s most celebrated sparkling wines. Explore rolling vineyards and historic cellars.',
        image: '/images/tourism/reims-champagne.jpg'
      },
      {
        title: 'Exclusive Tastings',
        content: 'Enjoy private, guided tastings at prestigious Maisons as well as boutique, family-owned estates, discovering the complex art of Champagne making.',
        image: 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=1200&q=85&auto=format&fit=crop'
      },
      {
        title: 'A Day of Luxury',
        content: 'Your day trip includes:',
        list: [
          'Private luxury transport from your Paris hotel',
          'Guided tour of the Reims Cathedral',
          'Gourmet lunch in the vineyards',
          'Multiple premium champagne tastings'
        ],
        image: '/images/tourism/cellar-tours.webp'
      }
    ],
    highlights: ['Premium tastings included', 'Expert wine guide', 'Luxury transportation', 'Visit to Reims Cathedral', 'Exclusive cellar access'],
    price: 0,
    pricingOptions: [
      { name: 'Moët & Chandon VIP Day Trip', price: 'from €1,600' },
      { name: 'Veuve Clicquot & Ruinart Tour', price: 'from €1,800' },
      { name: 'Dom Pérignon Exclusive Access', price: 'from €2,500' }
    ]
  },
  'couple': {
    id: 'couple',
    image: '/images/tourism/romantic-ceremony.jpg',
    badge: 'Romantic',
    title: 'Romantic Paris for Couples',
    subtitle: 'Write your own romantic chapter in the City of Love.',
    description: 'As the undisputed capital of romance, Paris offers dreamlike settings for couples. We create an enchanted interlude for you, far from the tumult, to celebrate your union, an anniversary, or simply to reconnect with your partner.',
    sections: [
      {
        title: 'The Capital of Romance',
        content: 'Celebrate your love in the world\'s most romantic city. We craft intimate moments, from secluded picnics to breathtaking viewpoints.',
        image: '/images/tourism/romantic-ceremony.jpg'
      },
      {
        title: 'Unforgettable Memories',
        content: 'Whether it\'s an anniversary, a honeymoon, or a surprise proposal, our team ensures every detail is perfect, beautiful, and deeply personal.',
        image: '/images/tourism/rooftop-proposal1.jpg'
      },
      {
        title: 'Romantic Experiences',
        content: 'Let us plan unforgettable moments for just the two of you:',
        list: [
          'Private vintage car tour at twilight',
          'Exclusive spa day for couples',
          'Professional romantic photoshoot by the Eiffel Tower',
          'Private dinner in a secret Parisian garden'
        ],
        image: '/images/tourism/eiffel-tower-evening-stockcake.webp'
      }
    ],
    highlights: ['Utmost privacy', 'Romantic surprises included', 'Photographer available', 'Tailored romantic itinerary', 'Champagne and roses'],
    price: 0,
    pricingOptions: [
      { name: '2h Romantic Vintage Car Tour', price: 'from €450' },
      { name: '4h Tour + Professional Photoshoot', price: 'from €850' },
      { name: 'Proposal Package (Full Setup)', price: 'from €2,000' }
    ]
  },
  'solo': {
    id: 'solo',
    image: '/images/tourism/solo-cafe.png',
    badge: 'Solo',
    title: 'Solo Traveler Paris Experience',
    subtitle: 'Total freedom, accompanied by a local expert.',
    description: 'Traveling alone is the perfect opportunity to experience Paris at your own pace. Enjoy the expertise of your private chauffeur-guide to discover the city like a local, in complete safety, and with maximum comfort.',
    sections: [
      {
        title: 'Insider Tips and Secrets',
        content: 'Where can you eat the best croissant? What is the best spot for sunrise photography? Your guide shares their personal favorite addresses and insider tips that you won\'t find in any guidebook.',
        image: '/images/tourism/solo-1.png'
      },
      {
        title: 'Safety and Freedom',
        content: 'Benefit from reassuring accompaniment while retaining total freedom of movement. We adapt entirely to your desires of the moment—whether you want to spend three hours in a museum or go boutique shopping in Le Marais.',
        image: '/images/tourism/chanel-store.jpg'
      },
      {
        title: 'Solo Itineraries',
        content: 'Perfect options for the solo traveler:',
        list: [
          'Café culture and literature walks in Saint-Germain',
          'Personal shopping and fashion history',
          'Photography tours of hidden passages',
          'Artisan food tasting tours in Le Marais'
        ],
        image: '/images/tourism/boulevard-haussmann.jpg'
      }
    ],
    highlights: ['Highly flexible itinerary', 'Local insider tips', 'VIP accompaniment', 'Absolute safety and comfort', 'Photography assistance'],
    price: 0,
    pricingOptions: [
      { name: 'Half-Day Discovery (4h)', price: 'from €400' },
      { name: 'Full-Day Local Experience (8h)', price: 'from €750' }
    ]
  },
  'historical': {
    id: 'historical',
    image: '/images/tourism/notre-dame.jpg',
    badge: 'Heritage',
    title: 'Deep Historical Paris Tour',
    subtitle: 'Dive into 2,000 years of the capital\'s fascinating history.',
    description: 'From the Roman city of Lutetia to the modern metropolis, Paris has survived centuries of upheaval, revolution, and renaissance. Traverse the eras through its architecture, its monuments, and the thrilling narratives of our historian guides.',
    sections: [
      {
        title: 'The Legacy of Kings',
        content: 'Discover the Île de la Cité, the true cradle of Paris, and the grand royal squares (Place des Vosges, Place Vendôme) that have shaped the face of France and its monarchy throughout the ages.',
        image: '/images/tourism/notre-dame.jpg'
      },
      {
        title: 'Centuries of Storytelling',
        content: 'From the Roman ruins of Lutetia to the French Revolution and World War II, the streets of Paris are an open-air history book.',
        image: '/images/tourism/musee-orsay.jpg'
      },
      {
        title: 'Thematic Deep Dives',
        content: 'Choose an era that fascinates you:',
        list: [
          'Medieval Paris: Knights, Templars, and Gothic architecture',
          'The French Revolution: The path to liberty',
          'Napoleon’s Paris: Empire and grandeur',
          'Paris under the Occupation and the Resistance'
        ],
        image: '/images/tourism/chapelle-stained-glass.jpg'
      }
    ],
    highlights: ['Historian guide', 'UNESCO Heritage sites', 'Exclusive access', 'Captivating storytelling', 'Thematic choices'],
    price: 0,
    pricingOptions: [
      { name: '3h Historical Walking Tour', price: 'from €350' },
      { name: '4h Historical Driving Tour', price: 'from €600' }
    ]
  },
  'custom': {
    id: 'custom',
    image: '/custom_luxury_paris.png',
    badge: 'Bespoke',
    title: 'Fully Custom Paris Package',
    subtitle: 'Your imagination is our only limit.',
    description: 'Do you have a specific desire? A complex travel project? Our concierge team is at your complete disposal to design a 100% personalized experience, unique in the world, crafted exactly to your specifications.',
    sections: [
      {
        title: 'Artisanal Design',
        content: 'We take the time to converse with you to deeply understand your expectations, your travel style, and your dreams, creating a program that perfectly reflects who you are.',
        image: '/custom_luxury_paris.png'
      },
      {
        title: 'Flawless Logistics',
        content: 'Whatever your needs—coordinating multiple luxury vehicles, securing highly private venues, arranging security details, or organizing private events—we guarantee millimeter-perfect coordination.',
        image: '/images/tourism/car-interior.png'
      },
      {
        title: 'Limitless Possibilities',
        content: 'If you can dream it, we can arrange it:',
        list: [
          'Private after-hours tours of major museums',
          'Helicopter transfers to Châteaux',
          'Personal shopping experiences with a stylist',
          'Private yacht cruises on the Seine'
        ],
        image: '/images/tourism/versailles.png'
      }
    ],
    highlights: ['Dedicated senior concierge', 'Total flexibility', 'Limitless services', 'Absolute exclusivity', 'Flawless execution'],
    price: 0,
    pricingPackages: [
      {
        name: 'Specific Demand',
        price: 'Upon quotation',
        description: 'Totally tailor-made package with options, tours and services of your choice upon your spending orientations.'
      },
      {
        name: 'VIP Package',
        price: 'From 4,000 Euros',
        description: 'Online support during full stay, full stay Itinerary, museum skip the line ticket and leisure activity booking, hotel and restaurant recommendations with reservation, private tour guide and private driver, airport transfer.'
      },
      {
        name: 'Big Classics Package',
        price: 'From 3,000 Euros',
        description: 'Online support during full stay, full stay Itinerary, Louvre and Versailles private tour booking, hotel and restaurant recommendations with reservation, private tour guide in Paris, airport transfer.'
      },
      {
        name: 'Full Service Package',
        price: 'From 1,500 Euros',
        description: 'Full stay itinerary and online support, activity booking, hotel and restaurant recommendations with reservation, private tour guide.'
      },
      {
        name: 'Premium Package',
        price: 'From 650 Euros',
        description: 'Online support during full stay, full stay Itinerary, hotel and restaurant recommendations.'
      }
    ]
  }
};
