import type { MetadataRoute } from 'next'

const BASE_URL = 'https://pharmaworkspace.fr'

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date()

  return [
    { url: `${BASE_URL}/`, lastModified, changeFrequency: 'weekly', priority: 1 },
    { url: `${BASE_URL}/tarifs`, lastModified, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${BASE_URL}/securite`, lastModified, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/signup`, lastModified, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/conditions-generales`, lastModified, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE_URL}/privacy`, lastModified, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE_URL}/dpa`, lastModified, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE_URL}/mentions-legales`, lastModified, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE_URL}/cookies`, lastModified, changeFrequency: 'yearly', priority: 0.3 },
  ]
}
