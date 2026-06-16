// Datos ficticios para la demo de Huellas Seguras (Santiago de Chile).
// Cada animal tiene su propia URL de foto, distinta del resto, para que el
// algoritmo de similitud no produzca falsos positivos por imágenes
// repetidas.

// Helper para fotos de Unsplash con tamaño fijo 400x400 cuadradas.
const unsplash = (id) =>
  `https://images.unsplash.com/photo-${id}?w=400&h=400&fit=crop`;

// Centro de Santiago para el mapa
export const SANTIAGO_CENTER = { lat: -33.45, lng: -70.66 };

export const ORGANIZACIONES = [
  {
    id: 'ORG-01',
    nombre: 'Fundación Refugio Esperanza',
    comuna: 'Ñuñoa',
    comunasOperacion: ['Ñuñoa', 'Providencia', 'Macul'],
    descripcion:
      'Rescatamos y rehabilitamos animales en situación de calle desde 2010. Operamos un refugio con capacidad para 80 animales.',
    telefono: '+56 9 8765 4321',
    horario: 'Lun a Vie 10:00 - 18:00',
    banco: {
      banco: 'Banco de Chile',
      tipoCuenta: 'Cuenta Corriente',
      numero: '0011-22-33445566',
      rut: '65.123.456-7',
      titular: 'Fundación Refugio Esperanza',
      email: 'donaciones@refugioesperanza.cl',
    },
  },
  {
    id: 'ORG-02',
    nombre: 'Asociación Huellitas',
    comuna: 'Providencia',
    comunasOperacion: ['Providencia', 'Las Condes', 'Vitacura'],
    descripcion:
      'Apoyamos a comunidades en el cuidado de animales callejeros. Programa de adopción responsable y esterilización masiva.',
    telefono: '+56 9 1234 5678',
    horario: 'Lun a Sáb 09:00 - 17:00',
    banco: {
      banco: 'BancoEstado',
      tipoCuenta: 'CuentaRUT',
      numero: '00078901234',
      rut: '65.987.654-3',
      titular: 'Asociación Huellitas Chile',
      email: 'aportes@huellitas.cl',
    },
  },
  {
    id: 'ORG-03',
    nombre: 'Patitas en la Calle',
    comuna: 'Santiago Centro',
    comunasOperacion: ['Santiago Centro', 'Recoleta', 'Independencia'],
    descripcion:
      'Programa de esterilización y adopción responsable. Más de 5000 esterilizaciones gratuitas desde 2015.',
    telefono: '+56 9 5555 1212',
    horario: 'Mar a Dom 11:00 - 19:00',
    banco: {
      banco: 'Banco Santander',
      tipoCuenta: 'Cuenta Vista',
      numero: '7766-5544-3322-1100',
      rut: '76.555.111-K',
      titular: 'ONG Patitas en la Calle',
      email: 'donar@patitasenlacalle.org',
    },
  },
  {
    id: 'ORG-04',
    nombre: 'Red Animal Solidaria',
    comuna: 'Maipú',
    comunasOperacion: ['Maipú', 'Cerrillos', 'Pudahuel', 'Cerro Navia'],
    descripcion:
      'Red de voluntarios que brinda alimento y atención básica en sectores con menor acceso a veterinarias.',
    telefono: '+56 9 7777 3434',
    horario: 'Lun a Dom 08:00 - 20:00',
    banco: {
      banco: 'Banco BCI',
      tipoCuenta: 'Cuenta Corriente',
      numero: '5544-9988-7766',
      rut: '76.333.222-1',
      titular: 'Red Animal Solidaria SpA',
      email: 'tesoreria@redanimalsolidaria.cl',
    },
  },
  {
    id: 'ORG-05',
    nombre: 'Hogar Animal Cordillera',
    comuna: 'Las Condes',
    comunasOperacion: ['Las Condes', 'La Reina', 'Peñalolén'],
    descripcion:
      'Albergue temporal con foco en perros de talla grande. Programa "Adopta un anciano" para animales mayores de 8 años.',
    telefono: '+56 9 6543 2109',
    horario: 'Lun a Sáb 10:00 - 19:00',
    banco: {
      banco: 'Scotiabank Chile',
      tipoCuenta: 'Cuenta Corriente',
      numero: '0099-8877-6655',
      rut: '76.888.777-6',
      titular: 'Hogar Animal Cordillera Ltda.',
      email: 'donaciones@hogarcordillera.cl',
    },
  },
  {
    id: 'ORG-06',
    nombre: 'Fundación Patitas del Sur',
    comuna: 'La Florida',
    comunasOperacion: ['La Florida', 'Puente Alto', 'San Bernardo'],
    descripcion:
      'Trabajamos en zonas periurbanas del sur de Santiago. Campañas mensuales de vacunación y rescate de camadas.',
    telefono: '+56 9 2233 4455',
    horario: 'Mié a Dom 09:00 - 18:00',
    banco: {
      banco: 'Banco Falabella',
      tipoCuenta: 'Cuenta Corriente',
      numero: '1122-3344-5566',
      rut: '76.111.222-3',
      titular: 'Fundación Patitas del Sur',
      email: 'contacto@patitasdelsur.cl',
    },
  },
];

