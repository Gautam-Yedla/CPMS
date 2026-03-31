import { useEffect, useState, useMemo } from 'react';
import { 
  Box, 
  Typography, 
  Paper,
  Chip,
  useTheme,
  Fade,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Pagination,
  Stack,
  useMediaQuery
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

  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  
  // Pagination State
  const [page, setPage] = useState(1);
  const itemsPerPage = 8;
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isExtraSmall = useMediaQuery('(max-width:400px)');

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

  const uniqueTypes = useMemo(() => {
    return Array.from(new Set(violations.map(v => v.violation_type)));
  }, [violations]);

  const filteredViolations = useMemo(() => {
    return violations
      .filter(v => {
        const matchesSearch = v.vehicle_number.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              v.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'All' || v.status === statusFilter;
        const matchesType = typeFilter === 'All' || v.violation_type === typeFilter;
        return matchesSearch && matchesStatus && matchesType;
      })
      .sort((a, b) => new Date(b.violation_date).getTime() - new Date(a.violation_date).getTime());
  }, [violations, searchTerm, statusFilter, typeFilter]);

  const paginatedViolations = useMemo(() => {
    const startIndex = (page - 1) * itemsPerPage;
    return filteredViolations.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredViolations, page]);

  const handlePageChange = (_: any, value: number) => {
    setPage(value);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [searchTerm, statusFilter, typeFilter]);

  return (
    <Box p={isExtraSmall ? 1 : isMobile ? 1.5 : 3} minHeight="calc(100vh - 100px)" display="flex" flexDirection="column" gap={isExtraSmall ? 2 : 3}>
      <Box display="flex" flexDirection={isMobile ? 'column' : 'row'} justifyContent="space-between" alignItems={isMobile ? 'flex-start' : 'center'} gap={2}>
        <Box>
          <Typography fontWeight="900" sx={{ fontSize: isExtraSmall ? '1.75rem' : isMobile ? '2.25rem' : '3.25rem', letterSpacing: '-0.03em', lineHeight: 1.1, color: theme.palette.text.primary, mb: 1 }}>
            Violations
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, opacity: 0.9 }}>
            Live monitoring of restricted access and parking violations
          </Typography>
        </Box>
        
        <Stack direction={isMobile ? 'column' : 'row'} spacing={isExtraSmall ? 1.5 : 2} width={isMobile ? '100%' : 'auto'}>
          <Paper 
            elevation={0} 
            sx={{ 
              px: 2, 
              py: 0.5, 
              borderRadius: '12px',
              border: `1px solid ${theme.palette.divider}`,
              background: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0,0,0,0.02)',
              width: isMobile ? '100%' : '260px',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <TextField 
              variant="standard" 
              placeholder={isExtraSmall ? "Search..." : "Search plate or description..."}
              fullWidth 
              InputProps={{ 
                disableUnderline: true, 
                style: { fontSize: '0.9rem' },
                startAdornment: <InputAdornment position="start"><Search size={16} color={theme.palette.text.secondary} /></InputAdornment>
              }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </Paper>

          <Box display="flex" flexDirection="row" gap={isExtraSmall ? 1 : 1.5} width={isMobile ? '100%' : 'auto'}>
            <FormControl size="small" sx={{ minWidth: isMobile ? '80px' : '140px', flex: 1 }}>
              <InputLabel id="status-filter-label" sx={{ fontSize: '0.7rem' }}>Status</InputLabel>
              <Select
                labelId="status-filter-label"
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
                sx={{ borderRadius: '10px', fontSize: '0.7rem', bgcolor: theme.palette.background.paper, height: '34px' }}
                MenuProps={{
                  PaperProps: {
                    style: {
                      maxHeight: 200,
                      borderRadius: '12px',
                      width: '100px'
                    }
                  }
                }}
              >
                <MenuItem value="All" sx={{ fontSize: '0.75rem' }}>All</MenuItem>
                <MenuItem value="Unpaid" sx={{ fontSize: '0.75rem' }}>Unpaid</MenuItem>
                <MenuItem value="Paid" sx={{ fontSize: '0.75rem' }}>Paid</MenuItem>
                <MenuItem value="Appealed" sx={{ fontSize: '0.75rem' }}>Appealed</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: isMobile ? '80px' : '150px', flex: 1 }}>
              <InputLabel id="type-filter-label" sx={{ fontSize: '0.7rem' }}>Type</InputLabel>
              <Select
                labelId="type-filter-label"
                value={typeFilter}
                label="Type"
                onChange={(e) => setTypeFilter(e.target.value)}
                sx={{ borderRadius: '10px', fontSize: '0.7rem', bgcolor: theme.palette.background.paper, height: '34px' }}
                MenuProps={{
                  PaperProps: {
                    style: {
                      maxHeight: 200,
                      borderRadius: '12px',
                      width: '120px'
                    }
                  }
                }}
              >
                <MenuItem value="All" sx={{ fontSize: '0.75rem' }}>All</MenuItem>
                {uniqueTypes.map(type => <MenuItem key={type} value={type} sx={{ fontSize: '0.75rem' }}>{type}</MenuItem>)}
              </Select>
            </FormControl>
          </Box>
        </Stack>
      </Box>

      {/* Top KPI Cards */}
      <Grid container spacing={isExtraSmall ? 1.5 : (isMobile ? 2 : 3)}>
        {[
          { 
            title: 'Critical Unpaid', 
            val: stats.unpaidCount, 
            sub: `₹${stats.unpaidTotal.toFixed(0)} pending`, 
            icon: <AlertOctagon size={isExtraSmall ? 18 : 20} />, 
            color: theme.palette.error.main 
          },
          { 
            title: 'Severe', 
            val: stats.severeCount, 
            sub: '> ₹100 penalty', 
            icon: <AlertTriangle size={isExtraSmall ? 18 : 20} />, 
            color: theme.palette.warning.main 
          },
          { 
            title: 'Today', 
            val: stats.todayCount, 
            sub: 'Last 24h', 
            icon: <TrendingUp size={isExtraSmall ? 18 : 20} />, 
            color: theme.palette.info.main 
          }
        ].map((kpi, i) => (
          <Grid size={{ xs: isExtraSmall ? 12 : (i === 2 && isMobile ? 12 : 6), sm: 4 }} key={i}>
            <Paper
              elevation={0}
              sx={{
                p: isExtraSmall ? 1.5 : isMobile ? 2 : 3,
                borderRadius: '16px',
                border: `1px solid ${kpi.color}25`,
                background: `linear-gradient(135deg, ${kpi.color}08 0%, transparent 100%)`,
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                height: '100%',
                '&:hover': { background: `${kpi.color}15` }
              }}
            >
              <Box sx={{ p: isExtraSmall ? 0.75 : 1, borderRadius: '10px', background: `${kpi.color}12`, color: kpi.color, display: 'flex' }}>
                {kpi.icon}
              </Box>
              <Box>
                <Typography variant={isExtraSmall ? "subtitle1" : isMobile ? "h6" : "h4"} fontWeight="800" color={kpi.color} lineHeight={1}>{kpi.val}</Typography>
                {isExtraSmall ? (
                   <Typography variant="caption" fontWeight="700" color="text.primary" display="block">
                     {kpi.title} • <span style={{ opacity: 0.6 }}>{kpi.sub}</span>
                   </Typography>
                ) : (
                  <>
                    <Typography variant="caption" fontWeight="700" color="text.primary" display={isExtraSmall ? 'none' : 'block'} mt={0.5}>{kpi.title}</Typography>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: '0.65rem' }}>{kpi.sub}</Typography>
                  </>
                )}
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>


      {/* The Violations List */}
      <Box display="flex" flexDirection="column" gap={1.5} flex={1}>
        {loading ? (
          <Typography color="text.secondary" textAlign="center" py={8} sx={{ opacity: 0.6 }}>Scanning infraction database...</Typography>
        ) : filteredViolations.length === 0 ? (
          <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" py={10} sx={{ opacity: 0.4 }}>
            <CheckCircle size={64} style={{ marginBottom: '16px', color: theme.palette.success.main }} />
            <Typography variant="h6" fontWeight="700">No Infractions Detected</Typography>
            <Typography variant="body2">Great! No active violations found matching your filters.</Typography>
          </Box>
        ) : (
          <Fade in={true} key={page}>
            <Box display="flex" flexDirection="column" gap={1.5}>
              {paginatedViolations.map((v) => {
                const isUnpaid = v.status === 'Unpaid';
                const isSevere = v.amount > 100;

                return (
                  <Paper
                    key={v.id}
                    elevation={0}
                    sx={{
                      p: isMobile ? 1.5 : 2,
                      borderRadius: '12px',
                      border: `1px solid ${isUnpaid ? theme.palette.error.main + '30' : theme.palette.divider}`,
                      background: isUnpaid 
                          ? (theme.palette.mode === 'dark' ? 'rgba(239, 68, 68, 0.04)' : 'rgba(239, 68, 68, 0.015)')
                          : (theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.01)' : 'rgba(0,0,0,0.005)'),
                      transition: 'all 0.2s ease',
                      position: 'relative',
                      overflow: 'hidden',
                      '&:hover': {
                        background: isUnpaid 
                          ? (theme.palette.mode === 'dark' ? 'rgba(239, 68, 68, 0.08)' : 'rgba(239, 68, 68, 0.025)')
                          : (theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0,0,0,0.02)')
                      }
                    }}
                  >
                    {isUnpaid && (
                      <Box 
                        sx={{
                          position: 'absolute',
                          left: 0,
                          top: 0,
                          bottom: 0,
                          width: '3px',
                          background: theme.palette.error.main,
                        }}
                      />
                    )}

                    <Box display="flex" alignItems="center" gap={isMobile ? 1.5 : 3}>
                      {/* Icon - Hidden on very small screens to save space */}
                      {!isExtraSmall && (
                        <Box 
                          sx={{ 
                            p: 1.25, 
                            borderRadius: '10px', 
                            background: isUnpaid ? `${theme.palette.error.main}12` : `${theme.palette.text.secondary}08`,
                            color: isUnpaid ? theme.palette.error.main : theme.palette.text.secondary,
                            display: 'flex'
                          }}
                        >
                          {v.violation_type.toLowerCase().includes('parking') ? <Car size={20} /> : <ShieldAlert size={20} />}
                        </Box>
                      )}

                      {/* Main Info */}
                      <Box flex={1}>
                        <Box display="flex" alignItems="center" flexWrap="wrap" gap={1}>
                          <Typography variant={isExtraSmall ? "body2" : "body1"} fontWeight="800" sx={{ fontFamily: 'monospace', letterSpacing: '0.5px', color: theme.palette.text.primary }}>
                            {v.vehicle_number}
                          </Typography>
                          {isSevere && isUnpaid && (
                            <Chip label="SEVERE" size="small" variant="filled" sx={{ height: 14, fontSize: '0.55rem', fontWeight: 900, bgcolor: theme.palette.error.main, color: '#fff' }} />
                          )}
                          {!isMobile && (
                            <Typography variant="caption" color="text.secondary" sx={{ opacity: 0.7 }}>
                              • {new Date(v.violation_date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                            </Typography>
                          )}
                        </Box>
                        <Typography variant="caption" color="text.secondary" fontWeight="500" display="block">
                          {v.violation_type} {isMobile ? '' : '— ' + v.description}
                        </Typography>
                        {isMobile && (
                          <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: '0.65rem' }}>
                            {new Date(v.violation_date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                          </Typography>
                        )}
                      </Box>

                      {/* Amount & Status */}
                      <Box textAlign="right">
                        <Typography variant="subtitle1" fontWeight="800" color={isUnpaid ? theme.palette.error.main : 'text.primary'} lineHeight={1.2}>
                          ₹{v.amount.toFixed(0)}
                        </Typography>
                        <Chip 
                          label={v.status} 
                          size="small"
                          sx={{ 
                            height: 20,
                            fontWeight: 700, 
                            fontSize: '0.65rem',
                            letterSpacing: '0.2px',
                            background: isUnpaid ? `${theme.palette.error.main}12` : `${theme.palette.success.main}12`,
                            color: isUnpaid ? theme.palette.error.main : theme.palette.success.main,
                            border: `1px solid ${isUnpaid ? theme.palette.error.main : theme.palette.success.main}20`,
                            mt: 0.5
                          }} 
                        />
                      </Box>
                    </Box>
                  </Paper>
                );
              })}
            </Box>
          </Fade>
        )}
      </Box>

      {/* Pagination Container */}
      {!loading && filteredViolations.length > itemsPerPage && (
        <Box display="flex" justifyContent="center" mt={2} mb={2}>
          <Pagination 
            count={Math.ceil(filteredViolations.length / itemsPerPage)} 
            page={page} 
            onChange={handlePageChange} 
            color="primary" 
            size={isMobile ? "small" : "medium"}
            sx={{
              '& .MuiPaginationItem-root': {
                fontWeight: 600,
                borderRadius: '8px'
              }
            }}
          />
        </Box>
      )}
    </Box>
  );
};

export default ViolationsPage;
