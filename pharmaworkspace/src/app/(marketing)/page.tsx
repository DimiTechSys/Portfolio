import type { Metadata } from 'next'
import { Hero } from '@/components/marketing/hero'
import { ProductShowcase } from '@/components/marketing/product-showcase'
import { ProductFeatures } from '@/components/marketing/product-features'
import { SecurityBand } from '@/components/marketing/security-band'
import { Testimonial } from '@/components/marketing/testimonial'
import { PricingPreview } from '@/components/marketing/pricing-preview'
import { Faq } from '@/components/marketing/faq'
import { CtaFinal } from '@/components/marketing/cta-final'
import { LandingViewTracker } from '@/components/marketing/landing-view-tracker'
import { SUPPORT_EMAIL } from '@/config/constants'

export const metadata: Metadata = {
  title: {
    absolute: 'PharmaWorkspace : La coordination de votre officine, en un seul espace',
  },
  description:
    "Remplacez le cahier de transmission, les post-it et le WhatsApp d'équipe par un seul espace partagé : tâches, ordonnances (OCR), ruptures, locations et planning. Co-construit avec plus de 110 pharmaciens, hébergé en France, conforme RGPD. 30 jours d'essai gratuit.",
  alternates: { canonical: '/' },
}

const JSON_LD = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': 'https://pharmaworkspace.fr/#organization',
      name: 'PharmaWorkspace',
      url: 'https://pharmaworkspace.fr',
      logo: 'https://pharmaworkspace.fr/logo.png',
      email: SUPPORT_EMAIL,
      areaServed: 'FR',
    },
    {
      '@type': 'SoftwareApplication',
      name: 'PharmaWorkspace',
      url: 'https://pharmaworkspace.fr',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web, iOS, Android',
      description:
        "L'espace de travail partagé des équipes officinales françaises : tâches, ordonnances (OCR), ruptures, locations et planning. Hébergé en France, conforme RGPD.",
      inLanguage: 'fr-FR',
      publisher: { '@id': 'https://pharmaworkspace.fr/#organization' },
      offers: {
        '@type': 'Offer',
        price: '49.00',
        priceCurrency: 'EUR',
        description: 'À partir de 49 € HT/mois, sans engagement (-20 % en annuel). 30 jours d’essai gratuit.',
      },
    },
  ],
}

export default function HomePage() {
  return (
    <>
      {/* Données structurées (schema.org) pour le référencement / rich results */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
      />
      <LandingViewTracker />
      <Hero />
      <ProductShowcase />
      <ProductFeatures />
      <SecurityBand />
      <Testimonial />
      <PricingPreview />
      <Faq />
      <CtaFinal />
    </>
  )
}
