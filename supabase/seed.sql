-- Huellas Seguras — Seed de demo.
--
-- Datos para mostrar la app poblada en una presentación. Cubre:
--   - 6 organizaciones placeholder (sin user_id, así no chocan con
--     fundaciones reales registradas vía signup)
--   - 20 animales repartidos por comuna, tipo y estado
--   - 6 veterinarias en distintas comunas
--   - 10 posts de foro cubriendo combinaciones (monto+foto+boleta,
--     solo monto, solo foto, etc.)
--   - foro_post_animales: relaciones entre los posts y animales
--
-- NO seedea donaciones, reportes, ni apadrinamientos/adopciones porque
-- requieren un user_id real (FK a public.users). Para la demo en vivo:
-- crea un usuario "maria@demo.cl" via signup en la app, y luego desde
-- el catálogo apadrina/adopta 2-3 animales y haz una donación. Eso
-- llena las secciones del Perfil y los filtros de Animales.
--
-- Idempotente: el DELETE limpia los placeholders previos y los INSERT
-- con UUIDs fijos usan ON CONFLICT DO NOTHING.

-- ============================================================
-- Limpieza
-- ============================================================
-- user_id IS NULL ⇒ placeholder/seed. Las fundaciones reales (con
-- user_id != null) no se tocan. CASCADE limpia animales y foro_posts.
delete from public.organizaciones where user_id is null;
delete from public.veterinarias;

-- ============================================================
-- Organizaciones (6 placeholder)
-- ============================================================

insert into public.organizaciones (
  id, nombre, comuna, comunas_operacion, descripcion, telefono, horario, banco, redes
) values
  (
    '11111111-1111-1111-1111-111111111101',
    'Fundación Refugio Esperanza',
    'Ñuñoa',
    array['Ñuñoa', 'Providencia', 'Macul'],
    'Rescatamos y rehabilitamos animales en situación de calle desde 2010. Operamos un refugio con capacidad para 80 animales.',
    '+56 9 8765 4321',
    'Lun a Vie 10:00 - 18:00',
    '{"banco":"Banco de Chile","tipoCuenta":"Cuenta Corriente","numero":"0011-22-33445566","rut":"65.123.456-7","titular":"Fundación Refugio Esperanza","email":"donaciones@refugioesperanza.cl"}'::jsonb,
    '{"instagram":"@refugioesperanza","facebook":"RefugioEsperanzaCL","whatsapp":"+56987654321","web":"https://refugioesperanza.cl"}'::jsonb
  ),
  (
    '11111111-1111-1111-1111-111111111102',
    'Asociación Huellitas',
    'Providencia',
    array['Providencia', 'Las Condes', 'Vitacura'],
    'Apoyamos a comunidades en el cuidado de animales callejeros. Programa de adopción responsable y esterilización masiva.',
    '+56 9 1234 5678',
    'Lun a Sáb 09:00 - 17:00',
    '{"banco":"BancoEstado","tipoCuenta":"CuentaRUT","numero":"00078901234","rut":"65.987.654-3","titular":"Asociación Huellitas Chile","email":"aportes@huellitas.cl"}'::jsonb,
    '{"instagram":"@huellitas.cl","facebook":"huellitaschile","whatsapp":"+56912345678"}'::jsonb
  ),
  (
    '11111111-1111-1111-1111-111111111103',
    'Patitas en la Calle',
    'Santiago Centro',
    array['Santiago Centro', 'Recoleta', 'Independencia'],
    'Programa de esterilización y adopción responsable. Más de 5000 esterilizaciones gratuitas desde 2015.',
    '+56 9 5555 1212',
    'Mar a Dom 11:00 - 19:00',
    '{"banco":"Banco Santander","tipoCuenta":"Cuenta Vista","numero":"7766-5544-3322-1100","rut":"76.555.111-K","titular":"ONG Patitas en la Calle","email":"donar@patitasenlacalle.org"}'::jsonb,
    '{"instagram":"@patitasenlacalle","web":"https://patitasenlacalle.org"}'::jsonb
  ),
  (
    '11111111-1111-1111-1111-111111111104',
    'Red Animal Solidaria',
    'Maipú',
    array['Maipú', 'Cerrillos', 'Pudahuel', 'Cerro Navia'],
    'Red de voluntarios que brinda alimento y atención básica en sectores con menor acceso a veterinarias.',
    '+56 9 7777 3434',
    'Lun a Dom 08:00 - 20:00',
    '{"banco":"Banco BCI","tipoCuenta":"Cuenta Corriente","numero":"5544-9988-7766","rut":"76.333.222-1","titular":"Red Animal Solidaria SpA","email":"tesoreria@redanimalsolidaria.cl"}'::jsonb,
    '{"facebook":"RedAnimalSolidaria","whatsapp":"+56977773434"}'::jsonb
  ),
  (
    '11111111-1111-1111-1111-111111111105',
    'Hogar Animal Cordillera',
    'Las Condes',
    array['Las Condes', 'La Reina', 'Peñalolén'],
    'Albergue temporal con foco en perros de talla grande. Programa "Adopta un anciano" para animales mayores de 8 años.',
    '+56 9 6543 2109',
    'Lun a Sáb 10:00 - 19:00',
    '{"banco":"Scotiabank Chile","tipoCuenta":"Cuenta Corriente","numero":"0099-8877-6655","rut":"76.888.777-6","titular":"Hogar Animal Cordillera Ltda.","email":"donaciones@hogarcordillera.cl"}'::jsonb,
    '{"instagram":"@hogarcordillera","facebook":"HogarAnimalCordillera","web":"https://hogarcordillera.cl"}'::jsonb
  ),
  (
    '11111111-1111-1111-1111-111111111106',
    'Fundación Patitas del Sur',
    'La Florida',
    array['La Florida', 'Puente Alto', 'San Bernardo'],
    'Trabajamos en zonas periurbanas del sur de Santiago. Campañas mensuales de vacunación y rescate de camadas.',
    '+56 9 2233 4455',
    'Mié a Dom 09:00 - 18:00',
    '{"banco":"Banco Falabella","tipoCuenta":"Cuenta Corriente","numero":"1122-3344-5566","rut":"76.111.222-3","titular":"Fundación Patitas del Sur","email":"contacto@patitasdelsur.cl"}'::jsonb,
    null
  )
