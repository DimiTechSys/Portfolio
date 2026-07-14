-- Tâches : tout membre rattaché à la pharmacie peut créer, modifier et se réassigner une tâche
-- (aligné modèle métier : pas de restriction titulaire/adjoint ni « seulement si assigné »).

drop policy if exists "tasks_insert" on public.tasks;
drop policy if exists "tasks_update" on public.tasks;

create policy "tasks_insert" on public.tasks
  for insert
  with check (pharmacy_id = public.get_pharmacy_id());

create policy "tasks_update" on public.tasks
  for update
  using (pharmacy_id = public.get_pharmacy_id())
  with check (pharmacy_id = public.get_pharmacy_id());
