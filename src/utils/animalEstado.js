// Etiquetas y colores para el estado de un animal del catálogo.
// Antes vivían en `mockData.js` junto con los datos seed; al borrar
// mockData se movieron acá porque son lógica pura sin acoplamiento a
// datos.

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
