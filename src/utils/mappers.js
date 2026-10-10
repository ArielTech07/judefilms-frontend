/**
 * Mappers para transformar datos entre el formato del backend (anidado)
 * y el formato plano que usa la UI del frontend.
 *
 * Backend: Cliente { id, nombreCompleto, telefono, direccion, eventos: [Evento] }
 *          Evento  { id, cliente, tipoEvento, fecha, hora, precioTotal, adelanto, notasAdicionales, contratos: [Contrato] }
 *          Contrato { id, evento, nombreArchivo, url }
 *
 * Frontend (legacy plano): { id, nombreCompleto, telefono, direccion, tipoEvento, fechaEvento, horaEvento, precioTotal, adelanto, pagoPendiente, estado, contratoPdf, contratoPdfName, notas }
 */

/**
 * Aplana un cliente del backend (con su primer evento) al formato plano de la UI.
 * Si el cliente tiene múltiples eventos, retorna un elemento por cada evento.
 */
export const flattenClientWithEvents = (cliente) => {
  if (!cliente.eventos || cliente.eventos.length === 0) {
    // Cliente sin eventos — retornar solo datos básicos
    return [{
      clienteId: cliente.id,
      id: cliente.id,
      nombreCompleto: cliente.nombreCompleto,
      telefono: cliente.telefono,
      direccion: cliente.direccion,
      tipoEvento: null,
      fechaEvento: null,
      horaEvento: null,
      precioTotal: 0,
      adelanto: 0,
      pagoPendiente: 0,
      estado: 'sin_evento',
      notas: '',
      eventoId: null,
      contratoPdf: null,
      contratoPdfName: '',
      contratoId: null,
      createdAt: cliente.createdAt,
    }];
  }

  return cliente.eventos.map(evento => {
    const precioTotal = parseFloat(evento.precioTotal) || 0;
    const adelanto = parseFloat(evento.adelanto) || 0;
    const pagoPendiente = precioTotal - adelanto;
    const contrato = evento.contratos?.[0] || null;

    return {
      clienteId: cliente.id,
      id: `${cliente.id}_${evento.id}`, // ID compuesto para la UI
      nombreCompleto: cliente.nombreCompleto,
      telefono: cliente.telefono,
      direccion: cliente.direccion,
      tipoEvento: evento.tipoEvento,
      fechaEvento: evento.fecha,
      horaEvento: evento.hora,
      precioTotal,
      adelanto,
      pagoPendiente,
      estado: pagoPendiente <= 0 ? 'pagado' : 'pendiente',
      notas: evento.notasAdicionales || '',
      eventoId: evento.id,
      contratoPdf: contrato?.url || null,
      contratoPdfName: contrato?.nombreArchivo || '',
      contratoId: contrato?.id || null,
      createdAt: evento.createdAt || cliente.createdAt,
    };
  });
};

/**
 * Aplana una lista de clientes del backend al formato plano.
 */
export const flattenAllClients = (clientes) => {
  // A veces el backend o Axios devuelve un string JSON crudo en lugar de un objeto parseado
  let data = typeof clientes === 'string' ? JSON.parse(clientes) : clientes;
  
  let lista = [];
  if (Array.isArray(data)) {
    lista = data;
  } else if (data?.content) {
    lista = data.content;
  } else if (data?.data) {
    lista = data.data;
  } else if (data?._embedded) {
    const keys = Object.keys(data._embedded);
    if (keys.length > 0) {
      lista = data._embedded[keys[0]];
    }
  }

  return lista.flatMap(flattenClientWithEvents);
};

/**
 * Transforma un evento del backend (con cliente anidado) al formato de evento del calendario.
 */
export const mapEventoToCalendar = (evento) => {
  let start = evento.fecha;
  if (evento.hora) {
    start = `${evento.fecha}T${evento.hora}`;
  }

  return {
    id: evento.id,
    title: `${evento.cliente?.nombreCompleto || 'Sin nombre'} - ${evento.tipoEvento}`,
    start,
    extendedProps: {
      evento,
      clienteId: evento.cliente?.id,
      clienteNombre: evento.cliente?.nombreCompleto,
      tipoEvento: evento.tipoEvento,
      precioTotal: parseFloat(evento.precioTotal) || 0,
      adelanto: parseFloat(evento.adelanto) || 0,
    }
  };
};

/**
 * Convierte los datos planos del formulario a los payloads separados de Cliente y Evento.
 */
export const formDataToPayloads = (formData, clienteId = null, eventoId = null) => {
  const clientePayload = {
    nombreCompleto: formData.nombreCompleto,
    telefono: formData.telefono,
    direccion: formData.direccion,
  };

  const eventoPayload = {
    cliente: { id: clienteId },
    tipoEvento: formData.tipoEvento,
    fecha: formData.fechaEvento,
    hora: formData.horaEvento || null,
    precioTotal: parseFloat(formData.precioTotal) || 0,
    adelanto: parseFloat(formData.adelanto) || 0,
    notasAdicionales: formData.notas || null,
  };

  const contratoPayload = formData.contratoPdf ? {
    evento: { id: eventoId },
    nombreArchivo: formData.contratoPdfName,
    url: formData.contratoPdf,
  } : null;

  return { clientePayload, eventoPayload, contratoPayload };
};
