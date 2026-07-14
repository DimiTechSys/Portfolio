// scripts/hash-legal.mjs
//
// P3-05 — Calcule le SHA-256 du contenu (hors frontmatter) des documents
// légaux signés au click-wrap, puis patche `src/lib/legal/consent-versions.ts`
// avec les versions + hashes courants.
//
// À relancer à chaque fois que `legal/conditions-generales.md` ou `legal/dpa.md`
// est modifié. Le hash est utilisé à l'inscription pour stocker dans
// `pharmacy_acquisition.{cgs_hash,dpa_hash}` la preuve cryptographique de
// CE QUI a été accepté à T0 (RGPD art. 7).
//
// Usage : `node scripts/hash-legal.mjs`
// (pas de transpilation TS nécessaire — ESM natif Node + gray-matter déjà
// installé pour le rendu UI)

import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import matter from 'gray-matter'

const ROOT = process.cwd()

const TARGETS = [
  {
    key: 'CGS',
    file: 'legal/conditions-generales.md',
    versionConst: 'CGS_VERSION',
    hashConst: 'CGS_HASH',
  },
  {
    key: 'DPA',
    file: 'legal/dpa.md',
    versionConst: 'DPA_VERSION',
    hashConst: 'DPA_HASH',
  },
]

function hashPolicy(relPath) {
  const full = path.join(ROOT, relPath)
  const raw = fs.readFileSync(full, 'utf-8')
  const { data, content } = matter(raw)

  if (!data.version) {
    throw new Error(`[hash-legal] ${relPath} : frontmatter manque le champ \`version\``)
  }

  // On hash le contenu hors frontmatter — c'est ce que voit l'utilisateur
  // au click-wrap. Le frontmatter est de la métadonnée dev.
  const sha = crypto.createHash('sha256').update(content, 'utf-8').digest('hex')

  return {
    version: String(data.version),
    hash: `sha256:${sha}`,
  }
}

const versionsFile = path.join(ROOT, 'src/lib/legal/consent-versions.ts')
let source = fs.readFileSync(versionsFile, 'utf-8')

const results = []
for (const target of TARGETS) {
  const { version, hash } = hashPolicy(target.file)

  const versionRegex = new RegExp(
    `(export const ${target.versionConst} = ')[^']*(')`,
  )
  const hashRegex = new RegExp(
    `(export const ${target.hashConst} = ')[^']*(')`,
  )

  if (!versionRegex.test(source)) {
    throw new Error(`[hash-legal] ${target.versionConst} introuvable dans ${versionsFile}`)
  }
  if (!hashRegex.test(source)) {
    throw new Error(`[hash-legal] ${target.hashConst} introuvable dans ${versionsFile}`)
  }

  source = source.replace(versionRegex, `$1${version}$2`)
  source = source.replace(hashRegex, `$1${hash}$2`)

  results.push({ ...target, version, hash })
}

fs.writeFileSync(versionsFile, source, 'utf-8')

console.log('✓ Versions + hashes mis à jour dans src/lib/legal/consent-versions.ts :\n')
for (const r of results) {
  console.log(`  ${r.versionConst} = '${r.version}'`)
  console.log(`  ${r.hashConst} = '${r.hash}'\n`)
}

// Sanity check : aucun 'TBD' ne doit rester dans le fichier
if (source.includes('TBD')) {
  console.error('⚠ Attention : il reste des occurrences "TBD" dans le fichier patché.')
  process.exit(1)
}
