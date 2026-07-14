-- ============================================================
-- PharmaWorkspace — Schéma de référence IaC
-- Aligné sur la base Supabase au 2026-03-29
-- ============================================================

-- Extensions
create extension if not exists "uuid-ossp";

-- ── Enums ────────────────────────────────────────────────────

create type user_role as enum ('titulaire', 'adjoint', 'preparateur');
create type task_status as enum ('todo', 'in_progress', 'done', 'cancelled');
create type task_priority as enum ('low', 'medium', 'high');
create type order_status as enum ('draft', 'sent', 'received', 'cancelled');
create type prescription_status as enum ('to_serve', 'in_progress', 'served', 'expired', 'on_hold');
create type rental_status as enum ('active', 'returned', 'overdue');
create type shortage_status as enum ('open', 'substitute_found', 'resolved');
create type handover_target as enum ('today', 'tomorrow');

-- ── Tables ───────────────────────────────────────────────────

create table pharmacies (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  finess      text,
  address     text,
  logo_url    text,
  created_at  timestamptz not null default now()
);

create table profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  pharmacy_id   uuid references pharmacies(id) on delete set null,
  role          user_role not null default 'preparateur',
  first_name    text,
  last_name     text,
  display_name  text,
  avatar_url    text,
  created_at    timestamptz not null default now()
);

create table invitations (
  id            uuid primary key default gen_random_uuid(),
  pharmacy_id   uuid not null references pharmacies(id) on delete cascade,
  email         text not null,
  role          user_role not null default 'preparateur',
  token         uuid not null unique default gen_random_uuid(),
  accepted_at   timestamptz,
  expires_at    timestamptz not null default (now() + interval '7 days'),
  created_at    timestamptz not null default now()
);

create table work_sessions (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references profiles(id) on delete cascade,
  pharmacy_id       uuid not null references pharmacies(id) on delete cascade,
  started_at        timestamptz not null default now(),
  ended_at          timestamptz,
  handover_note     text,
  handover_target   handover_target,
  tasks_completed   int not null default 0,
  created_at        timestamptz not null default now()
);

