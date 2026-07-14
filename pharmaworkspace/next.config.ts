import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['172.20.10.2'],
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(self), microphone=(self), geolocation=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              // 'unsafe-inline' reste requis sur script-src : l'App Router de Next.js injecte
              // ses scripts de bootstrap/hydratation et le payload RSC en inline sans nonce.
              // Une suppression propre nécessite un pipeline de nonce via middleware (proxy.ts) — hors scope.
              // Tentative R3-6 (PR #94) écartée : le nonce par requête est incompatible avec les
              // pages statiquement prerenderisées du route group (marketing), dont le HTML
              // (et les <script> Next inline) est figé à la build sans nonce → CSP les bloque
              // → React n'hydrate pas → cookie-banner / login form invisibles côté e2e.
              // Un nonce strict ne peut être réactivé qu'en force-dynamic toutes les pages
              // publiques (perf hit) ou via un CSP conditionnel par pathname (ticket séparé).
              // 'unsafe-eval' est requis par le worker pdfjs (render-pdf-first-page.ts, chargé depuis unpkg).
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.supabase.co https://unpkg.com",
              "worker-src 'self' blob: https://unpkg.com",
              // 'unsafe-inline' conservé sur style-src : Tailwind/shadcn et styles inline des composants.
              "style-src 'self' 'unsafe-inline'",
              // img.youtube.com : vignettes des ressources vidéo Formation (training-card).
              "img-src 'self' data: blob: https://*.supabase.co https://img.youtube.com",
              "font-src 'self' data:",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.openai.com https://unpkg.com https://*.ingest.de.sentry.io https://*.sentry.io",
              "media-src 'self' blob: https://*.supabase.co",
              // frame-src : lecteurs intégrés Formation (YouTube/Loom/Vimeo) + aperçu PDF
              // servi en iframe depuis une URL signée Supabase Storage (training-video-player).
              "frame-src 'self' https://*.supabase.co https://www.youtube.com https://www.loom.com https://player.vimeo.com",
              "frame-ancestors 'none'",
            ].join('; '),
          },
        ],
      },
    ]
  },
  async rewrites() {
    return [
      {
        source: "/ingest/static/:path*",
        destination: "https://eu-assets.i.posthog.com/static/:path*",
      },
      {
        source: "/ingest/array/:path*",
        destination: "https://eu-assets.i.posthog.com/array/:path*",
      },
      {
        source: "/ingest/:path*",
        destination: "https://eu.i.posthog.com/:path*",
      },
    ];
  },
  skipTrailingSlashRedirect: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
        pathname: "/storage/v1/object/**",
      },
      {
        protocol: "https",
        hostname: "img.youtube.com",
        pathname: "/vi/**",
      },
    ],
  },
};

export default withSentryConfig(nextConfig, {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  // org/project relus depuis l'env (les options explicites de withSentryConfig
  // écrasent sinon SENTRY_ORG/SENTRY_PROJECT). Le projet est résolu selon
  // l'environnement Vercel (VERCEL_ENV, fourni automatiquement) → aucune var à
  // configurer : prod → pharmaworkspace-prod, sinon pharmaworkspace-staging.
  // Surchargeable par SENTRY_PROJECT si besoin.
  org: process.env.SENTRY_ORG ?? "baseflow-xg",

  project:
    process.env.SENTRY_PROJECT ??
    (process.env.VERCEL_ENV === "production"
      ? "pharmaworkspace-prod"
      : "pharmaworkspace-staging"),

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Uncomment to route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  // tunnelRoute: "/monitoring",

  webpack: {
    // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
    // See the following for more information:
    // https://docs.sentry.io/product/crons/
    // https://vercel.com/docs/cron-jobs
    automaticVercelMonitors: true,

    // Tree-shaking options for reducing bundle size
    treeshake: {
      // Automatically tree-shake Sentry logger statements to reduce bundle size
      removeDebugLogging: true,
    },
  },
});
