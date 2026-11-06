import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Users, Calendar, LayoutDashboard, LogOut, Menu, X, Image as ImageIcon } from 'lucide-react';
import logoImg from '../../assets/logo.png';
import './Sidebar.css';

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const { logout } = useAuth();

  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={toggleSidebar}></div>}
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <img src={logoImg} alt="JudeFilms" className="sidebar-logo-img" />
            <span className="sidebar-subtitle">Control de Eventos</span>
          </div>
          <button className="mobile-close-btn" onClick={toggleSidebar}>
            <X size={24} />
          </button>
        </div>

        <nav className="sidebar-nav">
          <NavLink to="/clientes" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={toggleSidebar}>
            <Users size={20} />
            <span>Clientes</span>
          </NavLink>
          <NavLink to="/calendario" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={toggleSidebar}>
            <Calendar size={20} />
            <span>Calendario</span>
          </NavLink>
          <NavLink to="/dashboard" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={toggleSidebar}>
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </NavLink>
          <NavLink to="/galeria-web" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={toggleSidebar}>
            <ImageIcon size={20} />
            <span>Galería Web</span>
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <button className="logout-btn" onClick={logout}>
            <LogOut size={20} />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
