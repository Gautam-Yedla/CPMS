import { useState, useEffect, useMemo } from 'react';
import { Box, Typography, Paper, useTheme, Button, Avatar, Chip, TextField, InputAdornment, LinearProgress, CircularProgress } from '@mui/material';
import { ParkingCircle, Plus, Search, Car, AlertTriangle, Key } from 'lucide-react';
import { api } from '@utils/services/api';
import { toast } from 'react-toastify';

export default function ParkingManagementPage() {
  const theme = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [zones, setZones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchZones = async () => {
    try {
      setLoading(true);
      const data = await api.fetchMLStatus();
      if (data && data.zones) {
        setZones(data.zones);
      }
    } catch (err) {
      console.error('Failed to fetch zones:', err);
      toast.error('Failed to load parking zones');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchZones();
    // Poll every 10 seconds to keep live
    const interval = setInterval(fetchZones, 10000);
    return () => clearInterval(interval);
  }, []);

  const systemStats = useMemo(() => {
    const capacity = zones.reduce((acc, z) => acc + z.capacity, 0);
    const occupied = zones.reduce((acc, z) => acc + z.occupancy, 0);
    const ratio = capacity > 0 ? Math.round((occupied / capacity) * 100) : 0;
    return { capacity, occupied, ratio };
  }, [zones]);

  return (
    <Box p={2} minHeight="calc(100vh - 100px)" display="flex" flexDirection="column">
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
        <div>
          <Typography fontWeight="700" sx={{ fontSize: '1.875rem', color: theme.palette.text.primary, mb: 0.5 }}>
            Parking Infrastructure
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage lots, monitor capacity, and oversee active permits.
          </Typography>
        </div>
        <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
          <Paper 
            elevation={0} 
            sx={{ 
              px: 2, 
              py: 0.75, 
              borderRadius: '12px',
              border: `1px solid ${theme.palette.divider}`,
              background: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0,0,0,0.01)',
              backdropFilter: 'blur(10px)',
              width: '280px'
            }}
          >
            <TextField 
              variant="standard" 
              placeholder="Search zones..." 
              fullWidth 
              InputProps={{ 
                disableUnderline: true, 
                style: { fontSize: '0.95rem' },
                startAdornment: <InputAdornment position="start"><Search size={18} color={theme.palette.text.secondary} /></InputAdornment>
              }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </Paper>
          <Button 
            variant="contained" 
            startIcon={<Plus size={20} />}
            sx={{ borderRadius: '12px', boxShadow: `0 8px 16px ${theme.palette.primary.main}40`, px: 3, height: '42px' }}
          >
            New Zone
          </Button>
        </Box>
      </Box>

      {/* KPI Row */}
      {loading && zones.length === 0 ? (
        <Box display="flex" justifyContent="center" py={4}><CircularProgress /></Box>
      ) : (
        <>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 3, mb: 4 }}>
            {[
              { label: 'Total Capacity', value: systemStats.capacity.toString(), sub: 'Spots System Wide', icon: <ParkingCircle size={24} /> },
              { label: 'Currently Occupied', value: systemStats.occupied.toString(), sub: `${systemStats.ratio}% Full`, icon: <Car size={24} /> },
              { label: 'Active Permits', value: '450+', sub: 'Valid passes', icon: <Key size={24} /> }
            ].map((stat, idx) => (
              <Box key={idx}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    borderRadius: '16px',
                    border: `1px solid ${theme.palette.divider}`,
                    background: theme.palette.mode === 'dark' ? 'linear-gradient(145deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)' : 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                  }}
                >
                  <Avatar sx={{ bgcolor: `${theme.palette.primary.main}15`, color: theme.palette.primary.main, width: 56, height: 56 }}>
                    {stat.icon}
                  </Avatar>
                  <Box>
                    <Typography color="text.secondary" variant="body2" fontWeight="600" textTransform="uppercase" letterSpacing={1}>{stat.label}</Typography>
                    <Typography variant="h4" fontWeight="800" color="text.primary">{stat.value}</Typography>
                    <Typography variant="caption" color="text.secondary">{stat.sub}</Typography>
                  </Box>
                </Paper>
              </Box>
            ))}
          </Box>

          {/* Zones Masonry */}
          <Typography variant="h6" fontWeight="700" mb={2}>Active Parking Zones</Typography>
          <Box 
            sx={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
              gap: 3 
            }}
          >
            {zones.filter(z => z.name.toLowerCase().includes(searchTerm.toLowerCase())).map((zone, i) => {
              const usagePercent = zone.capacity > 0 ? Math.round((zone.occupancy / zone.capacity) * 100) : 0;
              const colorPool = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
              const zoneColor = colorPool[i % colorPool.length];
              const isCritical = usagePercent >= 90;

              return (
                <Paper
                  key={zone.id}
                  elevation={0}
                  sx={{
                    p: 3,
                    borderRadius: '16px',
                    border: `1px solid ${theme.palette.divider}`,
                    borderTop: `4px solid ${isCritical ? theme.palette.error.main : zoneColor}`,
                    background: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.01)' : '#ffffff',
                    transition: 'transform 0.2s',
                    '&:hover': { transform: 'translateY(-4px)', boxShadow: `0 12px 24px ${zoneColor}20` }
                  }}
                >
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                    <Typography variant="h6" fontWeight="700">{zone.name}</Typography>
                    <Chip 
                      label={isCritical ? 'Critical' : 'Active'} 
                      size="small" 
                      sx={{ 
                        fontWeight: 700,
                        bgcolor: isCritical ? `${theme.palette.error.main}20` : `${zoneColor}20`,
                        color: isCritical ? theme.palette.error.main : zoneColor,
                        borderRadius: '8px'
                      }} 
                    />
                  </Box>
                  
                  <Box display="flex" justifyContent="space-between" alignItems="flex-end" mb={1}>
                    <Typography variant="body2" color="text.secondary" fontWeight="600">Capacity Usage</Typography>
                    <Typography variant="body2" fontWeight="700" color={isCritical ? 'error.main' : 'text.primary'}>
                      {zone.occupancy} / {zone.capacity}
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={usagePercent} 
                    sx={{ 
                      height: 8, 
                      borderRadius: 4, 
                      bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                      '& .MuiLinearProgress-bar': { bgcolor: isCritical ? theme.palette.error.main : zoneColor }
                    }} 
                  />
                  
                  {isCritical && (
                    <Box display="flex" alignItems="center" gap={1} mt={2} color="error.main">
                      <AlertTriangle size={16} />
                      <Typography variant="caption" fontWeight="600">Nearing maximum capacity</Typography>
                    </Box>
                  )}
                </Paper>
              )
            })}
          </Box>
        </>
      )}
    </Box>
  );
}