on conflict (id) do nothing;

-- ============================================================
-- Animales (20 con UUIDs fijos)
-- ============================================================
-- Fotos sin crop (?w=800) para que el resizeMode:contain del card las
-- muestre con su aspecto natural. Cada animal con foto distinta para
-- que el matcher visual de Reportar no dé falsos positivos.

insert into public.animales (
  id, nombre, tipo, estado, zona, comuna, descripcion, foto_url,
  organizacion_id, lat, lng, ficha
) values
  -- ORG-01: Refugio Esperanza
  (
    '22222222-2222-2222-2222-222222222201',
    'Manchas', 'Perro', 'saludable',
    'Plaza Ñuñoa', 'Ñuñoa',
    'Perro mestizo, muy amistoso. Frecuenta la plaza por las tardes.',
    'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=800',
    '11111111-1111-1111-1111-111111111101',
    -33.4569, -70.5939,
    '{"edad":"3 años aprox.","sexo":"Macho","raza":"Mestizo (quiltro)","tamaño":"Mediano","peso":"14 kg","color":"Café con manchas blancas","temperamento":"Sociable, juguetón, leal","vacunado":true,"esterilizado":true,"desparasitado":true,"microchip":true,"fechaRescate":"Marzo 2024","historia":"Manchas apareció en Plaza Ñuñoa durante el otoño de 2024.","cuidadosEspeciales":"Ninguno.","buenoConNiños":true,"buenoConOtrosAnimales":true,"necesidades":"Casa con patio o salidas diarias."}'::jsonb
  ),
  (
    '22222222-2222-2222-2222-222222222202',
    'Lola', 'Perra', 'observacion',
    'Av. Irarrázaval', 'Ñuñoa',
    'Cachorra en seguimiento de vacunación. Le falta una dosis.',
    'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800',
    '11111111-1111-1111-1111-111111111101',
    -33.4525, -70.6017,
    '{"edad":"5 meses","sexo":"Hembra","raza":"Mestiza","tamaño":"Cachorra","peso":"4 kg","color":"Café claro","temperamento":"Curiosa, dócil","vacunado":false,"esterilizado":false,"desparasitado":true,"microchip":false,"fechaRescate":"Octubre 2024","historia":"Lola fue encontrada deambulando sola por Av. Irarrázaval.","cuidadosEspeciales":"Le falta vacuna séxtuple y esterilización a los 6 meses.","buenoConNiños":true,"buenoConOtrosAnimales":true,"necesidades":"Familia paciente."}'::jsonb
  ),
  (
    '22222222-2222-2222-2222-222222222203',
    'Simba', 'Gato', 'saludable',
    'Suecia', 'Providencia',
    'Gato naranja, esterilizado. Vive entre dos edificios.',
    'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800',
    '11111111-1111-1111-1111-111111111101',
    -33.4222, -70.6116,
    '{"edad":"4 años aprox.","sexo":"Macho","raza":"Doméstico pelo corto","tamaño":"Mediano","peso":"5 kg","color":"Naranja atigrado","temperamento":"Independiente, calmado","vacunado":true,"esterilizado":true,"desparasitado":true,"microchip":false,"fechaRescate":"Junio 2022","historia":"Simba es parte de una colonia controlada.","cuidadosEspeciales":"Control trimestral.","buenoConNiños":false,"buenoConOtrosAnimales":true,"necesidades":"Departamento sin niños pequeños."}'::jsonb
  ),
  (
    '22222222-2222-2222-2222-222222222204',
    'Coco', 'Perro', 'urgente',
    'Av. Quilín', 'Macul',
    'Perro adulto con herida abierta en el lomo. Requiere intervención.',
    'https://images.unsplash.com/photo-1517849845537-4d257902454a?w=800',
    '11111111-1111-1111-1111-111111111101',
    -33.4906, -70.5980,
    '{"edad":"6 años aprox.","sexo":"Macho","raza":"Mestizo grande","tamaño":"Grande","peso":"22 kg","color":"Café oscuro","temperamento":"Tímido, dulce cuando confía","vacunado":true,"esterilizado":false,"desparasitado":true,"microchip":false,"fechaRescate":"Noviembre 2025","historia":"Reportado con herida abierta posiblemente por pelea.","cuidadosEspeciales":"Curaciones diarias.","buenoConNiños":true,"buenoConOtrosAnimales":false,"necesidades":"Hogar de tránsito."}'::jsonb
  ),

  -- ORG-02: Huellitas
  (
    '22222222-2222-2222-2222-222222222205',
    'Toby', 'Perro', 'observacion',
    'Pedro de Valdivia', 'Providencia',
    'Cachorro tipo Cavalier en seguimiento de vacunación.',
    'https://images.unsplash.com/photo-1560807707-8cc77767d783?w=800',
    '11111111-1111-1111-1111-111111111102',
    -33.4319, -70.6135,
    '{"edad":"4 meses","sexo":"Macho","raza":"Mestizo tipo Cavalier","tamaño":"Cachorro","peso":"3.5 kg","color":"Blanco con manchas castañas","temperamento":"Cariñoso, muy juguetón","vacunado":false,"esterilizado":false,"desparasitado":true,"microchip":false,"fechaRescate":"Septiembre 2024","historia":"Rescatado en una caja de cartón.","cuidadosEspeciales":"Vacunación en curso.","buenoConNiños":true,"buenoConOtrosAnimales":true,"necesidades":"Familia con tiempo para educación."}'::jsonb
  ),
  (
    '22222222-2222-2222-2222-222222222206',
    'Bruno', 'Perro', 'urgente',
    'Av. Kennedy', 'Vitacura',
    'Golden retriever adulto, posible fractura. Necesita radiografía urgente.',
    'https://images.unsplash.com/photo-1591946614720-90a587da4a36?w=800',
    '11111111-1111-1111-1111-111111111102',
    -33.3897, -70.5807,
    '{"edad":"5 años aprox.","sexo":"Macho","raza":"Golden Retriever","tamaño":"Grande","peso":"24 kg","color":"Dorado","temperamento":"Dulce, dócil","vacunado":true,"esterilizado":false,"desparasitado":true,"microchip":false,"fechaRescate":"Noviembre 2025","historia":"Encontrado cojeando en Av. Kennedy.","cuidadosEspeciales":"Reposo absoluto, posible cirugía.","buenoConNiños":true,"buenoConOtrosAnimales":true,"necesidades":"Hogar de tránsito post-quirúrgico."}'::jsonb
  ),
  (
    '22222222-2222-2222-2222-222222222207',
    'Misha', 'Gata', 'saludable',
    'Bellavista', 'Providencia',
    'Gata negra, esterilizada. Cuidada por un vecino.',
    'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=800',
    '11111111-1111-1111-1111-111111111102',
    -33.4310, -70.6373,
    '{"edad":"6 años","sexo":"Hembra","raza":"Doméstico pelo corto","tamaño":"Mediana","peso":"4 kg","color":"Negro azabache","temperamento":"Tranquila, observadora","vacunado":true,"esterilizado":true,"desparasitado":true,"microchip":true,"fechaRescate":"Marzo 2020","historia":"Pasó años en colonia hasta ser formalizada.","cuidadosEspeciales":"Control anual.","buenoConNiños":true,"buenoConOtrosAnimales":false,"necesidades":"Hogar definitivo."}'::jsonb
  ),

  -- ORG-03: Patitas en la Calle
  (
    '22222222-2222-2222-2222-222222222208',
    'Nube', 'Gato', 'saludable',
    'Lastarria', 'Santiago Centro',
    'Gato blanco, frecuenta cafeterías. Muy sociable.',
    'https://images.unsplash.com/photo-1570824104453-508955ab713e?w=800',
    '11111111-1111-1111-1111-111111111103',
    -33.4380, -70.6437,
    '{"edad":"2 años","sexo":"Macho","raza":"Doméstico pelo corto","tamaño":"Mediano","peso":"4.5 kg","color":"Blanco","temperamento":"Súper sociable","vacunado":true,"esterilizado":true,"desparasitado":true,"microchip":false,"fechaRescate":"Febrero 2024","historia":"Famoso en Lastarria por colarse en cafeterías.","cuidadosEspeciales":"Ninguno.","buenoConNiños":true,"buenoConOtrosAnimales":true,"necesidades":"Hogar con compañía durante el día."}'::jsonb
  ),
  (
    '22222222-2222-2222-2222-222222222209',
    'Roma', 'Perra', 'saludable',
    'Patronato', 'Recoleta',
    'Perra mediana tipo Corgi. Adoptable, muy mansa.',
    'https://images.unsplash.com/photo-1551717743-49959800b1f6?w=800',
    '11111111-1111-1111-1111-111111111103',
    -33.4291, -70.6444,
    '{"edad":"5 años aprox.","sexo":"Hembra","raza":"Mestiza tipo Corgi","tamaño":"Mediana","peso":"13 kg","color":"Blanco con canela","temperamento":"Mansa, tranquila","vacunado":true,"esterilizado":true,"desparasitado":true,"microchip":true,"fechaRescate":"Julio 2024","historia":"Abandonada cuando sus dueños se mudaron.","cuidadosEspeciales":"Ninguno.","buenoConNiños":true,"buenoConOtrosAnimales":true,"necesidades":"Hogar amoroso."}'::jsonb
  ),
  (
    '22222222-2222-2222-2222-222222222210',
    'Rocky', 'Perro', 'urgente',
    'Av. Matta', 'Santiago Centro',
    'Perro herido en la pata trasera. Requiere atención urgente.',
    'https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=800',
    '11111111-1111-1111-1111-111111111103',
    -33.4628, -70.6481,
    '{"edad":"4 años aprox.","sexo":"Macho","raza":"Mestizo","tamaño":"Mediano","peso":"16 kg","color":"Café con detalles claros","temperamento":"Asustadizo por su condición","vacunado":false,"esterilizado":false,"desparasitado":true,"microchip":false,"fechaRescate":"Noviembre 2025","historia":"Visto arrastrando una pata en Av. Matta.","cuidadosEspeciales":"Evaluación quirúrgica.","buenoConNiños":false,"buenoConOtrosAnimales":false,"necesidades":"Apadrinamiento urgente."}'::jsonb
  ),
  (
    '22222222-2222-2222-2222-222222222211',
    'Trueno', 'Perro', 'observacion',
    'Av. Independencia', 'Independencia',
    'Perro adulto, recuperándose de sarna sarcóptica.',
    'https://images.unsplash.com/photo-1530281700549-e82e7bf110d6?w=800',
    '11111111-1111-1111-1111-111111111103',
    -33.4174, -70.6660,
    '{"edad":"6 años aprox.","sexo":"Macho","raza":"Mestizo","tamaño":"Mediano","peso":"17 kg","color":"Café canela","temperamento":"Agradecido, paciente","vacunado":true,"esterilizado":true,"desparasitado":true,"microchip":false,"fechaRescate":"Agosto 2025","historia":"Llegó con sarna avanzada, ya recuperado.","cuidadosEspeciales":"Baños medicados quincenales.","buenoConNiños":true,"buenoConOtrosAnimales":true,"necesidades":"Familia paciente."}'::jsonb
  ),

  -- ORG-04: Red Animal Solidaria
  (
    '22222222-2222-2222-2222-222222222212',
    'Negra', 'Perra', 'urgente',
    'Pajaritos', 'Maipú',
    'Perra preñada, necesita atención prenatal urgente.',
    'https://images.unsplash.com/photo-1605568427561-40dd23c2acea?w=800',
    '11111111-1111-1111-1111-111111111104',
    -33.5111, -70.7574,
    '{"edad":"3 años aprox.","sexo":"Hembra (preñada)","raza":"Mestiza","tamaño":"Mediana","peso":"15 kg","color":"Negra","temperamento":"Dulce, protectora","vacunado":false,"esterilizado":false,"desparasitado":true,"microchip":false,"fechaRescate":"Noviembre 2025","historia":"Rescatada en estado avanzado de gestación.","cuidadosEspeciales":"Control prenatal semanal.","buenoConNiños":true,"buenoConOtrosAnimales":true,"necesidades":"Hogar de tránsito para parto."}'::jsonb
  ),
  (
    '22222222-2222-2222-2222-222222222213',
    'Estrella', 'Perra', 'saludable',
    'Lo Prado', 'Pudahuel',
    'Perra joven tipo bulldog francés. Lista para adopción.',
    'https://images.unsplash.com/photo-1583512603805-3cc6b41f3edb?w=800',
    '11111111-1111-1111-1111-111111111104',
    -33.4403, -70.7167,
    '{"edad":"1.5 años","sexo":"Hembra","raza":"Mestiza tipo Bulldog Francés","tamaño":"Pequeña-mediana","peso":"9 kg","color":"Beige claro","temperamento":"Alegre, juguetona","vacunado":true,"esterilizado":true,"desparasitado":true,"microchip":true,"fechaRescate":"Marzo 2024","historia":"Última hermana de una camada rescatada.","cuidadosEspeciales":"Ninguno.","buenoConNiños":true,"buenoConOtrosAnimales":true,"necesidades":"Familia con tiempo para juegos."}'::jsonb
  ),
  (
    '22222222-2222-2222-2222-222222222214',
    'Lobo', 'Perro', 'observacion',
    'Av. Departamental', 'Cerrillos',
    'Husky siberiano, recuperándose de desnutrición.',
    'https://images.unsplash.com/photo-1547407139-3c921a66005c?w=800',
    '11111111-1111-1111-1111-111111111104',
    -33.4988, -70.7156,
    '{"edad":"4 años aprox.","sexo":"Macho","raza":"Husky Siberiano","tamaño":"Grande","peso":"19 kg","color":"Blanco con gris, ojos azules","temperamento":"Energético, vocal","vacunado":true,"esterilizado":false,"desparasitado":true,"microchip":false,"fechaRescate":"Septiembre 2025","historia":"Encontrado en desnutrición severa.","cuidadosEspeciales":"Dieta hipercalórica supervisada.","buenoConNiños":true,"buenoConOtrosAnimales":true,"necesidades":"Familia activa con patio."}'::jsonb
  ),

  -- ORG-05: Hogar Cordillera
  (
    '22222222-2222-2222-2222-222222222215',
    'Max', 'Perro', 'saludable',
    'Av. Larraín', 'La Reina',
    'Perro mayor (10 años), busca hogar tranquilo. Programa Anciano.',
    'https://images.unsplash.com/photo-1605897472359-85e4b94d685d?w=800',
    '11111111-1111-1111-1111-111111111105',
    -33.4453, -70.5407,
    '{"edad":"10 años","sexo":"Macho","raza":"Mestizo (cruce Labrador)","tamaño":"Grande","peso":"25 kg","color":"Dorado claro","temperamento":"Calmado, sabio","vacunado":true,"esterilizado":true,"desparasitado":true,"microchip":true,"fechaRescate":"Enero 2024","historia":"Entregado al refugio cuando su dueño falleció.","cuidadosEspeciales":"Control geriátrico semestral.","buenoConNiños":true,"buenoConOtrosAnimales":true,"necesidades":"Hogar tranquilo para sus últimos años."}'::jsonb
  ),
  (
    '22222222-2222-2222-2222-222222222216',
    'Bigotes', 'Gato', 'observacion',
    'Tobalaba', 'La Reina',
    'Gato blanco con detalles atigrados, recuperándose de cirugía dental.',
    'https://images.unsplash.com/photo-1543852786-1cf6624b9987?w=800',
    '11111111-1111-1111-1111-111111111105',
    -33.4486, -70.5440,
    '{"edad":"7 años","sexo":"Macho","raza":"Doméstico pelo corto","tamaño":"Mediano","peso":"5.5 kg","color":"Blanco con atigrado","temperamento":"Conversador, expresivo","vacunado":true,"esterilizado":true,"desparasitado":true,"microchip":true,"fechaRescate":"Octubre 2023","historia":"Abandonado con problemas dentales severos.","cuidadosEspeciales":"Dieta blanda por 2 meses más.","buenoConNiños":false,"buenoConOtrosAnimales":false,"necesidades":"Hogar tranquilo sin otros animales."}'::jsonb
  ),
  (
    '22222222-2222-2222-2222-222222222217',
    'Mia', 'Gata', 'urgente',
    'Las Perdices', 'Peñalolén',
    'Gatita rescatada con desnutrición severa, alimentación asistida.',
    'https://images.unsplash.com/photo-1574144611937-0df059b5ef3e?w=800',
    '11111111-1111-1111-1111-111111111105',
    -33.4878, -70.5283,
    '{"edad":"8 meses","sexo":"Hembra","raza":"Doméstico pelo corto","tamaño":"Pequeña","peso":"1.8 kg","color":"Atigrada café","temperamento":"Frágil pero agradecida","vacunado":false,"esterilizado":false,"desparasitado":true,"microchip":false,"fechaRescate":"Noviembre 2025","historia":"Rescatada con desnutrición y deshidratación.","cuidadosEspeciales":"Alimentación asistida cada 4h.","buenoConNiños":true,"buenoConOtrosAnimales":true,"necesidades":"Apadrinamiento URGENTE."}'::jsonb
  ),

  -- ORG-06: Patitas del Sur
  (
    '22222222-2222-2222-2222-222222222218',
    'Canela', 'Perra', 'saludable',
    'Vicente Valdés', 'La Florida',
    'Perra mediana, color canela. Esterilizada, vacunada.',
    'https://images.unsplash.com/photo-1558788353-f76d92427f16?w=800',
    '11111111-1111-1111-1111-111111111106',
    -33.5226, -70.5985,
    '{"edad":"4 años","sexo":"Hembra","raza":"Mestiza tipo Labrador","tamaño":"Mediana-grande","peso":"20 kg","color":"Canela uniforme","temperamento":"Equilibrada, cariñosa","vacunado":true,"esterilizado":true,"desparasitado":true,"microchip":true,"fechaRescate":"Junio 2023","historia":"Vivió en la calle durante 2 años.","cuidadosEspeciales":"Ninguno.","buenoConNiños":true,"buenoConOtrosAnimales":true,"necesidades":"Familia que valore una perra tranquila."}'::jsonb
  ),
  (
    '22222222-2222-2222-2222-222222222219',
    'Ramona', 'Gata', 'saludable',
    'Av. Concha y Toro', 'Puente Alto',
    'Gata adulta naranja, recientemente esterilizada. Calmada.',
    'https://images.unsplash.com/photo-1571566882372-1598d88abd90?w=800',
    '11111111-1111-1111-1111-111111111106',
    -33.6111, -70.5764,
    '{"edad":"5 años","sexo":"Hembra","raza":"Doméstico pelo corto","tamaño":"Mediana","peso":"4.5 kg","color":"Naranja uniforme","temperamento":"Calmada, regalona","vacunado":true,"esterilizado":true,"desparasitado":true,"microchip":false,"fechaRescate":"Agosto 2025","historia":"Rescatada en Av. Concha y Toro.","cuidadosEspeciales":"Ninguno.","buenoConNiños":true,"buenoConOtrosAnimales":false,"necesidades":"Hogar tranquilo."}'::jsonb
  ),
  (
    '22222222-2222-2222-2222-222222222220',
    'Capitán', 'Perro', 'urgente',
    'Eyzaguirre', 'Puente Alto',
    'Perro tipo Bulldog Inglés, atropellado leve. Requiere reposo.',
    'https://images.unsplash.com/photo-1561037404-61cd46aa615b?w=800',
    '11111111-1111-1111-1111-111111111106',
    -33.6166, -70.5837,
    '{"edad":"5 años aprox.","sexo":"Macho","raza":"Mestizo tipo Bulldog Inglés","tamaño":"Mediano","peso":"18 kg","color":"Café claro con blanco","temperamento":"Valiente, dócil","vacunado":true,"esterilizado":false,"desparasitado":true,"microchip":false,"fechaRescate":"Noviembre 2025","historia":"Atropellado en Eyzaguirre, sin fracturas.","cuidadosEspeciales":"Reposo absoluto y antiinflamatorio.","buenoConNiños":true,"buenoConOtrosAnimales":true,"necesidades":"Hogar futuro tras recuperación."}'::jsonb
  )
