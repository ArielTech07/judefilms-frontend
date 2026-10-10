// // Abstracción básica para el LocalStorage
// // Esto facilita el cambio futuro a una API real

// export const getItems = (key) => {
//   try {
//     const items = sessionStorage.getItem(key);
//     return items ? JSON.parse(items) : [];
//   } catch (error) {
//     console.error(`Error al obtener items de ${key}:`, error);
//     return [];
//   }
// };

// export const saveItems = (key, items) => {
//   try {
//     sessionStorage.setItem(key, JSON.stringify(items));
//     return true;
//   } catch (error) {
//     console.error(`Error al guardar items en ${key}:`, error);
//     // Probablemente se excedió la cuota por los PDFs en Base64
//     if (error.name === 'QuotaExceededError') {
//       throw new Error('Almacenamiento lleno. No se pueden guardar más datos o PDFs grandes.');
//     }
//     return false;
//   }
// };
