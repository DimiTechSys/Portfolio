-- 0038_rls_initplan_optim.sql
-- P2-07: Optimisation des policies RLS via InitPlan.
--
-- Sans wrapping, Postgres ré-évalue get_pharmacy_id() / get_user_role() une
-- fois par ligne parcourue par la policy. En les enveloppant dans
-- (select public.get_*()), le planificateur génère un InitPlan : la fonction
-- est évaluée UNE seule fois par requête. Gain attendu ×3-5 sur les
-- grosses tables (notifications, prescription_items, tasks, work_session_segments).
--
-- Voir https://supabase.com/docs/guides/database/postgres/row-level-security#performance
-- section "Call functions with select".
--
-- Sémantique inchangée : seul le wrapping de l'appel aux deux helpers
-- change. Aucune colonne, aucun rôle, aucune condition n'est modifié.
--
-- Idempotent : DROP POLICY IF EXISTS + CREATE POLICY pour chaque policy.
-- État de référence : état FINAL du schéma après application des migrations
-- 0001..0037 (en particulier, les redéfinitions de 0015 sur tasks,
-- 0018 sur work_sessions, 0027 sur notifications et 0028 sur pharmacies).
--
-- Les policies suivantes ne sont PAS touchées par cette migration :
--   - storage.objects sur attachments/prescriptions et training_files_select/update
--     → utilisent déjà un (SELECT ... FROM public.profiles ...) inline
--       qui bénéficie déjà du même InitPlan.
--   - work_sessions_insert / work_sessions_update (redéfinies par 0018)
--     → mêmes raisons : inline subquery déjà optimisé.
--   - drug_shortages_select / medications_select / pharmacies_insert_onboarding
--     / profiles_insert_self / invitations_select / work_sessions_delete
--     → n'appellent ni get_pharmacy_id() ni get_user_role().

-- ============================================================
-- public.pharmacies
-- ============================================================

-- Définie en 0002, jamais re-droppée par 0028 → toujours active.
DROP POLICY IF EXISTS pharmacies_select_member ON public.pharmacies;
CREATE POLICY pharmacies_select_member
ON public.pharmacies
FOR SELECT
USING (id = (select public.get_pharmacy_id()));

-- Définie en 0002, toujours active.
DROP POLICY IF EXISTS pharmacies_update_titulaire ON public.pharmacies;
CREATE POLICY pharmacies_update_titulaire
ON public.pharmacies
FOR UPDATE
USING (
  id = (select public.get_pharmacy_id())
  AND (select public.get_user_role()) = 'titulaire'
)
WITH CHECK (
  id = (select public.get_pharmacy_id())
  AND (select public.get_user_role()) = 'titulaire'
);

-- Définie en 0028 (override la version 0002).
DROP POLICY IF EXISTS pharmacies_select_onboarding ON public.pharmacies;
CREATE POLICY pharmacies_select_onboarding
ON public.pharmacies
FOR SELECT
TO authenticated
USING (
  id = (select public.get_pharmacy_id())
  OR (
    auth.uid() IS NOT NULL
    AND NOT EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid() AND p.pharmacy_id IS NOT NULL
    )
  )
);

-- ============================================================
-- public.profiles
-- ============================================================

DROP POLICY IF EXISTS profiles_select_scoped ON public.profiles;
CREATE POLICY profiles_select_scoped
ON public.profiles
FOR SELECT
USING (
  id = auth.uid()
  OR pharmacy_id = (select public.get_pharmacy_id())
);

DROP POLICY IF EXISTS profiles_update_self_or_titulaire ON public.profiles;
CREATE POLICY profiles_update_self_or_titulaire
ON public.profiles
FOR UPDATE
USING (
  id = auth.uid()
  OR (
    pharmacy_id = (select public.get_pharmacy_id())
    AND (select public.get_user_role()) = 'titulaire'
  )
)
WITH CHECK (
  id = auth.uid()
  OR (
    pharmacy_id = (select public.get_pharmacy_id())
    AND (select public.get_user_role()) = 'titulaire'
  )
);

-- ============================================================
-- public.invitations
-- ============================================================

