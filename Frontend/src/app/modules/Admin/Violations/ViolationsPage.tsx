import React, { useEffect, useState, useMemo } from 'react';
import { 
  Box, 
  Typography, 
  Paper,
  Chip,
  useTheme,
  Fade,
  TextField,
  InputAdornment
} from '@mui/material';
import { Search, AlertTriangle, CheckCircle, ShieldAlert, Car, TrendingUp, AlertOctagon } from 'lucide-react';
import { api } from '@utils/services/api';
import { toast } from 'react-toastify';

interface Violation {
  id: string;
  vehicle_number: string;
  violation_type: string;
  description: string;
  amount: number;
  status: string;
  violation_date: string;
}

const ViolationsPage: React.FC = () => {
  const theme = useTheme();
  const [violations, setViolations] = useState<Violation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchViolations = async () => {
    try {
      setLoading(true);
      const data = await api.fetchViolations();
      setViolations(data);
    } catch (error: any) {
      console.error('Error fetching violations:', error);
      toast.error('Failed to load violations data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchViolations();
  }, []);

  const stats = useMemo(() => {
    const unpaid = violations.filter(v => v.status === 'Unpaid');
    const todayStr = new Date().toDateString();
    const today = violations.filter(v => new Date(v.violation_date).toDateString() === todayStr);
    const severe = violations.filter(v => v.amount > 100);

    return {
      unpaidCount: unpaid.length,
      unpaidTotal: unpaid.reduce((acc, v) => acc + v.amount, 0),
      todayCount: today.length,
      severeCount: severe.length
    };
  }, [violations]);

  const filteredViolations = useMemo(() => {
    return violations
      .filter(v => 
        v.vehicle_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.violation_type.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => new Date(b.violation_date).getTime() - new Date(a.violation_date).getTime());
  }, [violations, searchTerm]);

  return (
    <Box p={2} minHeight="calc(100vh - 100px)" display="flex" flexDirection="column">
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <div>
          <Typography fontWeight="700" sx={{ fontSize: '1.875rem', color: theme.palette.text.primary, mb: 0.5 }}>
            System Infractions & Violations
          </Typography>
          <Typography variant="body1" color="text.secondary">Live monitoring of restricted access and parking violations</Typography>
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
              placeholder="Lookup plate or type..." 
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
        </Box>
      </Box>

      {/* Top KPI Cards */}
      <Box display="grid" gridTemplateColumns="repeat(auto-fit, minmax(250px, 1fr))" gap={3} mb={4}>
        {[
          { 
            title: 'Critical Unpaid', 
            val: stats.unpaidCount, 
            sub: `$${stats.unpaidTotal.toFixed(2)} pending recovery`, 
            icon: <AlertOctagon size={28} />, 
            color: theme.palette.error.main 
          },
          { 
            title: 'Severe Infractions', 
            val: stats.severeCount, 
            sub: 'Over $100 penalty', 
            icon: <AlertTriangle size={28} />, 
            color: theme.palette.warning.main 
          },
          { 
            title: 'Today\'s Activity', 
            val: stats.todayCount, 
            sub: 'Captured last 24h', 
            icon: <TrendingUp size={28} />, 
            color: theme.palette.info.main 
          }
        ].map((kpi, i) => (
          <Paper
            key={i}
            elevation={0}
            sx={{
              p: 3,
              borderRadius: '16px',
              border: `1px solid ${kpi.color}30`,
              background: `linear-gradient(135deg, ${kpi.color}0A 0%, transparent 100%)`,
              display: 'flex',
              alignItems: 'center',
              gap: 2.5
            }}
          >
            <Box sx={{ p: 1.5, borderRadius: '12px', background: `${kpi.color}15`, color: kpi.color, display: 'flex' }}>
              {kpi.icon}
            </Box>
            <Box>
              <Typography variant="h4" fontWeight="800" color={kpi.color}>{kpi.val}</Typography>
              <Typography variant="subtitle2" fontWeight="700" color="text.primary">{kpi.title}</Typography>
              <Typography variant="caption" color="text.secondary">{kpi.sub}</Typography>
            </Box>
          </Paper>
        ))}
      </Box>


      {/* The Pulsing List */}
      <Box display="flex" flexDirection="column" gap={2} flex={1}>
        {loading ? (
          <Typography color="text.secondary" textAlign="center" py={4}>Scanning infraction database...</Typography>
        ) : filteredViolations.length === 0 ? (
          <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" py={8} sx={{ opacity: 0.5 }}>
            <CheckCircle size={64} style={{ marginBottom: '16px', color: theme.palette.success.main }} />
            <Typography variant="h6">No Infractions Detected</Typography>
          </Box>
        ) : (
          filteredViolations.map((v) => {
            const isUnpaid = v.status === 'Unpaid';
            const isSevere = v.amount > 100;

            return (
              <Fade in={true} key={v.id}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    borderRadius: '16px',
                    border: `1px solid ${isUnpaid ? theme.palette.error.main + '40' : theme.palette.divider}`,
                    background: isUnpaid 
                        ? (theme.palette.mode === 'dark' ? 'rgba(239, 68, 68, 0.05)' : 'rgba(239, 68, 68, 0.02)')
                        : (theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.01)' : 'rgba(0,0,0,0.01)'),
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    position: 'relative',
                    overflow: 'hidden',
                    opacity: isUnpaid ? 1 : 0.65,
                    filter: isUnpaid ? 'none' : 'grayscale(0.5)',
                    '&:hover': {
                      opacity: 1,
                      filter: 'none',
                      transform: 'translateY(-2px)',
                      boxShadow: isUnpaid 
                        ? `0 8px 32px ${theme.palette.error.main}30` 
                        : `0 8px 32px ${theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.05)'}`
                    }
                  }}
                >
                  {/* Glowing warning edge */}
                  {isUnpaid && (
                    <Box 
                      sx={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: '4px',
                        background: theme.palette.error.main,
                        boxShadow: `0 0 12px ${theme.palette.error.main}`
                      }}
                    />
                  )}

                  <Box display="flex" flexWrap="wrap" gap={3} alignItems="center">
                    {/* Icon */}
                    <Box 
                      sx={{ 
                        p: 2, 
                        borderRadius: '14px', 
                        background: isUnpaid ? `${theme.palette.error.main}1A` : `${theme.palette.text.secondary}1A`,
                        color: isUnpaid ? theme.palette.error.main : theme.palette.text.secondary,
                      }}
                    >
                      {v.violation_type.toLowerCase().includes('parking') ? <Car size={26} /> : <ShieldAlert size={26} />}
                    </Box>

                    {/* Details */}
                    <Box flex={1} minWidth="200px">
                      <Box display="flex" alignItems="center" gap={1.5} mb={0.5}>
                        <Typography variant="h6" fontWeight="800" sx={{ fontFamily: 'monospace', letterSpacing: '1px' }}>
                          {v.vehicle_number}
                        </Typography>
                        {isSevere && isUnpaid && (
                          <Chip label="SEVERE" size="small" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 800, background: theme.palette.error.main, color: '#fff' }} />
                        )}
                      </Box>
                      <Typography variant="body2" color={isUnpaid ? 'text.primary' : 'text.secondary'} fontWeight="500">
                        {v.violation_type} &mdash; {v.description}
                      </Typography>
                    </Box>

                    {/* Meta */}
                    <Box textAlign="right" minWidth="120px">
                      <Typography variant="body2" color="text.secondary" fontWeight="600" mb={0.5}>
                        {new Date(v.violation_date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                      </Typography>
                      <Box display="flex" alignItems="center" justifyContent="flex-end" gap={1.5}>
                        <Typography variant="h6" fontWeight="800" color={isUnpaid ? theme.palette.error.main : 'text.primary'}>
                          ${v.amount.toFixed(2)}
                        </Typography>
                        <Chip 
                          label={v.status} 
                          size="small"
                          sx={{ 
                            fontWeight: 800, 
                            textTransform: 'uppercase',
                            fontSize: '0.7rem',
                            letterSpacing: '0.5px',
                            background: isUnpaid ? `${theme.palette.error.main}20` : `${theme.palette.success.main}20`,
                            color: isUnpaid ? theme.palette.error.main : theme.palette.success.main,
                            border: `1px solid ${isUnpaid ? theme.palette.error.main : theme.palette.success.main}40`
                          }} 
                        />
                      </Box>
                    </Box>
                  </Box>
                </Paper>
              </Fade>
            );
          })
        )}
      </Box>
    </Box>
  );
};

export default ViolationsPage;
