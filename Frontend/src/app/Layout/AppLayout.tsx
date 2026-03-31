import React, { useState, useEffect } from 'react';
import TopBar from './TopBar/TopBar';
import DynamicSidebar from './Sidebar/DynamicSidebar';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { Outlet } from 'react-router-dom';

/**
 * AppLayout: Generic layout for all roles.
 * Features a shared TopBar and a permission-aware DynamicSidebar.
 */
const AppLayout: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md')); // < 900px in MUI default or custom
  const isSmallMobile = useMediaQuery('(max-width:480px)');
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1128);

  useEffect(() => {
    // On mobile, sidebar should be closed by default
    if (isMobile) {
      setIsSidebarOpen(false);
    } else {
      setIsSidebarOpen(window.innerWidth > 1128);
    }
  }, [isMobile]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const openSidebar = () => {
    setIsSidebarOpen(true);
  };

  const closeSidebar = () => {
    if (isMobile) setIsSidebarOpen(false);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: theme.palette.background.default, position: 'relative' }}>
      <TopBar onMenuClick={toggleSidebar} />
      
      <div style={{ display: 'flex', position: 'relative' }}>
        {/* Sidebar */}
        <DynamicSidebar 
          isOpen={isSidebarOpen} 
          onExpand={openSidebar} 
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

        {/* Main Content */}
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

export default AppLayout;
