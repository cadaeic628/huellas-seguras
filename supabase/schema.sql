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
  puntos integer not null default 0,
  created_at timestamptz not null default now()
);

-- Migración suave para installs previos a la columna puntos.
alter table public.users
  add column if not exists puntos integer not null default 0;

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
  -- estado del *reporte* (lo administra el equipo / moderación)
  estado text not null default 'recibido'
    check (estado in ('recibido', 'en revisión', 'verificado')),
  -- estado *observado* del animal por quien reporta (lo elige el usuario)
  estado_observado text
    check (estado_observado in ('saludable', 'observacion', 'urgente')),
  created_at timestamptz not null default now()
);

create index if not exists reportes_user_idx on public.reportes(user_id);

-- Migración suave para installs previos a la columna estado_observado.
alter table public.reportes
  add column if not exists estado_observado text
  check (estado_observado in ('saludable', 'observacion', 'urgente'));

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

-- Tiendas partner de la app: son entidades comerciales (locales, e-commerce)
-- que pagan por aparecer en el foro como publicidad y cuyos cupones se canjean
-- con puntos. Mismo patrón que `veterinarias`: las administra el equipo del
-- proyecto vía service_role; no tienen login propio en esta versión.
create table if not exists public.tiendas (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  comuna text,
  descripcion text,
  telefono text,
  web text,
  logo_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.foro_posts (
  id uuid primary key default gen_random_uuid(),
  organizacion_id uuid references public.organizaciones(id) on delete cascade,
  tienda_id uuid references public.tiendas(id) on delete cascade,
  -- Distingue render en el feed: fundacion = ícono business verde,
  -- publicidad = ícono storefront naranjo + badge "Publicidad".
  tipo text not null default 'fundacion'
    check (tipo in ('fundacion', 'publicidad')),
  titulo text not null,
  descripcion text not null,
  monto integer,
  foto_url text,
  boleta_url text,
  created_at timestamptz not null default now(),
  -- Exactamente una de las dos columnas de autor debe estar set.
  constraint foro_posts_autor_check check (
    (tipo = 'fundacion' and organizacion_id is not null and tienda_id is null)
    or
    (tipo = 'publicidad' and tienda_id is not null and organizacion_id is null)
  )
);

-- Migración suave para installs previos a tienda_id / tipo. Tiene que ir
-- ANTES del CREATE INDEX y del check constraint para que ambos puedan
-- referenciar las nuevas columnas. organizacion_id pasa a ser nullable
-- porque ahora puede venir un post de una tienda.
alter table public.foro_posts
  add column if not exists tienda_id uuid references public.tiendas(id) on delete cascade;

alter table public.foro_posts
  add column if not exists tipo text not null default 'fundacion';

alter table public.foro_posts
  alter column organizacion_id drop not null;

create index if not exists foro_posts_org_idx on public.foro_posts(organizacion_id);
create index if not exists foro_posts_tienda_idx on public.foro_posts(tienda_id);

-- Re-aplica el check de autor para installs que tenían foro_posts antes de
-- introducir publicidad (donde el CREATE TABLE no se aplicó porque la tabla
-- ya existía). Idempotente vía DROP IF EXISTS.
alter table public.foro_posts
  drop constraint if exists foro_posts_autor_check;
alter table public.foro_posts
  add constraint foro_posts_autor_check check (
    (tipo = 'fundacion' and organizacion_id is not null and tienda_id is null)
    or
    (tipo = 'publicidad' and tienda_id is not null and organizacion_id is null)
  );

create table if not exists public.foro_post_animales (
  post_id uuid not null references public.foro_posts(id) on delete cascade,
  animal_id uuid not null references public.animales(id) on delete cascade,
  primary key (post_id, animal_id)
);

-- Catálogo de cupones canjeables con puntos. Cada cupón pertenece a una
-- tienda y describe un descuento (porcentaje) con un costo en puntos. El
-- equipo del proyecto edita esto vía SQL Editor; el cliente solo lo lee y
-- canjea vía el RPC `canjear_cupon`.
create table if not exists public.cupones (
  id uuid primary key default gen_random_uuid(),
  tienda_id uuid not null references public.tiendas(id) on delete cascade,
  titulo text not null,
  descripcion text,
  -- Porcentaje de descuento. 10 = "10% OFF". Solo para mostrar.
  descuento_pct integer not null check (descuento_pct > 0 and descuento_pct <= 100),
  costo_puntos integer not null check (costo_puntos > 0),
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists cupones_tienda_idx on public.cupones(tienda_id);

-- Historial de canjes. Guardamos el código generado para que el usuario lo
-- pueda recuperar desde su perfil y mostrarlo en la tienda. El código es un
-- string corto generado por el RPC.
create table if not exists public.canjes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  cupon_id uuid not null references public.cupones(id) on delete restrict,
  codigo text not null unique,
  puntos_gastados integer not null check (puntos_gastados > 0),
  created_at timestamptz not null default now()
);

create index if not exists canjes_user_idx on public.canjes(user_id);

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
-- Trigger: +10 puntos al crear un reporte
-- ============================================================
--
-- Cada reporte aprobado/enviado vale 10 puntos para quien lo creó. Como el
-- estado por defecto es 'recibido' y el cliente nunca actualiza esa columna,
-- alcanza con sumar al insert. Si en el futuro se distingue "recibido" vs
-- "verificado", se puede mover esta lógica a un AFTER UPDATE que dispare
-- cuando estado pase a 'verificado'.
create or replace function public.handle_new_reporte()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.users
    set puntos = puntos + 10
    where id = new.user_id;
  return new;
end;
$$;

drop trigger if exists on_reporte_created on public.reportes;
create trigger on_reporte_created
  after insert on public.reportes
  for each row execute function public.handle_new_reporte();

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
alter table public.tiendas enable row level security;
alter table public.cupones enable row level security;
alter table public.canjes enable row level security;

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

-- Solo la fundación dueña inserta posts tipo 'fundacion'. Los posts tipo
-- 'publicidad' los administra el equipo del proyecto vía service_role (no
-- hay rol "tienda" autenticado en esta versión), igual que `tiendas` y
-- `veterinarias`. La cláusula `tipo = 'fundacion'` evita que una fundación
-- se cuele como publicidad.
drop policy if exists "foro_posts_insert_fundacion" on public.foro_posts;
create policy "foro_posts_insert_fundacion" on public.foro_posts
  for insert to authenticated
  with check (
    tipo = 'fundacion'
    and exists (
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

-- ---- tiendas ----
-- Catálogo público. Sin policies de escritura: solo service_role puede
-- tocarla, consistente con el patrón de `veterinarias`.
drop policy if exists "tiendas_select_all" on public.tiendas;
create policy "tiendas_select_all" on public.tiendas
  for select using (true);

-- ---- cupones ----
-- Catálogo público (cualquier usuario autenticado ve los descuentos
-- disponibles). El equipo del proyecto crea/edita vía service_role.
drop policy if exists "cupones_select_all" on public.cupones;
create policy "cupones_select_all" on public.cupones
  for select to authenticated using (true);

-- ---- canjes ----
-- Cada usuario solo ve sus propios canjes (su lista de cupones obtenidos).
-- El insert se hace vía el RPC `canjear_cupon` (SECURITY DEFINER) que
-- valida puntos y burla esta RLS; los clientes nunca insertan directamente.
drop policy if exists "canjes_select_self" on public.canjes;
create policy "canjes_select_self" on public.canjes
  for select to authenticated using (user_id = auth.uid());

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

-- Permite a un usuario normal reportar un animal que NO está en el catálogo:
-- crea la fila en `animales` (asignándole una org existente como dueña
-- inicial, preferentemente una de la misma comuna) y la fila ligada en
-- `reportes`. Sin esto, la RLS de animales solo permite insertar a la
-- fundación dueña del organizacion_id, y los usuarios normales no podrían
-- crear el row del animal.
create or replace function public.reportar_animal_nuevo(
  p_nombre text,
  p_tipo text,
  p_estado text,
  p_zona text,
  p_comuna text,
  p_descripcion text,
  p_foto_url text,
  p_ubicacion text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_org_id uuid;
  v_animal_id uuid;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'No autenticado';
  end if;

  -- Selecciona una organización dueña: 1) match exacto de comuna sede;
  -- 2) org que opera en la comuna; 3) cualquiera disponible.
  select id into v_org_id
  from public.organizaciones
  where p_comuna is not null and comuna = p_comuna
  limit 1;

  if v_org_id is null and p_comuna is not null then
    select id into v_org_id
    from public.organizaciones
    where p_comuna = any(comunas_operacion)
    limit 1;
  end if;

  if v_org_id is null then
    select id into v_org_id from public.organizaciones limit 1;
  end if;

  if v_org_id is null then
    raise exception 'No hay ninguna organización registrada todavía. Pide a una fundación que se registre primero.';
  end if;

  insert into public.animales (
    nombre, tipo, estado, zona, comuna, descripcion, foto_url, organizacion_id
  ) values (
    coalesce(nullif(trim(p_nombre), ''), 'Sin nombre'),
    p_tipo,
    p_estado,
    p_zona,
    p_comuna,
    p_descripcion,
    p_foto_url,
    v_org_id
  )
  returning id into v_animal_id;

  insert into public.reportes (
    user_id, animal_id, foto_url, ubicacion, descripcion, estado_observado
  ) values (
    v_user_id,
    v_animal_id,
    p_foto_url,
    p_ubicacion,
    p_descripcion,
    p_estado
  );

  return v_animal_id;
end;
$$;

-- Canjear un cupón: valida que el usuario tenga puntos suficientes, descuenta
-- el costo de su saldo, genera un código aleatorio único y registra el canje.
-- Devuelve un row con { codigo, puntos_restantes }. SECURITY DEFINER porque
-- la RLS de canjes no permite insert al cliente (solo se ve el historial).
create or replace function public.canjear_cupon(p_cupon_id uuid)
returns table (codigo text, puntos_restantes integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_costo integer;
  v_activo boolean;
  v_saldo integer;
  v_codigo text;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'No autenticado';
  end if;

  select costo_puntos, activo into v_costo, v_activo
  from public.cupones where id = p_cupon_id;
  if not found then
    raise exception 'Cupón no existe';
  end if;
  if not v_activo then
    raise exception 'Este cupón ya no está disponible';
  end if;

  -- Lock optimista del usuario para evitar carrera entre 2 canjes simultáneos.
  select puntos into v_saldo from public.users where id = v_user_id for update;
  if v_saldo < v_costo then
    raise exception 'Puntos insuficientes (tienes %, necesitas %)', v_saldo, v_costo;
  end if;

  -- Código corto legible. 8 hex caracteres = 4 bytes de entropía. Como hay
  -- unique constraint en codigo, si choca el insert falla y el cliente
  -- reintenta — improbable para el volumen esperado.
  -- Namespace explícito `extensions.gen_random_bytes` porque pgcrypto vive
  -- en el schema `extensions` en Supabase (no en `public`), y el RPC tiene
  -- search_path limitado a public.
  v_codigo := upper(encode(extensions.gen_random_bytes(4), 'hex'));

  update public.users
    set puntos = puntos - v_costo
    where id = v_user_id;

  insert into public.canjes (user_id, cupon_id, codigo, puntos_gastados)
  values (v_user_id, p_cupon_id, v_codigo, v_costo);

  return query select v_codigo, v_saldo - v_costo;
end;
$$;

-- Permite al usuario autenticado borrar su propia cuenta. El cliente con anon
-- key no puede tocar auth.users, así que exponemos esto como RPC. El cascade
-- de public.users -> organizaciones / animales / etc. limpia el resto.
create or replace function public.delete_self()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'No autenticado';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

-- ============================================================
-- Storage: policies para los buckets de la app
-- ============================================================
--
-- Requiere haber creado los buckets `avatars`, `animales`, `reportes` y
-- `foro` en Storage (paso 3 al inicio del archivo). Los buckets son
-- públicos para lectura; agregamos policies para que cualquier usuario
-- autenticado pueda subir/editar/borrar objetos en ellos. Las pantallas
-- (ej. Foro) usan paths con prefijo `<user_id>/...` para facilitar
-- auditoría manual, pero las policies no lo exigen para mantener el
-- patrón simple a nivel de taller.

drop policy if exists "storage_app_buckets_select" on storage.objects;
create policy "storage_app_buckets_select" on storage.objects
  for select using (
    bucket_id in ('avatars', 'animales', 'reportes', 'foro')
  );

drop policy if exists "storage_app_buckets_insert" on storage.objects;
create policy "storage_app_buckets_insert" on storage.objects
  for insert to authenticated with check (
    bucket_id in ('avatars', 'animales', 'reportes', 'foro')
  );

drop policy if exists "storage_app_buckets_update" on storage.objects;
create policy "storage_app_buckets_update" on storage.objects
  for update to authenticated using (
    bucket_id in ('avatars', 'animales', 'reportes', 'foro')
  );

drop policy if exists "storage_app_buckets_delete" on storage.objects;
create policy "storage_app_buckets_delete" on storage.objects
  for delete to authenticated using (
    bucket_id in ('avatars', 'animales', 'reportes', 'foro')
  );