DROP POLICY IF EXISTS "invitations_insert" ON public.invitations;
CREATE POLICY "invitations_insert"
ON public.invitations
FOR INSERT
WITH CHECK (
  pharmacy_id = (select public.get_pharmacy_id())
  AND (select public.get_user_role()) = 'titulaire'
);

DROP POLICY IF EXISTS "invitations_update" ON public.invitations;
CREATE POLICY "invitations_update"
ON public.invitations
FOR UPDATE
USING (
  pharmacy_id = (select public.get_pharmacy_id())
  AND (select public.get_user_role()) = 'titulaire'
);

DROP POLICY IF EXISTS "invitations_delete" ON public.invitations;
CREATE POLICY "invitations_delete"
ON public.invitations
FOR DELETE
USING (
  pharmacy_id = (select public.get_pharmacy_id())
  AND (select public.get_user_role()) = 'titulaire'
);

-- ============================================================
-- public.work_sessions
--   work_sessions_insert / work_sessions_update redéfinies en 0018
--   avec un subquery inline : on n'y touche pas (déjà InitPlan).
-- ============================================================

DROP POLICY IF EXISTS "work_sessions_select" ON public.work_sessions;
CREATE POLICY "work_sessions_select"
ON public.work_sessions
FOR SELECT
USING (pharmacy_id = (select public.get_pharmacy_id()));

-- ============================================================
-- public.tasks
--   tasks_insert / tasks_update redéfinies en 0015.
-- ============================================================

DROP POLICY IF EXISTS "tasks_select" ON public.tasks;
CREATE POLICY "tasks_select"
ON public.tasks
FOR SELECT
USING (pharmacy_id = (select public.get_pharmacy_id()));

DROP POLICY IF EXISTS "tasks_insert" ON public.tasks;
CREATE POLICY "tasks_insert"
ON public.tasks
FOR INSERT
WITH CHECK (pharmacy_id = (select public.get_pharmacy_id()));

DROP POLICY IF EXISTS "tasks_update" ON public.tasks;
CREATE POLICY "tasks_update"
ON public.tasks
FOR UPDATE
USING (pharmacy_id = (select public.get_pharmacy_id()))
WITH CHECK (pharmacy_id = (select public.get_pharmacy_id()));

DROP POLICY IF EXISTS "tasks_delete" ON public.tasks;
CREATE POLICY "tasks_delete"
ON public.tasks
FOR DELETE
USING (
  pharmacy_id = (select public.get_pharmacy_id())
  AND (select public.get_user_role()) = 'titulaire'
);

-- ============================================================
-- public.prescriptions
-- ============================================================

DROP POLICY IF EXISTS "prescriptions_select" ON public.prescriptions;
CREATE POLICY "prescriptions_select"
ON public.prescriptions
FOR SELECT
USING (pharmacy_id = (select public.get_pharmacy_id()));

DROP POLICY IF EXISTS "prescriptions_insert" ON public.prescriptions;
CREATE POLICY "prescriptions_insert"
ON public.prescriptions
FOR INSERT
WITH CHECK (pharmacy_id = (select public.get_pharmacy_id()));

DROP POLICY IF EXISTS "prescriptions_update" ON public.prescriptions;
CREATE POLICY "prescriptions_update"
ON public.prescriptions
FOR UPDATE
USING (pharmacy_id = (select public.get_pharmacy_id()));

DROP POLICY IF EXISTS "prescriptions_delete" ON public.prescriptions;
CREATE POLICY "prescriptions_delete"
ON public.prescriptions
FOR DELETE
USING (
  pharmacy_id = (select public.get_pharmacy_id())
  AND (select public.get_user_role()) IN ('titulaire', 'adjoint')
);

-- ============================================================
-- public.prescription_comments
-- ============================================================

DROP POLICY IF EXISTS "prescription_comments_select" ON public.prescription_comments;
CREATE POLICY "prescription_comments_select"
ON public.prescription_comments
FOR SELECT
USING (pharmacy_id = (select public.get_pharmacy_id()));

DROP POLICY IF EXISTS "prescription_comments_insert" ON public.prescription_comments;
CREATE POLICY "prescription_comments_insert"
ON public.prescription_comments
FOR INSERT
WITH CHECK (
  pharmacy_id = (select public.get_pharmacy_id())
  AND author_id = auth.uid()
);

