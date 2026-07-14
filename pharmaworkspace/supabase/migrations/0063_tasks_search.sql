-- 0063 — Full-text search sur les tâches
--
-- La page /tasks faisait la recherche (titre/description) côté client, sur le
-- sous-ensemble déjà paginé → résultats incomplets à grosse volumétrie. On ajoute
-- une colonne FTS générée + index GIN, comme prescriptions/shortages (cf. 0043),
-- pour une recherche côté serveur (textSearch sur search_vec).

ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS search_vec tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('french', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('french', coalesce(description, '')), 'B')
  ) STORED;

CREATE INDEX IF NOT EXISTS tasks_search_idx
  ON public.tasks USING GIN (search_vec);
