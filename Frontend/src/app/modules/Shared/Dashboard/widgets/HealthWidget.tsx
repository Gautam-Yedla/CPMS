import React, { useEffect, useState } from 'react';
import { useTheme } from '@mui/material/styles';
import { Box, Typography, CircularProgress } from '@mui/material';
import { Cpu, Activity } from 'lucide-react';
import { api } from '@services/api';

const HealthWidget: React.FC = () => {
  const theme = useTheme();
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const data = await api.fetchSystemHealth();
        setHealth(data);
      } catch (err) {
        console.error('Failed to fetch health for widget:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHealth();
    const interval = setInterval(fetchHealth, 30000); // 30s refresh
    return () => clearInterval(interval);
  }, []);

  if (loading) return <CircularProgress size={24} />;

  const stats = [
    { label: 'ML Service', value: health?.mlService || 'Offline', icon: <Cpu size={20} />, color: health?.mlService === 'Online' ? theme.palette.success.main : theme.palette.error.main },
    { label: 'System Status', value: health?.status || 'Unknown', icon: <Activity size={20} />, color: health?.status === 'Healthy' ? theme.palette.success.main : theme.palette.warning.main },
  ];

  return (
    <Box sx={{ p: 3, bgcolor: 'background.paper', borderRadius: '16px', border: `1px solid ${theme.palette.divider}` }}>
      <Typography variant="h6" fontWeight={700} mb={2}>System Pulse</Typography>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        {stats.map((stat, i) => (
          <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ p: 1, borderRadius: '8px', bgcolor: `${stat.color}15`, color: stat.color }}>
                  {stat.icon}
              </Box>
              <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>{stat.label}</Typography>
                  <Typography variant="body2" fontWeight={700}>{stat.value}</Typography>
              </Box>
          </Box>
        ))}
      </div>
    </Box>
  );
};

export default HealthWidget;
