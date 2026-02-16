import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import { 
  LayoutDashboard, 
  Car, 
  Info, 
  History, 
  AlertCircle,
  LifeBuoy,
  Activity
} from 'lucide-react';

interface StudentSidebarProps {
  isOpen: boolean;
}

const StudentSidebar: React.FC<StudentSidebarProps> = ({ isOpen }) => {
  const theme = useTheme();
  const menuItems = [
    { label: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/student-dashboard' },
    { label: 'My Vehicles', icon: <Car size={20} />, path: '/student/vehicles' },
    { label: 'Parking Status', icon: <Info size={20} />, path: '/student/status' },
    { label: 'Parking History', icon: <History size={20} />, path: '/student/history' },
    { label: 'Report Issue', icon: <AlertCircle size={20} />, path: '/student/report' },
    { label: 'Activity Log', icon: <Activity size={20} />, path: '/student/activity' },
  ];

  return (
    <aside style={{ 
      width: isOpen ? '260px' : '80px',
      backgroundColor: theme.palette.background.paper,
      borderRight: `1px solid ${theme.palette.divider}`,
      height: 'calc(100vh - 64px)',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      overflowX: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      position: 'sticky',
      top: '64px',
      zIndex: 40,
      boxShadow: '0px 2px 4px rgba(0,0,0,0.02)'
    }}>
      <div style={{ padding: '1.5rem 0', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              padding: '0.875rem 0',
              textDecoration: 'none',
              color: isActive ? theme.palette.primary.main : theme.palette.text.secondary,
              fontWeight: isActive ? 600 : 500,
              fontSize: '0.9375rem',
              transition: 'all 0.2s',
              position: 'relative',
              backgroundColor: isActive 
                ? (theme.palette.mode === 'light' ? `${theme.palette.primary.main}15` : `${theme.palette.primary.main}25`) 
                : 'transparent',
            })}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            {/* Active Indicator Line */}
            <div style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: '5px',
              backgroundColor: theme.palette.primary.main,
              opacity: 0, // Controlled by CSS class below
              transition: 'opacity 0.2s'
            }} className="active-indicator" />

            <div style={{ 
              minWidth: '80px', 
              display: 'flex', 
              justifyContent: 'center',
              alignItems: 'center'
            }}>
              {item.icon}
            </div>
            
            <span style={{ 
              whiteSpace: 'nowrap', 
              opacity: isOpen ? 1 : 0,
              transition: 'opacity 0.3s',
              visibility: isOpen ? 'visible' : 'hidden'
            }}>
              {item.label}
            </span>
          </NavLink>
        ))}
      </div>

      {isOpen && (
        <div style={{ marginTop: 'auto', padding: '1rem' }}>
          <div style={{ 
            backgroundColor: theme.palette.mode === 'light' ? '#f8fafc' : '#0f172a', 
            borderRadius: '12px', 
            padding: '1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem'
          }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: theme.palette.text.secondary, textTransform: 'uppercase' }}>Need Help?</div>
            <p style={{ fontSize: '0.8125rem', color: theme.palette.text.secondary, margin: 0 }}>Contact support for parking permit issues.</p>
            <NavLink
              to="/student/support"
              style={{ 
                display: 'block',
                backgroundColor: theme.palette.background.paper, 
                border: `1px solid ${theme.palette.divider}`, 
                padding: '0.625rem', 
                borderRadius: '8px',
                fontSize: '0.8125rem',
                fontWeight: 600,
                color: theme.palette.text.primary,
                cursor: 'pointer',
                textAlign: 'center',
                textDecoration: 'none'
              }}
            >
              Contact Support
            </NavLink>
          </div>
        </div>
      )}

      {!isOpen && (
        <div style={{ marginTop: 'auto', padding: '1.5rem 0', display: 'flex', justifyContent: 'center' }}>
          <NavLink to="/student/support" style={{ color: theme.palette.text.secondary }}>
            <LifeBuoy size={20} />
          </NavLink>
        </div>
      )}

      <style>{`
        .sidebar-link.active .active-indicator {
          opacity: 1 !important;
        }
        
        .sidebar-link:hover:not(.active) {
          background: linear-gradient(
            to right,
            ${theme.palette.primary.main}10 0%,
            transparent 100%
          );
          color: ${theme.palette.text.primary};
        }

        .sidebar-link:hover .active-indicator {
          opacity: 0.5;
          background-color: ${theme.palette.primary.main}75;
        }
      `}</style>
    </aside>
  );
};

export default StudentSidebar;
