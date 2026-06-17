-- Huellas Seguras — Seed mínimo para arrancar.
--
-- Inserta:
--   - 1 organización placeholder (sin user_id)
--   - 3 animales para tener algo que mostrar en Animales/Mapa
--   - 2 veterinarias (entidades públicas administradas por el equipo)
--
-- Fundaciones reales: se crean vía signupFundacion desde la app y quedan
-- con user_id != null, así que el DELETE inicial no las toca.
-- Personas reales: se registran via signup normal.
-- Animales reales de una fundación: la fundación los inserta vía SQL
-- Editor con su `organizacion_id` (más adelante habrá UI para eso).
--
-- Es idempotente: el DELETE limpia placeholders previos y los INSERT
-- usan `ON CONFLICT DO NOTHING` donde aplica.

-- ============================================================
-- Limpieza de placeholders previos
-- ============================================================
-- user_id IS NULL ⇒ org placeholder/seed; user_id != null ⇒ fundación real.
-- Las animales con CASCADE caen junto con su org.
delete from public.organizaciones where user_id is null;
-- Las veterinarias no tienen user_id; las re-poblamos enteras.
delete from public.veterinarias;

-- ============================================================
-- Organización placeholder
-- ============================================================

insert into public.organizaciones (
  id, nombre, comuna, comunas_operacion, descripcion, telefono, horario, banco, redes
) values (
  '11111111-1111-1111-1111-111111111101',
  'Fundación Demo',
  'Ñuñoa',
  array['Ñuñoa', 'Providencia', 'Macul'],
  'Organización de muestra para probar la app. Reemplázala por una fundación real registrada desde la pantalla de signup.',
  '+56 9 1234 5678',
  'Lun a Vie 10:00 - 18:00',
  '{"banco":"Banco Demo","tipoCuenta":"Cuenta Corriente","numero":"00-11-22-33","rut":"00.000.000-0","titular":"Fundación Demo","email":"demo@ejemplo.cl"}'::jsonb,
  '{"instagram":"@fundaciondemo","whatsapp":"+56912345678"}'::jsonb
)
on conflict (id) do nothing;

-- ============================================================
-- 3 animales placeholder (uno por estado: saludable/observacion/urgente)
-- ============================================================

insert into public.animales (
  id, nombre, tipo, estado, zona, comuna, descripcion, foto_url, organizacion_id, lat, lng, ficha
) values
  (
    '22222222-2222-2222-2222-222222222201',
    'Manchas', 'Perro', 'saludable',
    'Plaza Ñuñoa', 'Ñuñoa',
    'Perro mestizo, muy amistoso. Animal de muestra para probar el catálogo.',
    'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=400&h=400&fit=crop',
    '11111111-1111-1111-1111-111111111101',
    -33.4569, -70.5939,
    '{"edad":"3 años aprox.","sexo":"Macho","raza":"Mestizo (quiltro)","tamaño":"Mediano","peso":"14 kg","temperamento":"Sociable, juguetón","vacunado":true,"esterilizado":true,"desparasitado":true,"microchip":true,"buenoConNiños":true,"buenoConOtrosAnimales":true,"historia":"Animal de placeholder. Reemplázalo desde el SQL Editor cuando agregues animales reales.","necesidades":"Hogar definitivo."}'::jsonb
  ),
  (
    '22222222-2222-2222-2222-222222222202',
    'Nube', 'Gato', 'observacion',
    'Lastarria', 'Santiago Centro',
    'Gato blanco, recuperándose de cirugía dental. Animal de muestra.',
    'https://images.unsplash.com/photo-1570824104453-508955ab713e?w=400&h=400&fit=crop',
    '11111111-1111-1111-1111-111111111101',
    -33.4380, -70.6437,
    '{"edad":"2 años","sexo":"Macho","raza":"Doméstico pelo corto","tamaño":"Mediano","peso":"4.5 kg","temperamento":"Súper sociable, regalón","vacunado":true,"esterilizado":true,"desparasitado":true,"microchip":false,"buenoConNiños":true,"buenoConOtrosAnimales":true,"historia":"Animal de placeholder.","cuidadosEspeciales":"Dieta blanda durante 2 semanas.","necesidades":"Hogar con compañía durante el día."}'::jsonb
  ),
  (
    '22222222-2222-2222-2222-222222222203',
    'Coco', 'Perro', 'urgente',
    'Av. Quilín', 'Macul',
    'Perro adulto con herida abierta en el lomo. Animal de muestra de un caso urgente.',
    'https://images.unsplash.com/photo-1517849845537-4d257902454a?w=400&h=400&fit=crop',
    '11111111-1111-1111-1111-111111111101',
    -33.4906, -70.5980,
    '{"edad":"6 años aprox.","sexo":"Macho","raza":"Mestizo","tamaño":"Grande","peso":"22 kg","temperamento":"Tímido al principio, dulce cuando confía","vacunado":true,"esterilizado":false,"desparasitado":true,"microchip":false,"buenoConNiños":true,"buenoConOtrosAnimales":false,"historia":"Animal de placeholder, caso urgente.","cuidadosEspeciales":"Curaciones diarias y antibióticos.","necesidades":"Hogar de tránsito hasta recuperarse."}'::jsonb
  )
on conflict (id) do nothing;

-- ============================================================
-- 2 veterinarias placeholder
-- ============================================================
-- Sin ON CONFLICT porque los UUIDs son autogenerados; el DELETE de arriba
-- limpia los previos.

insert into public.veterinarias (nombre, comuna, telefono, horario, lat, lng, redes) values
  (
    'Veterinaria Demo Ñuñoa',
    'Ñuñoa',
    '+56 2 2345 6789',
    'Lun a Vie 09:00 - 19:00',
    -33.4540, -70.5985,
    '{"whatsapp":"+56223456789","instagram":"@vet.demo.nunoa"}'::jsonb
  ),
  (
    'Hospital Demo Centro',
    'Santiago Centro',
    '+56 2 2456 7890',
    '24 horas',
    -33.4489, -70.6693,
    null
  );