on conflict (id) do nothing;

-- ============================================================
-- Veterinarias (6, distribuidas por la ciudad)
-- ============================================================

insert into public.veterinarias (nombre, comuna, telefono, horario, lat, lng, redes) values
  (
    'Veterinaria Patitas Felices',
    'Ñuñoa',
    '+56 2 2345 6789',
    'Lun a Vie 09:00 - 19:00',
    -33.4540, -70.5985,
    '{"instagram":"@patitasfelices.vet","whatsapp":"+56223456789","web":"https://patitasfelices.cl"}'::jsonb
  ),
  (
    'Clínica Animal Salud',
    'Providencia',
    '+56 2 2987 6543',
    'Lun a Sáb 10:00 - 20:00',
    -33.4280, -70.6190,
    '{"instagram":"@clinicaanimalsalud","facebook":"ClinicaAnimalSalud"}'::jsonb
  ),
  (
    'Hospital Veterinario Central',
    'Santiago Centro',
    '+56 2 2456 7890',
    '24 horas',
    -33.4489, -70.6693,
    '{"web":"https://hospitalvetcentral.cl","whatsapp":"+56224567890"}'::jsonb
  ),
  (
    'VetCare Cordillera',
    'Las Condes',
    '+56 2 2876 5432',
    'Lun a Dom 09:00 - 21:00',
    -33.4150, -70.5710,
    '{"instagram":"@vetcare.cordillera","facebook":"VetCareCordillera","web":"https://vetcarecordillera.cl"}'::jsonb
  ),
  (
    'Clínica Veterinaria Maipú',
    'Maipú',
    '+56 2 2654 3210',
    'Lun a Sáb 09:00 - 19:00',
    -33.5145, -70.7580,
    null
  ),
  (
    'Hospital Animal Sur',
    'La Florida',
    '+56 2 2321 0987',
    'Lun a Dom 08:00 - 22:00',
    -33.5270, -70.5940,
    '{"facebook":"HospitalAnimalSur","whatsapp":"+56223210987"}'::jsonb
  );