DROP POLICY IF EXISTS "prescription_comments_delete" ON public.prescription_comments;
CREATE POLICY "prescription_comments_delete"
ON public.prescription_comments
FOR DELETE
USING (
  pharmacy_id = (select public.get_pharmacy_id())
  AND (
    author_id = auth.uid()
    OR (select public.get_user_role()) = 'titulaire'
  )
);

-- ============================================================
-- public.prescription_items  (créée par 0027)
-- ============================================================

DROP POLICY IF EXISTS prescription_items_select ON public.prescription_items;
CREATE POLICY prescription_items_select
ON public.prescription_items
FOR SELECT
USING (pharmacy_id = (select public.get_pharmacy_id()));

DROP POLICY IF EXISTS prescription_items_insert ON public.prescription_items;
CREATE POLICY prescription_items_insert
ON public.prescription_items
FOR INSERT
WITH CHECK (pharmacy_id = (select public.get_pharmacy_id()));

DROP POLICY IF EXISTS prescription_items_update ON public.prescription_items;
CREATE POLICY prescription_items_update
ON public.prescription_items
FOR UPDATE
USING (pharmacy_id = (select public.get_pharmacy_id()));

DROP POLICY IF EXISTS prescription_items_delete ON public.prescription_items;
CREATE POLICY prescription_items_delete
ON public.prescription_items
FOR DELETE
USING (
  pharmacy_id = (select public.get_pharmacy_id())
  AND (select public.get_user_role()) = ANY (ARRAY[
    'titulaire'::user_role,
    'adjoint'::user_role
  ])
);

-- ============================================================
-- public.suppliers
-- ============================================================

DROP POLICY IF EXISTS "suppliers_select" ON public.suppliers;
CREATE POLICY "suppliers_select"
ON public.suppliers
FOR SELECT
USING (pharmacy_id = (select public.get_pharmacy_id()));

DROP POLICY IF EXISTS "suppliers_insert" ON public.suppliers;
CREATE POLICY "suppliers_insert"
ON public.suppliers
FOR INSERT
WITH CHECK (pharmacy_id = (select public.get_pharmacy_id()));

DROP POLICY IF EXISTS "suppliers_update" ON public.suppliers;
CREATE POLICY "suppliers_update"
ON public.suppliers
FOR UPDATE
USING (pharmacy_id = (select public.get_pharmacy_id()));

DROP POLICY IF EXISTS "suppliers_delete" ON public.suppliers;
CREATE POLICY "suppliers_delete"
ON public.suppliers
FOR DELETE
USING (
  pharmacy_id = (select public.get_pharmacy_id())
  AND (select public.get_user_role()) IN ('titulaire', 'adjoint')
);

-- ============================================================
-- public.orders
-- ============================================================

DROP POLICY IF EXISTS "orders_select" ON public.orders;
CREATE POLICY "orders_select"
ON public.orders
FOR SELECT
USING (pharmacy_id = (select public.get_pharmacy_id()));

DROP POLICY IF EXISTS "orders_insert" ON public.orders;
CREATE POLICY "orders_insert"
ON public.orders
FOR INSERT
WITH CHECK (pharmacy_id = (select public.get_pharmacy_id()));

DROP POLICY IF EXISTS "orders_update" ON public.orders;
CREATE POLICY "orders_update"
ON public.orders
FOR UPDATE
USING (pharmacy_id = (select public.get_pharmacy_id()));

DROP POLICY IF EXISTS "orders_delete" ON public.orders;
CREATE POLICY "orders_delete"
ON public.orders
FOR DELETE
USING (
  pharmacy_id = (select public.get_pharmacy_id())
  AND (select public.get_user_role()) IN ('titulaire', 'adjoint')
);

-- ============================================================
-- public.order_items
-- ============================================================

DROP POLICY IF EXISTS "order_items_select" ON public.order_items;
CREATE POLICY "order_items_select"
ON public.order_items
FOR SELECT
USING (pharmacy_id = (select public.get_pharmacy_id()));

DROP POLICY IF EXISTS "order_items_insert" ON public.order_items;
CREATE POLICY "order_items_insert"
ON public.order_items
FOR INSERT
WITH CHECK (pharmacy_id = (select public.get_pharmacy_id()));

