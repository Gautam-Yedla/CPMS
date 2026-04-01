import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, List, ListItem, Avatar, Chip, CircularProgress, useTheme } from '@mui/material';
import { Bell, ShieldAlert, FileText, Info, Camera, CheckCircle } from 'lucide-react';
import { api } from '@app/utils/services/api';
import toast from 'react-hot-toast';

interface Profile {
  full_name: string;
  department: string;
}

interface Notification {
  id: string;
  title: string;
  description: string;
  type: string;
  is_read: boolean;
  created_at: string;
  profiles?: Profile;
}

const AdminNotificationsPage: React.FC = () => {
  const theme = useTheme();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAllNotifications = async () => {
    try {
      setLoading(true);
      const data = await api.fetchAllNotifications();
      setNotifications(data);
    } catch (error) {
      toast.error('Failed to load system-wide notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllNotifications();
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case 'security': return <ShieldAlert size={20} />;
      case 'permit': return <FileText size={20} />;
      case 'system': return <Info size={20} />;
      case 'camera': return <Camera size={20} />;
      default: return <Bell size={20} />;
    }
  };

  const getColor = (type: string) => {
    switch (type) {
      case 'security': return theme.palette.error.main;
      case 'permit': return theme.palette.warning.main;
      case 'system': return theme.palette.info.main;
      case 'camera': return theme.palette.secondary.main;
      default: return theme.palette.primary.main;
    }
  };

  return (
    <Box p={3}>
      <Box mb={4}>
        <Typography variant="h4" fontWeight="800" mb={1}>System Notifications Overview</Typography>
        <Typography color="text.secondary">Monitor all alerts and notifications dispatched across the entire system network.</Typography>
      </Box>

      <Paper elevation={0} sx={{ borderRadius: 4, border: `1px solid ${theme.palette.divider}`, bgcolor: theme.palette.background.paper }}>
        {loading ? (
          <Box display="flex" justifyContent="center" py={10}>
            <CircularProgress />
          </Box>
        ) : notifications.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 10, opacity: 0.5 }}>
            <Bell size={48} style={{ marginBottom: 16 }} />
            <Typography variant="h6">No System Notifications Found</Typography>
          </Box>
        ) : (
          <List disablePadding>
            {notifications.map((notif, index) => {
              const color = getColor(notif.type);
              const isLast = index === notifications.length - 1;
              return (
                <ListItem 
                  key={notif.id}
                  sx={{ 
                    px: 4, 
                    py: 3, 
                    borderBottom: isLast ? 'none' : `1px solid ${theme.palette.divider}`,
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 3,
                    bgcolor: notif.is_read ? 'transparent' : `${color}05`
                  }}
                >
                  <Avatar sx={{ bgcolor: `${color}15`, color: color, width: 48, height: 48 }}>
                    {getIcon(notif.type)}
                  </Avatar>
                  <Box flex={1}>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={0.5}>
                      <Typography variant="subtitle1" fontWeight={notif.is_read ? 600 : 800}>
                        {notif.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>
                        {new Date(notif.created_at).toLocaleString()}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" mb={1.5}>
                      {notif.description}
                    </Typography>
                    {notif.profiles && (
                      <Box display="flex" alignItems="center" gap={1}>
                        <Chip size="small" label={`User: ${notif.profiles.full_name}`} sx={{ fontSize: '0.7rem', fontWeight: 700 }} />
                        {notif.profiles.department && (
                          <Chip size="small" variant="outlined" label={notif.profiles.department} sx={{ fontSize: '0.7rem', fontWeight: 600 }} />
                        )}
                        {notif.is_read ? (
                          <Chip icon={<CheckCircle size={12} />} size="small" label="Read" color="default" sx={{ fontSize: '0.7rem' }} />
                        ) : (
                          <Chip size="small" label="Unread" color="warning" sx={{ fontSize: '0.7rem', fontWeight: 700 }} />
                        )}
                      </Box>
                    )}
                  </Box>
                </ListItem>
              );
            })}
          </List>
        )}
      </Paper>
    </Box>
  );
};

export default AdminNotificationsPage;
