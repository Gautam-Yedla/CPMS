import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { IPermission } from '@modules/Auth/authReducer';
import { useTheme } from '@mui/material/styles';
import { 
  LayoutDashboard, 
  Car, 
  Info, 
  History, 
  LifeBuoy,
  Activity,
  Navigation,
  ShieldCheck,
  ChevronDown,
  ChevronRight,
  Video,
  FileBarChart,
  ShieldAlert,
  Users,
  HardDrive,
  Bell,
  X
} from 'lucide-react';
import { IRootState } from '@app/appReducer';

interface SidebarItem {
  label: string;
  icon: React.ReactNode;
  path: string;
  permission?: string;
  adminOnly?: boolean;
  subItems?: SidebarItem[];
}

interface DynamicSidebarProps {
  isOpen: boolean;
  onExpand?: () => void;
  isMobile?: boolean;
  onClose?: () => void;
}

const DynamicSidebar: React.FC<DynamicSidebarProps> = ({ isOpen, onExpand, isMobile, onClose }) => {
  const theme = useTheme();
  const { user } = useSelector((state: IRootState) => state.app.auth);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  const toggleSection = (label: string) => {
    if (!isOpen && !isMobile && onExpand) {
        onExpand();
        setOpenSections(prev => ({ ...prev, [label]: true }));
    } else {
        setOpenSections(prev => ({ ...prev, [label]: !prev[label] }));
    }
  };

  const menuItems: SidebarItem[] = [
    { label: 'Dashboard', icon: <LayoutDashboard size={20} />, path: `/${user?.role || 'student'}-dashboard` },
    { 
        label: 'My Vehicles', 
        icon: <Car size={20} />, 
        path: '/vehicles', 
        permission: 'vehicles.manage' 
    },
    { 
        label: 'Parking Status', 
        icon: <Info size={20} />, 
        path: '/status' 
    },
    { 
        label: 'Parking History', 
        icon: <History size={20} />, 
        path: '/history', 
        permission: 'history.view' 
    },
    { 
        label: 'Zone Monitoring', 
        icon: <Navigation size={20} />, 
        path: '/zones', 
        permission: 'zones.faculty.view' 
    },
    { 
        label: 'Support', 
        icon: <LifeBuoy size={20} />, 
        path: '/support' 
    },
    { 
        label: 'Notifications', 
        icon: <Bell size={20} />, 
        path: user?.role === 'admin' ? '/admin/notifications' : '/notifications' 
    },
    // Admin Sections
    {
        label: 'Camera Monitoring',
        icon: <Video size={20} />,
        path: '/admin/cameras',
        adminOnly: true,
        subItems: [
            { label: 'Live Streams', icon: <Video size={18} />, path: '/admin/live-streams' },
            { label: 'Management', icon: <Video size={18} />, path: '/admin/cameras' },
            { label: 'Media Uploads', icon: <HardDrive size={18} />, path: '/admin/media-uploads' },
        ]
    },
    {
        label: 'Analytics',
        icon: <FileBarChart size={20} />,
        path: '/admin/reports',
        adminOnly: true,
        subItems: [
            { label: 'Dynamic Reports', icon: <FileBarChart size={18} />, path: '/admin/reports' },
            { label: 'System Status', icon: <Activity size={18} />, path: '/admin/system-status' },
        ]
    },
    {
        label: 'Parking Control',
        icon: <Navigation size={20} />,
        path: '/admin/parking',
        adminOnly: true,
        subItems: [
            { label: 'Zone Management', icon: <Navigation size={18} />, path: '/admin/parking' },
            { label: 'Permit Review', icon: <Car size={18} />, path: '/admin/permits' },
            { label: 'Violations', icon: <ShieldAlert size={18} />, path: '/admin/violations' },
        ]
    },
    {
        label: 'User Management',
        icon: <Users size={20} />,
        path: '/admin/users',
        adminOnly: true,
    },
    { 
        label: 'Auth & Roles', 
        icon: <ShieldCheck size={20} />, 
        path: '/admin/auth/roles', 
        adminOnly: true,
        subItems: [
            { label: 'Role Management', icon: <ShieldCheck size={18} />, path: '/admin/auth/roles' },
            { label: 'Permissions', icon: <ShieldCheck size={18} />, path: '/admin/auth/permissions' },
            { label: 'Direct Users', icon: <ShieldCheck size={18} />, path: '/admin/auth/users' },
        ]
    },
  ];

  const hasAccess = (item: SidebarItem) => {
    if (!user) return !item.adminOnly && !item.permission;
    const userRole = (user.role || 'student').toLowerCase();
    if (userRole === 'admin') return true;
    if (item.adminOnly) return false;
    if (!item.permission) return true;
    return user?.permissions?.some((p: IPermission) => p.name === item.permission);
  };

  const filteredItems = menuItems.filter(hasAccess);
  const sidebarWidth = isMobile ? '280px' : (isOpen ? '260px' : '80px');

  return (
    <aside style={{ 
      width: sidebarWidth,
      backgroundColor: theme.palette.background.paper,
      borderRight: `1px solid ${theme.palette.divider}`,
      height: isMobile ? '100vh' : 'calc(100vh - 64px)',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      overflowX: 'hidden',
      overflowY: 'auto',
      display: 'flex',
      flexDirection: 'column',
      position: isMobile ? 'fixed' : 'sticky',
      top: isMobile ? 0 : '64px',
      left: 0,
      bottom: 0,
      zIndex: isMobile ? 1000 : 40,
      boxShadow: isMobile ? '10px 0 30px rgba(0,0,0,0.1)' : '0px 2px 4px rgba(0,0,0,0.02)',
      transform: isMobile ? (isOpen ? 'translateX(0)' : 'translateX(-100%)') : 'none'
    }} className="custom-scrollbar">
      
      {isMobile && (
        <div style={{ 
          padding: '1.25rem', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          borderBottom: `1px solid ${theme.palette.divider}`
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ backgroundColor: theme.palette.primary.main, padding: '6px', borderRadius: '8px', color: 'white' }}>
              <Car size={20} />
            </div>
            <span style={{ fontWeight: 800, fontSize: '1.25rem', color: theme.palette.text.primary }}>CPMS</span>
          </div>
          <button 
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: theme.palette.text.secondary }}
          >
            <X size={24} />
          </button>
        </div>
      )}

      <div style={{ padding: '1rem 0', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        {filteredItems.map((item) => {
          const isDropdown = !!item.subItems;
          
          return (
            <React.Fragment key={item.label}>
              {isDropdown ? (
                <div
                  onClick={() => toggleSection(item.label)}
                  title={!isOpen && !isMobile ? item.label : ''}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0.875rem 0',
                    cursor: 'pointer',
                    color: theme.palette.text.secondary,
                    fontWeight: 500,
                    fontSize: '0.9375rem',
                    transition: 'all 0.2s',
                    position: 'relative',
                    justifyContent: (isOpen || isMobile) ? 'flex-start' : 'center',
                  }}
                  className="sidebar-link"
                >
                  <div style={{ 
                    minWidth: (isOpen || isMobile) ? (isMobile ? '60px' : '80px') : 'auto', 
                    display: 'flex', 
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}>
                    {item.icon}
                  </div>
                  {(isOpen || isMobile) && (
                    <>
                      <span style={{ flex: 1, whiteSpace: 'nowrap' }}>{item.label}</span>
                      <div style={{ paddingRight: '1rem' }}>
                        {openSections[item.label] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <NavLink
                  to={item.path}
                  onClick={() => isMobile && onClose && onClose()}
                  title={!isOpen && !isMobile ? item.label : ''}
                  className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
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
                    justifyContent: (isOpen || isMobile) ? 'flex-start' : 'center',
                    backgroundColor: isActive 
                      ? (theme.palette.mode === 'light' ? `${theme.palette.primary.main}15` : `${theme.palette.primary.main}25`) 
                      : 'transparent',
                  })}
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

                  <div style={{ 
                    minWidth: (isOpen || isMobile) ? (isMobile ? '60px' : '80px') : 'auto', 
                    display: 'flex', 
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}>
                    {item.icon}
                  </div>
                  {(isOpen || isMobile) && <span style={{ flex: 1, whiteSpace: 'nowrap' }}>{item.label}</span>}
                </NavLink>
              )}

              {/* Sub Items */}
              {isDropdown && openSections[item.label] && (isOpen || isMobile) && (
                <div style={{ backgroundColor: theme.palette.mode === 'light' ? '#f8fafc' : '#0f172a' }}>
                  {item.subItems!.map((sub) => (
                    <NavLink
                      key={sub.path}
                      to={sub.path}
                      onClick={() => isMobile && onClose && onClose()}
                      className={({ isActive }) => `sidebar-sub-link ${isActive ? 'active' : ''}`}
                      style={({ isActive }) => ({
                        display: 'flex',
                        alignItems: 'center',
                        padding: isMobile ? '0.75rem 0 0.75rem 3.75rem' : '0.75rem 2.5rem',
                        textDecoration: 'none',
                        color: isActive ? theme.palette.primary.main : theme.palette.text.secondary,
                        fontSize: '0.875rem',
                        transition: 'all 0.2s',
                        fontWeight: isActive ? 600 : 400
                      })}
                    >
                      <span style={{ marginRight: '0.75rem' }}>{sub.icon}</span>
                      {sub.label}
                    </NavLink>
                  ))}
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      <style>{`
        .sidebar-link.active .active-indicator { opacity: 1 !important; }
        .sidebar-link:hover:not(.active) { background: ${theme.palette.mode === 'light' ? '#f1f5f9' : '#1e293b'}; color: ${theme.palette.text.primary}; }
        .sidebar-sub-link:hover:not(.active) { background: ${theme.palette.mode === 'light' ? '#f1f5f9' : '#1e293b'}; color: ${theme.palette.primary.main}; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}; border-radius: 4px; }
      `}</style>
    </aside>
  );
};

export default DynamicSidebar;
