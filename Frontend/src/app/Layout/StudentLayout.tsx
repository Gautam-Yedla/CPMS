import React, { useState, useEffect } from 'react';
import TopBar from './TopBar/TopBar';
import StudentSidebar from './Sidebar/StudentSidebar';
import { useTheme } from '@mui/material/styles';

import { Outlet } from 'react-router-dom';

const StudentLayout: React.FC = () => {
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

  return (
    <div style={{ minHeight: '100vh', backgroundColor: theme.palette.background.default }}>
      <TopBar onMenuClick={toggleSidebar} />
      <div style={{ display: 'flex' }}>
        <StudentSidebar isOpen={isSidebarOpen} />
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

export default StudentLayout;
