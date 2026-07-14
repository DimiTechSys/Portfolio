# Migrations Supabase — Règles absolues

> **À lire OBLIGATOIREMENT avant toute opération qui touche le schéma DB.**
> Référencé par `CLAUDE.md` §12. Applicable à toi (dev humain) **et** à Claude Code / tout assistant IA qui travaille sur le repo.

---

## 0. Pourquoi ce document existe

En **mai 2026**, lors du setup d'un environnement staging via `supabase db push`, on a découvert que **3 tables (`notifications`, `prescription_items`, `drug_shortages`) existaient en prod mais n'avaient JAMAIS été créées via les migrations versionnées du repo**. Elles avaient été créées à la main dans le Dashboard SQL Editor au début du projet.

Conséquence : impossible de recréer la base à partir des migrations seules → schema drift permanent → debugging nightmare → migration `db push` échoue dès qu'on essaie de monter un nouvel env.

**Ce document existe pour empêcher cette erreur de se reproduire.**

---

## 1. Source unique de vérité : `supabase/migrations/`

**TOUTE modification de schéma DB se fait via un fichier de migration dans `supabase/migrations/`. Sans exception.**

Concrètement, **interdit** :
- `CREATE TABLE` dans le Dashboard SQL Editor de prod ou staging.
- `ALTER TABLE` direct.
- `CREATE POLICY` / `DROP POLICY` direct.
- `INSERT INTO storage.buckets` à la main.
- `CREATE EXTENSION` à la main (sauf via Dashboard → Database → Extensions, pour activation ; la migration en dépend doit le checker).

Si tu modifies la DB autrement, tu crées une dette de drift qui se découvre 6 mois plus tard quand quelqu'un essaie de recréer l'environnement (et qui coûte 2 jours à débugger).

**Exception unique** : les opérations one-shot de réparation/recovery qui ne touchent pas le schéma — par ex. supprimer une ligne corrompue, reset password user via `auth.admin`. Ces opérations sont OK via Dashboard.

---

## 2. Numérotation

- Format : `00XX_short_description.sql` (séquentiel, padding zéros).
- **Avant de créer une migration, vérifier dans `COORDINATION.md` §5** que le numéro n'est pas déjà alloué à un autre dev.
- Une fois la migration créée, **mettre à jour `COORDINATION.md`** dans la même PR.
- Si deux PRs concurrentes ont claimé le même numéro : celle mergée en premier garde, l'autre rebase et renomme.

---

## 3. Idempotence — non négociable

Toute migration doit être **idempotente** (rejouable plusieurs fois sans erreur). Sans ça, `supabase db reset` ne marche plus.

**Utiliser systématiquement** :
- `CREATE TABLE IF NOT EXISTS`
- `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`
- `DROP POLICY IF EXISTS ...; CREATE POLICY ...`
- `CREATE INDEX IF NOT EXISTS`
- `CREATE EXTENSION IF NOT EXISTS`
- `CREATE OR REPLACE FUNCTION`

Pour les opérations sans guard natif (`ALTER COLUMN`, `DROP COLUMN`, etc.) → wrapper dans un bloc défensif :

```sql
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'mytable'
      AND column_name = 'mycol'
  ) THEN
    ALTER TABLE public.mytable ALTER COLUMN mycol TYPE text;
  END IF;
END $$;
```

---

## 4. Ne JAMAIS éditer une migration déjà appliquée

Une fois qu'une migration `00XX_*.sql` est mergée sur `main` :
- **Ne change pas son contenu**.
- **Ne change pas son nom**.
- **Ne la supprime pas**.

Si tu as besoin de corriger ou compléter, **crée une nouvelle migration** qui patche.

**Pourquoi** : Supabase CLI track les migrations par version (extrait du nom de fichier), pas par contenu. Si tu changes une migration déjà appliquée en prod, le CLI ne re-roulera pas le nouveau contenu sur prod → prod et dev divergent silencieusement. C'est exactement comme ça qu'on crée du drift.

---

## 5. Test obligatoire : staging AVANT prod

Workflow non négociable pour toute migration :

