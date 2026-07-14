import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'

export type PolicySlug =
  | 'privacy'
  | 'dpa'
  | 'conditions-generales'
  | 'securite'
  | 'mentions-legales'

export type PolicyMetadata = {
  title: string
  version: string
  hash_placeholder?: string
  last_review?: string
  applies_to?: string
  gdpr_article?: string
}

export type LoadedPolicy = {
  metadata: PolicyMetadata
  content: string
}

export function loadPolicy(slug: PolicySlug): LoadedPolicy {
  const file = path.join(process.cwd(), 'legal', `${slug}.md`)
  const raw = fs.readFileSync(file, 'utf-8')
  const { data, content } = matter(raw)
  return { metadata: data as PolicyMetadata, content }
}
