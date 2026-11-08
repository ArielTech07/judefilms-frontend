import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Filter, CheckCircle2, Calendar, CalendarDays, ArrowUpDown, RotateCcw } from 'lucide-react';
import { getClients, deleteClient } from '../../services/clientService';
import { updateEvento } from '../../services/eventoService';
import { flattenAllClients } from '../../utils/mappers';
import { EVENT_TYPES, getEventLabel } from '../../utils/constants';
import { formatCurrency, formatDate } from '../../utils/formatters';
import Card from '../../components/UI/Card';
import Badge from '../../components/UI/Badge';
import ConfirmModal from '../../components/UI/ConfirmModal';
import ClientForm from './ClientForm';
import ClientDetail from './ClientDetail';
import toast from 'react-hot-toast';
import './ClientsPage.css';

const MONTHS = [
  { value: 'todos', label: 'Todos los meses' },
  { value: '01', label: 'Enero' },
  { value: '02', label: 'Febrero' },
  { value: '03', label: 'Marzo' },
  { value: '04', label: 'Abril' },
  { value: '05', label: 'Mayo' },
  { value: '06', label: 'Junio' },
  { value: '07', label: 'Julio' },
  { value: '08', label: 'Agosto' },
  { value: '09', label: 'Septiembre' },
  { value: '10', label: 'Octubre' },
  { value: '11', label: 'Noviembre' },
  { value: '12', label: 'Diciembre' }
];

// Extractor seguro de año y mes sin desfase de zona horaria
const getClientYearAndMonth = (fechaStr) => {
  if (!fechaStr) return { year: null, month: null };
  const cleanDate = fechaStr.split('T')[0];
  const parts = cleanDate.split('-');
  if (parts.length >= 2) {
    return { year: parts[0], month: parts[1] };
  }
  return { year: null, month: null };
};

