import React, { useState, useEffect } from 'react';
import TopBar from './TopBar/TopBar';
import AdminSidebar from './Sidebar/AdminSidebar';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { Outlet } from 'react-router-dom';

const AdminLayout: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallMobile = useMediaQuery('(max-width:480px)');
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1128);

  useEffect(() => {
    if (isMobile) {
      setIsSidebarOpen(false);
    } else {
      setIsSidebarOpen(window.innerWidth > 1128);
    }
  }, [isMobile]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    if (isMobile) setIsSidebarOpen(false);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: theme.palette.background.default, position: 'relative' }}>
      <TopBar onMenuClick={toggleSidebar} />
      <div style={{ display: 'flex', position: 'relative' }}>
        <AdminSidebar 
          isOpen={isSidebarOpen} 
          isMobile={isMobile}
          onClose={closeSidebar}
        />
        
        {/* Mobile Overlay */}
        {isMobile && isSidebarOpen && (
          <div 
            onClick={closeSidebar}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.4)',
              backdropFilter: 'blur(2px)',
              zIndex: 35,
              animation: 'fadeIn 0.2s ease-out'
            }}
          />
        )}

        <main style={{ 
          flex: 1, 
          padding: isSmallMobile ? '0.75rem' : isMobile ? '1.25rem' : '2rem',
          maxWidth: isMobile ? '100vw' : (isSidebarOpen ? 'calc(100vw - 260px)' : 'calc(100vw - 80px)'),
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          minHeight: 'calc(100vh - 64px)',
          overflowX: 'hidden',
          backgroundColor: theme.palette.background.default,
          width: '100%'
        }}>
          <Outlet />
        </main>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default AdminLayout;
