-- Huellas Seguras — Datos de prueba para Supabase.
--
-- Correr en el SQL Editor DESPUÉS de schema.sql. Es idempotente: los IDs
-- son fijos y se usa ON CONFLICT DO NOTHING, por lo que se puede re-correr
-- sin duplicar filas. Para limpiar primero: truncate animales, organizaciones
-- cascade.
--
-- Las organizaciones quedan sin user_id (la columna es nullable). Cuando
-- una fundación se registre por la app, su organización se crea aparte
-- desde signupFundacion con user_id = auth.uid().

-- ============================================================
-- Organizaciones
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
  )
on conflict (id) do nothing;

-- ============================================================
-- Animales (todos quedan libres: apadrinado_por y adoptado_por son null)
-- ============================================================

insert into public.animales (
  id, nombre, tipo, estado, zona, comuna, descripcion, foto_url, organizacion_id, lat, lng, ficha
) values
  (
    '22222222-2222-2222-2222-222222222201',
    'Manchas', 'Perro', 'saludable',
    'Plaza Ñuñoa', 'Ñuñoa',
    'Perro mestizo, muy amistoso. Frecuenta la plaza por las tardes.',
    'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=400&h=400&fit=crop',
    '11111111-1111-1111-1111-111111111101',
    -33.4569, -70.5939,
    '{"edad":"3 años aprox.","sexo":"Macho","raza":"Mestizo (quiltro)","tamaño":"Mediano","peso":"14 kg","color":"Café con manchas blancas","temperamento":"Sociable, juguetón, leal","vacunado":true,"esterilizado":true,"desparasitado":true,"microchip":true,"fechaRescate":"Marzo 2024","historia":"Manchas apareció en Plaza Ñuñoa durante el otoño de 2024. Vecinos del sector lo alimentan a diario y la fundación lo esterilizó. Hoy busca un hogar definitivo donde pueda recibir el cariño que se merece.","cuidadosEspeciales":"Ninguno. Está en perfecto estado de salud.","buenoConNiños":true,"buenoConOtrosAnimales":true,"necesidades":"Casa con patio o salidas diarias. Familia activa que disfrute caminar."}'::jsonb
  ),
  (
    '22222222-2222-2222-2222-222222222202',
    'Lola', 'Perra', 'observacion',
    'Av. Irarrázaval', 'Ñuñoa',
    'Cachorra en seguimiento de vacunación. Le falta una dosis.',
    'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=400&fit=crop',
    '11111111-1111-1111-1111-111111111101',
    -33.4525, -70.6017,
    '{"edad":"5 meses","sexo":"Hembra","raza":"Mestiza","tamaño":"Cachorra (pequeña)","peso":"4 kg","color":"Café claro con orejas oscuras","temperamento":"Curiosa, dócil, mucha energía","vacunado":false,"esterilizado":false,"desparasitado":true,"microchip":false,"fechaRescate":"Octubre 2024","historia":"Lola fue encontrada deambulando sola por Av. Irarrázaval con apenas 2 meses. Una familia voluntaria la acogió temporalmente y un padrino financia sus tratamientos veterinarios.","cuidadosEspeciales":"Le falta la última dosis de la vacuna séxtuple y agendar esterilización al cumplir 6 meses.","buenoConNiños":true,"buenoConOtrosAnimales":true,"necesidades":"Familia paciente que la ayude a completar su socialización y educación básica."}'::jsonb
  ),
  (
    '22222222-2222-2222-2222-222222222203',
    'Coco', 'Perro', 'urgente',
    'Av. Quilín', 'Macul',
    'Perro adulto con herida abierta en el lomo. Requiere intervención.',
    'https://images.unsplash.com/photo-1517849845537-4d257902454a?w=400&h=400&fit=crop',
    '11111111-1111-1111-1111-111111111101',
    -33.4906, -70.5980,
    '{"edad":"6 años aprox.","sexo":"Macho","raza":"Mestizo de raza grande","tamaño":"Grande","peso":"22 kg","color":"Café oscuro","temperamento":"Tímido al principio, dulce cuando confía","vacunado":true,"esterilizado":false,"desparasitado":true,"microchip":false,"fechaRescate":"Noviembre 2025","historia":"Coco fue reportado por vecinos al ver una herida abierta en su lomo, posiblemente causada por una pelea. La fundación coordina su atención veterinaria urgente.","cuidadosEspeciales":"Curaciones diarias y antibióticos. Esterilización pendiente tras recuperación.","buenoConNiños":true,"buenoConOtrosAnimales":false,"necesidades":"Hogar de tránsito mientras se recupera. Único perro en la casa."}'::jsonb
  ),
  (
    '22222222-2222-2222-2222-222222222204',
    'Toby', 'Perro', 'observacion',
    'Pedro de Valdivia', 'Providencia',
    'Cachorro tipo Cavalier en seguimiento de vacunación.',
    'https://images.unsplash.com/photo-1560807707-8cc77767d783?w=400&h=400&fit=crop',
    '11111111-1111-1111-1111-111111111102',
    -33.4319, -70.6135,
    '{"edad":"4 meses","sexo":"Macho","raza":"Mestizo tipo Cavalier King Charles","tamaño":"Cachorro (pequeño)","peso":"3.5 kg","color":"Blanco con manchas castañas","temperamento":"Cariñoso, sociable, muy juguetón","vacunado":false,"esterilizado":false,"desparasitado":true,"microchip":false,"fechaRescate":"Septiembre 2024","historia":"Toby fue rescatado tras ser encontrado en una caja de cartón en Pedro de Valdivia.","cuidadosEspeciales":"Vacunación en curso. Próxima dosis en 3 semanas.","buenoConNiños":true,"buenoConOtrosAnimales":true,"necesidades":"Familia con tiempo para educación de cachorro. Disponibilidad para paseos."}'::jsonb
  ),
  (
    '22222222-2222-2222-2222-222222222205',
    'Bruno', 'Perro', 'urgente',
    'Av. Kennedy', 'Vitacura',
    'Golden retriever adulto, posible fractura. Necesita radiografía urgente.',
    'https://images.unsplash.com/photo-1591946614720-90a587da4a36?w=400&h=400&fit=crop',
    '11111111-1111-1111-1111-111111111102',
    -33.3897, -70.5807,
    '{"edad":"5 años aprox.","sexo":"Macho","raza":"Golden Retriever","tamaño":"Grande","peso":"24 kg","color":"Dorado","temperamento":"Dulce, dócil, pide cariño constantemente","vacunado":true,"esterilizado":false,"desparasitado":true,"microchip":false,"fechaRescate":"Noviembre 2025","historia":"Bruno fue encontrado cojeando en Av. Kennedy. Se cree que fue atropellado. Necesita radiografía urgente para confirmar fractura en pata trasera.","cuidadosEspeciales":"Reposo absoluto, posible cirugía. Apadrinamiento urgente para costos veterinarios.","buenoConNiños":true,"buenoConOtrosAnimales":true,"necesidades":"Hogar de tránsito para recuperación post-quirúrgica."}'::jsonb
  ),
  (
    '22222222-2222-2222-2222-222222222206',
    'Nube', 'Gato', 'saludable',
    'Lastarria', 'Santiago Centro',
    'Gato blanco, frecuenta cafeterías. Muy sociable.',
    'https://images.unsplash.com/photo-1570824104453-508955ab713e?w=400&h=400&fit=crop',
    '11111111-1111-1111-1111-111111111103',
    -33.4380, -70.6437,
    '{"edad":"2 años","sexo":"Macho","raza":"Doméstico pelo corto","tamaño":"Mediano","peso":"4.5 kg","color":"Blanco con detalles grises","temperamento":"Súper sociable, busca a la gente, le gustan los regalones","vacunado":true,"esterilizado":true,"desparasitado":true,"microchip":false,"fechaRescate":"Febrero 2024","historia":"Nube se hizo famoso en el Barrio Lastarria por colarse en cafeterías a saludar clientes.","cuidadosEspeciales":"Ninguno.","buenoConNiños":true,"buenoConOtrosAnimales":true,"necesidades":"Hogar con personas presentes durante el día. No le gusta estar solo."}'::jsonb
  ),
  (
    '22222222-2222-2222-2222-222222222207',
    'Roma', 'Perra', 'saludable',
    'Patronato', 'Recoleta',
    'Perra mediana tipo Corgi. Adoptable, muy mansa.',
    'https://images.unsplash.com/photo-1551717743-49959800b1f6?w=400&h=400&fit=crop',
    '11111111-1111-1111-1111-111111111103',
    -33.4291, -70.6444,
    '{"edad":"5 años aprox.","sexo":"Hembra","raza":"Mestiza tipo Corgi","tamaño":"Mediana","peso":"13 kg","color":"Blanco con manchas canela","temperamento":"Mansa, tranquila, ideal para principiantes","vacunado":true,"esterilizado":true,"desparasitado":true,"microchip":true,"fechaRescate":"Julio 2024","historia":"Roma fue entregada a la fundación tras quedar abandonada cuando sus dueños se mudaron.","cuidadosEspeciales":"Ninguno.","buenoConNiños":true,"buenoConOtrosAnimales":true,"necesidades":"Hogar amoroso. Ideal para personas mayores o familias con niños."}'::jsonb
  ),
  (
    '22222222-2222-2222-2222-222222222208',
    'Negra', 'Perra', 'urgente',
    'Pajaritos', 'Maipú',
    'Perra preñada, necesita atención prenatal urgente.',
    'https://images.unsplash.com/photo-1605568427561-40dd23c2acea?w=400&h=400&fit=crop',
    '11111111-1111-1111-1111-111111111104',
    -33.5111, -70.7574,
    '{"edad":"3 años aprox.","sexo":"Hembra (preñada)","raza":"Mestiza","tamaño":"Mediana","peso":"15 kg (gestante)","color":"Negra","temperamento":"Dulce, protectora, en estado vulnerable","vacunado":false,"esterilizado":false,"desparasitado":true,"microchip":false,"fechaRescate":"Noviembre 2025","historia":"Negra fue rescatada en Av. Pajaritos en avanzado estado de gestación.","cuidadosEspeciales":"Control prenatal semanal. Esterilización post-parto cuando los cachorros estén destetados.","buenoConNiños":true,"buenoConOtrosAnimales":true,"necesidades":"Urgente hogar de tránsito para el parto. Apadrinamiento para gastos veterinarios."}'::jsonb
  ),
  (
    '22222222-2222-2222-2222-222222222209',
    'Estrella', 'Perra', 'saludable',
    'Lo Prado', 'Pudahuel',
    'Perra joven tipo bulldog francés. Vacunada, lista para adopción.',
    'https://images.unsplash.com/photo-1583512603805-3cc6b41f3edb?w=400&h=400&fit=crop',
    '11111111-1111-1111-1111-111111111104',
    -33.4403, -70.7167,
    '{"edad":"1.5 años","sexo":"Hembra","raza":"Mestiza tipo Bulldog Francés","tamaño":"Pequeña-mediana","peso":"9 kg","color":"Beige claro","temperamento":"Alegre, juguetona, muy activa","vacunado":true,"esterilizado":true,"desparasitado":true,"microchip":true,"fechaRescate":"Marzo 2024","historia":"Estrella es parte de una camada rescatada en Pudahuel. Es la última hermana esperando hogar.","cuidadosEspeciales":"Ninguno.","buenoConNiños":true,"buenoConOtrosAnimales":true,"necesidades":"Familia con tiempo para juegos. Casa con patio o paseos largos."}'::jsonb
  ),
  (
    '22222222-2222-2222-2222-222222222210',
    'Max', 'Perro', 'saludable',
    'Av. Larraín', 'La Reina',
    'Perro mayor (10 años), busca hogar tranquilo. Programa Anciano.',
    'https://images.unsplash.com/photo-1605897472359-85e4b94d685d?w=400&h=400&fit=crop',
    '11111111-1111-1111-1111-111111111105',
    -33.4453, -70.5407,
    '{"edad":"10 años","sexo":"Macho","raza":"Mestizo (cruce Labrador)","tamaño":"Grande","peso":"25 kg","color":"Dorado claro con canas","temperamento":"Calmado, sabio, mejor amigo del humano","vacunado":true,"esterilizado":true,"desparasitado":true,"microchip":true,"fechaRescate":"Enero 2024 (Programa Anciano)","historia":"Max fue entregado al refugio cuando su dueño falleció. Es parte del programa \"Adopta un anciano\" del Hogar Animal Cordillera.","cuidadosEspeciales":"Control geriátrico semestral. Medicación para articulaciones.","buenoConNiños":true,"buenoConOtrosAnimales":true,"necesidades":"Hogar tranquilo. Familia que valore acompañar a un perro mayor en sus últimos años."}'::jsonb
  )
on conflict (id) do nothing;
