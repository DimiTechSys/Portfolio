import type { MetadataRoute } from 'next'

const BASE_URL = 'https://pharmaworkspace.fr'

// Pages publiques indexables : la landing + tarifs/sécurité/signup + pages légales.
// Tout le reste (app authentifiée, admin, onboarding, auth, API) est privé :
// les crawlers y sont de toute façon redirigés vers /login, on l'exclut
// explicitement pour ne pas gaspiller le budget de crawl ni indexer /login.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/admin',
          '/dashboard',
          '/onboarding',
          '/login',
          '/verify',
          '/auth/',
          '/profile',
          '/billing',
          '/tasks',
          '/orders',
          '/prescriptions',
          '/rentals',
          '/shortages',
          '/procedures',
          '/agenda',
          '/annuaire',
          '/notifications',
          '/planning',
          '/chat',
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  }
}