-- ============================================================
-- Foro posts (10, cubriendo combinaciones de monto/foto/boleta/animales)
-- ============================================================

insert into public.foro_posts (
  id, organizacion_id, titulo, descripcion, monto, foto_url, boleta_url, created_at
) values
  -- POST-01: completo (monto + foto + boleta + animales)
  (
    '33333333-3333-3333-3333-333333333301',
    '11111111-1111-1111-1111-111111111105',
    'Alimento senior para el programa "Adopta un anciano"',
    'Compramos alimento hipoalergénico y suplementos articulares para los 6 perros mayores del programa. Max y Bigotes ya lo están disfrutando.',
    215000,
    'https://images.unsplash.com/photo-1605897472359-85e4b94d685d?w=800',
    'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800',
    now() - interval '20 days'
  ),
  -- POST-02: monto + boleta + animal (sin foto)
  (
    '33333333-3333-3333-3333-333333333302',
    '11111111-1111-1111-1111-111111111101',
    'Cirugía y curaciones de Coco',
    'Gracias a un padrino anónimo costeamos la cirugía de Coco para tratar la herida del lomo. Está recuperándose en hogar de tránsito.',
    185000,
    null,
    'https://images.unsplash.com/photo-1554224154-22dec7ec8818?w=800',
    now() - interval '8 days'
  ),
  -- POST-03: monto + foto + animales (sin boleta)
  (
    '33333333-3333-3333-3333-333333333303',
    '11111111-1111-1111-1111-111111111102',
    'Operativo de esterilización masiva en Las Condes',
    'Durante el fin de semana esterilizamos 14 gatos comunitarios en El Golf y Apoquindo. Toda la campaña fue financiada con aportes del último trimestre.',
    720000,
    'https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=800',
    null,
    now() - interval '6 days'
  ),
  -- POST-04: solo monto (resumen financiero)
  (
    '33333333-3333-3333-3333-333333333304',
    '11111111-1111-1111-1111-111111111103',
    'Resumen financiero de mayo',
    'En mayo recibimos 38 aportes individuales por un total de $1.245.000. Se destinaron a alimento (54%), veterinaria (33%) y operativos (13%). Gracias a todos.',
    1245000,
    null,
    null,
    now() - interval '15 days'
  ),
  -- POST-05: solo foto + animales (celebración)
  (
    '33333333-3333-3333-3333-333333333305',
    '11111111-1111-1111-1111-111111111104',
    '¡Negra ya tuvo a sus cachorros!',
    'Tras dos semanas en el hogar de tránsito, Negra dio a luz a 6 cachorros sanos. Mamá y bebés están bien. Pronto abriremos lista para padrinos.',
    null,
    'https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=800',
    null,
    now() - interval '3 days'
  ),
  -- POST-06: sin nada opcional (pura comunicación)
  (
    '33333333-3333-3333-3333-333333333306',
    '11111111-1111-1111-1111-111111111106',
    'Buscamos hogar de tránsito en La Florida',
    'Recibimos una camada de 4 cachorros y nuestro refugio está al tope. Necesitamos un hogar de tránsito por 6 semanas. Cubrimos alimento y veterinaria. Escríbenos por mensaje directo.',
    null,
    null,
    null,
    now() - interval '2 days'
  ),
  -- POST-07: boleta + animal, sin monto ni foto
  (
    '33333333-3333-3333-3333-333333333307',
    '11111111-1111-1111-1111-111111111103',
    'Radiografías y antibióticos para Rocky',
    'Rocky fue evaluado en clínica y descartamos fractura. Está con tratamiento antibiótico y antiinflamatorio. Adjuntamos la boleta del centro veterinario.',
    null,
    null,
    'https://images.unsplash.com/photo-1556742044-3c52d6e88c62?w=800',
    now() - interval '11 days'
  ),
  -- POST-08: foto + boleta sin monto sin animales (compra de insumos)
  (
    '33333333-3333-3333-3333-333333333308',
    '11111111-1111-1111-1111-111111111101',
    'Compra de 10 sacos de comida premium',
    'Con los aportes de mayo abastecimos el refugio con 10 sacos de 20kg de comida para perros adultos. Cubre cerca de 6 semanas de alimentación para los 80 animales.',
    null,
    'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=800',
    'https://images.unsplash.com/photo-1607863680151-cd2d1e63a37c?w=800',
    now() - interval '4 days'
  ),
  -- POST-09: solo animales (sin nada más)
  (
    '33333333-3333-3333-3333-333333333309',
    '11111111-1111-1111-1111-111111111101',
    'Estos peludos completaron su esquema de vacunación',
    'Manchas, Lola y Simba ya están al día con vacunas y desparasitación. Próximo paso: control veterinario en agosto.',
    null,
    null,
    null,
    now() - interval '13 days'
  ),
  -- POST-10: monto + foto sin boleta sin animales (campaña difusión)
  (
    '33333333-3333-3333-3333-333333333310',
    '11111111-1111-1111-1111-111111111104',
    'Campaña de vacunación antirrábica en Maipú',
    'Vacunamos 87 perros y gatos comunitarios durante el sábado. Agradecemos a la municipalidad por el espacio y a los voluntarios que se sumaron.',
    430000,
    'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?w=800',
    null,
    now() - interval '24 days'
  )