// Animales repartidos en comunas reales de Santiago.
// Cada animal tiene su propia URL única; las fichas fueron ajustadas para
// reflejar visualmente lo que muestra la foto.
export const ANIMALS = [
  // === ORG-01: Ñuñoa / Providencia / Macul ===
  {
    id: 'HS-001', nombre: 'Manchas', tipo: 'Perro', estado: 'saludable',
    zona: 'Plaza Ñuñoa', comuna: 'Ñuñoa',
    descripcion: 'Perro mestizo, muy amistoso. Frecuenta la plaza por las tardes.',
    foto: unsplash('1543466835-00a7907e9de1'),
    organizacionId: 'ORG-01', lat: -33.4569, lng: -70.5939,
    apadrinado: false, adoptado: false,
    ficha: {
      edad: '3 años aprox.', sexo: 'Macho', raza: 'Mestizo (quiltro)', tamaño: 'Mediano',
      peso: '14 kg', color: 'Café con manchas blancas',
      temperamento: 'Sociable, juguetón, leal',
      vacunado: true, esterilizado: true, desparasitado: true, microchip: true,
      fechaRescate: 'Marzo 2024',
      historia: 'Manchas apareció en Plaza Ñuñoa durante el otoño de 2024. Vecinos del sector lo alimentan a diario y la fundación lo esterilizó. Hoy busca un hogar definitivo donde pueda recibir el cariño que se merece.',
      cuidadosEspeciales: 'Ninguno. Está en perfecto estado de salud.',
      buenoConNiños: true, buenoConOtrosAnimales: true,
      necesidades: 'Casa con patio o salidas diarias. Familia activa que disfrute caminar.',
    }
  },
  {
    id: 'HS-002', nombre: 'Lola', tipo: 'Perra', estado: 'observacion',
    zona: 'Av. Irarrázaval', comuna: 'Ñuñoa',
    descripcion: 'Cachorra en seguimiento de vacunación. Le falta una dosis.',
    foto: unsplash('1587300003388-59208cc962cb'),
    organizacionId: 'ORG-01', lat: -33.4525, lng: -70.6017,
    apadrinado: true, adoptado: false,
    ficha: {
      edad: '5 meses', sexo: 'Hembra', raza: 'Mestiza', tamaño: 'Cachorra (pequeña)',
      peso: '4 kg', color: 'Café claro con orejas oscuras',
      temperamento: 'Curiosa, dócil, mucha energía',
      vacunado: false, esterilizado: false, desparasitado: true, microchip: false,
      fechaRescate: 'Octubre 2024',
      historia: 'Lola fue encontrada deambulando sola por Av. Irarrázaval con apenas 2 meses. Una familia voluntaria la acogió temporalmente y un padrino financia sus tratamientos veterinarios.',
      cuidadosEspeciales: 'Le falta la última dosis de la vacuna séxtuple y agendar esterilización al cumplir 6 meses.',
      buenoConNiños: true, buenoConOtrosAnimales: true,
      necesidades: 'Familia paciente que la ayude a completar su socialización y educación básica.',
    }
  },
  {
    id: 'HS-003', nombre: 'Simba', tipo: 'Gato', estado: 'saludable',
    zona: 'Suecia', comuna: 'Providencia',
    descripcion: 'Gato naranja, esterilizado. Vive entre dos edificios.',
    foto: unsplash('1514888286974-6c03e2ca1dba'),
    organizacionId: 'ORG-01', lat: -33.4222, lng: -70.6116,
    apadrinado: false, adoptado: false,
    ficha: {
      edad: '4 años aprox.', sexo: 'Macho', raza: 'Doméstico pelo corto', tamaño: 'Mediano',
      peso: '5 kg', color: 'Naranja atigrado',
      temperamento: 'Independiente, calmado, le gusta su rutina',
      vacunado: true, esterilizado: true, desparasitado: true, microchip: false,
      fechaRescate: 'Junio 2022',
      historia: 'Simba es parte de una colonia controlada en calle Suecia. Vive entre dos edificios cuyos conserjes lo alimentan. Está esterilizado y desparasitado por la fundación.',
      cuidadosEspeciales: 'Control de desparasitación cada 3 meses.',
      buenoConNiños: false, buenoConOtrosAnimales: true,
      necesidades: 'Hogar tranquilo, idealmente departamento sin niños pequeños.',
    }
  },
  {
    id: 'HS-004', nombre: 'Coco', tipo: 'Perro', estado: 'urgente',
    zona: 'Av. Quilín', comuna: 'Macul',
    descripcion: 'Perro adulto con herida abierta en el lomo. Requiere intervención.',
    foto: unsplash('1517849845537-4d257902454a'),
    organizacionId: 'ORG-01', lat: -33.4906, lng: -70.5980,
    apadrinado: false, adoptado: false,
    ficha: {
      edad: '6 años aprox.', sexo: 'Macho', raza: 'Mestizo de raza grande', tamaño: 'Grande',
      peso: '22 kg', color: 'Café oscuro',
      temperamento: 'Tímido al principio, dulce cuando confía',
      vacunado: true, esterilizado: false, desparasitado: true, microchip: false,
      fechaRescate: 'Noviembre 2025',
      historia: 'Coco fue reportado por vecinos al ver una herida abierta en su lomo, posiblemente causada por una pelea. La fundación coordina su atención veterinaria urgente.',
      cuidadosEspeciales: 'Curaciones diarias y antibióticos. Esterilización pendiente tras recuperación.',
      buenoConNiños: true, buenoConOtrosAnimales: false,
      necesidades: 'Hogar de tránsito mientras se recupera. Único perro en la casa.',
    }
  },
  {
    id: 'HS-005', nombre: 'Pelusa', tipo: 'Gata', estado: 'saludable',
    zona: 'Tobalaba', comuna: 'Ñuñoa',
    descripcion: 'Gata trícolor, muy independiente. Alimentada por vecinos.',
    foto: unsplash('1573865526739-10659fec78a5'),
    organizacionId: 'ORG-01', lat: -33.4634, lng: -70.5828,
    apadrinado: false, adoptado: true,
    ficha: {
      edad: '5 años', sexo: 'Hembra', raza: 'Doméstico pelo corto', tamaño: 'Pequeña',
      peso: '3.5 kg', color: 'Trícolor (carey)',
      temperamento: 'Independiente, cariñosa cuando ella quiere',
      vacunado: true, esterilizado: true, desparasitado: true, microchip: true,
      fechaRescate: 'Agosto 2021',
      historia: 'Pelusa vivió en la calle alimentada por vecinos durante años. En 2024 fue adoptada por una familia del sector que conoce su carácter y la dejó adaptarse a su ritmo.',
      cuidadosEspeciales: 'Ninguno.',
      buenoConNiños: false, buenoConOtrosAnimales: false,
      necesidades: 'Ya cuenta con hogar. Caso de éxito de la fundación.',
    }
  },

  // === ORG-02: Providencia / Las Condes / Vitacura ===
  {
    id: 'HS-006', nombre: 'Toby', tipo: 'Perro', estado: 'observacion',
    zona: 'Pedro de Valdivia', comuna: 'Providencia',
    descripcion: 'Cachorro tipo Cavalier en seguimiento de vacunación.',
    foto: unsplash('1560807707-8cc77767d783'),
    organizacionId: 'ORG-02', lat: -33.4319, lng: -70.6135,
    apadrinado: true, adoptado: false,
    ficha: {
      edad: '4 meses', sexo: 'Macho', raza: 'Mestizo tipo Cavalier King Charles', tamaño: 'Cachorro (pequeño)',
      peso: '3.5 kg', color: 'Blanco con manchas castañas',
      temperamento: 'Cariñoso, sociable, muy juguetón',
      vacunado: false, esterilizado: false, desparasitado: true, microchip: false,
      fechaRescate: 'Septiembre 2024',
      historia: 'Toby fue rescatado tras ser encontrado en una caja de cartón en Pedro de Valdivia. Está apadrinado mientras completa su esquema de vacunación.',
      cuidadosEspeciales: 'Vacunación en curso. Próxima dosis en 3 semanas.',
      buenoConNiños: true, buenoConOtrosAnimales: true,
      necesidades: 'Familia con tiempo para educación de cachorro. Disponibilidad para paseos.',
    }
  },
  {
    id: 'HS-007', nombre: 'Misha', tipo: 'Gata', estado: 'saludable',
    zona: 'Bellavista', comuna: 'Providencia',
    descripcion: 'Gata negra, esterilizada. Cuidada por un vecino.',
    foto: unsplash('1574158622682-e40e69881006'),
    organizacionId: 'ORG-02', lat: -33.4310, lng: -70.6373,
    apadrinado: false, adoptado: true,
    ficha: {
      edad: '6 años', sexo: 'Hembra', raza: 'Doméstico pelo corto', tamaño: 'Mediana',
      peso: '4 kg', color: 'Negro azabache',
      temperamento: 'Tranquila, observadora, afectuosa con su familia',
      vacunado: true, esterilizado: true, desparasitado: true, microchip: true,
      fechaRescate: 'Marzo 2020',
      historia: 'Misha pasó años en colonia urbana de Bellavista hasta que un vecino la formalizó como gata de hogar en 2022. Es uno de los primeros casos exitosos del programa "Adopta tu vecino".',
      cuidadosEspeciales: 'Control veterinario anual.',
      buenoConNiños: true, buenoConOtrosAnimales: false,
      necesidades: 'Ya cuenta con hogar definitivo.',
    }
  },
  {
    id: 'HS-008', nombre: 'Rex', tipo: 'Perro', estado: 'saludable',
    zona: 'Apoquindo', comuna: 'Las Condes',
    descripcion: 'Perro mediano, mestizo tipo Staffy. Recientemente rescatado.',
    foto: unsplash('1601758228041-f3b2795255f1'),
    organizacionId: 'ORG-02', lat: -33.4106, lng: -70.5681,
    apadrinado: false, adoptado: false,
    ficha: {
      edad: '4 años aprox.', sexo: 'Macho', raza: 'Mestizo tipo Staffordshire', tamaño: 'Mediano-grande',
      peso: '22 kg', color: 'Gris oscuro con detalles blancos',
      temperamento: 'Protector, leal, requiere liderazgo claro',
      vacunado: true, esterilizado: true, desparasitado: true, microchip: true,
      fechaRescate: 'Diciembre 2024',
      historia: 'Rex fue rescatado tras ser visto deambulando solo varios días por Av. Apoquindo. Tras un periodo de adaptación en el refugio, muestra muy buen carácter y se lleva bien con humanos.',
      cuidadosEspeciales: 'Necesita ejercicio diario intenso.',
      buenoConNiños: true, buenoConOtrosAnimales: false,
      necesidades: 'Familia con experiencia en perros de carácter fuerte. Casa con patio amplio.',
    }
  },
  {
    id: 'HS-009', nombre: 'Nala', tipo: 'Gata', estado: 'observacion',
    zona: 'El Golf', comuna: 'Las Condes',
    descripcion: 'Gata blanca, recuperándose de infección respiratoria.',
    foto: unsplash('1592194996308-7b43878e84a6'),
    organizacionId: 'ORG-02', lat: -33.4196, lng: -70.5764,
    apadrinado: true, adoptado: false,
    ficha: {
      edad: '2 años', sexo: 'Hembra', raza: 'Doméstico pelo semi-largo', tamaño: 'Mediana',
      peso: '3.8 kg', color: 'Blanco con manchas grises',
      temperamento: 'Tímida pero cariñosa, vínculo profundo cuando confía',
      vacunado: true, esterilizado: true, desparasitado: true, microchip: false,
      fechaRescate: 'Octubre 2025',
      historia: 'Nala fue rescatada con una infección respiratoria avanzada. Tras un mes de tratamiento ya está fuera de peligro y casi lista para adopción.',
      cuidadosEspeciales: 'Completar antibióticos hasta diciembre. Ambiente sin corrientes de aire.',
      buenoConNiños: true, buenoConOtrosAnimales: true,
      necesidades: 'Hogar tranquilo, sin demasiado ruido durante su recuperación.',
    }
  },
  {
    id: 'HS-010', nombre: 'Bruno', tipo: 'Perro', estado: 'urgente',
    zona: 'Av. Kennedy', comuna: 'Vitacura',
    descripcion: 'Golden retriever adulto, posible fractura. Necesita radiografía urgente.',
    foto: unsplash('1591946614720-90a587da4a36'),
    organizacionId: 'ORG-02', lat: -33.3897, lng: -70.5807,
    apadrinado: false, adoptado: false,
    ficha: {
      edad: '5 años aprox.', sexo: 'Macho', raza: 'Golden Retriever', tamaño: 'Grande',
      peso: '24 kg', color: 'Dorado',
      temperamento: 'Dulce, dócil, pide cariño constantemente',
      vacunado: true, esterilizado: false, desparasitado: true, microchip: false,
      fechaRescate: 'Noviembre 2025',
      historia: 'Bruno fue encontrado cojeando en Av. Kennedy. Se cree que fue atropellado. Necesita radiografía urgente para confirmar fractura en pata trasera.',
      cuidadosEspeciales: 'Reposo absoluto, posible cirugía. Apadrinamiento urgente para costos veterinarios.',
      buenoConNiños: true, buenoConOtrosAnimales: true,
      necesidades: 'Hogar de tránsito para recuperación post-quirúrgica.',
    }
  },

  // === ORG-03: Santiago Centro / Recoleta / Independencia ===
  {
    id: 'HS-011', nombre: 'Luna', tipo: 'Gata', estado: 'observacion',
    zona: 'Barrio Yungay', comuna: 'Santiago Centro',
    descripcion: 'Gata atigrada, en observación por leve cojera.',
    foto: unsplash('1495360010541-f48722b34f7d'),
    organizacionId: 'ORG-03', lat: -33.4444, lng: -70.6766,
    apadrinado: true, adoptado: false,
    ficha: {
      edad: '3 años', sexo: 'Hembra', raza: 'Doméstico pelo corto', tamaño: 'Mediana',
      peso: '4 kg', color: 'Atigrada (gris y negro)',
      temperamento: 'Tranquila, regalona, dormilona',
      vacunado: true, esterilizado: true, desparasitado: true, microchip: false,
      fechaRescate: 'Mayo 2023',
      historia: 'Luna vivió en el Barrio Yungay desde pequeña. Su cojera leve apareció recientemente y se está investigando si proviene de un golpe antiguo.',
      cuidadosEspeciales: 'Antiinflamatorio y reposo. Próxima revisión en 2 semanas.',
      buenoConNiños: true, buenoConOtrosAnimales: true,
      necesidades: 'Hogar pequeño y tranquilo, ideal para departamento.',
    }
  },
  {
    id: 'HS-012', nombre: 'Nube', tipo: 'Gato', estado: 'saludable',
    zona: 'Lastarria', comuna: 'Santiago Centro',
    descripcion: 'Gato blanco, frecuenta cafeterías. Muy sociable.',
    foto: unsplash('1570824104453-508955ab713e'),
    organizacionId: 'ORG-03', lat: -33.4380, lng: -70.6437,
    apadrinado: false, adoptado: false,
    ficha: {
      edad: '2 años', sexo: 'Macho', raza: 'Doméstico pelo corto', tamaño: 'Mediano',
      peso: '4.5 kg', color: 'Blanco con detalles grises',
      temperamento: 'Súper sociable, busca a la gente, le gustan los regalones',
      vacunado: true, esterilizado: true, desparasitado: true, microchip: false,
      fechaRescate: 'Febrero 2024',
      historia: 'Nube se hizo famoso en el Barrio Lastarria por colarse en cafeterías a saludar clientes. Varios locales lo cuidan colectivamente y la fundación coordinó su esterilización.',
      cuidadosEspeciales: 'Ninguno.',
      buenoConNiños: true, buenoConOtrosAnimales: true,
      necesidades: 'Hogar con personas presentes durante el día. No le gusta estar solo.',
    }
  },
  {
    id: 'HS-013', nombre: 'Rocky', tipo: 'Perro', estado: 'urgente',
    zona: 'Av. Matta', comuna: 'Santiago Centro',
    descripcion: 'Perro herido en la pata trasera. Requiere atención urgente.',
    foto: unsplash('1450778869180-41d0601e046e'),
    organizacionId: 'ORG-03', lat: -33.4628, lng: -70.6481,
    apadrinado: false, adoptado: false,
    ficha: {
      edad: '4 años aprox.', sexo: 'Macho', raza: 'Mestizo', tamaño: 'Mediano',
      peso: '16 kg', color: 'Café con detalles claros',
      temperamento: 'Asustadizo por su condición, manso con paciencia',
      vacunado: false, esterilizado: false, desparasitado: true, microchip: false,
      fechaRescate: 'Noviembre 2025',
      historia: 'Rocky fue reportado por transeúntes en Av. Matta arrastrando una pata. Equipo de la fundación lo rescató y está en evaluación veterinaria.',
      cuidadosEspeciales: 'Evaluación quirúrgica. Vacunación en cuanto su estado lo permita.',
      buenoConNiños: false, buenoConOtrosAnimales: false,
      necesidades: 'Apadrinamiento urgente para cubrir tratamiento. Hogar de tránsito.',
    }
  },
  {
    id: 'HS-014', nombre: 'Roma', tipo: 'Perra', estado: 'saludable',
    zona: 'Patronato', comuna: 'Recoleta',
    descripcion: 'Perra mediana tipo Corgi. Adoptable, muy mansa.',
    foto: unsplash('1551717743-49959800b1f6'),
    organizacionId: 'ORG-03', lat: -33.4291, lng: -70.6444,
    apadrinado: false, adoptado: false,
    ficha: {
      edad: '5 años aprox.', sexo: 'Hembra', raza: 'Mestiza tipo Corgi', tamaño: 'Mediana',
      peso: '13 kg', color: 'Blanco con manchas canela',
      temperamento: 'Mansa, tranquila, ideal para principiantes',
      vacunado: true, esterilizado: true, desparasitado: true, microchip: true,
      fechaRescate: 'Julio 2024',
      historia: 'Roma fue entregada a la fundación tras quedar abandonada cuando sus dueños se mudaron. Lleva varios meses esperando hogar.',
      cuidadosEspeciales: 'Ninguno.',
      buenoConNiños: true, buenoConOtrosAnimales: true,
      necesidades: 'Hogar amoroso. Ideal para personas mayores o familias con niños.',
    }
  },
  {
    id: 'HS-015', nombre: 'Fenix', tipo: 'Gato', estado: 'saludable',
    zona: 'Cementerio General', comuna: 'Recoleta',
    descripcion: 'Gato gris, parte de una colonia controlada de 6 gatos.',
    foto: unsplash('1518791841217-8f162f1e1131'),
    organizacionId: 'ORG-03', lat: -33.4093, lng: -70.6451,
    apadrinado: true, adoptado: false,
    ficha: {
      edad: '3 años', sexo: 'Macho', raza: 'Doméstico pelo corto', tamaño: 'Mediano',
      peso: '5 kg', color: 'Gris uniforme',
      temperamento: 'Esquivo con humanos, sociable con otros gatos',
      vacunado: true, esterilizado: true, desparasitado: true, microchip: false,
      fechaRescate: 'Programa Colonia 2023',
      historia: 'Fenix forma parte de la colonia controlada del Cementerio General (6 gatos esterilizados). Su madrina financia su alimentación mensual.',
      cuidadosEspeciales: 'Manejo CER (Captura, Esterilización, Retorno). Vive libre en colonia.',
      buenoConNiños: false, buenoConOtrosAnimales: true,
      necesidades: 'No apto para hogar tradicional. Apadrinamiento para mantención de la colonia.',
    }
  },
  {
    id: 'HS-016', nombre: 'Trueno', tipo: 'Perro', estado: 'observacion',
    zona: 'Av. Independencia', comuna: 'Independencia',
    descripcion: 'Perro adulto, recuperándose de sarna sarcóptica.',
    foto: unsplash('1530281700549-e82e7bf110d6'),
    organizacionId: 'ORG-03', lat: -33.4174, lng: -70.6660,
    apadrinado: true, adoptado: false,
    ficha: {
      edad: '6 años aprox.', sexo: 'Macho', raza: 'Mestizo', tamaño: 'Mediano',
      peso: '17 kg', color: 'Café canela con pelaje en recuperación',
      temperamento: 'Agradecido, paciente, muy tranquilo',
      vacunado: true, esterilizado: true, desparasitado: true, microchip: false,
      fechaRescate: 'Agosto 2025',
      historia: 'Trueno llegó al refugio con sarna sarcóptica avanzada y muy bajo peso. Tras 3 meses de tratamiento ya recuperó pelaje y peso ideal, y disfruta corriendo por la playa los fines de semana.',
      cuidadosEspeciales: 'Baños medicados quincenales hasta enero. Su pelaje seguirá creciendo.',
      buenoConNiños: true, buenoConOtrosAnimales: true,
      necesidades: 'Familia paciente. Apadrinamiento ayuda a costear baños medicados.',
    }
  },

  // === ORG-04: Maipú / Cerrillos / Pudahuel ===
  {
    id: 'HS-017', nombre: 'Negra', tipo: 'Perra', estado: 'urgente',
    zona: 'Pajaritos', comuna: 'Maipú',
    descripcion: 'Perra preñada, necesita atención prenatal urgente.',
    foto: unsplash('1605568427561-40dd23c2acea'),
    organizacionId: 'ORG-04', lat: -33.5111, lng: -70.7574,
    apadrinado: false, adoptado: false,
    ficha: {
      edad: '3 años aprox.', sexo: 'Hembra (preñada)', raza: 'Mestiza', tamaño: 'Mediana',
      peso: '15 kg (gestante)', color: 'Negra',
      temperamento: 'Dulce, protectora, en estado vulnerable',
      vacunado: false, esterilizado: false, desparasitado: true, microchip: false,
      fechaRescate: 'Noviembre 2025',
      historia: 'Negra fue rescatada en Av. Pajaritos en avanzado estado de gestación. La fundación coordina su atención prenatal y prepara hogar de tránsito para el parto.',
      cuidadosEspeciales: 'Control prenatal semanal. Esterilización post-parto cuando los cachorros estén destetados.',
      buenoConNiños: true, buenoConOtrosAnimales: true,
      necesidades: 'Urgente hogar de tránsito para el parto. Apadrinamiento para gastos veterinarios.',
    }
  },
  {
    id: 'HS-018', nombre: 'Princesa', tipo: 'Gata', estado: 'saludable',
    zona: 'Plaza Maipú', comuna: 'Maipú',
    descripcion: 'Gata pequeña, color crema. Esterilizada hace 2 meses.',
    foto: unsplash('1606214174585-fe31582dc6ee'),
    organizacionId: 'ORG-04', lat: -33.5163, lng: -70.7607,
    apadrinado: false, adoptado: false,
    ficha: {
      edad: '2 años', sexo: 'Hembra', raza: 'Doméstico pelo corto', tamaño: 'Pequeña',
      peso: '3 kg', color: 'Crema',
      temperamento: 'Cariñosa, vocal, le gusta conversar',
      vacunado: true, esterilizado: true, desparasitado: true, microchip: false,
      fechaRescate: 'Mayo 2024',
      historia: 'Princesa fue encontrada de cachorra en Plaza Maipú. Una voluntaria la rescató y la fundación la esterilizó al cumplir el año y medio.',
      cuidadosEspeciales: 'Ninguno.',
      buenoConNiños: true, buenoConOtrosAnimales: false,
      necesidades: 'Hogar como única mascota. Familia que disfrute gatos comunicativos.',
    }
  },
  {
    id: 'HS-019', nombre: 'Lobo', tipo: 'Perro', estado: 'observacion',
    zona: 'Av. Departamental', comuna: 'Cerrillos',
    descripcion: 'Husky siberiano, en recuperación de desnutrición.',
    foto: unsplash('1547407139-3c921a66005c'),
    organizacionId: 'ORG-04', lat: -33.4988, lng: -70.7156,
    apadrinado: true, adoptado: false,
    ficha: {
      edad: '4 años aprox.', sexo: 'Macho', raza: 'Husky Siberiano', tamaño: 'Grande',
      peso: '19 kg (bajo peso ideal)', color: 'Blanco con detalles grises, ojos azules',
      temperamento: 'Energético, vocal, requiere actividad constante',
      vacunado: true, esterilizado: false, desparasitado: true, microchip: false,
      fechaRescate: 'Septiembre 2025',
      historia: 'Lobo fue encontrado en estado de desnutrición severa en Av. Departamental. Su madrina financia su alimentación premium para recuperación.',
      cuidadosEspeciales: 'Dieta hipercalórica supervisada por veterinario. Esterilización al alcanzar peso ideal.',
      buenoConNiños: true, buenoConOtrosAnimales: true,
      necesidades: 'Familia activa, deportista. Casa con patio. Climas frescos.',
    }
  },
  {
    id: 'HS-020', nombre: 'Estrella', tipo: 'Perra', estado: 'saludable',
    zona: 'Lo Prado', comuna: 'Pudahuel',
    descripcion: 'Perra joven tipo bulldog francés. Vacunada, lista para adopción.',
    foto: unsplash('1583512603805-3cc6b41f3edb'),
    organizacionId: 'ORG-04', lat: -33.4403, lng: -70.7167,
    apadrinado: false, adoptado: false,
    ficha: {
      edad: '1.5 años', sexo: 'Hembra', raza: 'Mestiza tipo Bulldog Francés', tamaño: 'Pequeña-mediana',
      peso: '9 kg', color: 'Beige claro',
      temperamento: 'Alegre, juguetona, muy activa',
      vacunado: true, esterilizado: true, desparasitado: true, microchip: true,
      fechaRescate: 'Marzo 2024',
      historia: 'Estrella es parte de una camada rescatada en Pudahuel. Es la última hermana esperando hogar. Todas sus hermanas ya fueron adoptadas.',
      cuidadosEspeciales: 'Ninguno.',
      buenoConNiños: true, buenoConOtrosAnimales: true,
      necesidades: 'Familia con tiempo para juegos. Casa con patio o paseos largos.',
    }
  },
  {
    id: 'HS-029', nombre: 'Negrito', tipo: 'Perro', estado: 'urgente',
    zona: 'Mar Infinito', comuna: 'Pudahuel',
    descripcion: 'Mascota perdida. Perro pequeño de pelaje negro, visto por última vez en calle Mar Infinito. Familia lo busca.',
    foto: 'https://i.imgur.com/o5PEc72.png',
    organizacionId: 'ORG-04', lat: -33.4385, lng: -70.7530,
    apadrinado: false, adoptado: false,
    ficha: {
      edad: '4 años', sexo: 'Macho', raza: 'Caniche mestizo', tamaño: 'Pequeño',
      peso: '6 kg', color: 'Negro azabache',
      temperamento: 'Asustadizo con extraños, muy apegado a su familia',
      vacunado: true, esterilizado: true, desparasitado: true, microchip: true,
      fechaRescate: 'Mascota perdida (no rescatado)',
      historia: 'Negrito se escapó de su hogar en calle Mar Infinito el 5 de noviembre de 2025. Su familia ofrece recompensa por su retorno. Tiene microchip registrado.',
      cuidadosEspeciales: 'Si lo encuentras, NO lo persigas. Llama al teléfono de la organización.',
      buenoConNiños: true, buenoConOtrosAnimales: true,
      necesidades: 'AYUDA PARA SU UBICACIÓN. Reportar cualquier avistamiento.',
    }
  },
  {
    id: 'HS-030', nombre: 'Fatima', tipo: 'Gata', estado: 'saludable',
    zona: 'Av. Mapocho', comuna: 'Cerro Navia',
    descripcion: 'Gata adulta, sociable y saludable. Frecuenta el sector de Av. Mapocho. Alimentada por vecinos.',
    foto: 'https://i.imgur.com/fjkk8ai.png',
    organizacionId: 'ORG-04', lat: -33.4180, lng: -70.7370,
    apadrinado: false, adoptado: false,
    ficha: {
      edad: '3 años aprox.', sexo: 'Hembra', raza: 'Doméstico pelo corto', tamaño: 'Mediana',
      peso: '4 kg', color: 'Atigrada café con blanco',
      temperamento: 'Sociable, dulce, busca cariño',
      vacunado: true, esterilizado: true, desparasitado: true, microchip: false,
      fechaRescate: 'Programa colonia 2024',
      historia: 'Fatima vive cerca de Av. Mapocho. Vecinos del sector la cuidan colectivamente. Fue esterilizada y vacunada en una campaña de la fundación.',
      cuidadosEspeciales: 'Control desparasitación trimestral.',
      buenoConNiños: true, buenoConOtrosAnimales: true,
      necesidades: 'Estaría feliz de pasar de gata comunitaria a gata de hogar.',
    }
  },

  // === ORG-05: Las Condes / La Reina / Peñalolén ===
  {
    id: 'HS-021', nombre: 'Max', tipo: 'Perro', estado: 'saludable',
    zona: 'Av. Larraín', comuna: 'La Reina',
    descripcion: 'Perro mayor (10 años), busca hogar tranquilo. Programa Anciano.',
    foto: unsplash('1605897472359-85e4b94d685d'),
    organizacionId: 'ORG-05', lat: -33.4453, lng: -70.5407,
    apadrinado: true, adoptado: false,
    ficha: {
      edad: '10 años', sexo: 'Macho', raza: 'Mestizo (cruce Labrador)', tamaño: 'Grande',
      peso: '25 kg', color: 'Dorado claro con canas',
      temperamento: 'Calmado, sabio, mejor amigo del humano',
      vacunado: true, esterilizado: true, desparasitado: true, microchip: true,
      fechaRescate: 'Enero 2024 (Programa Anciano)',
      historia: 'Max fue entregado al refugio cuando su dueño falleció. Es parte del programa "Adopta un anciano" del Hogar Animal Cordillera.',
      cuidadosEspeciales: 'Control geriátrico semestral. Medicación para articulaciones.',
      buenoConNiños: true, buenoConOtrosAnimales: true,
      necesidades: 'Hogar tranquilo. Familia que valore acompañar a un perro mayor en sus últimos años.',
    }
  },
  {
    id: 'HS-022', nombre: 'Bigotes', tipo: 'Gato', estado: 'observacion',
    zona: 'Tobalaba', comuna: 'La Reina',
    descripcion: 'Gato blanco con detalles atigrados, recuperándose de cirugía dental.',
    foto: unsplash('1543852786-1cf6624b9987'),
    organizacionId: 'ORG-05', lat: -33.4486, lng: -70.5440,
    apadrinado: false, adoptado: false,
    ficha: {
      edad: '7 años', sexo: 'Macho', raza: 'Doméstico pelo corto', tamaño: 'Mediano',
      peso: '5.5 kg', color: 'Blanco con manchas atigradas',
      temperamento: 'Conversador, expresivo, le gusta llamar la atención',
      vacunado: true, esterilizado: true, desparasitado: true, microchip: true,
      fechaRescate: 'Octubre 2023',
      historia: 'Bigotes fue abandonado en Tobalaba con problemas dentales severos. Tras cirugía está recuperándose y necesita dieta blanda durante 2 meses más.',
      cuidadosEspeciales: 'Dieta blanda hasta enero. Cepillado semanal.',
      buenoConNiños: false, buenoConOtrosAnimales: false,
      necesidades: 'Hogar tranquilo, sin otros animales. Adoptante con disponibilidad para cuidados gato senior.',
    }
  },
  {
    id: 'HS-023', nombre: 'Duque', tipo: 'Perro', estado: 'saludable',
    zona: 'Av. Grecia', comuna: 'Peñalolén',
    descripcion: 'Perro pequeño tipo Pug, muy juguetón.',
    foto: unsplash('1583337130417-3346a1be7dee'),
    organizacionId: 'ORG-05', lat: -33.4744, lng: -70.5347,
    apadrinado: false, adoptado: false,
    ficha: {
      edad: '3 años', sexo: 'Macho', raza: 'Mestizo tipo Pug', tamaño: 'Pequeño',
      peso: '8 kg', color: 'Beige con hocico oscuro',
      temperamento: 'Juguetón, social, regalón',
      vacunado: true, esterilizado: true, desparasitado: true, microchip: true,
      fechaRescate: 'Mayo 2024',
      historia: 'Duque fue rescatado en Av. Grecia tras ser visto buscando comida en la basura por varias semanas. Mostró un carácter excelente y ya está listo para adopción.',
      cuidadosEspeciales: 'Limpieza de pliegues faciales 2 veces por semana. Sensible al calor.',
      buenoConNiños: true, buenoConOtrosAnimales: true,
      necesidades: 'Familia que disfrute compañía constante. Departamento o casa con patio cubierto.',
    }
  },
  {
    id: 'HS-024', nombre: 'Mia', tipo: 'Gata', estado: 'urgente',
    zona: 'Las Perdices', comuna: 'Peñalolén',
    descripcion: 'Gatita rescatada con desnutrición severa, alimentación asistida.',
    foto: unsplash('1574144611937-0df059b5ef3e'),
    organizacionId: 'ORG-05', lat: -33.4878, lng: -70.5283,
    apadrinado: false, adoptado: false,
    ficha: {
      edad: '8 meses', sexo: 'Hembra', raza: 'Doméstico pelo corto', tamaño: 'Pequeña (bajo peso)',
      peso: '1.8 kg (debería pesar 3 kg)', color: 'Atigrada café claro',
      temperamento: 'Frágil pero agradecida, ronronea constantemente',
      vacunado: false, esterilizado: false, desparasitado: true, microchip: false,
      fechaRescate: 'Noviembre 2025',
      historia: 'Mia fue rescatada en Las Perdices con desnutrición severa y deshidratación. Está en alimentación asistida cada 4 horas en hogar de tránsito.',
      cuidadosEspeciales: 'Alimentación asistida. Suplementación vitamínica. Apadrinamiento urgente.',
      buenoConNiños: true, buenoConOtrosAnimales: true,
      necesidades: 'Apadrinamiento URGENTE para cubrir gastos veterinarios.',
    }
  },

  // === ORG-06: La Florida / Puente Alto / San Bernardo ===
  {
    id: 'HS-025', nombre: 'Canela', tipo: 'Perra', estado: 'saludable',
    zona: 'Vicente Valdés', comuna: 'La Florida',
    descripcion: 'Perra mediana, color canela. Esterilizada, vacunada.',
    foto: unsplash('1558788353-f76d92427f16'),
    organizacionId: 'ORG-06', lat: -33.5226, lng: -70.5985,
    apadrinado: false, adoptado: false,
    ficha: {
      edad: '4 años', sexo: 'Hembra', raza: 'Mestiza tipo Labrador', tamaño: 'Mediana-grande',
      peso: '20 kg', color: 'Canela uniforme',
      temperamento: 'Equilibrada, cariñosa, fácil convivencia',
      vacunado: true, esterilizado: true, desparasitado: true, microchip: true,
      fechaRescate: 'Junio 2023',
      historia: 'Canela vivió en la calle durante 2 años hasta ser rescatada en Vicente Valdés. Está completamente sana y lista para encontrar familia.',
      cuidadosEspeciales: 'Ninguno.',
      buenoConNiños: true, buenoConOtrosAnimales: true,
      necesidades: 'Familia que valore una perra tranquila y agradecida.',
    }
  },
  {
    id: 'HS-026', nombre: 'Pancho', tipo: 'Perro', estado: 'observacion',
    zona: 'Walker Martínez', comuna: 'La Florida',
    descripcion: 'Cachorro tipo Bulldog francés, parte de camada rescatada.',
    foto: unsplash('1583511655857-d19b40a7a54e'),
    organizacionId: 'ORG-06', lat: -33.5365, lng: -70.5704,
    apadrinado: true, adoptado: false,
    ficha: {
      edad: '6 meses', sexo: 'Macho', raza: 'Mestizo tipo Bulldog Francés', tamaño: 'Pequeño',
      peso: '7 kg', color: 'Beige claro',
      temperamento: 'Juguetón, curioso, regalón',
      vacunado: false, esterilizado: false, desparasitado: true, microchip: false,
      fechaRescate: 'Septiembre 2025',
      historia: 'Pancho es parte de una camada de 5 cachorros rescatada en Walker Martínez. Sus hermanos ya están adoptados, él espera su familia.',
      cuidadosEspeciales: 'Vacunación en proceso. Esterilización a los 8 meses.',
      buenoConNiños: true, buenoConOtrosAnimales: true,
      necesidades: 'Familia con tiempo para educación de cachorro. Compromiso a largo plazo.',
    }
  },
  {
    id: 'HS-027', nombre: 'Ramona', tipo: 'Gata', estado: 'saludable',
    zona: 'Av. Concha y Toro', comuna: 'Puente Alto',
    descripcion: 'Gata adulta naranja, recientemente esterilizada. Calmada.',
    foto: unsplash('1571566882372-1598d88abd90'),
    organizacionId: 'ORG-06', lat: -33.6111, lng: -70.5764,
    apadrinado: false, adoptado: false,
    ficha: {
      edad: '5 años', sexo: 'Hembra', raza: 'Doméstico pelo corto', tamaño: 'Mediana',
      peso: '4.5 kg', color: 'Naranja uniforme',
      temperamento: 'Calmada, regalona, dormilona profesional',
      vacunado: true, esterilizado: true, desparasitado: true, microchip: false,
      fechaRescate: 'Agosto 2025',
      historia: 'Ramona fue rescatada en Av. Concha y Toro. Tras esterilización está recuperándose y muestra excelente carácter para hogar.',
      cuidadosEspeciales: 'Ninguno.',
      buenoConNiños: true, buenoConOtrosAnimales: false,
      necesidades: 'Hogar tranquilo, ideal personas mayores o sin niños pequeños.',
    }
  },
  {
    id: 'HS-028', nombre: 'Capitán', tipo: 'Perro', estado: 'urgente',
    zona: 'Eyzaguirre', comuna: 'Puente Alto',
    descripcion: 'Perro tipo Bulldog Inglés, atropellado leve. Requiere reposo y observación.',
    foto: unsplash('1561037404-61cd46aa615b'),
    organizacionId: 'ORG-06', lat: -33.6166, lng: -70.5837,
    apadrinado: false, adoptado: false,
    ficha: {
      edad: '5 años aprox.', sexo: 'Macho', raza: 'Mestizo tipo Bulldog Inglés', tamaño: 'Mediano',
      peso: '18 kg', color: 'Café claro con blanco',
      temperamento: 'Valiente, dócil pese al trauma',
      vacunado: true, esterilizado: false, desparasitado: true, microchip: false,
      fechaRescate: 'Noviembre 2025',
      historia: 'Capitán fue atropellado en Eyzaguirre. Tiene contusiones pero sin fracturas. Está en hogar de tránsito por 4 semanas mientras se recupera.',
      cuidadosEspeciales: 'Reposo absoluto. Antiinflamatorio diario. Esterilización al recuperarse.',
      buenoConNiños: true, buenoConOtrosAnimales: true,
      necesidades: 'Apadrinamiento para cubrir tratamiento. Hogar futuro tras recuperación.',
    }
  },
];

