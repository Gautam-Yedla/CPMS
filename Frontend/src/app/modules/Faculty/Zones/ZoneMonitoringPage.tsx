import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, useTheme, Grid, CircularProgress, Chip } from '@mui/material';
import { Navigation, MapPin, Activity, CheckCircle, AlertTriangle } from 'lucide-react';
import { api } from '@utils/services/api';
import PermissionGuard from '@shared/components/PermissionGuard';
import { toast } from 'react-toastify';

interface ZoneStatus {
  id: string;
  name: string;
  capacity: number;
  occupancy: number;
  available: number;
}

const ZoneMonitoringPage: React.FC = () => {
  const theme = useTheme();
  const [zones, setZones] = useState<ZoneStatus[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchZones = async () => {
    try {
      const data = await api.fetchMLStatus();
      if (data && data.zones) {
        setZones(data.zones);
      }
    } catch (err) {
      console.error('Failed to fetch zones:', err);
      toast.error('Failed to connect to Zone Monitoring API');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchZones();
    const interval = setInterval(fetchZones, 5000); // Live poll
    return () => clearInterval(interval);
  }, []);

  return (
    <Box p={3} minHeight="calc(100vh - 100px)">
      <header style={{ marginBottom: '2rem' }}>
        <Typography variant="h4" fontWeight={800} color="text.primary" gutterBottom display="flex" alignItems="center" gap={1.5}>
          <Navigation size={28} color={theme.palette.primary.main} />
          Live Zone Monitoring
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Track real-time occupancy across designated campus parking areas.
        </Typography>
      </header>

      {loading && zones.length === 0 ? (
        <Box display="flex" justifyContent="center" alignItems="center" height="40vh">
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {zones.map((zone) => {
            const percent = (zone.occupancy / zone.capacity) * 100;
            let statusPhrase = 'Available';
            let statusColor = theme.palette.success.main;
            let Icon = CheckCircle;

            if (percent >= 100) {
              statusPhrase = 'FULL';
              statusColor = theme.palette.error.main;
              Icon = AlertTriangle;
            } else if (percent >= 80) {
              statusPhrase = 'Almost Full';
              statusColor = theme.palette.warning.main;
              Icon = Activity;
            }

            return (
              <Grid size={{ xs: 12, md: 6, lg: 4 }} key={zone.id}>
                <Paper 
                  elevation={0}
                  sx={{
                    p: 3,
                    borderRadius: '16px',
                    border: `1px solid ${theme.palette.divider}`,
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'transform 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 12px 24px -10px rgba(0,0,0,0.1)'
                    }
                  }}
                >
                  <Box sx={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '4px', backgroundColor: statusColor }} />
                  
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                    <Box display="flex" alignItems="center" gap={1.5}>
                      <Box sx={{ p: 1.2, borderRadius: '12px', background: `${theme.palette.primary.main}1A`, color: theme.palette.primary.main }}>
                        <MapPin size={22} />
                      </Box>
                      <Box>
                        <Typography variant="h6" fontWeight={700} lineHeight={1.2}>{zone.name}</Typography>
                        <Typography variant="caption" color="text.secondary" fontWeight={600}>Zone ID: {zone.id}</Typography>
                      </Box>
                    </Box>
                    <Chip 
                      label={statusPhrase} 
                      size="small" 
                      icon={<Icon size={14} />}
                      sx={{ 
                        fontWeight: 700, 
                        backgroundColor: `${statusColor}1A`, 
                        color: statusColor,
                        border: `1px solid ${statusColor}40`,
                        '& .MuiChip-icon': { color: statusColor }
                      }} 
                    />
                  </Box>

                  <Box my={3}>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="body2" fontWeight={600} color="text.secondary">Occupancy</Typography>
                      <Typography variant="body2" fontWeight={800}>{zone.occupancy} / {zone.capacity}</Typography>
                    </Box>
                    <Box sx={{ width: '100%', height: '8px', backgroundColor: theme.palette.divider, borderRadius: '4px', overflow: 'hidden' }}>
                      <Box 
                        sx={{ 
                          width: `${Math.min(percent, 100)}%`, 
                          height: '100%', 
                          backgroundColor: statusColor,
                          transition: 'width 0.5s ease-in-out'
                        }} 
                      />
                    </Box>
                  </Box>

                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="h4" fontWeight={800} color={statusColor}>
                      {zone.available > 0 ? zone.available : 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" fontWeight={600} textTransform="uppercase">
                      Spots Available
                    </Typography>
                  </Box>
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Box>
  );
};

export default function PermissionWrappedZoneMonitoring() {
  return (
    <PermissionGuard permission="zones.faculty.view">
      <ZoneMonitoringPage />
    </PermissionGuard>
  );
}
