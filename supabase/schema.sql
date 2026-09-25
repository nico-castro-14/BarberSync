-- ============================================================================
-- BarberSync PRO — Esquema de Base de Datos (Supabase / PostgreSQL)
-- ============================================================================
-- CÓMO EJECUTAR ESTE ARCHIVO (paso a paso):
--
--   1. Abre tu proyecto en https://supabase.com/dashboard
--   2. En el menú lateral entra a "SQL Editor" y pulsa "New query".
--   3. Copia y pega TODO el contenido de este archivo.
--   4. Pulsa "Run" (o Ctrl+Enter).
--   5. Verifica en "Table Editor" que existan las 5 tablas:
--      profiles, services, barbers, portfolio_items, appointments.
--   6. (Opcional) Para poblar datos de prueba, ejecuta al final el bloque
--      SEED comentado o registra servicios desde la app.
--
-- NOTAS:
--   - El script es re-ejecutable (usa IF NOT EXISTS / DROP ... IF EXISTS).
--   - Las políticas RLS asumen 3 roles: 'client', 'barber', 'admin'.
--   - La reserva de clientes es SIN registro: se permite INSERT anónimo
--     únicamente con status 'pending' (ver política más abajo).
-- ============================================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. PROFILES — extiende auth.users con rol y datos de contacto
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  role        text not null default 'client' check (role in ('client', 'barber', 'admin')),
  name        text not null,
  phone       text,
  created_at  timestamptz not null default now()
);

comment on table public.profiles is 'Perfil de usuario con rol (client/barber/admin).';

-- Trigger: crea el perfil automáticamente al registrarse un usuario
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role, name, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'role', 'client'),
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'phone'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Helper SECURITY DEFINER para políticas RLS (evita recursión en profiles)
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ----------------------------------------------------------------------------
-- 2. SERVICES — catálogo de servicios de la barbería
-- ----------------------------------------------------------------------------
create table if not exists public.services (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  price       numeric(10, 2) not null check (price >= 0),
  duration    interval not null default '45 minutes',
  description text,
  tag         text not null default 'Clásico',
  is_popular  boolean not null default false,
  created_at  timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 3. BARBERS — barberos vinculados a un perfil (rol 'barber')
-- ----------------------------------------------------------------------------
create table if not exists public.barbers (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid references public.profiles (id) on delete set null,
  handle      text not null unique,             -- deep link: /barbero/:handle
  bio         text,
  chair       text,
  rating      numeric(2, 1) not null default 5.0 check (rating between 0 and 5),
  color       text,                             -- gradiente del avatar en la UI
  active      boolean not null default true,    -- toggle del admin: recibe reservas hoy
  created_at  timestamptz not null default now()
);

-- Migración para bases ya creadas:
-- alter table public.barbers add column if not exists active boolean not null default true;

create unique index if not exists idx_barbers_handle on public.barbers (handle);

-- ----------------------------------------------------------------------------
-- 4. PORTFOLIO_ITEMS — trabajos publicados por cada barbero
-- ----------------------------------------------------------------------------
create table if not exists public.portfolio_items (
  id          uuid primary key default gen_random_uuid(),
  barber_id   uuid not null references public.barbers (id) on delete cascade,
  title       text not null,
  tag         text not null,
  image_url   text,                             -- URL en Supabase Storage
  description text,
  likes       integer not null default 0 check (likes >= 0),
  created_at  timestamptz not null default now()
);

create index if not exists idx_portfolio_barber on public.portfolio_items (barber_id);

-- ----------------------------------------------------------------------------
-- 5. APPOINTMENTS — citas/reservas
-- ----------------------------------------------------------------------------
create table if not exists public.appointments (
  id                uuid primary key default gen_random_uuid(),
  client_id         uuid references public.profiles (id) on delete set null,
  barber_id         uuid not null references public.barbers (id) on delete cascade,
  service_id        uuid not null references public.services (id) on delete restrict,
  appointment_date  date not null,
  start_time        time not null,
  status            text not null default 'pending'
                    check (status in ('pending', 'confirmed', 'completed', 'noshow', 'cancelled')),
  total_price       numeric(10, 2) not null check (total_price >= 0),
  -- Contacto para reservas de invitados (flujo sin registro; client_id queda null)
  client_name       text,
  client_phone      text,
  created_at        timestamptz not null default now()
);

create index if not exists idx_appointments_barber_date
  on public.appointments (barber_id, appointment_date);
create index if not exists idx_appointments_client on public.appointments (client_id);

-- Regla anti-solapamiento a nivel base de datos: un barbero no puede tener
-- dos citas activas (pending/confirmed) en la misma fecha y hora de inicio.
-- guardian.py refuerza esta regla validando ventanas de duración completas.
create unique index if not exists uq_appointments_active_slot
  on public.appointments (barber_id, appointment_date, start_time)
  where status in ('pending', 'confirmed');

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
alter table public.profiles        enable row level security;
alter table public.services        enable row level security;
alter table public.barbers         enable row level security;
alter table public.portfolio_items enable row level security;
alter table public.appointments    enable row level security;

-- --- profiles ---------------------------------------------------------------
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id or public.is_admin());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id or public.is_admin())
  with check (auth.uid() = id or public.is_admin());

