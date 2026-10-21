import React, { useState, useEffect, useCallback, useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Calendar as CalendarIcon, Clock, Phone, ChevronRight } from 'lucide-react';
import { getClients, deleteClient } from '../../services/clientService';
import { updateEvento } from '../../services/eventoService';
import { flattenAllClients } from '../../utils/mappers';
import { getEventLabel } from '../../utils/constants';
import ClientDetail from '../clients/ClientDetail';
import ClientForm from '../clients/ClientForm';
import ConfirmModal from '../../components/UI/ConfirmModal';
import toast from 'react-hot-toast';
import './CalendarPage.css';

// Colores por tipo de evento para el calendario
const EVENT_COLORS = {
  bodas: '#FFFFFF',             // Blanco
  bautizos: '#60A5FA',          // Azul claro
  quinceañeros: '#F472B6',      // Rosa
  cumpleaños_infantiles: '#FCD34D', // Amarillo
  eventos_corporativos: '#9CA3AF', // Gris
  otros: '#8B5CF6'              // Morado
};

const MOBILE_BREAKPOINT = 768;

const getTodayDateStr = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatSelectedDateHeader = (dateStr) => {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const formatted = new Intl.DateTimeFormat('es-PE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  }).format(date);
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
};

const CalendarPage = () => {
  const [events, setEvents] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= MOBILE_BREAKPOINT);
  const [selectedDate, setSelectedDate] = useState(getTodayDateStr());

  // Estados para modales de confirmación
  const [confirmPaymentClient, setConfirmPaymentClient] = useState(null);
  const [isCompletingPayment, setIsCompletingPayment] = useState(false);
  const [clientToDelete, setClientToDelete] = useState(null);
  const [isDeletingClient, setIsDeletingClient] = useState(false);

  // Detectar cambios de resolución
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= MOBILE_BREAKPOINT);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const loadEvents = async () => {
    try {
      const data = await getClients();
      const clients = flattenAllClients(data).filter(c => c.fechaEvento);
      
      const formattedEvents = clients.map(client => {
        // Asegurar fecha exacta YYYY-MM-DD sin desbordar timezone
        const dateOnly = client.fechaEvento.split('T')[0];

        // Formato para mostrar hora si existe en el título en desktop
        const horaFormatted = client.horaEvento ? client.horaEvento.substring(0, 5) : '';
        const title = horaFormatted 
          ? `${horaFormatted} ${client.nombreCompleto} - ${client.tipoEvento}`
          : `${client.nombreCompleto} - ${client.tipoEvento}`;

        return {
          id: String(client.id),
          title: title,
          start: dateOnly,
          allDay: true, // ¡CRUCIAL! Mantiene el evento 100% confinado a su propio día, sin salirse al día siguiente
          backgroundColor: EVENT_COLORS[client.tipoEvento] || EVENT_COLORS.otros,
          borderColor: 'transparent',
          textColor: client.tipoEvento === 'bodas' || client.tipoEvento === 'cumpleaños_infantiles' ? '#000000' : '#FFFFFF',
          extendedProps: {
            client: client
          }
        };
      });
      setEvents(formattedEvents);

      // Si hoy no tiene eventos pero hay eventos cargados, seleccionar la fecha del primer evento
      const today = getTodayDateStr();
      const hasTodayEvent = formattedEvents.some(e => e.start === today);
      if (!hasTodayEvent && formattedEvents.length > 0) {
        setSelectedDate(formattedEvents[0].start);
      }
    } catch (error) {
      console.error('Error al cargar eventos del calendario:', error);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  // Eventos para el día seleccionado en mobile
  const selectedDayEvents = useMemo(() => {
    if (!selectedDate) return [];
    return events.filter(e => e.start === selectedDate);
  }, [events, selectedDate]);

  const handleDateClick = (arg) => {
    setSelectedDate(arg.dateStr);
  };

  const handleEventClick = (clickInfo) => {
    const client = clickInfo.event.extendedProps.client;
    if (isMobile) {
      const eventDate = clickInfo.event.startStr?.split('T')[0];
      if (eventDate) setSelectedDate(eventDate);
    }
    setSelectedClient(client);
  };

  const handleCloseDetail = () => {
    setSelectedClient(null);
  };

  const handleEdit = (client) => {
    setSelectedClient(null);
    setIsEditing(client);
  };

  const handleCloseEdit = (shouldReload = false) => {
    setIsEditing(false);
    if (shouldReload) loadEvents();
  };

  // Ejecutar completado de pago desde Calendar
  const handleConfirmPayment = async () => {
    if (!confirmPaymentClient || !confirmPaymentClient.eventoId) return;
    setIsCompletingPayment(true);
    try {
      const eventoPayload = {
        cliente: { id: confirmPaymentClient.clienteId },
        tipoEvento: confirmPaymentClient.tipoEvento,
        fecha: confirmPaymentClient.fechaEvento,
        hora: confirmPaymentClient.horaEvento || null,
        precioTotal: confirmPaymentClient.precioTotal,
        adelanto: confirmPaymentClient.precioTotal,
        notasAdicionales: confirmPaymentClient.notas || null
      };

      await updateEvento(confirmPaymentClient.eventoId, eventoPayload);
      toast.success(`Pago completado para ${confirmPaymentClient.nombreCompleto}`);
      setConfirmPaymentClient(null);

      if (selectedClient && selectedClient.id === confirmPaymentClient.id) {
        setSelectedClient(prev => ({
          ...prev,
          adelanto: confirmPaymentClient.precioTotal,
          pagoPendiente: 0,
          estado: 'pagado'
        }));
      }

      loadEvents();
    } catch (error) {
      toast.error('Error al completar el pago');
      console.error(error);
    } finally {
      setIsCompletingPayment(false);
    }
  };

  // Ejecutar eliminación desde Calendar
  const handleConfirmDelete = async () => {
    if (!clientToDelete) return;
    setIsDeletingClient(true);
    try {
      await deleteClient(clientToDelete.clienteId || clientToDelete.id);
      toast.success('Cliente eliminado correctamente');
      setClientToDelete(null);
      setSelectedClient(null);
      loadEvents();
    } catch (error) {
      toast.error('Error al eliminar el cliente');
      console.error(error);
    } finally {
      setIsDeletingClient(false);
    }
  };

  // Render para cada celda de día: SOLO se usa en mobile
  // - 1 evento: encierra el número con el color del tipo de evento (sin bolita abajo)
  // - 2+ eventos: mantiene las bolitas de colores debajo de la fecha
  const renderMobileDayCellContent = useCallback((arg) => {
    const year = arg.date.getFullYear();
    const month = String(arg.date.getMonth() + 1).padStart(2, '0');
    const day = String(arg.date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    const dayEvents = events.filter(e => e.start === dateStr);
    const isSelected = selectedDate === dateStr;
    const hasSingleEvent = dayEvents.length === 1;
    const hasMultipleEvents = dayEvents.length > 1;

    let singleEventStyle = {};
    if (hasSingleEvent) {
      const eventColor = dayEvents[0].backgroundColor;
      // Contraste óptimo para el texto: oscuro sobre colores claros/pasteles, blanco sobre oscuros
      const isLightBg = ['#FFFFFF', '#FCD34D', '#9CA3AF', '#60A5FA', '#F472B6'].includes(eventColor?.toUpperCase());
      const textColor = isLightBg ? '#000000' : '#FFFFFF';

      singleEventStyle = {
        backgroundColor: eventColor,
        color: textColor,
        fontWeight: '700',
        border: eventColor === '#FFFFFF' ? '1px solid #777' : 'none',
        boxShadow: isSelected
          ? `0 0 0 2px var(--color-bg-secondary), 0 0 0 4px #FFFFFF, 0 0 10px ${eventColor}88`
          : `0 1px 4px rgba(0, 0, 0, 0.4)`
      };
    }

    return (
      <div className={`cal-cell-inner ${isSelected ? 'is-selected' : ''} ${hasSingleEvent ? 'has-single-event' : ''}`}>
        <span
          className={`cal-day-num ${hasSingleEvent ? 'single-event-num' : ''}`}
          style={hasSingleEvent ? singleEventStyle : undefined}
        >
          {arg.dayNumberText}
        </span>
        {hasMultipleEvents ? (
          <div className="cal-day-dots">
            {dayEvents.slice(0, 3).map((e, idx) => (
              <span
                key={e.id || idx}
                className="cal-dot"
                style={{
                  backgroundColor: e.backgroundColor,
                  border: e.backgroundColor === '#FFFFFF' ? '1px solid #777' : 'none'
                }}
              />
            ))}
            {dayEvents.length > 3 && (
              <span className="cal-dot-more">+{dayEvents.length - 3}</span>
            )}
          </div>
        ) : (
          <div className="cal-day-dots-placeholder" />
        )}
      </div>
    );
  }, [events, selectedDate]);

  return (
    <div className={`calendar-page ${isMobile ? 'is-mobile' : ''}`}>
      <div className="page-header">
        <h1>Calendario de Eventos</h1>
      </div>

      <div className="calendar-container">
        {/* Usamos key={isMobile ? 'fc-mobile' : 'fc-desktop'} para que React desmonte
            completamente la instancia anterior al cambiar de resolución.
            Esto elimina cualquier duplicación de números y sincroniza la grilla al 100%. */}
        <FullCalendar
          key={isMobile ? 'fc-mobile' : 'fc-desktop'}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={
            isMobile
              ? {
                  left: 'prev,next',
                  center: 'title',
                  right: 'today'
                }
              : {
                  left: 'prev,next today',
                  center: 'title',
                  right: 'dayGridMonth,timeGridWeek,timeGridDay'
                }
          }
          buttonText={{
            today: 'Hoy',
            month: 'Mes',
            week: 'Semana',
            day: 'Día'
          }}
          locale="es"
          events={events}
          eventClick={handleEventClick}
          dateClick={handleDateClick}
          dayCellContent={isMobile ? renderMobileDayCellContent : undefined}
          height="auto"
          dayMaxEvents={isMobile ? false : true}
        />
      </div>

      {/* Agenda del día seleccionado (exclusivo para mobile: amigable, claro y táctil) */}
      {isMobile && (
        <div className="calendar-agenda">
          <div className="agenda-header">
            <div className="agenda-title-group">
              <CalendarIcon size={18} className="agenda-icon" />
              <h3 className="agenda-date-title">{formatSelectedDateHeader(selectedDate)}</h3>
            </div>
            <span className="agenda-count-badge">
              {selectedDayEvents.length} {selectedDayEvents.length === 1 ? 'evento' : 'eventos'}
            </span>
          </div>

          {selectedDayEvents.length === 0 ? (
            <div className="agenda-empty-state">
              <p className="agenda-empty-title">Sin eventos en esta fecha</p>
              <p className="agenda-empty-sub">Toca los días con puntos de color en el calendario para ver los eventos programados.</p>
            </div>
          ) : (
            <div className="agenda-cards-list">
              {selectedDayEvents.map(evt => {
                const client = evt.extendedProps?.client;
                const eventColor = evt.backgroundColor;
                const isWhite = eventColor === '#FFFFFF';
                return (
                  <div 
                    key={evt.id} 
                    className="agenda-event-card"
                    onClick={() => setSelectedClient(client)}
                  >
                    <div 
                      className="agenda-color-bar" 
                      style={{ backgroundColor: eventColor, border: isWhite ? '1px solid #555' : 'none' }} 
                    />
                    <div className="agenda-event-info">
                      <div className="agenda-event-meta">
                        <span 
                          className="agenda-type-badge" 
                          style={{ 
                            backgroundColor: isWhite ? 'rgba(255,255,255,0.1)' : `${eventColor}22`,
                            color: isWhite ? '#FFFFFF' : eventColor,
                            borderColor: isWhite ? 'rgba(255,255,255,0.3)' : `${eventColor}55`
                          }}
                        >
                          <span 
                            className="agenda-type-dot" 
                            style={{ backgroundColor: eventColor, border: isWhite ? '1px solid #777' : 'none' }} 
                          />
                          {client?.tipoEvento ? getEventLabel(client.tipoEvento) : 'Evento'}
                        </span>
                        {client?.horaEvento && (
                          <span className="agenda-event-time">
                            <Clock size={13} /> {client.horaEvento}
                          </span>
                        )}
                      </div>
                      <h4 className="agenda-client-name">{client?.nombreCompleto}</h4>
                      {client?.telefono && (
                        <p className="agenda-client-phone">
                          <Phone size={12} /> {client.telefono}
                        </p>
                      )}
                    </div>
                    <div className="agenda-card-action">
                      <span className="agenda-view-text">Ver</span>
                      <ChevronRight size={16} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <div className="calendar-legend">
        <div className="legend-header">
          <h3>Tipos de Eventos</h3>
        </div>
        <div className="legend-items">
          <div className="legend-item"><span className="color-dot" style={{backgroundColor: EVENT_COLORS.bodas, border: '1px solid #777'}}></span> Bodas</div>
          <div className="legend-item"><span className="color-dot" style={{backgroundColor: EVENT_COLORS.bautizos}}></span> Bautizos</div>
          <div className="legend-item"><span className="color-dot" style={{backgroundColor: EVENT_COLORS.quinceañeros}}></span> Quinceañeros</div>
          <div className="legend-item"><span className="color-dot" style={{backgroundColor: EVENT_COLORS.cumpleaños_infantiles}}></span> Infantiles</div>
          <div className="legend-item"><span className="color-dot" style={{backgroundColor: EVENT_COLORS.eventos_corporativos}}></span> Corporativos</div>
          <div className="legend-item"><span className="color-dot" style={{backgroundColor: EVENT_COLORS.otros}}></span> Otros</div>
        </div>
      </div>

      {selectedClient && (
        <ClientDetail 
          client={selectedClient} 
          onClose={handleCloseDetail}
          onEdit={handleEdit}
          onDelete={() => setClientToDelete(selectedClient)}
          onCompletePayment={() => setConfirmPaymentClient(selectedClient)}
        />
      )}

      {isEditing && (
        <ClientForm 
          client={isEditing} 
          onClose={handleCloseEdit} 
        />
      )}

      {/* Modal de confirmación para Completar Pago */}
      <ConfirmModal
        isOpen={Boolean(confirmPaymentClient)}
        onClose={() => setConfirmPaymentClient(null)}
        onConfirm={handleConfirmPayment}
        title="Completar Pago"
        message={`¿Estás seguro de completar el pago del cliente "${confirmPaymentClient?.nombreCompleto}"? El monto restante pasará a 0 y el estado será Pagado.`}
        confirmText="Completar Pago"
        cancelText="Cancelar"
        variant="success"
        isLoading={isCompletingPayment}
      />

      {/* Modal de confirmación para Eliminar Cliente */}
      <ConfirmModal
        isOpen={Boolean(clientToDelete)}
        onClose={() => setClientToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Eliminar Cliente"
        message={`¿Estás seguro de eliminar a "${clientToDelete?.nombreCompleto}" de todo el sistema? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
        isLoading={isDeletingClient}
      />
    </div>
  );
};

export default CalendarPage;
