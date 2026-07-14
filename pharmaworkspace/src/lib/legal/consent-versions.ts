// Versions courantes des documents légaux acceptables au click-wrap signup.
// **Ne pas éditer à la main.** Source de vérité = `legal/conditions-generales.md`
// et `legal/dpa.md` (frontmatter `version`). À chaque modification de ces
// fichiers, relancer `node scripts/hash-legal.mjs` qui recalcule les hashes
// sha256 et patche ce fichier en place.
//
// Le hash sert d'empreinte audit RGPD art. 7 (preuve de ce qui a été accepté
// par l'utilisateur au moment du click-wrap). Stocké dans
// `pharmacy_acquisition.{cgs_hash,dpa_hash}` à chaque inscription.

export const CGS_VERSION = '2026-06-12'
export const CGS_HASH = 'sha256:145a8560c143d61173dc0b4cb6f31ab0f76ce5ae534be7d38fdde4b9c8500b71'
export const DPA_VERSION = '2026-06-12'
export const DPA_HASH = 'sha256:0aca89fda2161e38c437860f4546680e75fccc35f73b56077df6a2cb73dc274f'

export const CGS_URL = '/conditions-generales'
export const DPA_URL = '/dpa'
