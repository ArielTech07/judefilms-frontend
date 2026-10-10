import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { getClients } from '../../services/clientService';
import { flattenAllClients } from '../../utils/mappers';
import ClientDetail from '../clients/ClientDetail';
import ClientForm from '../clients/ClientForm';
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

const CalendarPage = () => {
  const [events, setEvents] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  const loadEvents = async () => {
    try {
      const data = await getClients();
      const clients = flattenAllClients(data).filter(c => c.fechaEvento);
      
      const formattedEvents = clients.map(client => {
        // Combinar fecha y hora si existe
        let start = client.fechaEvento;
        if (client.horaEvento) {
          start = `${client.fechaEvento}T${client.horaEvento}`;
        }

        return {
          id: client.id,
          title: `${client.nombreCompleto} - ${client.tipoEvento}`,
          start: start,
          backgroundColor: EVENT_COLORS[client.tipoEvento] || EVENT_COLORS.otros,
          borderColor: 'transparent',
          textColor: client.tipoEvento === 'bodas' || client.tipoEvento === 'cumpleaños_infantiles' ? '#000000' : '#FFFFFF',
          extendedProps: {
            client: client
          }
        };
      });
      setEvents(formattedEvents);
    } catch (error) {
      console.error('Error al cargar eventos del calendario:', error);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const handleEventClick = (clickInfo) => {
    setSelectedClient(clickInfo.event.extendedProps.client);
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

  return (
    <div className="calendar-page">
      <div className="page-header">
        <h1>Calendario de Eventos</h1>
      </div>

      <div className="calendar-container">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
          }}
          buttonText={{
            today: 'Hoy',
            month: 'Mes',
            week: 'Semana',
            day: 'Día'
          }}
          locale="es"
          events={events}
          eventClick={handleEventClick}
          height="auto"
          dayMaxEvents={true}
        />
      </div>

      <div className="calendar-legend">
        <h3>Leyenda</h3>
        <div className="legend-items">
          <div className="legend-item"><span className="color-dot" style={{backgroundColor: EVENT_COLORS.bodas, border: '1px solid #333'}}></span> Bodas</div>
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
          onDelete={() => {
            alert('Por favor elimine desde la vista de Clientes');
          }}
        />
      )}

      {isEditing && (
        <ClientForm 
          client={isEditing} 
          onClose={handleCloseEdit} 
        />
      )}
    </div>
  );
};

export default CalendarPage;
