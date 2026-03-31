import React, { useState, useEffect } from 'react';
import { useTheme } from '@mui/material/styles';
import { Box, Typography, useMediaQuery } from '@mui/material';
import { 
  Bell, 
  CheckCheck, 
  AlertTriangle, 
  Info, 
  Clock,
  CheckCircle,
  Zap
} from 'lucide-react';
import { api } from '@utils/services/api';
import Notification from '@shared/components/legacy/Notification';
import { supabase } from '@app/utils/lib/supabase';
import { useSelector } from 'react-redux';
import { IRootState } from '@app/appReducer';

const StudentNotificationsPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isSmallMobile = useMediaQuery('(max-width:400px)');
  const isTinyMobile = useMediaQuery('(max-width:340px)');
  const isDark = theme.palette.mode === 'dark';

  const { user } = useSelector((state: IRootState) => state.app.auth);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    loadNotifications();
    
    // Real-time listener
    if (user?.id) {
        const channel = supabase
            .channel(`user-notifications-${user.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${user.id}`
                },
                (payload) => {
                    setNotifications(prev => [payload.new, ...prev]);
                    setToast({ message: `New notification: ${payload.new.title}`, type: 'success' });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }
  }, [user?.id]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const data = await api.fetchNotifications();
      setNotifications(data);
    } catch (err) {
      console.error('Failed to load notifications', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
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
      setToast({ message: 'All notifications marked as read', type: 'success' });
    } catch (err) {
      setToast({ message: 'Failed to mark all as read', type: 'error' });
    }
  };

  const filteredNotifications = filter === 'all' 
    ? notifications 
    : notifications.filter(n => !n.is_read);

  const getIcon = (type: string) => {
    switch (type) {
      case 'permit': return <CheckCheck size={isMobile ? 18 : 20} color={theme.palette.success.main} />;
      case 'security': return <AlertTriangle size={isMobile ? 18 : 20} color={theme.palette.error.main} />;
      case 'system': return <Info size={isMobile ? 18 : 20} color={theme.palette.info.main} />;
      default: return <Bell size={isMobile ? 18 : 20} color={theme.palette.primary.main} />;
    }
  };

  const getIconBg = (type: string) => {
    switch (type) {
      case 'permit': return theme.palette.success.main + '15';
      case 'security': return theme.palette.error.main + '15';
      case 'system': return theme.palette.info.main + '15';
      default: return theme.palette.primary.main + '15';
    }
  };

  return (
    <>
      {toast && (
        <Notification 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: isTinyMobile ? '0 0.25rem' : '0' }}>
        <header style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: isMobile ? 'flex-start' : 'center', 
          marginBottom: isMobile ? '1.5rem' : '2.5rem',
          flexDirection: 'row',
          gap: '1rem'
        }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <Box display="flex" alignItems="center" gap={1} mb={0.25}>
                <Zap size={isMobile ? 20 : 24} color={theme.palette.warning.main} />
            <Typography fontWeight="900" sx={{ fontSize: isTinyMobile ? '1.75rem' : isSmallMobile ? '2.25rem' : '3.25rem', letterSpacing: '-0.03em', lineHeight: 1.1, color: theme.palette.text.primary, mb: 1 }}>
              Notifications
            </Typography>
            </Box>
            <p style={{ color: theme.palette.text.secondary, fontSize: '0.8125rem' }}>Stay updated with real-time alerts.</p>
          </div>
          <button 
            onClick={handleMarkAllRead}
            disabled={notifications.every(n => n.is_read)}
            style={{
              backgroundColor: theme.palette.background.paper,
              color: theme.palette.text.primary,
              border: `1.5px solid ${theme.palette.divider}`,
              padding: isMobile ? '0.75rem' : '0.75rem 1.25rem',
              borderRadius: isMobile ? '50%' : '14px',
              fontWeight: 700,
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              cursor: notifications.every(n => n.is_read) ? 'default' : 'pointer',
              opacity: notifications.every(n => n.is_read) ? 0.5 : 1,
              transition: 'all 0.2s',
              width: isMobile ? '44px' : 'auto',
              height: isMobile ? '44px' : 'auto',
              flexShrink: 0
            }}
            title="Mark all read"
          >
            <CheckCircle size={isMobile ? 22 : 18} />
            {!isMobile && 'Mark all read'}
          </button>
        </header>

        {/* Filter Tabs */}
        <div style={{ 
          display: 'flex', 
          gap: isMobile ? '0.5rem' : '1rem', 
          marginBottom: isMobile ? '1.5rem' : '2rem',
          borderBottom: `1px solid ${theme.palette.divider}`,
          overflowX: 'auto',
          scrollbarWidth: 'none'
        }}>
          <button 
            onClick={() => setFilter('all')}
            style={{
              padding: '0.75rem 1rem',
              background: 'none',
              border: 'none',
              borderBottom: `2px solid ${filter === 'all' ? theme.palette.primary.main : 'transparent'}`,
              color: filter === 'all' ? theme.palette.primary.main : theme.palette.text.secondary,
              fontWeight: 700,
              cursor: 'pointer',
              marginBottom: '-1px',
              fontSize: isMobile ? '0.875rem' : '1rem'
            }}
          >
            All
          </button>
          <button 
            onClick={() => setFilter('unread')}
            style={{
              padding: '0.75rem 1rem',
              background: 'none',
              border: 'none',
              borderBottom: `2px solid ${filter === 'unread' ? theme.palette.primary.main : 'transparent'}`,
              color: filter === 'unread' ? theme.palette.primary.main : theme.palette.text.secondary,
              fontWeight: 700,
              cursor: 'pointer',
              marginBottom: '-1px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: isMobile ? '0.875rem' : '1rem'
            }}
          >
            Unread
            {notifications.some(n => !n.is_read) && (
              <span style={{ 
                backgroundColor: theme.palette.primary.main, 
                color: 'white', 
                fontSize: '0.7rem', 
                padding: '2px 6px', 
                borderRadius: '8px',
                fontWeight: 800
              }}>
                {notifications.filter(n => !n.is_read).length}
              </span>
            )}
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: theme.palette.text.secondary }}>Loading notifications...</div>
        ) : filteredNotifications.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: isMobile ? '3rem 1.5rem' : '4rem 2rem', 
            backgroundColor: theme.palette.background.paper,
            borderRadius: '24px',
            border: isDark ? `1px solid ${theme.palette.divider}` : `1px dashed ${theme.palette.divider}`
          }}>
            <div style={{ 
              width: '60px', 
              height: '60px', 
              borderRadius: '50%', 
              backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              margin: '0 auto 1.5rem',
              color: theme.palette.text.secondary
            }}>
              <Bell size={24} />
            </div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 800, marginBottom: '0.5rem' }}>All caught up!</h3>
            <p style={{ color: theme.palette.text.secondary, fontSize: '0.875rem' }}>You have no {filter === 'unread' ? 'unread' : ''} messages.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {filteredNotifications.map((notif) => (
              <div 
                key={notif.id}
                onClick={!notif.is_read ? (e) => handleMarkRead(notif.id, e) : undefined}
                style={{
                  backgroundColor: theme.palette.background.paper,
                  padding: isMobile ? '1rem' : '1.5rem',
                  borderRadius: '24px',
                  display: 'flex',
                  gap: isMobile ? '1rem' : '1.5rem',
                  border: isDark ? `1px solid ${theme.palette.divider}` : 'none',
                  boxShadow: !isDark ? '0 10px 15px -3px rgba(0,0,0,0.03)' : 'none',
                  position: 'relative',
                  cursor: !notif.is_read ? 'pointer' : 'default',
                  opacity: notif.is_read ? 0.7 : 1,
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  minWidth: 0
                }}
                className={!notif.is_read ? 'hover-lift' : ''}
              >
                {!notif.is_read && (
                  <div style={{
                    position: 'absolute',
                    top: isMobile ? '1rem' : '1.5rem',
                    right: isMobile ? '1rem' : '1.5rem',
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: theme.palette.primary.main,
                    boxShadow: `0 0 10px ${theme.palette.primary.main}`
                  }} />
                )}

                <div style={{
                  flexShrink: 0,
                  width: isMobile ? '44px' : '56px',
                  height: isMobile ? '44px' : '56px',
                  borderRadius: '16px',
                  backgroundColor: getIconBg(notif.type),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {getIcon(notif.type)}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', flexDirection: isSmallMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isSmallMobile ? 'flex-start' : 'center', marginBottom: '0.25rem', gap: '0.5rem' }}>
                    <h3 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 800, color: theme.palette.text.primary, lineHeight: 1.3 }}>{notif.title}</h3>
                    <span style={{ fontSize: '0.675rem', color: theme.palette.text.disabled, display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 600 }}>
                      <Clock size={12} />
                      {new Date(notif.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p style={{ margin: 0, color: theme.palette.text.secondary, fontSize: '0.8125rem', lineHeight: 1.5 }}>{notif.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        .hover-lift:hover { transform: translateY(-4px); }
      `}</style>
    </>
  );
};

export default StudentNotificationsPage;