// Actualizaciones publicadas por las fundaciones sobre el uso de las donaciones.
// monto, foto, boleta son opcionales. animalesRelacionadosIds puede estar vacío.
// Los posts cubren distintas combinaciones de campos opcionales a propósito.
export const ACTUALIZACIONES_FORO = [
  // Post completo: monto + foto + boleta + varios animales
  {
    id: 'POST-01',
    organizacionId: 'ORG-05',
    fecha: '2026-05-28',
    titulo: 'Alimento senior para el programa "Adopta un anciano"',
    descripcion:
      'Compramos alimento hipoalergénico y suplementos articulares para los 6 perros mayores del programa. Max y Bigotes ya lo están disfrutando.',
    monto: 215000,
    foto: 'https://images.unsplash.com/photo-1605897472359-85e4b94d685d?w=600&h=400&fit=crop',
    boleta: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&h=800&fit=crop',
    animalesRelacionadosIds: ['HS-021', 'HS-022'],
  },
  // Monto + boleta + un animal, sin foto del operativo
  {
    id: 'POST-02',
    organizacionId: 'ORG-01',
    fecha: '2026-06-08',
    titulo: 'Cirugía y curaciones de Coco',
    descripcion:
      'Gracias a un padrino anónimo costeamos la cirugía de Coco para tratar la herida del lomo. Está recuperándose en un hogar de tránsito.',
    monto: 185000,
    boleta: 'https://images.unsplash.com/photo-1554224154-22dec7ec8818?w=600&h=800&fit=crop',
    animalesRelacionadosIds: ['HS-004'],
  },
  // Monto + foto + varios animales, SIN boleta (operativo de campaña)
  {
    id: 'POST-03',
    organizacionId: 'ORG-02',
    fecha: '2026-06-10',
    titulo: 'Operativo de esterilización masiva en Las Condes',
    descripcion:
      'Durante el fin de semana esterilizamos 14 gatos comunitarios en El Golf y Apoquindo. Toda la campaña fue financiada con aportes del último trimestre.',
    monto: 720000,
    foto: 'https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=600&h=400&fit=crop',
    animalesRelacionadosIds: ['HS-007', 'HS-009'],
  },
  // Solo monto: resumen financiero text-only
  {
    id: 'POST-04',
    organizacionId: 'ORG-03',
    fecha: '2026-06-01',
    titulo: 'Resumen financiero de mayo',
    descripcion:
      'En mayo recibimos 38 aportes individuales por un total de $1.245.000. Se destinaron principalmente a alimento (54%), veterinaria (33%) y gastos operativos (13%). Gracias.',
    monto: 1245000,
    animalesRelacionadosIds: [],
  },
  // Solo foto, sin monto ni boleta, con varios animales (celebración)
  {
    id: 'POST-05',
    organizacionId: 'ORG-04',
    fecha: '2026-06-13',
    titulo: '¡Negra ya tuvo a sus cachorros!',
    descripcion:
      'Tras dos semanas en el hogar de tránsito, Negra dio a luz a 6 cachorros sanos. Mamá y bebés están bien. Pronto abriremos lista para padrinos y adopción responsable.',
    foto: 'https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=600&h=400&fit=crop',
    animalesRelacionadosIds: ['HS-017'],
  },
  // Sin nada opcional: pura comunicación
  {
    id: 'POST-06',
    organizacionId: 'ORG-06',
    fecha: '2026-06-14',
    titulo: 'Buscamos hogar de tránsito en La Florida',
    descripcion:
      'Recibimos una camada de 4 cachorros y nuestro refugio está al tope. Necesitamos un hogar de tránsito por 6 semanas. Cubrimos alimento y veterinaria. Escríbenos por mensaje directo.',
    animalesRelacionadosIds: [],
  },
  // Boleta + un animal, sin monto explícito ni foto (servicio cubierto)
  {
    id: 'POST-07',
    organizacionId: 'ORG-03',
    fecha: '2026-06-05',
    titulo: 'Radiografías y antibióticos para Rocky',
    descripcion:
      'Rocky fue evaluado en clínica y descartamos fractura. Está con tratamiento antibiótico y antiinflamatorio. Adjuntamos la boleta del centro veterinario.',
    boleta: 'https://images.unsplash.com/photo-1556742044-3c52d6e88c62?w=600&h=800&fit=crop',
    animalesRelacionadosIds: ['HS-013'],
  },
  // Foto + boleta, sin monto, sin animales (compra de insumos genéricos)
  {
    id: 'POST-08',
    organizacionId: 'ORG-01',
    fecha: '2026-06-12',
    titulo: 'Compra de 10 sacos de comida premium',
    descripcion:
      'Con los aportes de mayo abastecimos el refugio con 10 sacos de 20kg de comida para perros adultos. Cubre cerca de 6 semanas de alimentación para los 80 animales.',
    foto: 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=600&h=400&fit=crop',
    boleta: 'https://images.unsplash.com/photo-1607863680151-cd2d1e63a37c?w=600&h=800&fit=crop',
    animalesRelacionadosIds: [],
  },
  // Solo animales relacionados (varios), sin monto, sin foto, sin boleta
  {
    id: 'POST-09',
    organizacionId: 'ORG-01',
    fecha: '2026-06-03',
    titulo: 'Estos peludos completaron su esquema de vacunación',
    descripcion:
      'Manchas, Lola y Simba ya están al día con vacunas y desparasitación. Próximo paso: control veterinario en agosto.',
    animalesRelacionadosIds: ['HS-001', 'HS-002', 'HS-003'],
  },
  // Monto + foto, sin boleta, sin animales (campaña difusión)
  {
    id: 'POST-10',
    organizacionId: 'ORG-04',
    fecha: '2026-05-22',
    titulo: 'Campaña de vacunación antirrábica en Maipú',
    descripcion:
      'Vacunamos 87 perros y gatos comunitarios durante el sábado. Agradecemos a la municipalidad por el espacio y a los voluntarios que se sumaron.',
    monto: 430000,
    foto: 'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?w=600&h=400&fit=crop',
    animalesRelacionadosIds: [],
  },
];

