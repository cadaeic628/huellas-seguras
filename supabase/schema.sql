-- Huellas Seguras — Schema inicial para Supabase.
--
-- Este script es idempotente: puedes correrlo varias veces sobre el mismo
-- proyecto sin romper nada. Define tablas, trigger de signup, RLS y RPCs.
--
-- Pasos previos en el dashboard de Supabase antes de ejecutar:
--   1. Crear el proyecto.
--   2. Authentication > Providers: dejar habilitado "Email" (password).
--      Recomendado para dev: desactivar "Confirm email" en Auth > Email
--      para no requerir verificación al hacer signup.
--   3. Storage: crear buckets PÚBLICOS llamados `avatars`, `animales`,
--      `reportes` y `foro`.
--   4. Correr este script desde el SQL Editor.
--   5. Copiar Project URL y anon key a `app.json` -> `expo.extra`.

-- ============================================================
-- Extensiones
-- ============================================================

create extension if not exists pgcrypto;

-- ============================================================
-- Tablas
-- ============================================================

-- Perfil público asociado a auth.users. La sesión es client-side, así que
-- el rol y datos de display viven acá (no en custom claims del JWT).
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  role text not null check (role in ('normal', 'fundacion')),
  nombre text not null,
  avatar_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.organizaciones (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  comuna text not null,
  comunas_operacion text[] not null default '{}',
  descripcion text,
  telefono text,
  horario text,
  banco jsonb,
  redes jsonb,
  user_id uuid unique references public.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- Entidad pública sin user_id: la administra el equipo del proyecto vía
-- service_role (ver CLAUDE.md → "Veterinarias").
create table if not exists public.veterinarias (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  comuna text not null,
  telefono text,
  horario text,
  lat double precision,
  lng double precision,
  redes jsonb
);

create table if not exists public.animales (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  tipo text not null check (tipo in ('Perro', 'Perra', 'Gato', 'Gata')),
  estado text not null check (estado in ('saludable', 'observacion', 'urgente')),
  zona text,
  comuna text,
  descripcion text,
  foto_url text,
  organizacion_id uuid not null references public.organizaciones(id) on delete cascade,
  lat double precision,
  lng double precision,
  apadrinado_por uuid references public.users(id) on delete set null,
  adoptado_por uuid references public.users(id) on delete set null,
  ficha jsonb,
  created_at timestamptz not null default now()
);

create index if not exists animales_organizacion_idx on public.animales(organizacion_id);

create table if not exists public.reportes (
  id uuid primary key default gen_random_uuid(),
  animal_id uuid references public.animales(id) on delete set null,
  user_id uuid not null references public.users(id) on delete cascade,
  foto_url text,
  ubicacion text,
  descripcion text,
  estado text not null default 'recibido'
    check (estado in ('recibido', 'en revisión', 'verificado')),
  created_at timestamptz not null default now()
);

create index if not exists reportes_user_idx on public.reportes(user_id);

create table if not exists public.donaciones (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  organizacion_id uuid not null references public.organizaciones(id) on delete cascade,
  monto integer not null check (monto > 0),
  comprobante_url text,
  created_at timestamptz not null default now()
);

create index if not exists donaciones_user_idx on public.donaciones(user_id);
create index if not exists donaciones_org_idx on public.donaciones(organizacion_id);

create table if not exists public.foro_posts (
  id uuid primary key default gen_random_uuid(),
  organizacion_id uuid not null references public.organizaciones(id) on delete cascade,
  titulo text not null,
  descripcion text not null,
  monto integer,
  foto_url text,
  boleta_url text,
  created_at timestamptz not null default now()
);

create index if not exists foro_posts_org_idx on public.foro_posts(organizacion_id);

create table if not exists public.foro_post_animales (
  post_id uuid not null references public.foro_posts(id) on delete cascade,
  animal_id uuid not null references public.animales(id) on delete cascade,
  primary key (post_id, animal_id)
);

-- ============================================================
-- Trigger: crear perfil en public.users al hacer signup
-- ============================================================

-- Corre justo después de un insert en auth.users. Lee role y nombre desde
-- raw_user_meta_data, que el cliente pasa al llamar a
-- supabase.auth.signUp({ email, password, options: { data: { role, nombre } } }).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, role, nombre)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'normal'),
    coalesce(new.raw_user_meta_data->>'nombre', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- Row Level Security
-- ============================================================

alter table public.users enable row level security;
alter table public.organizaciones enable row level security;
alter table public.veterinarias enable row level security;
alter table public.animales enable row level security;
alter table public.reportes enable row level security;
alter table public.donaciones enable row level security;
alter table public.foro_posts enable row level security;
alter table public.foro_post_animales enable row level security;

-- ---- users ----
-- Cualquiera autenticado lee (necesario para mostrar nombre de padrino/adoptante).
-- Cada uno solo edita o borra su propio registro.
drop policy if exists "users_select_all" on public.users;
create policy "users_select_all" on public.users
  for select to authenticated using (true);

drop policy if exists "users_update_self" on public.users;
create policy "users_update_self" on public.users
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

drop policy if exists "users_delete_self" on public.users;
create policy "users_delete_self" on public.users
  for delete to authenticated using (id = auth.uid());

-- ---- organizaciones ----
-- Catálogo público. La fundación dueña inserta y edita su ficha.
drop policy if exists "organizaciones_select_all" on public.organizaciones;
create policy "organizaciones_select_all" on public.organizaciones
  for select using (true);

drop policy if exists "organizaciones_insert_owner" on public.organizaciones;
create policy "organizaciones_insert_owner" on public.organizaciones
  for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "organizaciones_update_owner" on public.organizaciones;
create policy "organizaciones_update_owner" on public.organizaciones
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ---- veterinarias ----
-- Catálogo público. Sin policy de escritura: solo service_role puede tocarla,
-- consistente con que se administra fuera de la app.
drop policy if exists "veterinarias_select_all" on public.veterinarias;
create policy "veterinarias_select_all" on public.veterinarias
  for select using (true);

-- ---- animales ----
-- Catálogo público. La fundación dueña gestiona CRUD; los cambios de
-- apadrinado_por / adoptado_por por usuarios normales se hacen vía RPC
-- (apadrinar / adoptar), que es SECURITY DEFINER y burla esta RLS.
drop policy if exists "animales_select_all" on public.animales;
create policy "animales_select_all" on public.animales
  for select using (true);

drop policy if exists "animales_insert_owner_org" on public.animales;
create policy "animales_insert_owner_org" on public.animales
  for insert to authenticated
  with check (
    exists (
      select 1 from public.organizaciones o
      where o.id = organizacion_id and o.user_id = auth.uid()
    )
  );

drop policy if exists "animales_update_owner_org" on public.animales;
create policy "animales_update_owner_org" on public.animales
  for update to authenticated
  using (
    exists (
      select 1 from public.organizaciones o
      where o.id = organizacion_id and o.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.organizaciones o
      where o.id = organizacion_id and o.user_id = auth.uid()
    )
  );

drop policy if exists "animales_delete_owner_org" on public.animales;
create policy "animales_delete_owner_org" on public.animales
  for delete to authenticated
  using (
    exists (
      select 1 from public.organizaciones o
      where o.id = organizacion_id and o.user_id = auth.uid()
    )
  );

-- ---- reportes ----
-- Cada usuario ve y crea solo los suyos. La fundación destino no los lee:
-- los reportes son privados del autor; la fundación se entera por otros canales.
drop policy if exists "reportes_select_self" on public.reportes;
create policy "reportes_select_self" on public.reportes
  for select to authenticated using (user_id = auth.uid());

drop policy if exists "reportes_insert_self" on public.reportes;
create policy "reportes_insert_self" on public.reportes
  for insert to authenticated with check (user_id = auth.uid());

-- ---- donaciones ----
-- El donante ve sus aportes y la fundación destino también ve los que recibió
-- (para mostrarlos en su perfil y poder reportar uso en el foro).
drop policy if exists "donaciones_select_self_or_dest" on public.donaciones;
create policy "donaciones_select_self_or_dest" on public.donaciones
  for select to authenticated using (
    user_id = auth.uid()
    or exists (
      select 1 from public.organizaciones o
      where o.id = organizacion_id and o.user_id = auth.uid()
    )
  );

drop policy if exists "donaciones_insert_self" on public.donaciones;
create policy "donaciones_insert_self" on public.donaciones
  for insert to authenticated with check (user_id = auth.uid());

-- ---- foro_posts ----
-- Cualquiera lee. Solo la fundación dueña inserta, edita o borra.
drop policy if exists "foro_posts_select_all" on public.foro_posts;
create policy "foro_posts_select_all" on public.foro_posts
  for select using (true);

drop policy if exists "foro_posts_insert_fundacion" on public.foro_posts;
create policy "foro_posts_insert_fundacion" on public.foro_posts
  for insert to authenticated
  with check (
    exists (
      select 1 from public.organizaciones o
      where o.id = organizacion_id and o.user_id = auth.uid()
    )
    and exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role = 'fundacion'
    )
  );

