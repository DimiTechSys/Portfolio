-- 0062 — Index composites pour la pagination keyset des listes
--
-- Les listes (tasks, prescriptions, orders, rentals, shortages) trient toutes par
-- (created_at DESC, id DESC) filtré sur pharmacy_id (cf. getXxxPaginated dans
-- src/lib/queries/*.ts). Les seuls index existants sont (pharmacy_id, status), qui
-- ne couvrent pas ce tri : Postgres doit trier en mémoire toutes les lignes de
-- l'officine avant de renvoyer une page → latence croissante avec le volume.
--
-- Ces index composites rendent la pagination keyset servie directement par l'index
-- (filtre pharmacy_id + parcours ordonné + limit), sans tri en mémoire.
--
-- Non-CONCURRENTLY volontairement : les tables sont encore petites (bêta privée),
-- le verrou de création est négligeable. Si un jour on ré-indexe une table déjà
-- volumineuse, préférer CREATE INDEX CONCURRENTLY (hors transaction).

CREATE INDEX IF NOT EXISTS tasks_pharmacy_created_id_idx
  ON public.tasks (pharmacy_id, created_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS prescriptions_pharmacy_created_id_idx
  ON public.prescriptions (pharmacy_id, created_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS orders_pharmacy_created_id_idx
  ON public.orders (pharmacy_id, created_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS rentals_pharmacy_created_id_idx
  ON public.rentals (pharmacy_id, created_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS shortages_pharmacy_created_id_idx
  ON public.shortages (pharmacy_id, created_at DESC, id DESC);
