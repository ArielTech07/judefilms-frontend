import React from 'react';
import Modal from '../../components/UI/Modal';
import Badge from '../../components/UI/Badge';
import { getEventLabel } from '../../utils/constants';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { Download, Edit, Trash2, CheckCircle2 } from 'lucide-react';
import './ClientDetail.css';

const ClientDetail = ({ client, onClose, onEdit, onDelete, onCompletePayment }) => {
  if (!client) return null;

  // const handleDownloadPDF = () => {
  //   if (!client.contratoPdf) return;
    
  //   // Crear un link temporal para descargar el base64
  //   const link = document.createElement('a');
  //   link.href = client.contratoPdf;
  //   link.download = client.contratoPdfName || `Contrato_${client.nombreCompleto}.pdf`;
  //   document.body.appendChild(link);
  //   link.click();
  //   document.body.removeChild(link);
  // };

  const handleDownloadPDF = () => {
    if (!client.contratoPdf) return;

    window.open(client.contratoPdf, "_blank");
  };

  return (
    <Modal 
      isOpen={true} 
      onClose={onClose} 
      title="Detalle del Cliente"
    >
      <div className="client-detail">
        <div className="detail-header">
          <h2>{client.nombreCompleto}</h2>
          <Badge variant="default">{client.tipoEvento ? getEventLabel(client.tipoEvento) : 'Sin evento'}</Badge>
        </div>

        <div className="detail-section">
          <h3>Información General</h3>
          <div className="detail-grid">
            <div className="detail-item">
              <span className="label">Teléfono:</span>
              <span className="value">{client.telefono}</span>
            </div>
            <div className="detail-item">
              <span className="label">Dirección:</span>
              <span className="value">{client.direccion}</span>
            </div>
            {client.fechaEvento && (
              <>
                <div className="detail-item">
                  <span className="label">Fecha del Evento:</span>
                  <span className="value">{formatDate(client.fechaEvento)}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Hora del Evento:</span>
                  <span className="value">{client.horaEvento || 'No especificada'}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {client.eventoId && (
          <div className="detail-section">
            <h3>Información Financiera</h3>
            <div className="financial-summary">
              <div className="fin-box">
                <span className="label">Total</span>
                <span className="value">{formatCurrency(client.precioTotal)}</span>
              </div>
              <div className="fin-box">
                <span className="label">Adelanto</span>
                <span className="value">{formatCurrency(client.adelanto)}</span>
              </div>
              <div className={`fin-box ${client.pagoPendiente > 0 ? 'pending' : 'paid'}`}>
                <span className="label">Pendiente</span>
                <span className="value">{formatCurrency(client.pagoPendiente)}</span>
              </div>
            </div>
            <div className="status-badge-container">
              Estado: <Badge variant={client.estado === 'pagado' ? 'success' : 'warning'}>
                {client.estado === 'pagado' ? 'Pagado Completamente' : 'Pago Pendiente'}
              </Badge>
            </div>
          </div>
        )}

        {client.notas && (
          <div className="detail-section">
            <h3>Notas Adicionales</h3>
            <div className="notes-box">
              <p>{client.notas}</p>
            </div>
          </div>
        )}

        {client.contratoPdf && (
          <div className="detail-section">
            <h3>Contrato</h3>
            <button className="download-btn" onClick={handleDownloadPDF} >
              <Download size={18} />
              <span>Descargar {client.contratoPdfName}</span>
            </button>
          </div>
        )}

        <div className="detail-actions">
          <button className="btn-danger-outline" onClick={onDelete} type="button">
            <Trash2 size={18} />
            <span>Eliminar</span>
          </button>
          <div className="detail-right-actions">
            {client.pagoPendiente > 0 && onCompletePayment && (
              <button className="btn-success-outline" onClick={onCompletePayment} type="button">
                <CheckCircle2 size={18} />
                <span>Completar Pago</span>
              </button>
            )}
            <button className="btn-primary" onClick={() => onEdit(client)} type="button">
              <Edit size={18} />
              <span>Editar</span>
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ClientDetail;
