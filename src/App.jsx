import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/Layout/ProtectedRoute';
import AppLayout from './components/Layout/AppLayout';
import LoginPage from './features/auth/LoginPage';
import ClientsPage from './features/clients/ClientsPage';
import CalendarPage from './features/calendar/CalendarPage';
import DashboardPage from './features/dashboard/DashboardPage';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/clientes" element={<ClientsPage />} />
              <Route path="/calendario" element={<CalendarPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/" element={<Navigate to="/clientes" replace />} />
            </Route>
          </Route>
          
          <Route path="*" element={<Navigate to="/clientes" replace />} />
        </Routes>
      </BrowserRouter>
      
      <Toaster 
        position="top-right"
        toastOptions={{
          style: {
            background: 'var(--color-bg-elevated)',
            color: 'var(--color-accent)',
            border: '1px solid var(--color-border)',
          },
          success: {
            iconTheme: {
              primary: 'var(--color-success)',
              secondary: 'var(--color-bg-elevated)',
            },
          },
          error: {
            iconTheme: {
              primary: 'var(--color-danger)',
              secondary: 'var(--color-bg-elevated)',
            },
          },
        }} 
      />
    </AuthProvider>
  );
}

export default App;
