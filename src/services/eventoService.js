import api from './api';

/**
 * Obtener todos los eventos (incluye cliente y contratos anidados).
 */
export const getEventos = async () => {
  const { data } = await api.get('/eventos');
  return data;
};

/**
 * Obtener un evento por ID.
 */
export const getEventoById = async (id) => {
  const { data } = await api.get(`/eventos/${id}`);
  return data;
};

/**
 * Crear un nuevo evento.
 * @param {Object} eventoData - { cliente: { id }, tipoEvento, fecha, hora, precioTotal, adelanto, notasAdicionales }
 */
export const createEvento = async (eventoData) => {
  const { data } = await api.post('/eventos', eventoData);
  return data;
};

/**
 * Actualizar un evento existente.
 * @param {number} id - ID del evento
 * @param {Object} eventoData - campos a actualizar
 */
export const updateEvento = async (id, eventoData) => {
  const { data } = await api.put(`/eventos/${id}`, eventoData);
  return data;
};

/**
 * Eliminar un evento por ID (también elimina contratos en cascada).
 */
export const deleteEvento = async (id) => {
  const { data } = await api.delete(`/eventos/${id}`);
  return data;
};
