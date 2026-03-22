import React, { useState, useEffect } from 'react';
import TopBar from './TopBar/TopBar';
import DynamicSidebar from './Sidebar/DynamicSidebar';
import { useTheme } from '@mui/material/styles';
import { Outlet } from 'react-router-dom';

/**
 * AppLayout: Generic layout for all roles.
 * Features a shared TopBar and a permission-aware DynamicSidebar.
 */
const AppLayout: React.FC = () => {
  const theme = useTheme();
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1128);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 1128) {
        if (isSidebarOpen) setIsSidebarOpen(false);
      } else {
        if (!isSidebarOpen) setIsSidebarOpen(true);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isSidebarOpen]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const openSidebar = () => {
    setIsSidebarOpen(true);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: theme.palette.background.default }}>
      <TopBar onMenuClick={toggleSidebar} />
      <div style={{ display: 'flex' }}>
        <DynamicSidebar isOpen={isSidebarOpen} onExpand={openSidebar} />
        <main style={{ 
          flex: 1, 
          padding: '2rem',
          maxWidth: isSidebarOpen ? 'calc(100vw - 260px)' : 'calc(100vw - 80px)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          minHeight: 'calc(100vh - 64px)',
          overflowY: 'auto',
          backgroundColor: theme.palette.background.default
        }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
