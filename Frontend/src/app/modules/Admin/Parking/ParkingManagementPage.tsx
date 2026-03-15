import { useState } from 'react';
import { Box, Typography, Paper, useTheme, Button, Avatar, Chip, TextField, InputAdornment, LinearProgress } from '@mui/material';
import { ParkingCircle, Plus, Search, Car, AlertTriangle, Key } from 'lucide-react';

const MOCK_ZONES = [
  { id: 1, name: 'Zone A - Faculty', capacity: 120, occupied: 98, status: 'Active', color: '#3b82f6' },
  { id: 2, name: 'Zone B - Students', capacity: 350, occupied: 342, status: 'Critical', color: '#ef4444' },
  { id: 3, name: 'Zone C - Visitor', capacity: 50, occupied: 15, status: 'Active', color: '#10b981' },
  { id: 4, name: 'Lot D - Overflow', capacity: 200, occupied: 0, status: 'Closed', color: '#64748b' },
];

export default function ParkingManagementPage() {
  const theme = useTheme();
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <Box p={2} minHeight="calc(100vh - 100px)" display="flex" flexDirection="column">
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <div>
          <Typography fontWeight="700" sx={{ fontSize: '1.875rem', color: theme.palette.text.primary, mb: 0.5 }}>
            Parking Infrastructure
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage lots, monitor capacity, and oversee active permits.
          </Typography>
        </div>
        <Box display="flex" gap={2} alignItems="center">
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
              placeholder="Search zones or permits..." 
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
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 3, mb: 4 }}>
        {[
          { label: 'Total Capacity', value: '720', sub: 'Spots System Wide', icon: <ParkingCircle size={24} /> },
          { label: 'Currently Occupied', value: '455', sub: '63% Full', icon: <Car size={24} /> },
          { label: 'Active Permits', value: '1,892', sub: 'Valid passes', icon: <Key size={24} /> }
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
        {MOCK_ZONES.filter(z => z.name.toLowerCase().includes(searchTerm.toLowerCase())).map((zone) => {
          const usagePercent = Math.round((zone.occupied / zone.capacity) * 100) || 0;
          return (
            <Paper
              key={zone.id}
              elevation={0}
              sx={{
                p: 3,
                borderRadius: '16px',
                border: `1px solid ${theme.palette.divider}`,
                borderTop: `4px solid ${zone.color}`,
                background: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.01)' : '#ffffff',
                transition: 'transform 0.2s',
                '&:hover': { transform: 'translateY(-4px)', boxShadow: `0 12px 24px ${zone.color}20` }
              }}
            >
              <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                <Typography variant="h6" fontWeight="700">{zone.name}</Typography>
                <Chip 
                  label={zone.status} 
                  size="small" 
                  sx={{ 
                    fontWeight: 700,
                    bgcolor: `${zone.color}20`,
                    color: zone.color,
                    borderRadius: '8px'
                  }} 
                />
              </Box>
              
              <Box display="flex" justifyContent="space-between" alignItems="flex-end" mb={1}>
                <Typography variant="body2" color="text.secondary" fontWeight="600">Capacity Usage</Typography>
                <Typography variant="body2" fontWeight="700" color={usagePercent > 90 ? 'error.main' : 'text.primary'}>
                  {zone.occupied} / {zone.capacity}
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={usagePercent} 
                sx={{ 
                  height: 8, 
                  borderRadius: 4, 
                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                  '& .MuiLinearProgress-bar': { bgcolor: usagePercent > 90 ? theme.palette.error.main : zone.color }
                }} 
              />
              
              {usagePercent > 90 && (
                <Box display="flex" alignItems="center" gap={1} mt={2} color="error.main">
                  <AlertTriangle size={16} />
                  <Typography variant="caption" fontWeight="600">Nearing maximum capacity</Typography>
                </Box>
              )}
            </Paper>
          )
        })}
      </Box>
    </Box>
  );
}