drop policy if exists "foro_posts_update_owner" on public.foro_posts;
create policy "foro_posts_update_owner" on public.foro_posts
  for update to authenticated
  using (
    exists (
      select 1 from public.organizaciones o
      where o.id = organizacion_id and o.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.organizaciones o
      where o.id = organizacion_id and o.user_id = auth.uid()
    )
  );

drop policy if exists "foro_posts_delete_owner" on public.foro_posts;
create policy "foro_posts_delete_owner" on public.foro_posts
  for delete to authenticated
  using (
    exists (
      select 1 from public.organizaciones o
      where o.id = organizacion_id and o.user_id = auth.uid()
    )
  );

-- ---- foro_post_animales ----
-- Lectura pública. Escritura ligada al dueño del post padre.
drop policy if exists "foro_post_animales_select_all" on public.foro_post_animales;
create policy "foro_post_animales_select_all" on public.foro_post_animales
  for select using (true);

drop policy if exists "foro_post_animales_write_owner" on public.foro_post_animales;
create policy "foro_post_animales_write_owner" on public.foro_post_animales
  for all to authenticated
  using (
    exists (
      select 1 from public.foro_posts p
      join public.organizaciones o on o.id = p.organizacion_id
      where p.id = post_id and o.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.foro_posts p
      join public.organizaciones o on o.id = p.organizacion_id
      where p.id = post_id and o.user_id = auth.uid()
    )
  );

