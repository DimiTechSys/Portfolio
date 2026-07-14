-- 0058 — Durcissement des privilèges du rôle `anon` (L2 conservateur)
--
-- Contexte : aujourd'hui le rôle `anon` (clé publishable, client pré-login)
-- reçoit GRANT ALL sur TOUTES les tables de `public` (héritage du bootstrap
-- Supabase). La RLS est donc l'unique rempart. On réduit la surface d'attaque
-- du rôle pré-authentification : un client `anon` n'a en pratique besoin
-- d'AUCUNE table métier de `public` —
--   * l'authentification passe par GoTrue (schéma `auth`, pas `public`) ;
--   * les flux invite / onboarding lisent `profiles`/`invitations` via le
--     client navigateur APRÈS l'OTP (rôle `authenticated`), ou via la clé
--     `service_role` côté routes serveur (`/api/invite/*`) ;
--   * les pages publiques (landing, tarifs, sécurité, mentions légales, CGU,
--     DPA, cookies, privacy, signup, login, verify) sont statiques et ne lisent
--     AUCUNE table de `public`.
--
-- Portée volontairement limitée :
--   * on ne touche QU'AU rôle `anon`. Les grants `authenticated` et
--     `service_role` restent inchangés (les durcir sans matrice de privilèges
--     complète serait trop risqué — étape ultérieure).
--   * on EXCLUT les données de référence réellement « publiques » (voir plus
--     bas) pour ne pas casser un éventuel usage pré-login futur.
--
-- Idempotent : REVOKE est naturellement rejouable (no-op si déjà révoqué) ;
-- ALTER DEFAULT PRIVILEGES ... REVOKE l'est aussi.

-- ── Référence publique conservée (NON révoquée) ──────────────────────────────
-- `drug_shortages` (ruptures ANSM) est désigné comme donnée de référence dans
-- CLAUDE.md §7 ; la roadmap prévoit un refresh ANSM/BDPM et une exposition
-- potentielle hors-login. Sa RLS exige déjà `auth.uid() IS NOT NULL`, donc un
-- anon ne lit rien aujourd'hui même avec le grant. Par prudence (L2 = ne pas
-- casser un usage public futur), on LAISSE le grant `anon` sur cette seule
-- table de référence. (La table `medications`/BDPM citée dans CLAUDE.md §7
-- n'existe pas dans le schéma réel — rien à conserver de ce côté.)

-- ── REVOKE des tables métier sur anon ────────────────────────────────────────
-- Liste = toutes les tables de `public` présentes dans le snapshot `supabase.sql`
-- SAUF `drug_shortages` (conservée ci-dessus).
REVOKE ALL ON TABLE public.audit_log              FROM anon;
REVOKE ALL ON TABLE public.chat_channels          FROM anon;
REVOKE ALL ON TABLE public.chat_messages          FROM anon;
REVOKE ALL ON TABLE public.chat_read_states       FROM anon;
REVOKE ALL ON TABLE public.contacts               FROM anon;
REVOKE ALL ON TABLE public.feedback               FROM anon;
REVOKE ALL ON TABLE public.invitations            FROM anon;
REVOKE ALL ON TABLE public.leave_requests         FROM anon;
REVOKE ALL ON TABLE public.notifications          FROM anon;
REVOKE ALL ON TABLE public.order_items            FROM anon;
REVOKE ALL ON TABLE public.orders                 FROM anon;
REVOKE ALL ON TABLE public.pharmacies             FROM anon;
REVOKE ALL ON TABLE public.pharmacy_acquisition   FROM anon;
REVOKE ALL ON TABLE public.prescription_comments  FROM anon;
REVOKE ALL ON TABLE public.prescription_items     FROM anon;
REVOKE ALL ON TABLE public.prescriptions          FROM anon;
REVOKE ALL ON TABLE public.profiles               FROM anon;
REVOKE ALL ON TABLE public.rental_attachments     FROM anon;
REVOKE ALL ON TABLE public.rentals                FROM anon;
REVOKE ALL ON TABLE public.shortages              FROM anon;
REVOKE ALL ON TABLE public.stripe_webhook_log     FROM anon;
REVOKE ALL ON TABLE public.suppliers              FROM anon;
REVOKE ALL ON TABLE public.tasks                  FROM anon;
REVOKE ALL ON TABLE public.training_resources     FROM anon;
REVOKE ALL ON TABLE public.weekly_schedules       FROM anon;
REVOKE ALL ON TABLE public.work_session_segments  FROM anon;
REVOKE ALL ON TABLE public.work_sessions          FROM anon;

-- ── DEFAULT PRIVILEGES : ne plus re-granter anon sur les futures tables ──────
-- Le bootstrap Supabase pose `ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN
-- SCHEMA public GRANT ALL ON TABLES TO anon`, donc toute table créée ensuite
-- (par `postgres`/migrations) re-grante anon par défaut. On retire `anon` de
-- ce default pour que les nouvelles tables métier ne soient PAS exposées à anon
-- sans décision explicite. (authenticated / service_role restent par défaut.)
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON TABLES FROM anon;
