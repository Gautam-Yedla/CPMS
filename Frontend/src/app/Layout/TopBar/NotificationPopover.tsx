import React from 'react';
import { useTheme } from '@mui/material/styles';
import { 
  Bell, 
  CheckCheck, 
  AlertTriangle, 
  Info, 
  ChevronRight,
  Clock
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface Notification {
  id: string;
  title: string;
  description: string;
  created_at: string;
  type: 'permit' | 'security' | 'system' | 'general';
  is_read: boolean;
}

interface NotificationPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
  loading: boolean;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
}

const NotificationPopover: React.FC<NotificationPopoverProps> = ({ 
  isOpen, 
  onClose, 
  notifications, 
  loading,
  onMarkRead,
  onMarkAllRead
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (!isOpen) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case 'permit': return <CheckCheck size={18} color={theme.palette.success.main} />;
      case 'security': return <AlertTriangle size={18} color={theme.palette.error.main} />;
      case 'system': return <Info size={18} color={theme.palette.info.main} />;
      default: return <Bell size={18} color={theme.palette.primary.main} />;
    }
  };

  const getIconBg = (type: string) => {
    switch (type) {
      case 'permit': return theme.palette.success.main + '10';
      case 'security': return theme.palette.error.main + '10';
      case 'system': return theme.palette.info.main + '10';
      default: return theme.palette.primary.main + '10';
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        onClick={onClose}
        style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          zIndex: 999 
        }} 
      />

      <div style={{
        position: 'absolute',
        top: '100%',
        right: 0,
        width: '380px',
        backgroundColor: theme.palette.background.paper,
        borderRadius: '20px',
        marginTop: '10px',
        boxShadow: isDark ? '0 10px 30px rgba(0,0,0,0.5)' : '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        border: isDark ? `1px solid ${theme.palette.divider}` : '1px solid rgba(0,0,0,0.05)',
        zIndex: 1000,
        overflow: 'hidden',
        animation: 'popIn 0.2s ease-out'
      }}>
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: `1px solid ${theme.palette.divider}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)'
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: theme.palette.text.primary }}>Notifications</h3>
            <span style={{ fontSize: '0.75rem', color: theme.palette.text.secondary }}>You have {unreadCount} unread messages</span>
          </div>
          {unreadCount > 0 && (
            <button 
              onClick={onMarkAllRead}
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: theme.palette.primary.main,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px 8px',
                borderRadius: '6px'
              }} className="hover-btn"
            >
              Mark all read
            </button>
          )}
        </div>

        <div style={{ maxHeight: '420px', overflowY: 'auto' }}>
          {loading ? (
             <div style={{ padding: '2rem', textAlign: 'center', color: theme.palette.text.secondary }}>Loading...</div>
          ) : notifications.length === 0 ? (
             <div style={{ padding: '2rem', textAlign: 'center', color: theme.palette.text.secondary }}>No notifications</div>
          ) : (
            notifications.map((notif) => (
              <div 
                key={notif.id}
                onClick={() => onMarkRead(notif.id)}
                style={{
                  padding: '1.25rem 1.5rem',
                  borderBottom: `1px solid ${theme.palette.divider}`,
                  display: 'flex',
                  gap: '1rem',
                  cursor: 'pointer',
                  backgroundColor: !notif.is_read ? (isDark ? 'rgba(99, 102, 241, 0.05)' : 'rgba(99, 102, 241, 0.03)') : 'transparent',
                  transition: 'background-color 0.2s'
                }}
                className="notif-item"
              >
                <div style={{ 
                  flexShrink: 0,
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  backgroundColor: getIconBg(notif.type),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {getIcon(notif.type)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.25rem' }}>
                    <h4 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 700, color: theme.palette.text.primary, lineHeight: 1.4 }}>{notif.title}</h4>
                    {!notif.is_read && (
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: theme.palette.primary.main, marginTop: '5px' }} />
                    )}
                  </div>
                  <p style={{ margin: '0 0 0.5rem', fontSize: '0.8125rem', color: theme.palette.text.secondary, lineHeight: 1.5 }}>{notif.description}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.75rem', color: theme.palette.text.disabled }}>
                    <Clock size={12} />
                    {new Date(notif.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div style={{ padding: '1rem', textAlign: 'center', backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)' }}>
          <Link to="/student/notifications" onClick={onClose} style={{ textDecoration: 'none' }}>
            <button style={{
              fontSize: '0.875rem',
              fontWeight: 700,
              color: theme.palette.text.secondary,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              margin: '0 auto'
            }} className="hover-text-primary">
              View all notifications
              <ChevronRight size={16} />
            </button>
          </Link>
        </div>
      </div>

      <style>{`
        @keyframes popIn {
          from { opacity: 0; transform: translateY(-10px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .notif-item:hover { background-color: ${isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)'}; }
        .hover-text-primary:hover { color: ${theme.palette.primary.main} !important; }
      `}</style>
    </>
  );
};

export default NotificationPopover;
