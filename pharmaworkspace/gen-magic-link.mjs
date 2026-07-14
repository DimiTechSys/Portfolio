// Récupération d'accès à TON propre compte via l'API admin GoTrue (fetch natif, sans supabase-js).
// Usage : node gen-magic-link.mjs <email|userId> <SUPABASE_URL> <SERVICE_ROLE_KEY> [redirect_to]
// Fichier jetable : à supprimer après usage (rm gen-magic-link.mjs).

const [, , who, url, serviceKey, redirectTo] = process.argv
if (!who || !url || !serviceKey) {
  console.error('Usage: node gen-magic-link.mjs <email|userId> <SUPABASE_URL> <SERVICE_ROLE_KEY> [redirect_to]')
  process.exit(1)
}

const base = url.replace(/\/$/, '')
const headers = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' }

let email = who
if (!who.includes('@')) {
  const res = await fetch(`${base}/auth/v1/admin/users/${who}`, { headers })
  if (!res.ok) {
    console.error(`Impossible de résoudre l'email depuis cet id (HTTP ${res.status}):`, await res.text())
    process.exit(1)
  }
  const user = await res.json()
  if (!user?.email) {
    console.error('Utilisateur trouvé mais sans email:', JSON.stringify(user))
    process.exit(1)
  }
  email = user.email
  console.log(`id ${who} -> ${email}`)
}

const body = { type: 'magiclink', email }
if (redirectTo) body.redirect_to = redirectTo

const res = await fetch(`${base}/auth/v1/admin/generate_link`, {
  method: 'POST',
  headers,
  body: JSON.stringify(body),
})
if (!res.ok) {
  console.error(`Erreur generate_link (HTTP ${res.status}):`, await res.text())
  process.exit(1)
}
const data = await res.json()
const p = data.properties ?? data
const link = data.action_link ?? p.action_link
const otp = p.email_otp ?? data.email_otp
const hashed = p.hashed_token ?? data.hashed_token

console.log('\n=== Email résolu ===')
console.log(email)
console.log('\n=== CODE OTP (à saisir sur /verify — voie la plus fiable) ===')
console.log(otp ?? '(non renvoyé)')
console.log('\n=== Magic link (usage unique, ouvrir tout de suite) ===')
console.log(link ?? '(non renvoyé)')
if (hashed) {
  console.log('\n=== Verify URL manuelle (si besoin) ===')
  console.log(`${base}/auth/v1/verify?token=${hashed}&type=magiclink` + (redirectTo ? `&redirect_to=${encodeURIComponent(redirectTo)}` : ''))
}
console.log('')