-- ============================================================
-- RPC: apadrinar / adoptar
-- ============================================================

-- Cualquier usuario autenticado puede apadrinar un animal libre. La policy de
-- update de animales solo permite a la fundación dueña, así que estos RPC son
-- SECURITY DEFINER y validan internamente. Fallan si el animal ya tiene
-- padrino/adoptante para evitar pisarse entre clientes.
create or replace function public.apadrinar(animal uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_padrino uuid;
begin
  if auth.uid() is null then
    raise exception 'No autenticado';
  end if;

  select apadrinado_por into current_padrino
  from public.animales where id = animal for update;

  if not found then
    raise exception 'Animal no existe';
  end if;
  if current_padrino is not null then
    raise exception 'Animal ya tiene padrino';
  end if;

  update public.animales set apadrinado_por = auth.uid() where id = animal;
end;
$$;

create or replace function public.adoptar(animal uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_adoptante uuid;
begin
  if auth.uid() is null then
    raise exception 'No autenticado';
  end if;

  select adoptado_por into current_adoptante
  from public.animales where id = animal for update;

  if not found then
    raise exception 'Animal no existe';
  end if;
  if current_adoptante is not null then
    raise exception 'Animal ya tiene hogar';
  end if;

  update public.animales set adoptado_por = auth.uid() where id = animal;
end;
$$;