const ClientsPage = () => {
  const [clients, setClients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('todos');
  const [filterMonth, setFilterMonth] = useState('todos');
  const [filterYear, setFilterYear] = useState('todos');
  const [sortOrder, setSortOrder] = useState('desc'); // 'desc' = más recientes primero, 'asc' = más antiguos
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [viewingClient, setViewingClient] = useState(null);

  // Estados para modales de confirmación
  const [confirmPaymentClient, setConfirmPaymentClient] = useState(null);
  const [isCompletingPayment, setIsCompletingPayment] = useState(false);
  const [clientToDelete, setClientToDelete] = useState(null);
  const [isDeletingClient, setIsDeletingClient] = useState(false);

  const loadClients = async () => {
    setIsLoading(true);
    try {
      const data = await getClients();
      const flatClients = flattenAllClients(data);
      setClients(flatClients);
    } catch (error) {
      toast.error('Error al cargar los clientes');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, []);

  // Obtener dinámicamente los años presentes en los eventos
  const availableYears = useMemo(() => {
    const yearsSet = new Set();
    const currentYear = new Date().getFullYear().toString();
    yearsSet.add(currentYear);

    clients.forEach((c) => {
      if (c.fechaEvento) {
        const { year } = getClientYearAndMonth(c.fechaEvento);
        if (year && year.length === 4) {
          yearsSet.add(year);
        }
      }
    });

    return Array.from(yearsSet).sort((a, b) => b.localeCompare(a));
  }, [clients]);

  // Filtrado y ordenamiento de clientes por fecha
  const filteredClients = useMemo(() => {
    return clients
      .filter(client => {
        // 1. Búsqueda por nombre o teléfono
        const term = searchTerm.trim().toLowerCase();
        const matchesSearch = !term ||
          client.nombreCompleto?.toLowerCase().includes(term) ||
          client.telefono?.toLowerCase().includes(term);

        // 2. Filtro por tipo de evento
        const matchesFilter = filterType === 'todos' || client.tipoEvento === filterType;

        // 3. Extracción de mes y año
        const { year, month } = getClientYearAndMonth(client.fechaEvento);

        // 4. Filtro por mes
        const matchesMonth = filterMonth === 'todos' || (month && month === filterMonth);

        // 5. Filtro por año
        const matchesYear = filterYear === 'todos' || (year && year === filterYear);

        return matchesSearch && matchesFilter && matchesMonth && matchesYear;
      })
      .sort((a, b) => {
        // Ordenar por fecha del evento (los clientes sin fecha van al final)
        if (!a.fechaEvento && !b.fechaEvento) return 0;
        if (!a.fechaEvento) return 1;
        if (!b.fechaEvento) return -1;

        const dateA = a.fechaEvento.split('T')[0];
        const dateB = b.fechaEvento.split('T')[0];

        const compDate = sortOrder === 'desc'
          ? dateB.localeCompare(dateA)
          : dateA.localeCompare(dateB);

        if (compDate !== 0) return compDate;

        // Si la fecha es idéntica, comparar por hora si existe
        if (a.horaEvento && b.horaEvento) {
          const compHora = sortOrder === 'desc'
            ? b.horaEvento.localeCompare(a.horaEvento)
            : a.horaEvento.localeCompare(b.horaEvento);
          if (compHora !== 0) return compHora;
        }

        // Desempate por nombre alfabético
        return (a.nombreCompleto || '').localeCompare(b.nombreCompleto || '');
      });
  }, [clients, searchTerm, filterType, filterMonth, filterYear, sortOrder]);

  const hasActiveFilters = Boolean(
    searchTerm.trim() ||
    filterType !== 'todos' ||
    filterMonth !== 'todos' ||
    filterYear !== 'todos'
  );

  const handleClearFilters = () => {
    setSearchTerm('');
    setFilterType('todos');
    setFilterMonth('todos');
    setFilterYear('todos');
    setSortOrder('desc');
  };

  const handleAddNew = () => {
    setEditingClient(null);
    setIsFormOpen(true);
  };

  const handleEdit = (client, e) => {
    if (e) e.stopPropagation();
    setEditingClient(client);
    setIsFormOpen(true);
  };

  const handleView = (client) => {
    setViewingClient(client);
  };

  const handleCloseForm = (shouldReload = false) => {
    setIsFormOpen(false);
    setEditingClient(null);
    if (shouldReload) loadClients();
  };

  // Abrir modal de confirmación de pago
  const handlePromptPayment = (client, e) => {
    if (e) e.stopPropagation();
    setConfirmPaymentClient(client);
  };

  // Ejecutar completado de pago
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
        adelanto: confirmPaymentClient.precioTotal, // Adelanto igual al total -> Pagado
        notasAdicionales: confirmPaymentClient.notas || null
      };

      await updateEvento(confirmPaymentClient.eventoId, eventoPayload);
      toast.success(`Pago completado para ${confirmPaymentClient.nombreCompleto}`);
      setConfirmPaymentClient(null);

      // Si estaba viéndolo en el modal de detalle, actualizar estado local
      if (viewingClient && viewingClient.id === confirmPaymentClient.id) {
        setViewingClient(prev => ({
          ...prev,
          adelanto: confirmPaymentClient.precioTotal,
          pagoPendiente: 0,
          estado: 'pagado'
        }));
      }

      loadClients();
    } catch (error) {
      toast.error('Error al completar el pago');
      console.error(error);
    } finally {
      setIsCompletingPayment(false);
    }
  };

  // Abrir modal de confirmación de eliminación
  const handlePromptDelete = (client, e) => {
    if (e) e.stopPropagation();
    setClientToDelete(client);
  };

  // Ejecutar eliminación del cliente
  const handleConfirmDelete = async () => {
    if (!clientToDelete) return;
    setIsDeletingClient(true);
    try {
      await deleteClient(clientToDelete.clienteId || clientToDelete.id);
      toast.success('Cliente eliminado correctamente');
      setClientToDelete(null);
      setViewingClient(null);
      loadClients();
    } catch (error) {
      toast.error('Error al eliminar el cliente');
      console.error(error);
    } finally {
      setIsDeletingClient(false);
    }
  };

  return (
    <div className="clients-page">
      <div className="page-header">
        <h1>Mis Clientes</h1>
        <button className="btn-primary" onClick={handleAddNew}>
          <Plus size={20} />
          <span>Nuevo Cliente</span>
        </button>
      </div>

      <div className="controls-bar">
        <div className="search-box">
          <Search size={20} className="search-icon" />
          <input
            type="text"
            placeholder="Buscar por nombre o teléfono..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoComplete="off"
          />
        </div>
        
        {/* Filtro por Tipo de Evento */}
        <div className="filter-box">
          <Filter size={18} className="filter-icon" />
          <select 
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            aria-label="Filtrar por evento"
          >
            <option value="todos">Todos los eventos</option>
            {EVENT_TYPES.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </div>

        {/* Filtro por Mes */}
        <div className="filter-box">
          <Calendar size={18} className="filter-icon" />
          <select 
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            aria-label="Filtrar por mes"
          >
            {MONTHS.map(month => (
              <option key={month.value} value={month.value}>{month.label}</option>
            ))}
          </select>
        </div>

        {/* Filtro por Año */}
        <div className="filter-box">
          <CalendarDays size={18} className="filter-icon" />
          <select 
            value={filterYear}
            onChange={(e) => setFilterYear(e.target.value)}
            aria-label="Filtrar por año"
          >
            <option value="todos">Todos los años</option>
            {availableYears.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>

        {/* Botón Orden de Fecha */}
        <button
          type="button"
          className="btn-sort-order"
          onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
          title={sortOrder === 'desc' ? 'Orden: Más recientes primero (click para cambiar a más antiguos)' : 'Orden: Más antiguos primero (click para cambiar a más recientes)'}
        >
          <ArrowUpDown size={16} />
          <span>{sortOrder === 'desc' ? 'Más recientes' : 'Más antiguos'}</span>
        </button>

        {/* Botón Limpiar Filtros */}
        {hasActiveFilters && (
          <button
            type="button"
            className="btn-clear-filters"
            onClick={handleClearFilters}
            title="Limpiar todos los filtros"
          >
            <RotateCcw size={15} />
            <span>Limpiar</span>
          </button>
        )}
      </div>

      {/* Resumen de resultados y filtros activos */}
      {!isLoading && (
        <div className="filter-summary-bar">
          <span className="results-count">
            {filteredClients.length === 1
              ? '1 cliente encontrado'
              : `${filteredClients.length} clientes encontrados`}
          </span>
          {hasActiveFilters && (
            <span className="active-filters-tag">
              Filtros aplicados
            </span>
          )}
        </div>
      )}

      <div className="clients-grid">
        {isLoading ? (
          <div className="loading-state">Cargando clientes...</div>
        ) : filteredClients.length > 0 ? (
          filteredClients.map(client => (
            <Card key={client.id} className="client-card" onClick={() => handleView(client)}>
              <div className="client-card-header">
                <h3>{client.nombreCompleto}</h3>
                <Badge variant="default">{client.tipoEvento ? getEventLabel(client.tipoEvento) : 'Sin evento'}</Badge>
              </div>
              <div className="client-card-body">
                {client.fechaEvento && (
                  <p className="event-date">📅 {formatDate(client.fechaEvento)}</p>
                )}
                <div className="financials">
                  <div className="financial-row">
                    <span>Total:</span>
                    <strong>{formatCurrency(client.precioTotal)}</strong>
                  </div>
                  <div className="financial-row">
                    <span>Adelanto:</span>
                    <span>{formatCurrency(client.adelanto)}</span>
                  </div>
                </div>
              </div>
              <div className="client-card-footer">
                <Badge variant={client.pagoPendiente > 0 ? 'warning' : 'success'}>
                  {client.pagoPendiente > 0 ? `Pendiente: ${formatCurrency(client.pagoPendiente)}` : 'Pagado'}
                </Badge>
                <div className="card-actions">
                  {client.pagoPendiente > 0 && client.eventoId && (
                    <button 
                      className="btn-icon pay-btn" 
                      onClick={(e) => handlePromptPayment(client, e)}
                      title="Completar pago"
                    >
                      <CheckCircle2 size={17} />
                    </button>
                  )}
                  <button className="btn-icon edit-btn" onClick={(e) => handleEdit(client, e)} title="Editar cliente">
                    ✏️
                  </button>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <div className="no-results">
            <p>No se encontraron clientes con los filtros seleccionados.</p>
            {hasActiveFilters && (
              <button
                type="button"
                className="btn-clear-inline"
                onClick={handleClearFilters}
              >
                Restablecer filtros
              </button>
            )}
          </div>
        )}
      </div>

      {isFormOpen && (
        <ClientForm 
          client={editingClient} 
          onClose={handleCloseForm} 
        />
      )}

      {viewingClient && (
        <ClientDetail 
          client={viewingClient} 
          onClose={() => setViewingClient(null)}
          onEdit={(c) => { setViewingClient(null); handleEdit(c, {stopPropagation:()=>{}}); }}
          onDelete={() => handlePromptDelete(viewingClient)}
          onCompletePayment={() => handlePromptPayment(viewingClient)}
        />
      )}

      {/* Modal de confirmación para completar pago */}
      <ConfirmModal
        isOpen={Boolean(confirmPaymentClient)}
        onClose={() => setConfirmPaymentClient(null)}
        onConfirm={handleConfirmPayment}
        title="¿Completar pago?"
        message={`¿Estás seguro de completar el pago de ${confirmPaymentClient?.nombreCompleto}? El saldo pendiente pasará a S/ 0.00 y quedará registrado como pagado.`}
        confirmText="Completar Pago"
        cancelText="Cancelar"
        variant="success"
        isLoading={isCompletingPayment}
      />

      {/* Modal de confirmación para eliminar cliente */}
      <ConfirmModal
        isOpen={Boolean(clientToDelete)}
        onClose={() => setClientToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="¿Eliminar cliente?"
        message={`¿Estás seguro de eliminar a ${clientToDelete?.nombreCompleto}? Se borrará el cliente junto con todos sus eventos y contratos de forma permanente.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
        isLoading={isDeletingClient}
      />
    </div>
  );
};

export default ClientsPage;
