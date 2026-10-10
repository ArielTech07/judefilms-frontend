import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Filter } from 'lucide-react';
import { getClients, deleteClient } from '../../services/clientService';
import { flattenAllClients } from '../../utils/mappers';
import { EVENT_TYPES, getEventLabel } from '../../utils/constants';
import { formatCurrency, formatDate } from '../../utils/formatters';
import Card from '../../components/UI/Card';
import Badge from '../../components/UI/Badge';
import ClientForm from './ClientForm';
import ClientDetail from './ClientDetail';
import toast from 'react-hot-toast';
import './ClientsPage.css';

const ClientsPage = () => {
  const [clients, setClients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('todos');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [viewingClient, setViewingClient] = useState(null);

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

  const filteredClients = useMemo(() => {
    return clients.filter(client => {
      const matchesSearch = client.nombreCompleto?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterType === 'todos' || client.tipoEvento === filterType;
      return matchesSearch && matchesFilter;
    }).sort((a, b) => {
      if (!a.fechaEvento) return 1;
      if (!b.fechaEvento) return -1;
      return new Date(a.fechaEvento) - new Date(b.fechaEvento);
    });
  }, [clients, searchTerm, filterType]);

  const handleAddNew = () => {
    setEditingClient(null);
    setIsFormOpen(true);
  };

  const handleEdit = (client, e) => {
    e.stopPropagation();
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

  const handleDelete = async (clienteId) => {
    if (window.confirm('¿Estás seguro de eliminar este cliente y todos sus eventos/contratos?')) {
      try {
        await deleteClient(clienteId);
        toast.success('Cliente eliminado');
        setViewingClient(null);
        loadClients();
      } catch (error) {
        toast.error('Error al eliminar el cliente');
        console.error(error);
      }
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
            placeholder="Buscar por nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoComplete="off"
          />
        </div>
        
        <div className="filter-box">
          <Filter size={20} className="filter-icon" />
          <select 
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="todos">Todos los eventos</option>
            {EVENT_TYPES.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </div>
      </div>

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
                <button className="btn-icon edit-btn" onClick={(e) => handleEdit(client, e)}>
                  ✏️
                </button>
              </div>
            </Card>
          ))
        ) : (
          <div className="no-results">
            <p>No se encontraron clientes.</p>
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
          onDelete={() => handleDelete(viewingClient.clienteId)}
        />
      )}
    </div>
  );
};

export default ClientsPage;