on conflict (id) do nothing;

-- ============================================================
-- foro_post_animales (relaciones post ↔ animales)
-- ============================================================

insert into public.foro_post_animales (post_id, animal_id) values
  -- POST-01: Max y Bigotes
  ('33333333-3333-3333-3333-333333333301', '22222222-2222-2222-2222-222222222215'),
  ('33333333-3333-3333-3333-333333333301', '22222222-2222-2222-2222-222222222216'),
  -- POST-02: Coco
  ('33333333-3333-3333-3333-333333333302', '22222222-2222-2222-2222-222222222204'),
  -- POST-03: gatos comunitarios (Misha, Nube)
  ('33333333-3333-3333-3333-333333333303', '22222222-2222-2222-2222-222222222207'),
  ('33333333-3333-3333-3333-333333333303', '22222222-2222-2222-2222-222222222208'),
  -- POST-05: Negra
  ('33333333-3333-3333-3333-333333333305', '22222222-2222-2222-2222-222222222212'),
  -- POST-07: Rocky
  ('33333333-3333-3333-3333-333333333307', '22222222-2222-2222-2222-222222222210'),
  -- POST-09: Manchas, Lola, Simba
  ('33333333-3333-3333-3333-333333333309', '22222222-2222-2222-2222-222222222201'),
  ('33333333-3333-3333-3333-333333333309', '22222222-2222-2222-2222-222222222202'),
  ('33333333-3333-3333-3333-333333333309', '22222222-2222-2222-2222-222222222203')