create table tasks (
  id                    uuid primary key default gen_random_uuid(),
  pharmacy_id           uuid not null references pharmacies(id) on delete cascade,
  created_by            uuid not null references profiles(id) on delete restrict,
  assigned_to           uuid references profiles(id) on delete set null,
  completed_in_session  uuid references work_sessions(id) on delete set null,
  title                 text not null,
  description           text,
  status                task_status not null default 'todo',
  priority              task_priority not null default 'medium',
  due_date              date,
  completed_at          timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create table prescriptions (
  id               uuid primary key default gen_random_uuid(),
  pharmacy_id      uuid not null references pharmacies(id) on delete cascade,
  created_by       uuid references profiles(id) on delete set null,
  patient_ref      text,
  status           prescription_status not null default 'to_serve',
  priority         task_priority not null default 'medium',
  execution_date   date,
  missing_products text,
  notes            text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create table prescription_comments (
  id               uuid primary key default gen_random_uuid(),
  prescription_id  uuid not null references prescriptions(id) on delete cascade,
  pharmacy_id      uuid not null references pharmacies(id) on delete cascade,
  author_id        uuid not null references profiles(id) on delete restrict,
  content          text not null,
  created_at       timestamptz not null default now()
);

create table suppliers (
  id            uuid primary key default gen_random_uuid(),
  pharmacy_id   uuid not null references pharmacies(id) on delete cascade,
  name          text not null,
  contact_name  text,
  phone         text,
  email         text,
  notes         text,
  created_at    timestamptz not null default now()
);

create table orders (
  id           uuid primary key default gen_random_uuid(),
  pharmacy_id  uuid not null references pharmacies(id) on delete cascade,
  supplier_id  uuid references suppliers(id) on delete set null,
  created_by   uuid not null references profiles(id) on delete restrict,
  status       order_status not null default 'draft',
  notes        text,
  ordered_at   timestamptz,
  received_at  timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table order_items (
  id            uuid primary key default gen_random_uuid(),
  order_id      uuid not null references orders(id) on delete cascade,
  pharmacy_id   uuid not null references pharmacies(id) on delete cascade,
  product_name  text not null,
  quantity      int not null,
  unit_price    numeric,
  is_shortage   boolean not null default false
);

create table rentals (
  id               uuid primary key default gen_random_uuid(),
  pharmacy_id      uuid not null references pharmacies(id) on delete cascade,
  created_by       uuid not null references profiles(id) on delete restrict,
  client_name      text not null,
  client_phone     text,
  equipment        text not null,
  status           rental_status not null default 'active',
  started_at       date not null,
  expected_return  date not null,
  returned_at      date,
  deposit          numeric,
  notes            text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create table shortages (
  id                     uuid primary key default gen_random_uuid(),
  pharmacy_id            uuid not null references pharmacies(id) on delete cascade,
  reported_by            uuid not null references profiles(id) on delete restrict,
  resolved_by            uuid references profiles(id) on delete set null,
  linked_prescription_id uuid references prescriptions(id) on delete set null,
  product_name           text not null,
  status                 shortage_status not null default 'open',
  substitute             text,
  notes                  text,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

create table medications (
  id          uuid primary key default gen_random_uuid(),
  cip13       text not null unique,
  name        text not null,
  dosage      text,
  form        text,
  laboratory  text,
  active      boolean not null default true,
  updated_at  timestamptz not null default now()
);

-- ── Indexes ───────────────────────────────────────────────────

create index on tasks (pharmacy_id, status);
create index on tasks (assigned_to);
create index on tasks (due_date) where status != 'done';
create index on prescriptions (pharmacy_id, status);
create index on orders (pharmacy_id, status);
create index on rentals (pharmacy_id, status);
create index on rentals (expected_return) where status = 'active';
create index on shortages (pharmacy_id, status);
create index on work_sessions (user_id, started_at desc);
create index on work_sessions (pharmacy_id, ended_at) where ended_at is null;
create index on prescription_comments (prescription_id);
create index on order_items (order_id);
create index on invitations (token) where accepted_at is null;
create index on medications (cip13);
create index on medications (name);

-- ── Triggers ─────────────────────────────────────────────────

create or replace function handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger tasks_updated_at before update on tasks
  for each row execute function handle_updated_at();
create trigger prescriptions_updated_at before update on prescriptions
  for each row execute function handle_updated_at();
create trigger orders_updated_at before update on orders
  for each row execute function handle_updated_at();
create trigger rentals_updated_at before update on rentals
  for each row execute function handle_updated_at();
create trigger shortages_updated_at before update on shortages
  for each row execute function handle_updated_at();

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ── Helper functions ──────────────────────────────────────────

create or replace function get_pharmacy_id()
returns uuid as $$
  select pharmacy_id from profiles where id = auth.uid();
$$ language sql security definer stable;

create or replace function get_user_role()
returns user_role as $$
  select role from profiles where id = auth.uid();
$$ language sql security definer stable;

-- ── RLS ───────────────────────────────────────────────────────

-- pharmacies et profiles : RLS désactivé pour le MVP
alter table pharmacies disable row level security;
alter table profiles disable row level security;

alter table invitations           enable row level security;
alter table work_sessions         enable row level security;
alter table tasks                 enable row level security;
alter table prescriptions         enable row level security;
alter table prescription_comments enable row level security;
alter table suppliers             enable row level security;
alter table orders                enable row level security;
alter table order_items           enable row level security;
alter table rentals               enable row level security;
alter table shortages             enable row level security;
alter table medications           enable row level security;

-- invitations
create policy "invitations_select" on invitations for select using (true);
create policy "invitations_insert" on invitations for insert with check (pharmacy_id = get_pharmacy_id() and get_user_role() = 'titulaire');
create policy "invitations_update" on invitations for update using (pharmacy_id = get_pharmacy_id() and get_user_role() = 'titulaire');
create policy "invitations_delete" on invitations for delete using (pharmacy_id = get_pharmacy_id() and get_user_role() = 'titulaire');

-- work_sessions
create policy "work_sessions_select" on work_sessions for select using (pharmacy_id = get_pharmacy_id());
create policy "work_sessions_insert" on work_sessions for insert with check (user_id = auth.uid() and pharmacy_id = get_pharmacy_id());
create policy "work_sessions_update" on work_sessions for update using (user_id = auth.uid() and pharmacy_id = get_pharmacy_id());
create policy "work_sessions_delete" on work_sessions for delete using (user_id = auth.uid());

-- tasks
create policy "tasks_select" on tasks for select using (pharmacy_id = get_pharmacy_id());
create policy "tasks_insert" on tasks for insert with check (pharmacy_id = get_pharmacy_id() and get_user_role() in ('titulaire', 'adjoint'));
create policy "tasks_update" on tasks for update using (pharmacy_id = get_pharmacy_id() and (get_user_role() in ('titulaire', 'adjoint') or assigned_to = auth.uid()));
create policy "tasks_delete" on tasks for delete using (pharmacy_id = get_pharmacy_id() and get_user_role() = 'titulaire');

-- prescriptions
create policy "prescriptions_select" on prescriptions for select using (pharmacy_id = get_pharmacy_id());
create policy "prescriptions_insert" on prescriptions for insert with check (pharmacy_id = get_pharmacy_id());
create policy "prescriptions_update" on prescriptions for update using (pharmacy_id = get_pharmacy_id());
create policy "prescriptions_delete" on prescriptions for delete using (pharmacy_id = get_pharmacy_id() and get_user_role() in ('titulaire', 'adjoint'));

-- prescription_comments
create policy "prescription_comments_select" on prescription_comments for select using (pharmacy_id = get_pharmacy_id());
create policy "prescription_comments_insert" on prescription_comments for insert with check (pharmacy_id = get_pharmacy_id() and author_id = auth.uid());
create policy "prescription_comments_delete" on prescription_comments for delete using (pharmacy_id = get_pharmacy_id() and (author_id = auth.uid() or get_user_role() = 'titulaire'));

-- suppliers
create policy "suppliers_select" on suppliers for select using (pharmacy_id = get_pharmacy_id());
create policy "suppliers_insert" on suppliers for insert with check (pharmacy_id = get_pharmacy_id());
create policy "suppliers_update" on suppliers for update using (pharmacy_id = get_pharmacy_id());
create policy "suppliers_delete" on suppliers for delete using (pharmacy_id = get_pharmacy_id() and get_user_role() in ('titulaire', 'adjoint'));

-- orders
create policy "orders_select" on orders for select using (pharmacy_id = get_pharmacy_id());
create policy "orders_insert" on orders for insert with check (pharmacy_id = get_pharmacy_id());
create policy "orders_update" on orders for update using (pharmacy_id = get_pharmacy_id());
create policy "orders_delete" on orders for delete using (pharmacy_id = get_pharmacy_id() and get_user_role() in ('titulaire', 'adjoint'));

-- order_items
create policy "order_items_select" on order_items for select using (pharmacy_id = get_pharmacy_id());
create policy "order_items_insert" on order_items for insert with check (pharmacy_id = get_pharmacy_id());
create policy "order_items_update" on order_items for update using (pharmacy_id = get_pharmacy_id());
create policy "order_items_delete" on order_items for delete using (pharmacy_id = get_pharmacy_id());

-- rentals
create policy "rentals_select" on rentals for select using (pharmacy_id = get_pharmacy_id());
create policy "rentals_insert" on rentals for insert with check (pharmacy_id = get_pharmacy_id());
create policy "rentals_update" on rentals for update using (pharmacy_id = get_pharmacy_id());
create policy "rentals_delete" on rentals for delete using (pharmacy_id = get_pharmacy_id() and get_user_role() in ('titulaire', 'adjoint'));

-- shortages
create policy "shortages_select" on shortages for select using (pharmacy_id = get_pharmacy_id());
create policy "shortages_insert" on shortages for insert with check (pharmacy_id = get_pharmacy_id());
create policy "shortages_update" on shortages for update using (pharmacy_id = get_pharmacy_id());
create policy "shortages_delete" on shortages for delete using (pharmacy_id = get_pharmacy_id() and get_user_role() = 'titulaire');

-- medications (read-only)
create policy "medications_select" on medications for select
  using (auth.uid() is not null);