export const VETERINARIAS = [
  { id: 'VET-01', nombre: 'Veterinaria Patitas Felices', comuna: 'Ñuñoa',
    telefono: '+56 2 2345 6789', horario: 'Lun a Vie 09:00 - 19:00',
    lat: -33.4540, lng: -70.5985 },
  { id: 'VET-02', nombre: 'Clínica Animal Salud', comuna: 'Providencia',
    telefono: '+56 2 2987 6543', horario: 'Lun a Sáb 10:00 - 20:00',
    lat: -33.4280, lng: -70.6190 },
  { id: 'VET-03', nombre: 'Hospital Veterinario Central', comuna: 'Santiago Centro',
    telefono: '+56 2 2456 7890', horario: '24 horas',
    lat: -33.4489, lng: -70.6693 },
  { id: 'VET-04', nombre: 'VetCare Cordillera', comuna: 'Las Condes',
    telefono: '+56 2 2876 5432', horario: 'Lun a Dom 09:00 - 21:00',
    lat: -33.4150, lng: -70.5710 },
  { id: 'VET-05', nombre: 'Clínica Veterinaria Maipú', comuna: 'Maipú',
    telefono: '+56 2 2654 3210', horario: 'Lun a Sáb 09:00 - 19:00',
    lat: -33.5145, lng: -70.7580 },
  { id: 'VET-06', nombre: 'Hospital Animal Sur', comuna: 'La Florida',
    telefono: '+56 2 2321 0987', horario: 'Lun a Dom 08:00 - 22:00',
    lat: -33.5270, lng: -70.5940 },
];

