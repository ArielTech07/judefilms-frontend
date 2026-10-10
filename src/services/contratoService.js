import api from './api';

/**
 * Obtener todos los contratos.
 */
export const getContratos = async () => {
  const { data } = await api.get('/contratos');
  return data;
};

/**
 * Obtener un contrato por ID.
 */
export const getContratoById = async (id) => {
  const { data } = await api.get(`/contratos/${id}`);
  return data;
};

/**
 * Crear un nuevo contrato.
 * @param {Object} contratoData - { evento: { id }, nombreArchivo, url }
 */
export const createContrato = async (contratoData) => {
  const { data } = await api.post('/contratos', contratoData);
  return data;
};

/**
 * Actualizar un contrato existente.
 * @param {number} id - ID del contrato
 * @param {Object} contratoData - campos a actualizar
 */
export const updateContrato = async (id, contratoData) => {
  const { data } = await api.put(`/contratos/${id}`, contratoData);
  return data;
};

/**
 * Eliminar un contrato por ID.
 */
export const deleteContrato = async (id) => {
  const { data } = await api.delete(`/contratos/${id}`);
  return data;
};
