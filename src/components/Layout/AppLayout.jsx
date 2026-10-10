import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import Sidebar from './Sidebar';
import logoImg from '../../assets/logo.png';
import './AppLayout.css';

const AppLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="app-container">
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      
      <div className="main-content">
        <header className="mobile-header">
          <button className="menu-btn" onClick={toggleSidebar}>
            <Menu size={24} />
          </button>
          <img src={logoImg} alt="JudeFilms" className="mobile-header-logo" />
        </header>
        
        <main className="content-area">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
