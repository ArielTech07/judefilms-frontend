import api from './api';

/**
 * Obtener todos los clientes (incluye eventos anidados desde el backend).
 */
export const getClients = async () => {
  const { data } = await api.get('/clientes');
  return data;
};

/**
 * Obtener un cliente por ID.
 */
export const getClientById = async (id) => {
  const { data } = await api.get(`/clientes/${id}`);
  return data;
};

/**
 * Crear un nuevo cliente.
 * @param {Object} clientData - { nombreCompleto, telefono, direccion }
 */
export const createClient = async (clientData) => {
  const { data } = await api.post('/clientes', clientData);
  return data;
};

/**
 * Actualizar un cliente existente.
 * @param {number} id - ID del cliente
 * @param {Object} clientData - { nombreCompleto, telefono, direccion }
 */
export const updateClient = async (id, clientData) => {
  const { data } = await api.put(`/clientes/${id}`, clientData);
  return data;
};

/**
 * Eliminar un cliente por ID (también elimina eventos y contratos en cascada).
 */
export const deleteClient = async (id) => {
  const { data } = await api.delete(`/clientes/${id}`);
  return data;
};
