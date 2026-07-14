-- A task cannot be "done" if nobody is assigned (align with app rule).

update public.tasks
set
  status = 'todo',
  completed_at = null
where
  status = 'done'
  and assigned_to is null;

alter table public.tasks
  add constraint tasks_done_requires_assignee
  check (status is distinct from 'done' or assigned_to is not null);
