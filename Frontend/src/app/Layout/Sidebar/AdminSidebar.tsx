import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import { 
  LayoutDashboard, 
  Users, 
  Car, 
  BarChart3, 
  LifeBuoy,
  Settings,
  ClipboardList,
  Video,
  Camera,
  Upload,
  Activity,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  UserCog,
  Key
} from 'lucide-react';

interface SidebarItem {
  label: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: SidebarItem[];
}

interface AdminSidebarProps {
  isOpen: boolean;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ isOpen }) => {
  const theme = useTheme();
  const location = useLocation();
  
  const menuItems: SidebarItem[] = [
    { label: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/admin-dashboard' },
    { 
      label: 'Camera Hub', 
      icon: <Camera size={20} />, 
      subItems: [
        { label: 'Live Streams', icon: <Video size={18} />, path: '/admin/live-streams' },
        { label: 'Manage Cameras', icon: <Settings size={18} />, path: '/admin/cameras' },
        { label: 'Media Uploads', icon: <Upload size={18} />, path: '/admin/media-uploads' },
        { label: 'System Status', icon: <Activity size={18} />, path: '/admin/system-status' },
      ]
    },
    { label: 'User Management', icon: <Users size={20} />, path: '/admin/users' },
    { label: 'Parking Management', icon: <Car size={20} />, path: '/admin/parking' },
    { label: 'Violations', icon: <ClipboardList size={20} />, path: '/admin/violations' },
    { label: 'Reports', icon: <BarChart3 size={20} />, path: '/admin/reports' },
    { label: 'Support Tickets', icon: <LifeBuoy size={20} />, path: '/admin/support' },
    {
      label: 'Authorization',
      icon: <ShieldCheck size={20} />,
      subItems: [
        { label: 'Roles', icon: <UserCog size={18} />, path: '/admin/auth/roles' },
        { label: 'Permissions', icon: <Key size={18} />, path: '/admin/auth/permissions' },
        { label: 'Users', icon: <Users size={18} />, path: '/admin/auth/users' },
      ]
    },
    { label: 'Settings', icon: <Settings size={20} />, path: '/admin/settings' },
  ];

  // Initialize open state based on current path
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() => {
    const initialState: Record<string, boolean> = {};
    menuItems.forEach(item => {
      if (item.subItems) {
        if (item.subItems.some(sub => location.pathname === sub.path)) {
          initialState[item.label] = true;
        }
      }
    });
    return initialState;
  });

  const toggleSection = (label: string) => {
    if (!isOpen) return;
    setOpenSections(prev => ({
      ...prev,
      [label]: !prev[label]
    }));
  };

  return (
    <aside style={{ 
      width: isOpen ? '260px' : '80px',
      backgroundColor: theme.palette.background.paper,
      borderRight: `1px solid ${theme.palette.divider}`,
      height: 'calc(100vh - 64px)',
      transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      overflowX: isOpen ? 'hidden' : 'visible',
      overflowY: isOpen ? 'auto' : 'visible', // Visible when collapsed to allow flyouts
      display: 'flex',
      flexDirection: 'column',
      position: 'sticky',
      top: '64px',
      zIndex: 40,
      boxShadow: '0px 2px 4px rgba(0,0,0,0.02)'
    }} className="custom-scrollbar">
      <div style={{ padding: '1.5rem 0', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        {menuItems.map((item) => {
          if (item.subItems) {
            const isSubItemActive = item.subItems.some(sub => location.pathname === sub.path);
            const isSectionOpen = openSections[item.label];

            return (
              <div key={item.label} style={{ position: 'relative' }} className="group">
                <button
                  onClick={() => toggleSection(item.label)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0.875rem 0',
                    width: '100%',
                    border: 'none',
                    backgroundColor: 'transparent',
                    cursor: 'pointer',
                    color: isSubItemActive ? theme.palette.primary.main : theme.palette.text.secondary,
                    fontWeight: isSubItemActive ? 600 : 500,
                    fontSize: '0.9375rem',
                    transition: 'all 0.2s',
                    position: 'relative',
                  }}
                  className={`sidebar-link ${isSubItemActive ? 'active' : ''}`}
                >
                  <div style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: '5px',
                    backgroundColor: theme.palette.primary.main,
                    opacity: isSubItemActive ? 1 : 0,
                    transition: 'opacity 0.2s'
                  }} />
                  <div style={{ minWidth: '80px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    {item.icon}
                  </div>
                  <span style={{ 
                    whiteSpace: 'nowrap', 
                    opacity: isOpen ? 1 : 0,
                    transition: 'opacity 0.3s',
                    visibility: isOpen ? 'visible' : 'hidden',
                    flex: 1,
                    textAlign: 'left'
                  }}>
                    {item.label}
                  </span>
                  {isOpen && (
                    <div style={{ paddingRight: '1rem' }}>
                      {isSectionOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </div>
                  )}
                </button>
                
                {/* Inline Expansion (Open State) */}
                {isOpen && isSectionOpen && (
                  <div style={{ 
                    backgroundColor: theme.palette.mode === 'light' ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.03)', 
                    padding: '0.25rem 0' 
                  }}>
                    {item.subItems.map(sub => (
                      <NavLink
                        key={sub.path}
                        to={sub.path!}
                        style={({ isActive }) => ({
                          display: 'flex',
                          alignItems: 'center',
                          padding: '0.75rem 0',
                          paddingLeft: '1.5rem',
                          textDecoration: 'none',
                          color: isActive ? theme.palette.primary.main : theme.palette.text.secondary,
                          fontWeight: isActive ? 600 : 500,
                          fontSize: '0.875rem',
                          transition: 'all 0.2s',
                        })}
                      >
                        <div style={{ minWidth: '40px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                          {sub.icon}
                        </div>
                        <span style={{ whiteSpace: 'nowrap' }}>{sub.label}</span>
                      </NavLink>
                    ))}
                  </div>
                )}

                {/* Flyout Menu (Collapsed State) */}
                {!isOpen && (
                  <div 
                    className="flyout-menu"
                    style={{
                      position: 'absolute',
                      left: '80px',
                      top: 0,
                      width: '220px',
                      backgroundColor: theme.palette.background.paper,
                      boxShadow: theme.shadows[4],
                      borderRadius: '0 8px 8px 0',
                      border: `1px solid ${theme.palette.divider}`,
                      borderLeft: 'none',
                      zIndex: 100,
                      display: 'none', // Managed by CSS hover
                      flexDirection: 'column',
                      padding: '0.5rem 0'
                    }}
                  >
                    <div style={{ 
                      padding: '0.75rem 1.5rem', 
                      fontWeight: 600, 
                      color: theme.palette.text.primary,
                      borderBottom: `1px solid ${theme.palette.divider}`,
                      marginBottom: '0.25rem'
                    }}>
                      {item.label}
                    </div>
                    {item.subItems.map(sub => (
                      <NavLink
                        key={sub.path}
                        to={sub.path!}
                        style={({ isActive }) => ({
                          display: 'flex',
                          alignItems: 'center',
                          padding: '0.75rem 1.5rem',
                          textDecoration: 'none',
                          color: isActive ? theme.palette.primary.main : theme.palette.text.secondary,
                          fontWeight: isActive ? 600 : 500,
                          fontSize: '0.875rem',
                          transition: 'all 0.2s',
                        })}
                        onClick={(e) => e.stopPropagation()}
                      >
                       <div style={{ minWidth: '24px', display: 'flex', alignItems: 'center' }}>
                          {sub.icon}
                        </div>
                        <span style={{ whiteSpace: 'nowrap', marginLeft: '8px' }}>{sub.label}</span>
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            );
          }

          return (
            <div key={item.path} style={{ position: 'relative' }} className="group">
              <NavLink
                to={item.path!}
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
                <div style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: '5px',
                  backgroundColor: theme.palette.primary.main,
                  opacity: 0,
                  transition: 'opacity 0.2s'
                }} className="active-indicator" />
                <div style={{ minWidth: '80px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
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

              {/* Tooltip for standard items when collapsed */}
              {!isOpen && (
                 <div 
                   className="flyout-menu"
                   style={{
                     position: 'absolute',
                     left: '80px',
                     top: '50%',
                     transform: 'translateY(-50%)',
                     backgroundColor: theme.palette.background.paper,
                     boxShadow: theme.shadows[4],
                     borderRadius: '4px',
                     border: `1px solid ${theme.palette.divider}`,
                     zIndex: 100,
                     display: 'none', 
                     padding: '0.5rem 1rem',
                     whiteSpace: 'nowrap',
                     color: theme.palette.text.primary,
                     fontWeight: 500
                   }}
                 >
                   {item.label}
                 </div>
              )}
            </div>
          );
        })}
      </div>

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

        /* Show flyout on hover when collapsed */
        .group:hover .flyout-menu {
          display: flex !important;
          animation: fadeIn 0.2s ease-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateX(-10px); }
          to { opacity: 1; transform: translateX(0); }
        }

        /* Adjust tooltip position animation */
        .group:hover .flyout-menu[style*="top: 50%"] {
          animation: fadeInTooltip 0.2s ease-out;
        }
        
        @keyframes fadeInTooltip {
           from { opacity: 0; transform: translate(-10px, -50%); }
           to { opacity: 1; transform: translate(0, -50%); }
        }

        /* Custom Scrollbar for Sidebar */
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'};
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'};
        }
      `}</style>
    </aside>
  );
};

export default AdminSidebar;
