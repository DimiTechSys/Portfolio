# Déploiement sur Vercel + Supabase (PostgreSQL)

L'app est prête pour la production. Base : **Supabase** (PostgreSQL) via `@prisma/adapter-pg`.

## Variables d'environnement (Vercel)

| Variable | Rôle |
| -------- | ---- |
| `DATABASE_URL` | Connexion runtime — **pooler** Supabase (Transaction, port 6543, `?pgbouncer=true&sslmode=require`) |
| `DIRECT_URL` | Connexion directe (port 5432) — pour les migrations |
| `SESSION_SECRET` | Chaîne aléatoire longue (signature des cookies admin) |
| `ADMIN_PASSWORD` | Mot de passe initial du back-office (utilisé au seed) |

Les deux URL Supabase : **Supabase → Project Settings → Database → Connection string**
(onglet « Connection pooling » pour le pooler, « Direct connection » pour le direct).

## Étapes

```bash
# 1. Provisionner la base Supabase (tables + catalogue d'exemple)
#    (en local, avec les variables ci-dessus dans .env)
npm run db:provision         # prisma db push + seed

# 2. Déployer sur Vercel (avec un token : https://vercel.com/account/tokens)
export VERCEL_TOKEN="…"
vercel link --yes --token $VERCEL_TOKEN
vercel env add DATABASE_URL  production --token $VERCEL_TOKEN   # coller l'URL pooler
vercel env add DIRECT_URL    production --token $VERCEL_TOKEN   # coller l'URL directe
vercel env add SESSION_SECRET production --token $VERCEL_TOKEN
vercel env add ADMIN_PASSWORD production --token $VERCEL_TOKEN
vercel deploy --prod --token $VERCEL_TOKEN
```

## Après déploiement

- Vitrine : `https://<projet>.vercel.app`
- Back-office : `https://<projet>.vercel.app/admin` (mot de passe = `ADMIN_PASSWORD`,
  à changer ensuite dans *Paramètres*).