DROP POLICY IF EXISTS "order_items_update" ON public.order_items;
CREATE POLICY "order_items_update"
ON public.order_items
FOR UPDATE
USING (pharmacy_id = (select public.get_pharmacy_id()));

DROP POLICY IF EXISTS "order_items_delete" ON public.order_items;
CREATE POLICY "order_items_delete"
ON public.order_items
FOR DELETE
USING (pharmacy_id = (select public.get_pharmacy_id()));

-- ============================================================
-- public.rentals
-- ============================================================

DROP POLICY IF EXISTS "rentals_select" ON public.rentals;
CREATE POLICY "rentals_select"
ON public.rentals
FOR SELECT
USING (pharmacy_id = (select public.get_pharmacy_id()));

DROP POLICY IF EXISTS "rentals_insert" ON public.rentals;
CREATE POLICY "rentals_insert"
ON public.rentals
FOR INSERT
WITH CHECK (pharmacy_id = (select public.get_pharmacy_id()));

DROP POLICY IF EXISTS "rentals_update" ON public.rentals;
CREATE POLICY "rentals_update"
ON public.rentals
FOR UPDATE
USING (pharmacy_id = (select public.get_pharmacy_id()));

DROP POLICY IF EXISTS "rentals_delete" ON public.rentals;
CREATE POLICY "rentals_delete"
ON public.rentals
FOR DELETE
USING (
  pharmacy_id = (select public.get_pharmacy_id())
  AND (select public.get_user_role()) IN ('titulaire', 'adjoint')
);

-- ============================================================
-- public.shortages
-- ============================================================

DROP POLICY IF EXISTS "shortages_select" ON public.shortages;
CREATE POLICY "shortages_select"
ON public.shortages
FOR SELECT
USING (pharmacy_id = (select public.get_pharmacy_id()));

DROP POLICY IF EXISTS "shortages_insert" ON public.shortages;
CREATE POLICY "shortages_insert"
ON public.shortages
FOR INSERT
WITH CHECK (pharmacy_id = (select public.get_pharmacy_id()));

DROP POLICY IF EXISTS "shortages_update" ON public.shortages;
CREATE POLICY "shortages_update"
ON public.shortages
FOR UPDATE
USING (pharmacy_id = (select public.get_pharmacy_id()));

DROP POLICY IF EXISTS "shortages_delete" ON public.shortages;
CREATE POLICY "shortages_delete"
ON public.shortages
FOR DELETE
USING (
  pharmacy_id = (select public.get_pharmacy_id())
  AND (select public.get_user_role()) = 'titulaire'
);

-- ============================================================
-- public.notifications  (état final défini par 0027)
-- ============================================================

DROP POLICY IF EXISTS notifications_select ON public.notifications;
CREATE POLICY notifications_select
ON public.notifications
FOR SELECT
USING (pharmacy_id = (select public.get_pharmacy_id()));

DROP POLICY IF EXISTS notifications_insert ON public.notifications;
CREATE POLICY notifications_insert
ON public.notifications
FOR INSERT
WITH CHECK (
  pharmacy_id = (select public.get_pharmacy_id())
  AND (select public.get_user_role()) = ANY (ARRAY[
    'titulaire'::user_role,
    'adjoint'::user_role,
    'preparateur'::user_role
  ])
);

DROP POLICY IF EXISTS notifications_update ON public.notifications;
CREATE POLICY notifications_update
ON public.notifications
FOR UPDATE
USING (
  user_id = auth.uid()
  AND pharmacy_id = (select public.get_pharmacy_id())
)
WITH CHECK (
  user_id = auth.uid()
  AND pharmacy_id = (select public.get_pharmacy_id())
);

DROP POLICY IF EXISTS notifications_delete ON public.notifications;
CREATE POLICY notifications_delete
ON public.notifications
FOR DELETE
USING (
  user_id = auth.uid()
  AND pharmacy_id = (select public.get_pharmacy_id())
);

-- ============================================================
-- public.contacts  (créée par 0011)
-- ============================================================