on conflict (post_id, animal_id) do nothing;

-- ============================================================
-- Demo helper: poblar datos de un usuario normal por email
-- ============================================================
--
-- Después de crear un usuario normal vía signup en la app (recomendado:
-- maria@demo.cl), corre:
--
--     select demo_poblar_usuario('maria@demo.cl');
--
-- Esto le va a apadrinar 3 animales, adoptar 2, registrar 4 donaciones
-- y 3 reportes. Es idempotente: re-correrlo no duplica.

create or replace function public.demo_poblar_usuario(p_email text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_count_apad int;
  v_count_adop int;
  v_count_don int;
  v_count_rep int;
begin
  select id into v_user_id from public.users where email = p_email;
  if v_user_id is null then
    raise exception 'No existe usuario con email %', p_email;
  end if;

  -- Apadrina 3 (Lola, Toby, Lobo) en una sola sentencia para que el
  -- row_count sea acumulado por postgres. Skip si ya tienen padrino.
  update public.animales set apadrinado_por = v_user_id
  where id in (
    '22222222-2222-2222-2222-222222222202',
    '22222222-2222-2222-2222-222222222205',
    '22222222-2222-2222-2222-222222222214'
  ) and apadrinado_por is null;
  get diagnostics v_count_apad = row_count;

  -- Adopta 2 (Roma, Nube)
  update public.animales set adoptado_por = v_user_id
  where id in (
    '22222222-2222-2222-2222-222222222209',
    '22222222-2222-2222-2222-222222222208'
  ) and adoptado_por is null;
  get diagnostics v_count_adop = row_count;

  -- Donaciones (idempotente vía delete + insert)
  delete from public.donaciones where user_id = v_user_id and monto in (15000, 25000, 10000, 30000);
  insert into public.donaciones (user_id, organizacion_id, monto, created_at) values
    (v_user_id, '11111111-1111-1111-1111-111111111101', 15000, now() - interval '45 days'),
    (v_user_id, '11111111-1111-1111-1111-111111111102', 25000, now() - interval '30 days'),
    (v_user_id, '11111111-1111-1111-1111-111111111101', 10000, now() - interval '12 days'),
    (v_user_id, '11111111-1111-1111-1111-111111111105', 30000, now() - interval '4 days');
  v_count_don := 4;

  -- Reportes (idempotente vía delete + insert)
  delete from public.reportes where user_id = v_user_id and ubicacion like 'DEMO%';
  insert into public.reportes (user_id, animal_id, ubicacion, descripcion, estado_observado, created_at) values
    (v_user_id, '22222222-2222-2222-2222-222222222210', 'DEMO Av. Matta 1240, Santiago Centro', 'Lo vi cojeando, me preocupa la pata.', 'urgente', now() - interval '11 days'),
    (v_user_id, null, 'DEMO Plaza Brasil, Santiago Centro', 'Cachorro perdido, parece estar sin dueño.', 'observacion', now() - interval '7 days'),
    (v_user_id, '22222222-2222-2222-2222-222222222201', 'DEMO Plaza Ñuñoa', 'Manchas pasea tranquilo por la plaza.', 'saludable', now() - interval '4 days');
  v_count_rep := 3;

  return format('OK. Apadrinados:%s, adoptados:%s, donaciones:%s, reportes:%s',
    v_count_apad, v_count_adop, v_count_don, v_count_rep);
end;
$$;