1. Écris la migration `00XX_description.sql` en local.
2. **Test local** : `npx supabase db reset` (recrée la DB locale Docker from scratch avec TOUTES les migrations). Si une migration plante → corrige avant de continuer.
3. **Test sur staging** : `npx supabase db push` (link sur staging d'abord). Vérifie manuellement que l'app marche après.
4. Si OK → ouvre la PR, fais reviewer.
5. Après merge → push sur prod : `npx supabase link --project-ref <PROD_REF>` puis `npx supabase db push`.

**NE JAMAIS** exécuter une migration directement sur prod sans qu'elle ait passé staging.

---

## 6. Vérifier l'état réel de prod AVANT un nouveau `CREATE TABLE`

Avant d'écrire un `CREATE TABLE` dans une nouvelle migration, **vérifier sur prod que la table n'existe pas déjà** (sinon c'est du drift à réparer, pas une nouvelle table à créer) :

```sql
-- Dashboard PROD → SQL Editor
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

Si la table existe en prod mais pas dans `supabase/migrations/` → c'est un drift, à réparer (cf. Règle 7) **AVANT** d'ajouter quoi que ce soit dessus.

---

## 7. Réparer le drift avec une migration "repair"

Quand on découvre un drift (table en prod absente des migrations) :

1. **Dump le schéma actuel de prod** :
   ```bash
   npx supabase link --project-ref <PROD_REF>
   npx supabase db dump --schema public --linked > /tmp/prod-dump.sql
   ```
2. **Extraire les `CREATE TABLE`/index/policies** des tables manquantes du dump.
3. **Créer une migration** `00XX_repair_schema_drift_<scope>.sql` avec les `CREATE TABLE IF NOT EXISTS` + index + RLS + policies.
4. **Sur prod**, cette migration est no-op (les `IF NOT EXISTS` skip).
5. **Sur staging et tout nouvel env**, cette migration crée les tables.
6. **Marquer cette migration applied sur prod** sans la rejouer :
   ```bash
   npx supabase link --project-ref <PROD_REF>
   npx supabase migration repair --status applied 00XX
   ```
7. **Régénérer `supabase.sql`** (cf. Règle 8).

---

## 8. Snapshot `supabase.sql` à jour

Le fichier `supabase.sql` à la racine est un **snapshot lisible** du schéma actuel. À régénérer **après chaque migration mergée** :

```bash
npx supabase link --project-ref <PROD_REF>
npx supabase db dump --schema public --linked > supabase.sql
```

Commit le diff dans la même PR que la migration concernée.

Ce snapshot sert à :
- **La doc** : un dev qui ouvre le repo voit le schéma actuel d'un coup.
- **La review de PR** : on voit le schéma résultant sans devoir mentalement appliquer les migrations.
- **Le garde-fou** : un drift devient visible immédiatement (le snapshot ne match plus les migrations).

---

## 9. CI : `supabase db reset` doit passer

Une étape CI doit appliquer toutes les migrations sur une DB Postgres vide et vérifier qu'aucune n'échoue. **Ça aurait détecté le drift `notifications` dès le premier setup d'environnement.**

À intégrer dans `.github/workflows/ci.yml` (ticket P2-10) :

```yaml
- name: Verify migrations apply on fresh DB
  services:
    postgres:
      image: postgres:15
      env:
        POSTGRES_PASSWORD: test
      ports: ['5432:5432']
      options: >-
        --health-cmd pg_isready --health-interval 10s --health-timeout 5s --health-retries 5
  steps:
    - run: |
        # Active les extensions nécessaires
        psql postgresql://postgres:test@localhost:5432/postgres -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"
        psql postgresql://postgres:test@localhost:5432/postgres -c "CREATE EXTENSION IF NOT EXISTS \"pgcrypto\";"
        # Applique toutes les migrations
        for f in supabase/migrations/*.sql; do
          echo "Applying $f"
          psql postgresql://postgres:test@localhost:5432/postgres -f "$f" -v ON_ERROR_STOP=1 || exit 1
        done
```

---

## 10. Règles spécifiques pour Claude Code (et tout assistant IA)

Quand Claude Code doit créer ou modifier une migration, il doit :

1. **Lire ce fichier en premier**.
2. **Vérifier `COORDINATION.md` §5** pour le numéro à utiliser.
3. **Vérifier l'état actuel de la DB prod** (cf. Règle 6) avant tout `CREATE TABLE`.
4. **Toujours utiliser `IF NOT EXISTS` / `IF EXISTS`** (cf. Règle 3).
5. **Ne JAMAIS éditer une migration existante** (cf. Règle 4).
6. **Ne JAMAIS exécuter de DDL via Dashboard SQL Editor** — toujours via fichier de migration (cf. Règle 1).
7. **Tester via `npx supabase db reset` en local** avant de proposer la PR.
8. **En cas de doute, demander confirmation au lead humain** plutôt que d'inventer une approche.

### Signes d'alerte ("red flags") pour Claude Code

Si tu (Claude Code) te trouves à faire l'un de ces trucs, **STOP et demande au lead** :

- "Je vais juste créer cette table dans le Dashboard pour aller plus vite" → **NON**, crée une migration.
- "Je vais modifier la migration 0017 pour corriger ce bug" → **NON**, crée 00XX_fix_0017.sql.
- "Je vais juste ajouter une policy directement sur prod" → **NON**, fais une migration.
- "Je crée la table avec `CREATE TABLE foo (...)` (sans `IF NOT EXISTS`)" → **NON**, ajoute le `IF NOT EXISTS`.
- "Je vais delete la migration parce qu'elle ne marche pas" → **NON**, crée une migration corrective.
- "Le numéro 00XX est déjà pris, je vais juste utiliser le suivant sans vérifier `COORDINATION.md`" → **NON**, vérifie d'abord.

### Process recommandé pour une nouvelle migration

```
1. Lire MIGRATIONS_GUARDRAILS.md (ce fichier).
2. Lire COORDINATION.md §5 → claim un numéro.
3. Vérifier l'état prod via Dashboard SQL Editor (Règle 6).
4. Écrire la migration avec IF NOT EXISTS / IF EXISTS.
5. Tester en local : npx supabase db reset.
6. Tester sur staging : link + db push.
7. Régénérer supabase.sql (Règle 8).
8. Mettre à jour COORDINATION.md.
9. Ouvrir la PR avec ces 3 fichiers : la migration, supabase.sql, COORDINATION.md.
```

---

## 10b. Limite connue : setup d'un environnement fresh (post-drift)

Suite au drift découvert en mai 2026, les migrations historiques `0007`, `0008`, `0011`, `0025` **assument l'existence de tables** (`notifications`, `prescription_items`, `drug_shortages`) **qu'aucune migration antérieure ne crée**. La migration `0027_repair_schema_drift.sql` crée ces tables, mais elle s'exécute *après* les migrations qui les référencent — donc sur un **environnement complètement neuf**, `supabase db push` (ou `db reset`) **échouera** sur la migration `0007` avant d'atteindre `0027`.

### Solution A — Setup d'un nouvel environnement (staging, nouveau dev, CI fresh)
Avant le premier `supabase db push`, applique manuellement le contenu de `0027_repair_schema_drift.sql` sur la base vide (via SQL Editor du Dashboard cible), puis marque `0027` comme appliquée et continue :

```bash
npx supabase migration repair --status applied 0027
npx supabase db push
```

### Solution B — Environnement déjà partiellement migré (cas du staging actuel, 21/05/2026)
Si `0001` à `0006` sont déjà appliquées et que `0007` a échoué :
1. Applique le contenu de `0027_repair_schema_drift.sql` via SQL Editor.
2. Relance `npx supabase db push` (qui reprend à `0007`).
3. Une fois `0027` atteint dans la séquence, le CLI le marquera applied automatiquement.

### Solution C — Long terme (à envisager si on revient sur un fresh setup propre)
Ré-éditer les migrations `0007`, `0008`, `0011`, `0025` pour wrapper leurs opérations sur tables manquantes dans des blocs défensifs :

```sql
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'notifications'
  ) THEN
    -- ops sur notifications ici
  END IF;
END $$;
```

C'est techniquement une dérogation à la **Règle 4** (ne pas éditer une migration appliquée), justifiable parce que la modification serait purement **défensive** (idempotente, sans changement de comportement sur les envs où le drift n'existe pas — les conditions `IF EXISTS` y évalueraient à `true`). Pour l'instant on accepte la limitation A/B plutôt que de toucher l'historique. À reconsidérer le jour où on veut une CI propre avec `supabase db reset` sur Postgres vide.

---

## 11. Référence rapide — commandes Supabase CLI

```bash
# Lien et delinking
npx supabase link --project-ref <REF>      # lier au projet
npx supabase unlink                         # délier

# Migrations
npx supabase migration new <name>           # crée un fichier 00XX_<name>.sql
npx supabase db push                        # applique les migrations en pending sur le projet lié
npx supabase db pull                        # importe les changements faits manuellement sur le projet lié (à éviter en routine)
npx supabase migration repair --status applied <version>   # marque une migration comme appliquée sans la rejouer
npx supabase migration list                 # liste les migrations et leur statut

# Dump et reset
npx supabase db dump --schema public --linked > snapshot.sql   # dump le schéma actuel
npx supabase db reset                       # WIPE et re-applique toutes les migrations en local (Docker)
```
