// Constantes geográficas/administrativas usadas por los formularios y el mapa.
// Antes vivían en `mockData.js`; al borrar mockData se movieron acá.

export const SANTIAGO_CENTER = { lat: -33.45, lng: -70.66 };

// Listado de referencia: 32 comunas de la Provincia de Santiago + Puente Alto
// y San Bernardo (Gran Santiago, otras provincias). Los formularios de auth
// la usan para los dropdowns de comuna sede y comunas de operación.
export const COMUNAS_SANTIAGO = [
  'Cerrillos', 'Cerro Navia', 'Conchalí', 'El Bosque', 'Estación Central',
  'Huechuraba', 'Independencia', 'La Cisterna', 'La Florida', 'La Granja',
  'La Pintana', 'La Reina', 'Las Condes', 'Lo Barnechea', 'Lo Espejo',
  'Lo Prado', 'Macul', 'Maipú', 'Ñuñoa', 'Pedro Aguirre Cerda',
  'Peñalolén', 'Providencia', 'Pudahuel', 'Puente Alto', 'Quilicura',
  'Quinta Normal', 'Recoleta', 'Renca', 'San Bernardo', 'San Joaquín',
  'San Miguel', 'San Ramón', 'Santiago Centro', 'Vitacura',
];
