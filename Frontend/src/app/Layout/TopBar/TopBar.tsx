import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useTheme } from '@mui/material/styles';
import { 
  Bell, 
  User, 
  LogOut, 
  Car, 
  Menu, 
  Sun, 
  Moon, 
  ChevronDown, 
  Settings,
  UserCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { IRootState } from '@app/appReducer';
import { sessionLogout, setThemeMode } from '@modules/Auth/authActions';
import NotificationPopover from './NotificationPopover';
import { api } from '@utils/services/api';

interface TopBarProps {
  onMenuClick: () => void;
}

const TopBar: React.FC<TopBarProps> = ({ onMenuClick }) => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const { user, theme: themeMode } = useSelector((state: IRootState) => state.app.auth);
  const [notificationAnchorEl, setNotificationAnchorEl] = useState<HTMLElement | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  React.useEffect(() => {
    if (user?.id) {
      loadNotifications();
    }
  }, [user?.id]);

  const loadNotifications = async () => {
    try {
      setLoadingNotifications(true);
      const data = await api.fetchNotifications();
      setNotifications(data);
    } catch (err) {
      console.error('Failed to load notifications', err);
    } finally {
      setLoadingNotifications(false);
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await api.markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (err) {
      console.error('Failed to mark read', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error('Failed to mark all read', err);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleLogout = () => {
    dispatch(sessionLogout());
  };

  const toggleTheme = () => {
    dispatch(setThemeMode(themeMode === 'light' ? 'dark' : 'light'));
  };

  return (
    <nav style={{ 
      backgroundColor: theme.palette.background.paper, 
      padding: '0.75rem 1.5rem', 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center',
      boxShadow: themeMode === 'light' ? '0 1px 2px 0 rgba(0, 0, 0, 0.05)' : '0 1px 4px 0 rgba(0, 0, 0, 0.3)',
      borderBottom: themeMode === 'light' ? 'none' : `1px solid ${theme.palette.divider}`,
      position: 'sticky',
      top: 0,
      zIndex: 100,
      height: '64px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button 
          onClick={onMenuClick}
          style={{ 
            background: 'none', 
            border: 'none', 
            color: '#64748b', 
            cursor: 'pointer',
            padding: '8px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          className="hover-bg"
        >
          <Menu size={20} />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ 
            backgroundColor: theme.palette.primary.main, 
            width: '32px', 
            height: '32px', 
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white'
          }}>
            <Car size={18} />
          </div>
          <span style={{ fontWeight: 700, fontSize: '1.125rem', color: theme.palette.text.primary, letterSpacing: '-0.025em' }}>CPMS</span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        <button 
          onClick={toggleTheme}
          style={{ 
            background: 'none', 
            border: 'none', 
            color: theme.palette.text.secondary, 
            cursor: 'pointer',
            padding: '8px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }} 
          className="hover-bg"
          title={`Switch to ${themeMode === 'light' ? 'dark' : 'light'} mode`}
        >
          {themeMode === 'light' ? <Moon size={20} /> : <Sun size={20} />}
        </button>

        <div style={{ position: 'relative' }}>
          <button 
            onClick={(e) => setNotificationAnchorEl(e.currentTarget)}
            style={{ 
              background: 'none', 
              border: 'none', 
              color: Boolean(notificationAnchorEl) ? theme.palette.primary.main : theme.palette.text.secondary, 
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '8px',
              position: 'relative'
            }} 
            className="hover-bg"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <div style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: theme.palette.error.main,
                border: `2px solid ${theme.palette.background.paper}`
              }} />
            )}
          </button>
          <NotificationPopover 
            anchorEl={notificationAnchorEl} 
            onClose={() => setNotificationAnchorEl(null)}
            notifications={notifications}
            loading={loadingNotifications}
            onMarkRead={handleMarkRead}
            onMarkAllRead={handleMarkAllRead}
            basePath={user?.role === 'admin' ? '/admin' : '/student'}
          />
        </div>
        
        <div style={{ 
          height: '32px', 
          width: '1px', 
          backgroundColor: theme.palette.divider 
        }}></div>

        <div style={{ position: 'relative' }}>
          <div 
            onClick={() => setShowUserMenu(!showUserMenu)}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.75rem',
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: '12px',
              transition: 'all 0.2s'
            }}
            className="hover-bg"
          >
            <div style={{ textAlign: 'right', display: 'none', md: 'block' } as any} className="md-block">
              <div style={{ fontWeight: 600, fontSize: '0.875rem', color: theme.palette.text.primary }}>{user?.full_name}</div>
              <div style={{ fontSize: '0.75rem', color: theme.palette.text.secondary, textTransform: 'capitalize' }}>{user?.role}</div>
            </div>
            <div style={{ 
              width: '36px', 
              height: '36px', 
              borderRadius: '10px', 
              backgroundColor: theme.palette.primary.main + '15',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: theme.palette.primary.main,
              border: `1px solid ${theme.palette.primary.main}20`
            }}>
              <User size={20} />
            </div>
            <ChevronDown size={16} color={theme.palette.text.secondary} style={{ transform: showUserMenu ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </div>

          {showUserMenu && (
            <>
              <div 
                onClick={() => setShowUserMenu(false)}
                style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999 }} 
              />
              <div style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                width: '240px',
                backgroundColor: theme.palette.background.paper,
                borderRadius: '16px',
                marginTop: '10px',
                boxShadow: themeMode === 'dark' ? '0 10px 30px rgba(0,0,0,0.5)' : '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                border: `1px solid ${theme.palette.divider}`,
                zIndex: 1000,
                overflow: 'hidden',
                animation: 'popIn 0.2s ease-out'
              }}>
                <div style={{ padding: '0.5rem' }}>
                  <Link 
                    to={user?.role === 'admin' ? "/admin/profile" : "/student/profile"}
                    onClick={() => setShowUserMenu(false)}
                    style={{ ...menuItemStyle(theme), textDecoration: 'none' }}
                  >
                    <UserCircle size={18} />
                    My Profile
                  </Link>
                  <Link 
                    to={user?.role === 'admin' ? "/admin/settings" : "/student/settings"}
                    onClick={() => setShowUserMenu(false)}
                    style={{ ...menuItemStyle(theme), textDecoration: 'none' }}
                  >
                    <Settings size={18} />
                    Settings
                  </Link>
                  <div style={{ height: '1px', backgroundColor: theme.palette.divider, margin: '4px 8px' }} />
                  <button 
                    onClick={handleLogout}
                    style={{ ...menuItemStyle(theme), color: '#ef4444' }}
                  >
                    <LogOut size={18} />
                    Logout
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      <style>{`
        .hover-bg:hover { background-color: ${themeMode === 'light' ? '#f1f5f9' : '#334155'}; }
        .hover-bg-red:hover { background-color: ${themeMode === 'light' ? '#fef2f2' : '#452121'}; }
        @media (max-width: 768px) {
          .md-block { display: none !important; }
        }
        @keyframes popIn {
          from { opacity: 0; transform: translateY(-10px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </nav>
  );
};

const menuItemStyle = (theme: any) => ({
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
  padding: '0.75rem 1rem',
  borderRadius: '10px',
  border: 'none',
  background: 'none',
  cursor: 'pointer',
  fontSize: '0.875rem',
  fontWeight: 600,
  color: theme.palette.text.primary,
  transition: 'all 0.2s',
  '&:hover': {
    backgroundColor: theme.palette.mode === 'light' ? '#f1f5f9' : '#334155'
  }
} as any);

export default TopBar;