// Helpers de etiqueta y color
export const getEstadoLabel = (estado) => {
  switch (estado) {
    case 'saludable': return 'Saludable';
    case 'observacion': return 'En observación';
    case 'urgente': return 'Urgente';
    default: return estado;
  }
};

export const getEstadoColor = (estado) => {
  switch (estado) {
    case 'saludable': return '#4CAF50';
    case 'observacion': return '#FFC107';
    case 'urgente': return '#E63946';
    default: return '#8D99AE';
  }
};

// Usuarios demo para el mock de auth. Las contraseñas viven en texto plano
// porque toda la sesión es client-side y no hay backend. Cuando se migre a
// Supabase Auth (ver Roadmap §4) este arreglo desaparece.
export const USUARIOS_DEMO = [
  {
    id: 'USER-DEMO-01',
    email: 'maria@example.com',
    password: 'demo123',
    nombre: 'María González',
    role: 'normal',
  },
  {
    id: 'USER-DEMO-02',
    email: 'refugio@example.com',
    password: 'demo123',
    nombre: 'Fundación Refugio Esperanza',
    role: 'fundacion',
    organizacionId: 'ORG-01',
  },
  {
    id: 'USER-DEMO-03',
    email: 'huellitas@example.com',
    password: 'demo123',
    nombre: 'Asociación Huellitas',
    role: 'fundacion',
    organizacionId: 'ORG-02',
  },
];

// Helpers de correlación
export const getOrganizacionById = (id) =>
  ORGANIZACIONES.find((o) => o.id === id);

export const getOrganizacionDeAnimal = (animal) =>
  getOrganizacionById(animal.organizacionId);

export const getAnimalesDeOrganizacion = (organizacionId) =>
  ANIMALS.filter((a) => a.organizacionId === organizacionId);

export const getVeterinariaCercana = (comuna) =>
  VETERINARIAS.find((v) => v.comuna === comuna) || VETERINARIAS[0];

export const getActualizacionesDeOrganizacion = (organizacionId) =>
  ACTUALIZACIONES_FORO.filter((p) => p.organizacionId === organizacionId);

export const getAnimalById = (id) => ANIMALS.find((a) => a.id === id);