DROP POLICY IF EXISTS contacts_select ON public.contacts;
CREATE POLICY contacts_select
ON public.contacts
FOR SELECT
USING (pharmacy_id = (select public.get_pharmacy_id()));

DROP POLICY IF EXISTS contacts_insert ON public.contacts;
CREATE POLICY contacts_insert
ON public.contacts
FOR INSERT
WITH CHECK (
  pharmacy_id = (select public.get_pharmacy_id())
  AND created_by = auth.uid()
);

DROP POLICY IF EXISTS contacts_update ON public.contacts;
CREATE POLICY contacts_update
ON public.contacts
FOR UPDATE
USING (pharmacy_id = (select public.get_pharmacy_id()))
WITH CHECK (pharmacy_id = (select public.get_pharmacy_id()));

DROP POLICY IF EXISTS contacts_delete ON public.contacts;
CREATE POLICY contacts_delete
ON public.contacts
FOR DELETE
USING (
  pharmacy_id = (select public.get_pharmacy_id())
  AND (select public.get_user_role()) = ANY (ARRAY[
    'titulaire'::public.user_role,
    'adjoint'::public.user_role
  ])
);

-- ============================================================
-- public.training_resources  (créée par 0009)
-- ============================================================

DROP POLICY IF EXISTS training_resources_select ON public.training_resources;
CREATE POLICY training_resources_select
ON public.training_resources
FOR SELECT
USING (
  pharmacy_id = (select public.get_pharmacy_id())
  AND (
    is_published = true
    OR (select public.get_user_role()) IN ('titulaire', 'adjoint')
  )
);

DROP POLICY IF EXISTS training_resources_insert ON public.training_resources;
CREATE POLICY training_resources_insert
ON public.training_resources
FOR INSERT
WITH CHECK (
  pharmacy_id = (select public.get_pharmacy_id())
  AND (select public.get_user_role()) IN ('titulaire', 'adjoint')
  AND created_by = auth.uid()
);

DROP POLICY IF EXISTS training_resources_update ON public.training_resources;
CREATE POLICY training_resources_update
ON public.training_resources
FOR UPDATE
USING (
  pharmacy_id = (select public.get_pharmacy_id())
  AND (select public.get_user_role()) IN ('titulaire', 'adjoint')
)
WITH CHECK (pharmacy_id = (select public.get_pharmacy_id()));

DROP POLICY IF EXISTS training_resources_delete ON public.training_resources;
CREATE POLICY training_resources_delete
ON public.training_resources
FOR DELETE
USING (
  pharmacy_id = (select public.get_pharmacy_id())
  AND (select public.get_user_role()) IN ('titulaire', 'adjoint')
);

-- ============================================================
-- public.work_session_segments  (créée par 0019)
-- ============================================================

DROP POLICY IF EXISTS "work_session_segments_select" ON public.work_session_segments;
CREATE POLICY "work_session_segments_select"
ON public.work_session_segments
FOR SELECT
USING (pharmacy_id = (select public.get_pharmacy_id()));

DROP POLICY IF EXISTS "work_session_segments_insert" ON public.work_session_segments;
CREATE POLICY "work_session_segments_insert"
ON public.work_session_segments
FOR INSERT
WITH CHECK (
  user_id = auth.uid()
  AND pharmacy_id = (select public.get_pharmacy_id())
);

-- ============================================================
-- storage.objects — bucket training-files (créées par 0010)
--   Seules ces 2 policies utilisent get_user_role() ; les autres
--   policies storage (attachments, prescriptions, training_files_select/update)
--   utilisent déjà un (SELECT ...) inline.
-- ============================================================

DROP POLICY IF EXISTS "training_files_insert" ON storage.objects;
CREATE POLICY "training_files_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'training-files'
  AND split_part(name, '/', 1) = (SELECT pharmacy_id::text FROM public.profiles WHERE id = auth.uid())
  AND (select public.get_user_role()) IN ('titulaire', 'adjoint')
);

DROP POLICY IF EXISTS "training_files_delete" ON storage.objects;
CREATE POLICY "training_files_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'training-files'
  AND split_part(name, '/', 1) = (SELECT pharmacy_id::text FROM public.profiles WHERE id = auth.uid())
  AND (select public.get_user_role()) IN ('titulaire', 'adjoint')
);
