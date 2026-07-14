# PharmaWorkspace — Analyse critique du MVP

## Ce qui fonctionne

- Auth OTP email complet
- Onboarding titulaire
- Navigation et routing
- Modules CRUD de base (tâches, ordonnances, commandes, locations, ruptures)
- Gestion d'équipe et invitations
- Session de travail avec notes de transmission
- Dashboard KPIs

---

## Problèmes critiques

### 1. Schéma de données incomplet

**Ordonnances**
La table `prescriptions` n'a pas de lignes de médicaments. Un pharmacien ne peut pas travailler sans savoir quels produits sont sur l'ordonnance. La table `prescription_items` a été supprimée lors de la migration parce qu'elle était mal implémentée — le concept est pourtant légitime et nécessaire.

Colonnes manquantes : `prescriber_name`, `prescribed_date`, `expiry_date`.

**Locations**
`daily_rate` a été supprimé lors de la migration. Une location de matériel médical a toujours un tarif — sans ça, le module est inutilisable pour la facturation.

**Ruptures**
Pas de `cip13` (code produit pharmacie), pas de date de détection distincte de `created_at`, pas de lien vers un fournisseur alternatif. Le signalement est trop vague pour être actionnable.

**Sessions de travail**
`tasks_completed` est un compteur qui peut diverger si une tâche est modifiée après la clôture de session. Fragile.

---

### 2. Flux d'invitation non validé

La page `/invite/[token]` existe mais le flux complet n'a pas été testé de bout en bout. Quand un invité clique sur le lien, entre son OTP, crée son profil — `pharmacy_id` et `role` ne sont probablement pas correctement assignés depuis les metadata auth. Ce flux est cassé en production.

---

### 3. Sécurité — RLS désactivé

`pharmacies` et `profiles` ont le Row Level Security désactivé. En production, tout utilisateur Supabase authentifié peut lire et modifier tous les profils et toutes les pharmacies de la base. Ce n'est pas acceptable avant un déploiement.

---

### 4. Types TypeScript désalignés

`src/types/index.ts` n'a jamais été audité. Les types composites comme `TaskWithProfiles`, `OrderWithDetails`, `ShortageWithPrescription`, `NewRental`, `NewSupplier` sont probablement incomplets ou incorrects par rapport au schéma réel. Ça provoque des erreurs runtime silencieuses.

---

### 5. Fonctionnalités manquantes pour une utilisation réelle

| Fonctionnalité | Impact | Modules concernés |
|---|---|---|
| Recherche dans les listes | Bloquant | Tous |
| Pagination serveur | Bloquant à volume | Tous |
| Filtres par date | Important | Ordonnances, Commandes |
| Notifications tâches en retard | Important | Dashboard, Tâches |
| Export / impression | Important | Ordonnances, Commandes |
| Mode hors-ligne | Futur | — |

---

### 6. Performance

Le `ProfileContext` a réduit les requêtes dupliquées mais le démarrage reste séquentiel : auth → profiles → pharmacies. Sur mobile ou réseau lent, le délai est perceptible. Aucune stratégie de cache, aucune optimistic update.

---

### 7. Pas de gestion d'erreur globale

Les erreurs Supabase sont affichées localement dans chaque composant. Aucun logging, aucune retry logic, aucun état empty/error cohérent entre les modules. En production ça rend le débogage difficile.

---

## Priorités recommandées avant pilote terrain

1. **Réactiver RLS** sur `pharmacies` et `profiles` avec les bonnes policies
2. **Valider le flux d'invitation** de bout en bout
3. **Ajouter `prescription_items`** — sans ça le module ordonnances est inutilisable
4. **Réintroduire `daily_rate`** dans `rentals`
5. **Auditer `types/index.ts`** et aligner sur le schéma réel
6. **Ajouter la recherche** dans les modules critiques (ordonnances, ruptures)

---

## Ce qui peut attendre la V2

- Pagination serveur
- Notifications push
- Export PDF
- Mode hors-ligne
- PILL Chat (RAG)
- Intégration LGO (logiciel de gestion officine)
