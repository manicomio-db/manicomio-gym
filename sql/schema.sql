-- ============================================================================
-- Gym Manager — esquema completo (tablas, funciones, triggers, RLS)
-- Ejecutar una sola vez en el SQL Editor de tu proyecto Supabase.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- Tablas
-- ----------------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'socio' check (role in ('socio', 'staff', 'dueno')),
  full_name text,
  phone text,
  member_number integer,
  created_at timestamptz not null default now()
);

alter table public.profiles add column if not exists member_number integer;

create sequence if not exists public.member_number_seq;

alter table public.profiles alter column member_number set default nextval('public.member_number_seq');

update public.profiles set member_number = nextval('public.member_number_seq') where member_number is null;

do $$
begin
  alter table public.profiles add constraint profiles_member_number_key unique (member_number);
exception
  when duplicate_object then null;
  when duplicate_table then null;
end $$;

create table if not exists public.membership_plans (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  price numeric(10, 2) not null default 0,
  duration_days integer not null default 30,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.memberships (
  id uuid primary key default gen_random_uuid(),
  socio_id uuid not null references public.profiles (id) on delete cascade,
  plan_id uuid references public.membership_plans (id) on delete set null,
  start_date date not null default current_date,
  end_date date not null,
  status text not null default 'activo' check (status in ('activo', 'vencido', 'cancelado')),
  amount_paid numeric(10, 2),
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

alter table public.memberships add column if not exists amount_paid numeric(10, 2);

create table if not exists public.day_passes (
  id uuid primary key default gen_random_uuid(),
  visitor_name text not null,
  amount numeric(10, 2) not null,
  staff_id uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

create table if not exists public.expense_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.expense_categories (id) on delete set null,
  description text not null,
  amount numeric(10, 2) not null,
  expense_date date not null default current_date,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  schedule text,
  instructor_id uuid references public.profiles (id) on delete set null,
  capacity integer,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.routine_requests (
  id uuid primary key default gen_random_uuid(),
  socio_id uuid not null references public.profiles (id) on delete cascade,
  objetivo text not null,
  nivel text,
  lesiones text,
  sesiones_semana integer,
  status text not null default 'pendiente' check (status in ('pendiente', 'en_progreso', 'completado')),
  created_at timestamptz not null default now()
);

create table if not exists public.routines (
  id uuid primary key default gen_random_uuid(),
  socio_id uuid not null references public.profiles (id) on delete cascade,
  staff_id uuid references public.profiles (id),
  request_id uuid references public.routine_requests (id) on delete set null,
  title text not null,
  contenido jsonb not null,
  source text not null default 'manual' check (source in ('ia', 'manual')),
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  price numeric(10, 2) not null default 0,
  stock integer not null default 0,
  category text,
  image_url text,
  created_at timestamptz not null default now()
);

alter table public.products add column if not exists image_url text;

create table if not exists public.sales (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products (id) on delete set null,
  staff_id uuid not null references public.profiles (id),
  socio_id uuid references public.profiles (id),
  quantity integer not null check (quantity > 0),
  total numeric(10, 2) not null,
  created_at timestamptz not null default now()
);

-- Permitir borrar un producto aunque ya tenga ventas registradas (la venta
-- conserva su historial, solo pierde la referencia al producto eliminado).
alter table public.sales alter column product_id drop not null;
alter table public.sales drop constraint if exists sales_product_id_fkey;
alter table public.sales add constraint sales_product_id_fkey
  foreign key (product_id) references public.products (id) on delete set null;

create table if not exists public.gym_info (
  key text primary key,
  value text
);

create table if not exists public.check_ins (
  id uuid primary key default gen_random_uuid(),
  socio_id uuid not null references public.profiles (id) on delete cascade,
  staff_id uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- Deduplicar filas de corridas anteriores del seed y asegurar nombres únicos
-- en los catálogos (idempotente: seguro correrlo las veces que sea necesario).
-- ----------------------------------------------------------------------------

delete from public.membership_plans a using public.membership_plans b
  where a.ctid < b.ctid and a.name = b.name;

delete from public.classes a using public.classes b
  where a.ctid < b.ctid and a.name = b.name;

delete from public.products a using public.products b
  where a.ctid < b.ctid and a.name = b.name;

do $$
begin
  alter table public.membership_plans add constraint membership_plans_name_key unique (name);
exception
  when duplicate_object then null;
  when duplicate_table then null;
end $$;

do $$
begin
  alter table public.classes add constraint classes_name_key unique (name);
exception
  when duplicate_object then null;
  when duplicate_table then null;
end $$;

do $$
begin
  alter table public.products add constraint products_name_key unique (name);
exception
  when duplicate_object then null;
  when duplicate_table then null;
end $$;

-- ----------------------------------------------------------------------------
-- Helper: rol del usuario autenticado (security definer evita recursión de RLS)
-- ----------------------------------------------------------------------------

create or replace function public.current_role()
returns text
language sql
security definer
stable
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_staff_or_dueno()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce((select role in ('staff', 'dueno') from public.profiles where id = auth.uid()), false);
$$;

create or replace function public.is_dueno()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce((select role = 'dueno' from public.profiles where id = auth.uid()), false);
$$;

-- ----------------------------------------------------------------------------
-- Trigger: crear el profile automáticamente al registrarse en auth.users
-- El rol viene de raw_user_meta_data->>'role' (solo 'socio' se permite desde
-- el signup público; cuentas 'staff'/'dueno' las crea el dueño manualmente).
-- ----------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role, full_name, phone)
  values (
    new.id,
    'socio',
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'phone'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ----------------------------------------------------------------------------
-- RLS
-- ----------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.membership_plans enable row level security;
alter table public.memberships enable row level security;
alter table public.classes enable row level security;
alter table public.routine_requests enable row level security;
alter table public.routines enable row level security;
alter table public.products enable row level security;
alter table public.sales enable row level security;
alter table public.gym_info enable row level security;
alter table public.check_ins enable row level security;
alter table public.day_passes enable row level security;
alter table public.expense_categories enable row level security;
alter table public.expenses enable row level security;

-- profiles ---------------------------------------------------------------
drop policy if exists "profiles_select_own_or_staff" on public.profiles;
create policy "profiles_select_own_or_staff" on public.profiles
  for select using (id = auth.uid() or public.is_staff_or_dueno());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (id = auth.uid() or public.is_dueno());

drop policy if exists "profiles_insert_dueno" on public.profiles;
create policy "profiles_insert_dueno" on public.profiles
  for insert with check (public.is_dueno());

drop policy if exists "profiles_delete_dueno" on public.profiles;
create policy "profiles_delete_dueno" on public.profiles
  for delete using (public.is_dueno());

-- membership_plans (lectura pública para landing) -------------------------
drop policy if exists "plans_select_all" on public.membership_plans;
create policy "plans_select_all" on public.membership_plans
  for select using (true);

drop policy if exists "plans_write_dueno" on public.membership_plans;
create policy "plans_write_dueno" on public.membership_plans
  for all using (public.is_dueno()) with check (public.is_dueno());

-- classes (lectura pública para landing) ----------------------------------
drop policy if exists "classes_select_all" on public.classes;
create policy "classes_select_all" on public.classes
  for select using (true);

drop policy if exists "classes_write_dueno" on public.classes;
create policy "classes_write_dueno" on public.classes
  for all using (public.is_dueno()) with check (public.is_dueno());

-- memberships --------------------------------------------------------------
drop policy if exists "memberships_select_own_or_staff" on public.memberships;
create policy "memberships_select_own_or_staff" on public.memberships
  for select using (socio_id = auth.uid() or public.is_staff_or_dueno());

drop policy if exists "memberships_write_staff" on public.memberships;
create policy "memberships_write_staff" on public.memberships
  for all using (public.is_staff_or_dueno()) with check (public.is_staff_or_dueno());

-- routine_requests -----------------------------------------------------------
drop policy if exists "requests_select_own_or_staff" on public.routine_requests;
create policy "requests_select_own_or_staff" on public.routine_requests
  for select using (socio_id = auth.uid() or public.is_staff_or_dueno());

drop policy if exists "requests_insert_own" on public.routine_requests;
create policy "requests_insert_own" on public.routine_requests
  for insert with check (socio_id = auth.uid());

drop policy if exists "requests_update_staff" on public.routine_requests;
create policy "requests_update_staff" on public.routine_requests
  for update using (public.is_staff_or_dueno());

drop policy if exists "requests_delete_dueno" on public.routine_requests;
create policy "requests_delete_dueno" on public.routine_requests
  for delete using (public.is_dueno());

-- routines -------------------------------------------------------------------
drop policy if exists "routines_select_own_or_staff" on public.routines;
create policy "routines_select_own_or_staff" on public.routines
  for select using (socio_id = auth.uid() or public.is_staff_or_dueno());

drop policy if exists "routines_write_staff" on public.routines;
create policy "routines_write_staff" on public.routines
  for all using (public.is_staff_or_dueno()) with check (public.is_staff_or_dueno());

-- products (catálogo público) -------------------------------------------------
drop policy if exists "products_select_all" on public.products;
create policy "products_select_all" on public.products
  for select using (true);

drop policy if exists "products_write_staff" on public.products;
create policy "products_write_staff" on public.products
  for all using (public.is_staff_or_dueno()) with check (public.is_staff_or_dueno());

-- sales ------------------------------------------------------------------------
drop policy if exists "sales_select_own_or_staff" on public.sales;
create policy "sales_select_own_or_staff" on public.sales
  for select using (socio_id = auth.uid() or public.is_staff_or_dueno());

drop policy if exists "sales_write_staff" on public.sales;
create policy "sales_write_staff" on public.sales
  for insert with check (public.is_staff_or_dueno());

drop policy if exists "sales_update_dueno" on public.sales;
create policy "sales_update_dueno" on public.sales
  for update using (public.is_dueno());

drop policy if exists "sales_delete_dueno" on public.sales;
create policy "sales_delete_dueno" on public.sales
  for delete using (public.is_dueno());

-- gym_info (lectura pública) ------------------------------------------------
drop policy if exists "gym_info_select_all" on public.gym_info;
create policy "gym_info_select_all" on public.gym_info
  for select using (true);

drop policy if exists "gym_info_write_dueno" on public.gym_info;
create policy "gym_info_write_dueno" on public.gym_info
  for all using (public.is_dueno()) with check (public.is_dueno());

-- check_ins (control de acceso) ----------------------------------------------
drop policy if exists "check_ins_select_own_or_staff" on public.check_ins;
create policy "check_ins_select_own_or_staff" on public.check_ins
  for select using (socio_id = auth.uid() or public.is_staff_or_dueno());

drop policy if exists "check_ins_insert_staff" on public.check_ins;
create policy "check_ins_insert_staff" on public.check_ins
  for insert with check (public.is_staff_or_dueno());

drop policy if exists "check_ins_delete_dueno" on public.check_ins;
create policy "check_ins_delete_dueno" on public.check_ins
  for delete using (public.is_dueno());

-- day_passes (pases de visita) ------------------------------------------------
drop policy if exists "day_passes_select_staff" on public.day_passes;
create policy "day_passes_select_staff" on public.day_passes
  for select using (public.is_staff_or_dueno());

drop policy if exists "day_passes_insert_staff" on public.day_passes;
create policy "day_passes_insert_staff" on public.day_passes
  for insert with check (public.is_staff_or_dueno());

drop policy if exists "day_passes_delete_dueno" on public.day_passes;
create policy "day_passes_delete_dueno" on public.day_passes
  for delete using (public.is_dueno());

-- expense_categories / expenses (solo Director) --------------------------------
drop policy if exists "expense_categories_all_dueno" on public.expense_categories;
create policy "expense_categories_all_dueno" on public.expense_categories
  for all using (public.is_dueno()) with check (public.is_dueno());

drop policy if exists "expenses_all_dueno" on public.expenses;
create policy "expenses_all_dueno" on public.expenses
  for all using (public.is_dueno()) with check (public.is_dueno());

-- ----------------------------------------------------------------------------
-- Storage: bucket público para fotos de productos
-- ----------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

drop policy if exists "product_images_public_read" on storage.objects;
create policy "product_images_public_read" on storage.objects
  for select using (bucket_id = 'product-images');

drop policy if exists "product_images_staff_insert" on storage.objects;
create policy "product_images_staff_insert" on storage.objects
  for insert with check (bucket_id = 'product-images' and public.is_staff_or_dueno());

drop policy if exists "product_images_staff_update" on storage.objects;
create policy "product_images_staff_update" on storage.objects
  for update using (bucket_id = 'product-images' and public.is_staff_or_dueno());

drop policy if exists "product_images_staff_delete" on storage.objects;
create policy "product_images_staff_delete" on storage.objects
  for delete using (bucket_id = 'product-images' and public.is_staff_or_dueno());
