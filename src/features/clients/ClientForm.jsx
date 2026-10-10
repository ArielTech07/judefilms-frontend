import React, { useState, useEffect, useRef } from 'react';
import Modal from '../../components/UI/Modal';
import { EVENT_TYPES } from '../../utils/constants';
import { createClient, updateClient } from '../../services/clientService';
import { createEvento, updateEvento } from '../../services/eventoService';
import { createContrato, updateContrato } from '../../services/contratoService';
import { uploadPdf } from '../../services/uploadService';
import { formDataToPayloads } from '../../utils/mappers';
import toast from 'react-hot-toast';
import { Upload, FileText, X, Loader2 } from 'lucide-react';
import './ClientForm.css';

const ClientForm = ({ client, onClose }) => {
  const [formData, setFormData] = useState({
    nombreCompleto: '',
    telefono: '',
    direccion: '',
    tipoEvento: 'bodas',
    fechaEvento: '',
    horaEvento: '',
    precioTotal: '',
    adelanto: '',
    notas: '',
    contratoPdf: '', // Ahora será una URL (texto)
    contratoPdfName: 'Contrato_Enlace'
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (client) {
      // Para arreglar desfases de zona horaria si la fecha viene con T00:00:00
      let parsedDate = '';
      if (client.fechaEvento) {
        parsedDate = client.fechaEvento.split('T')[0];
      }

      setFormData({
        nombreCompleto: client.nombreCompleto || '',
        telefono: client.telefono || '',
        direccion: client.direccion || '',
        tipoEvento: client.tipoEvento || 'bodas',
        fechaEvento: parsedDate,
        horaEvento: client.horaEvento || '',
        precioTotal: client.precioTotal || '',
        adelanto: client.adelanto || '',
        notas: client.notas || '',
        contratoPdf: client.contratoPdf || '',
        contratoPdfName: client.contratoPdfName || 'Contrato_Enlace'
      });
    }
  }, [client]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast.error('Solo se permiten archivos PDF');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('El archivo no puede ser mayor a 10MB');
      return;
    }

    setIsUploading(true);
    try {
      const result = await uploadPdf(file);
      setFormData(prev => ({
        ...prev,
        contratoPdf: result.url,
        contratoPdfName: result.fileName || file.name
      }));
      toast.success('Contrato subido correctamente');
    } catch (error) {
      console.error('Error al subir PDF:', error);
      toast.error('Error al subir el archivo. Intenta de nuevo.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveFile = () => {
    setFormData(prev => ({
      ...prev,
      contratoPdf: '',
      contratoPdfName: ''
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const precioTotal = parseFloat(formData.precioTotal);
    const adelanto = parseFloat(formData.adelanto || 0);

    if (adelanto > precioTotal) {
      toast.error('El adelanto no puede ser mayor al precio total');
      setIsLoading(false);
      return;
    }

    try {
      const { clientePayload, eventoPayload, contratoPayload } = formDataToPayloads(
        formData, 
        client?.clienteId, 
        client?.eventoId
      );

      let currentClienteId = client?.clienteId;
      let currentEventoId = client?.eventoId;

      if (currentClienteId) {
        // Actualizar cliente existente
        await updateClient(currentClienteId, clientePayload);
      } else {
        // Crear nuevo cliente
        const createdClient = await createClient(clientePayload);
        currentClienteId = createdClient.id;
      }

      // Configurar payload de evento con el cliente asociado
      eventoPayload.cliente = { id: currentClienteId };

      if (currentEventoId) {
        // Actualizar evento existente
        await updateEvento(currentEventoId, eventoPayload);
      } else {
        // Crear nuevo evento
        const createdEvento = await createEvento(eventoPayload);
        currentEventoId = createdEvento.id;
      }

      // Configurar payload de contrato con el evento asociado (si hay contrato)
      if (contratoPayload && contratoPayload.url) {
        contratoPayload.evento = { id: currentEventoId };
        
        if (client?.contratoId) {
          await updateContrato(client.contratoId, contratoPayload);
        } else {
          await createContrato(contratoPayload);
        }
      }

      toast.success(client ? 'Cliente actualizado' : 'Cliente registrado');
      onClose(true); // Cerrar y recargar
    } catch (error) {
      toast.error('Ocurrió un error al guardar (Verifica que la URL sea válida si añadiste contrato)');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal 
      isOpen={true} 
      onClose={() => onClose()} 
      title={client ? 'Editar Cliente' : 'Nuevo Cliente'}
    >
      <form onSubmit={handleSubmit} className="client-form" autoComplete="off">
        <div className="form-row">
          <div className="form-group">
            <label>Nombre Completo</label>
            <input 
              type="text" 
              name="nombreCompleto" 
              value={formData.nombreCompleto} 
              onChange={handleChange}
              required 
              minLength={3}
              autoComplete="off"
            />
          </div>
          <div className="form-group">
            <label>Teléfono</label>
            <input 
              type="tel" 
              name="telefono" 
              value={formData.telefono} 
              onChange={handleChange}
              required 
              autoComplete="off"
            />
          </div>
        </div>

        <div className="form-group">
          <label>Dirección</label>
          <input 
            type="text" 
            name="direccion" 
            value={formData.direccion} 
            onChange={handleChange}
            required 
            autoComplete="off"
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Tipo de Evento</label>
            <select 
              name="tipoEvento" 
              value={formData.tipoEvento} 
              onChange={handleChange}
              required
            >
              {EVENT_TYPES.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>
          <div className="form-row half-row">
            <div className="form-group">
              <label>Fecha</label>
              <input 
                type="date" 
                name="fechaEvento" 
                value={formData.fechaEvento} 
                onChange={handleChange}
                required 
              />
            </div>
            <div className="form-group">
              <label>Hora</label>
              <input 
                type="time" 
                name="horaEvento" 
                value={formData.horaEvento} 
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Precio Total (S/)</label>
            <input 
              type="number" 
              name="precioTotal" 
              value={formData.precioTotal} 
              onChange={handleChange}
              min="1"
              step="0.01"
              required 
              autoComplete="off"
            />
          </div>
          <div className="form-group">
            <label>Adelanto (S/)</label>
            <input 
              type="number" 
              name="adelanto" 
              value={formData.adelanto} 
              onChange={handleChange}
              min="0"
              step="0.01"
              required 
              autoComplete="off"
            />
          </div>
        </div>
        
        {formData.precioTotal && (
          <div className="pago-pendiente-info" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>
              Pago Pendiente: S/ {Math.max(0, parseFloat(formData.precioTotal || 0) - parseFloat(formData.adelanto || 0)).toFixed(2)}
            </span>
            {client && Math.max(0, parseFloat(formData.precioTotal || 0) - parseFloat(formData.adelanto || 0)) > 0 && (
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setFormData(prev => ({ ...prev, adelanto: prev.precioTotal }))}
                style={{ padding: '0.25rem 0.5rem', fontSize: '0.85rem' }}
              >
                Marcar como pagado
              </button>
            )}
          </div>
        )}

        <div className="form-group">
          <label>Contrato (PDF)</label>
          <input
            type="file"
            accept="application/pdf"
            ref={fileInputRef}
            onChange={handleFileUpload}
            style={{ display: 'none' }}
            id="contrato-upload"
          />
          {formData.contratoPdf ? (
            <div className="uploaded-file-info">
              <FileText size={18} />
              <a 
                href={formData.contratoPdf} 
                target="_blank" 
                rel="noopener noreferrer"
                className="uploaded-file-name"
              >
                {formData.contratoPdfName || 'Ver contrato'}
              </a>
              <button 
                type="button" 
                className="btn-remove-file" 
                onClick={handleRemoveFile}
                title="Quitar contrato"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <label htmlFor="contrato-upload" className={`upload-area ${isUploading ? 'uploading' : ''}`}>
              {isUploading ? (
                <>
                  <Loader2 size={24} className="spin-icon" />
                  <span>Subiendo contrato...</span>
                </>
              ) : (
                <>
                  <Upload size={24} />
                  <span>Haz clic para subir un PDF</span>
                  <small>Máximo 10MB</small>
                </>
              )}
            </label>
          )}
        </div>

        <div className="form-group">
          <label>Notas Adicionales</label>
          <textarea 
            name="notas" 
            value={formData.notas} 
            onChange={handleChange}
            rows={3}
            autoComplete="off"
          />
        </div>

        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={() => onClose()}>
            Cancelar
          </button>
          <button type="submit" className="btn-primary" disabled={isLoading}>
            {isLoading ? 'Guardando...' : (client ? 'Actualizar' : 'Guardar')}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ClientForm;