-- --- services ---------------------------------------------------------------
drop policy if exists "services_public_read" on public.services;
create policy "services_public_read"
  on public.services for select
  to anon, authenticated
  using (true);

drop policy if exists "services_admin_write" on public.services;
create policy "services_admin_write"
  on public.services for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- --- barbers ----------------------------------------------------------------
drop policy if exists "barbers_public_read" on public.barbers;
create policy "barbers_public_read"
  on public.barbers for select
  to anon, authenticated
  using (true);

drop policy if exists "barbers_self_update" on public.barbers;
create policy "barbers_self_update"
  on public.barbers for update
  to authenticated
  using (profile_id = auth.uid() or public.is_admin())
  with check (profile_id = auth.uid() or public.is_admin());

drop policy if exists "barbers_admin_write" on public.barbers;
create policy "barbers_admin_write"
  on public.barbers for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "barbers_admin_delete" on public.barbers;
create policy "barbers_admin_delete"
  on public.barbers for delete
  to authenticated
  using (public.is_admin());

-- --- portfolio_items --------------------------------------------------------
drop policy if exists "portfolio_public_read" on public.portfolio_items;
create policy "portfolio_public_read"
  on public.portfolio_items for select
  to anon, authenticated
  using (true);

drop policy if exists "portfolio_owner_write" on public.portfolio_items;
create policy "portfolio_owner_write"
  on public.portfolio_items for all
  to authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from public.barbers b
      where b.id = portfolio_items.barber_id and b.profile_id = auth.uid()
    )
  )
  with check (
    public.is_admin()
    or exists (
      select 1 from public.barbers b
      where b.id = portfolio_items.barber_id and b.profile_id = auth.uid()
    )
  );

-- --- appointments ------------------------------------------------------------
-- Reserva sin registro: cualquier visitante puede crear una cita 'pending'.
drop policy if exists "appointments_public_insert" on public.appointments;
create policy "appointments_public_insert"
  on public.appointments for insert
  to anon, authenticated
  with check (status = 'pending');

drop policy if exists "appointments_owner_read" on public.appointments;
create policy "appointments_owner_read"
  on public.appointments for select
  to authenticated
  using (
    client_id = auth.uid()
    or public.is_admin()
    or exists (
      select 1 from public.barbers b
      where b.id = appointments.barber_id and b.profile_id = auth.uid()
    )
  );

drop policy if exists "appointments_barber_update" on public.appointments;
create policy "appointments_barber_update"
  on public.appointments for update
  to authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from public.barbers b
      where b.id = appointments.barber_id and b.profile_id = auth.uid()
    )
  );

drop policy if exists "appointments_admin_delete" on public.appointments;
create policy "appointments_admin_delete"
  on public.appointments for delete
  to authenticated
  using (public.is_admin());

-- ============================================================================
-- SUPABASE STORAGE — bucket de fotos del portafolio
-- ============================================================================
-- Bucket público de lectura; el nombre exacto lo espera el frontend en
-- src/services/storageService.js (PORTFOLIO_BUCKET = 'portfolio_images').
insert into storage.buckets (id, name, public)
values ('portfolio_images', 'portfolio_images', true)
on conflict (id) do nothing;

-- Helper: equipo interno (barbero o admin)
create or replace function public.is_staff()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('barber', 'admin')
  );
$$;

-- Lectura pública de las imágenes del portafolio
drop policy if exists "portfolio_images_public_read" on storage.objects;
create policy "portfolio_images_public_read"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'portfolio_images');

-- Escritura solo para el equipo (barberos y dueño autenticados)
drop policy if exists "portfolio_images_staff_insert" on storage.objects;
create policy "portfolio_images_staff_insert"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'portfolio_images' and public.is_staff());

drop policy if exists "portfolio_images_staff_update" on storage.objects;
create policy "portfolio_images_staff_update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'portfolio_images' and public.is_staff());

drop policy if exists "portfolio_images_staff_delete" on storage.objects;
create policy "portfolio_images_staff_delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'portfolio_images' and public.is_staff());

-- ============================================================================
-- SEED (opcional) — descomenta para datos de prueba coherentes con mockData.js
-- ============================================================================
-- Servicios exactos de Barber New Yark (COP):
-- insert into public.services (name, price, duration, description, tag, is_popular) values
--   ('Corte de cabello',                     25000, '45 minutes', 'Corte a máquina o tijera, acabado con navaja en contornos y peinado final.', 'Cabello', true),
--   ('Corte de barba',                       20000, '30 minutes', 'Perfilado y diseño de barba con navaja, toalla caliente y aceites.',        'Barba',   false),
--   ('Depilación de cejas',                   5000, '15 minutes', 'Perfilado de cejas a navaja o cera, acabado limpio y natural.',             'Cejas',   false),
--   ('Corte de cabello y diseño de barba',   35000, '60 minutes', 'El combo insignia: corte completo + diseño de barba con toalla caliente.',  'Combo',   true);
