import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { getClients } from '../../services/clientService';
import { flattenAllClients } from '../../utils/mappers';
import { formatCurrency } from '../../utils/formatters';
import { DollarSign, Calendar, TrendingUp, AlertCircle } from 'lucide-react';
import Card from '../../components/UI/Card';
import './DashboardPage.css';

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

const DashboardPage = () => {
  const [clients, setClients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await getClients();
        const flatClients = flattenAllClients(data).filter(c => c.fechaEvento);
        setClients(flatClients);
      } catch (error) {
        console.error('Error al cargar datos del dashboard', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const stats = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    
    // Obtener inicio de la semana actual (lunes)
    const currentDay = now.getDay();
    const diff = now.getDate() - currentDay + (currentDay === 0 ? -6 : 1);
    const startOfWeek = new Date(now.setDate(diff));
    startOfWeek.setHours(0, 0, 0, 0);

    let semanal = 0;
    let mensual = 0;
    let anual = 0;
    let pendienteTotal = 0;
    let clientesPendientes = 0;
    let totalPagados = 0;

    clients.forEach(client => {
      if (!client.fechaEvento) return;
      const eventDate = new Date(client.fechaEvento + 'T12:00:00');
      
      // Solo contar ingresos del año actual para anual y pendiente de este año
      if (eventDate.getFullYear() === currentYear) {
        anual += client.precioTotal;
        
        if (eventDate.getMonth() === currentMonth) {
          mensual += client.precioTotal;
        }

        if (eventDate >= startOfWeek) {
          semanal += client.precioTotal;
        }

        if (client.pagoPendiente > 0) {
          pendienteTotal += client.pagoPendiente;
          clientesPendientes++;
        } else {
          totalPagados++;
        }
      }
    });

    return {
      semanal,
      mensual,
      anual,
      pendienteTotal,
      clientesPendientes,
      totalEventos: clients.filter(c => c.fechaEvento && new Date(c.fechaEvento + 'T12:00:00').getFullYear() === currentYear).length,
      totalPagados
    };
  }, [clients, currentYear]);

  const chartData = useMemo(() => {
    // Inicializar array de 12 meses
    const data = MESES.map(mes => ({ name: mes, ingresos: 0, pendientes: 0 }));
    
    clients.forEach(client => {
      if (!client.fechaEvento) return;
      const eventDate = new Date(client.fechaEvento + 'T12:00:00');
      if (eventDate.getFullYear() === currentYear) {
        const monthIndex = eventDate.getMonth();
        // Sumar lo que ya pagaron a ingresos
        data[monthIndex].ingresos += client.adelanto;
        // Sumar lo que falta a pendientes
        data[monthIndex].pendientes += client.pagoPendiente;
      }
    });

    return data;
  }, [clients, currentYear]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="tooltip-label">{label} {currentYear}</p>
          <div className="tooltip-data">
            <p className="tooltip-item ingresos">
              Ingresos (Adelantos): <span>{formatCurrency(payload[0].value)}</span>
            </p>
            {payload[1] && payload[1].value > 0 && (
              <p className="tooltip-item pendientes">
                Por Cobrar: <span>{formatCurrency(payload[1].value)}</span>
              </p>
            )}
            <p className="tooltip-item total">
              Proyección Total: <span>{formatCurrency((payload[0]?.value || 0) + (payload[1]?.value || 0))}</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return <div className="dashboard-page"><div className="loading-state">Cargando dashboard...</div></div>;
  }

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <h1>Dashboard de Ingresos</h1>
        <p className="subtitle">Resumen del año {currentYear}</p>
      </div>

      <div className="kpi-grid">
        <Card className="kpi-card">
          <div className="kpi-icon-wrapper">
            <Calendar size={24} className="kpi-icon info" />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Proyección Semanal</span>
            <span className="kpi-value">{formatCurrency(stats.semanal)}</span>
          </div>
        </Card>

        <Card className="kpi-card">
          <div className="kpi-icon-wrapper">
            <TrendingUp size={24} className="kpi-icon success" />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Proyección Mensual</span>
            <span className="kpi-value">{formatCurrency(stats.mensual)}</span>
          </div>
        </Card>

        <Card className="kpi-card">
          <div className="kpi-icon-wrapper">
            <DollarSign size={24} className="kpi-icon accent" />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Proyección Anual Total</span>
            <span className="kpi-value">{formatCurrency(stats.anual)}</span>
          </div>
        </Card>

        <Card className="kpi-card">
          <div className="kpi-icon-wrapper">
            <AlertCircle size={24} className="kpi-icon warning" />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Pendiente de Cobro</span>
            <span className="kpi-value warning-text">{formatCurrency(stats.pendienteTotal)}</span>
            <span className="kpi-subtext">De {stats.clientesPendientes} eventos</span>
          </div>
        </Card>
      </div>

      <Card className="chart-card">
        <h3>Ingresos vs Por Cobrar ({currentYear})</h3>
        <div className="chart-container">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="name" stroke="var(--color-accent-muted)" tick={{fill: 'var(--color-accent-soft)'}} />
              <YAxis 
                stroke="var(--color-accent-muted)" 
                tick={{fill: 'var(--color-accent-soft)'}}
                tickFormatter={(value) => `S/${value}`}
              />
              <Tooltip content={<CustomTooltip />} cursor={{fill: 'var(--color-bg-tertiary)'}} />
              
              <Bar dataKey="ingresos" stackId="a" fill="var(--color-accent)" radius={[0, 0, 4, 4]} />
              <Bar dataKey="pendientes" stackId="a" fill="var(--color-warning)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="summary-footer">
        <div className="summary-item">
          <span className="label">Total Eventos:</span>
          <span className="value">{stats.totalEventos}</span>
        </div>
        <div className="summary-item">
          <span className="label">Pagados:</span>
          <span className="value success-text">{stats.totalPagados}</span>
        </div>
        <div className="summary-item">
          <span className="label">Pendientes:</span>
          <span className="value warning-text">{stats.clientesPendientes}</span>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
