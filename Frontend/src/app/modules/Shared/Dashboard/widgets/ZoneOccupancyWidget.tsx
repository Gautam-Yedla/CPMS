import React, { useEffect, useState } from 'react';
import { useTheme } from '@mui/material/styles';
import { Box, Typography, CircularProgress, Chip } from '@mui/material';
import { Navigation, MapPin } from 'lucide-react';
import { api } from '@services/api';

const ZoneOccupancyWidget: React.FC = () => {
  const theme = useTheme();
  const [zones, setZones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchZones = async () => {
      try {
        const data = await api.fetchZoneOccupancy();
        setZones(data || []);
      } catch (err) {
        console.error('Failed to fetch zones for widget:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchZones();
  }, []);

  if (loading) return <CircularProgress size={24} />;

  return (
    <Box sx={{ p: 3, bgcolor: 'background.paper', borderRadius: '16px', border: `1px solid ${theme.palette.divider}`, minHeight: '200px' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6" fontWeight={700}>Zone Monitoring</Typography>
        <Navigation size={20} color={theme.palette.primary.main} />
      </Box>
      
      {zones.length === 0 ? (
          <Typography variant="body2" color="text.secondary">No active detection data for faculty zones.</Typography>
      ) : (
          <Box sx={{ display: 'grid', gap: 2 }}>
              {zones.map((zone, i) => (
                  <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <MapPin size={16} />
                          <Typography variant="body2">{zone.cameras?.name || 'Unknown Zone'}</Typography>
                      </Box>
                      <Chip 
                        label={`${zone.metadata?.count || 0} Vehicles`} 
                        size="small" 
                        color={zone.metadata?.count > 5 ? 'warning' : 'success'} 
                        variant="outlined" 
                      />
                  </Box>
              ))}
          </Box>
      )}
    </Box>
  );
};

export default ZoneOccupancyWidget;
