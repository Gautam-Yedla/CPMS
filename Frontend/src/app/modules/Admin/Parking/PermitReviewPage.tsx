import React, { useEffect, useState, useMemo } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Chip,
  Button,
  CircularProgress,
  Checkbox,
  Stack,
  FormControlLabel,
  Switch,
  MenuItem,
  IconButton,
  TextField,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  FormControl,
  InputLabel,
  Select,
  Grid,
  Pagination,
  Fade,
  Divider
} from '@mui/material';
import { 
  Search, 
  CheckCircle2, 
  XCircle, 
  MapPin,
  Clock,
  User,
  CheckSquare,
  AlertOctagon,
  TrendingUp,
  CheckCircle,
  Hash,
  Layers,
  CalendarDays,
  Settings2,
  ListRestart
} from 'lucide-react';
import { useMediaQuery } from '@mui/material';
import { api } from '@utils/services/api';
import { toast } from 'react-toastify';

interface Permit {
  id: string;
  user_id: string;
  vehicle_number: string;
  permit_type: string;
  zone: string;
  spot: string;
  issue_date: string | null;
  expiry_date: string | null;
  status: 'Pending' | 'Active' | 'Approved' | 'Rejected';
  created_at: string;
  profiles: {
    full_name: string;
    email: string;
    student_id: string;
  };
}

const PermitReviewPage: React.FC = () => {
  const theme = useTheme();
  const [permits, setPermits] = useState<Permit[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPermit, setSelectedPermit] = useState<Permit | null>(null);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'Approve' | 'Reject' | null>(null);
  const [processing, setProcessing] = useState(false);

  // UX State
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isExtraSmall = useMediaQuery('(max-width:400px)');
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Real-world approval logic state
  const [useManualAssignment, setUseManualAssignment] = useState(false);
  const [manualZone, setManualZone] = useState('Zone A');
  const [manualSpot, setManualSpot] = useState('');

  // Filters
  const [filter, setFilter] = useState<'All' | 'Pending' | 'Approved' | 'Rejected'>('Pending');

  const loadPermits = async () => {
    try {
      setLoading(true);
      const data = await api.fetchAllPermits();
      setPermits(data);
    } catch (err) {
      console.error('Failed to load permits:', err);
      toast.error('Failed to load permit applications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPermits();
  }, []);

  const stats = useMemo(() => {
    const pending = permits.filter(p => p.status === 'Pending');
    const approvedToday = permits.filter(p => (p.status === 'Approved' || p.status === 'Active') && new Date(p.created_at).toDateString() === new Date().toDateString());
    const expiringSoon = permits.filter(p => p.expiry_date && new Date(p.expiry_date).getTime() < new Date().getTime() + 7 * 86400000);
    
    return {
      pendingCount: pending.length,
      approvedTodayCount: approvedToday.length,
      expiringSoonCount: expiringSoon.length,
      totalCount: permits.length
    };
  }, [permits]);

  const filteredPermits = useMemo(() => {
    return permits.filter(p => {
      const matchesSearch = 
        p.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.vehicle_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.profiles?.student_id?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesFilter = filter === 'All' || p.status === filter;
      
      return matchesSearch && matchesFilter;
    }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [permits, searchTerm, filter]);

  const [page, setPage] = useState(1);
  const itemsPerPage = isMobile ? 5 : 8;
  const paginatedPermits = useMemo(() => {
    const startIndex = (page - 1) * itemsPerPage;
    return filteredPermits.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredPermits, page, itemsPerPage]);

  const handlePageChange = (_: any, value: number) => {
    setPage(value);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    setPage(1);
  }, [searchTerm, filter]);

  const handleToggleSelectionMode = () => {
    if (selectionMode) setSelectedIds([]);
    setSelectionMode(!selectionMode);
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.length === paginatedPermits.length && paginatedPermits.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedPermits.map(p => p.id));
    }
  };

  const handleToggleSelectId = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBulkAction = async (type: 'Approved' | 'Rejected') => {
    if (selectedIds.length === 0) return;
    setProcessing(true);
    try {
      await Promise.all(selectedIds.map(id => api.updatePermitStatus(id, { status: type })));
      toast.success(`${selectedIds.length} permits ${type.toLowerCase()} successfully`);
      setSelectedIds([]);
      setSelectionMode(false);
      loadPermits();
    } catch (err) {
      toast.error('Failed to process bulk action');
    } finally {
      setProcessing(false);
    }
  };

  const handleAction = async () => {
    if (!selectedPermit || !actionType) return;
    
    setProcessing(true);
    try {
      const status = actionType === 'Approve' ? 'Approved' : 'Rejected';
      const payload: any = { status };
      
      if (actionType === 'Approve' && useManualAssignment) {
        payload.zone = manualZone;
        payload.spot = manualSpot;
      }

      await api.updatePermitStatus(selectedPermit.id, payload);
      toast.success(`Permit ${actionType.toLowerCase()}d successfully`);
      setActionDialogOpen(false);
      setSelectedPermit(null);
      setUseManualAssignment(false);
      setManualSpot('');
      loadPermits();
    } catch (err) {
      console.error(`Failed to ${actionType.toLowerCase()} permit:`, err);
      toast.error(`Failed to ${actionType.toLowerCase()} permit`);
    } finally {
      setProcessing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
      case 'Approved': return theme.palette.success.main;
      case 'Pending': return theme.palette.warning.main;
      case 'Rejected': return theme.palette.error.main;
      default: return theme.palette.text.secondary;
    }
  };

  return (
    <Box p={isExtraSmall ? 1 : isMobile ? 2 : 3} minHeight="calc(100vh - 100px)" display="flex" flexDirection="column" gap={isExtraSmall ? 1.5 : 3}>
      
      {/* Selection Mode Header Overlay (iOS Style) */}
      <Fade in={selectionMode}>
        <Box 
          sx={{ 
            position: 'absolute', 
            top: 0, left: 0, right: 0, 
            height: isMobile ? '60px' : '80px',
            bgcolor: theme.palette.primary.main,
            color: 'white',
            zIndex: 1100,
            display: selectionMode ? 'flex' : 'none',
            alignItems: 'center',
            px: 3,
            justifyContent: 'space-between'
          }}
        >
          <Box display="flex" alignItems="center" gap={2}>
            <IconButton onClick={() => setSelectionMode(false)} sx={{ color: 'white' }}>
              <XCircle size={24} />
            </IconButton>
            <Typography variant="h6" fontWeight="800">{selectedIds.length} Selective</Typography>
          </Box>
          <Button onClick={handleToggleSelectAll} sx={{ color: 'white', fontWeight: 700 }}>
            {selectedIds.length === paginatedPermits.length ? 'Deselect All' : 'Select All'}
          </Button>
        </Box>
      </Fade>

      {/* Main Header */}
      <Box display="flex" flexDirection={isMobile ? 'column' : 'row'} justifyContent="space-between" alignItems={isMobile ? 'flex-start' : 'center'} gap={2}>
        <Box>
          <Typography fontWeight="900" sx={{ fontSize: isExtraSmall ? '1.75rem' : isMobile ? '2.25rem' : '3.25rem', letterSpacing: '-0.03em', lineHeight: 1.1, color: theme.palette.text.primary, mb: 1 }}>
            Parking Permits
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, opacity: 0.9 }}>
            Queue: {filteredPermits.length} total • Page {page} of {Math.ceil(filteredPermits.length / itemsPerPage)}
          </Typography>
        </Box>
        
        <Stack direction="column" spacing={isExtraSmall ? 1 : 1.5} width={isMobile ? '100%' : 'auto'}>
          {/* Top Row: Search (Full Width) */}
          <Paper 
              elevation={0} 
              sx={{ 
                px: 2, 
                py: 0.5, 
                borderRadius: '12px', 
                border: `1px solid ${theme.palette.divider}`,
                background: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0,0,0,0.02)',
                display: 'flex', 
                alignItems: 'center',
                width: '100%'
              }}
          >
              <Search size={16} color={theme.palette.text.secondary} />
              <TextField 
                variant="standard" 
                placeholder="Search..." 
                fullWidth 
                sx={{ ml: 1 }}
                InputProps={{ disableUnderline: true, style: { fontSize: '0.85rem' } }}
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)}
              />
          </Paper>

          {/* Bottom Row: Actions & Filter (Side-by-Side on Mobile) */}
          <Box display="flex" flexDirection="row" gap={isExtraSmall ? 1 : 1.5} width="100%">
            <Button 
                variant={selectionMode ? "contained" : "outlined"}
                size="small"
                onClick={handleToggleSelectionMode}
                startIcon={<CheckSquare size={16} />}
                fullWidth={isMobile}
                sx={{ 
                  borderRadius: '10px', 
                  textTransform: 'none', 
                  fontWeight: 800, 
                  whiteSpace: 'nowrap',
                  flex: 1,
                  fontSize: '0.7rem',
                  height: '36px',
                  bgcolor: selectionMode ? theme.palette.primary.main : theme.palette.background.paper
                }}
            >
                {selectionMode ? 'Quit' : 'Select'}
            </Button>

            <FormControl size="small" sx={{ minWidth: isMobile ? '100px' : '140px', flex: 1.2 }}>
              <InputLabel sx={{ fontSize: '0.7rem' }}>Filter</InputLabel>
              <Select
                value={filter} 
                label="Filter" 
                onChange={(e) => setFilter(e.target.value as any)}
                sx={{ borderRadius: '10px', fontSize: '0.7rem', bgcolor: theme.palette.background.paper, height: '36px' }}
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
                <MenuItem value="Pending" sx={{ fontSize: '0.75rem' }}>Pending</MenuItem>
                <MenuItem value="Approved" sx={{ fontSize: '0.75rem' }}>Approved</MenuItem>
                <MenuItem value="Rejected" sx={{ fontSize: '0.75rem' }}>Rejected</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Stack>
      </Box>

      {/* KPI Section */}
      <Grid container spacing={isExtraSmall ? 1 : 2}>
        {[
          { label: 'Pending', val: stats.pendingCount, color: theme.palette.warning.main, icon: <Clock size={16} /> },
          { label: 'Today', val: stats.approvedTodayCount, color: theme.palette.success.main, icon: <TrendingUp size={16} /> },
          { label: 'Expiry', val: stats.expiringSoonCount, color: theme.palette.info.main, icon: <AlertOctagon size={16} /> }
        ].map((kpi, i) => (
          <Grid size={{ xs: 4, sm: 4 }} key={i}>
            <Paper elevation={0} sx={{ p: isExtraSmall ? 1 : 1.5, borderRadius: '12px', border: `1px solid ${kpi.color}25`, bgcolor: `${kpi.color}05`, textAlign: 'center' }}>
              <Typography variant="h6" fontWeight="900" color={kpi.color} lineHeight={1}>{kpi.val}</Typography>
              <Typography variant="caption" fontWeight="700" sx={{ fontSize: '0.65rem', textTransform: 'uppercase', opacity: 0.7 }}>{kpi.label}</Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* List Section */}
      <Box flex={1} display="flex" flexDirection="column" gap={1.5}>
        {loading ? (
             <Box display="flex" justifyContent="center" py={10}><CircularProgress /></Box>
        ) : filteredPermits.length === 0 ? (
            <Box textAlign="center" py={10} sx={{ opacity: 0.5 }}>
                <CheckCircle size={48} style={{ marginBottom: 12 }} />
                <Typography variant="body2">No results matching filters.</Typography>
            </Box>
        ) : (
          paginatedPermits.map((permit) => {
            const isSelected = selectedIds.includes(permit.id);
            const isPending = permit.status === 'Pending';

            return (
              <Paper 
                key={permit.id} elevation={0}
                sx={{ 
                  p: isMobile ? 1.5 : 2, borderRadius: '16px', border: `1px solid ${isSelected ? theme.palette.primary.main : theme.palette.divider}`,
                  bgcolor: isSelected ? `${theme.palette.primary.main}08` : theme.palette.background.paper,
                  transition: 'all 0.15s ease',
                  position: 'relative'
                }}
              >
                <Box display="flex" flexDirection="column" gap={2}>
                  {/* Card Header (Avatar + Name + Selection) */}
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box display="flex" alignItems="center" gap={1.5}>
                      <Avatar sx={{ width: 32, height: 32, bgcolor: isPending ? `${theme.palette.warning.main}15` : `${theme.palette.text.secondary}10`, color: isPending ? theme.palette.warning.main : theme.palette.text.secondary }}>
                         <User size={18} />
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight="800">{permit.profiles?.full_name}</Typography>
                        <Typography variant="caption" color="text.secondary">UID: {permit.profiles?.student_id}</Typography>
                      </Box>
                    </Box>
                    
                    {selectionMode ? (
                        <Checkbox size="small" checked={isSelected} onChange={() => handleToggleSelectId(permit.id)} />
                    ) : (
                        <Chip label={permit.status} size="small" sx={{ fontWeight: 800, fontSize: '0.6rem', bgcolor: `${getStatusColor(permit.status)}12`, color: getStatusColor(permit.status) }} />
                    )}
                  </Box>

                  <Divider sx={{ opacity: 0.6 }} />

                  {/* Card Body - Vital Labeled Data */}
                  <Grid container spacing={1}>
                    {[
                      { label: 'Plate', val: permit.vehicle_number, icon: <Hash size={14} /> },
                      { label: 'Type', val: permit.permit_type, icon: <Layers size={14} /> },
                      { label: 'Assignment', val: `${permit.zone} • ${permit.spot || 'Auto'}`, icon: <MapPin size={14} /> },
                      { label: 'Applied', val: new Date(permit.created_at).toLocaleDateString(), icon: <CalendarDays size={14} /> }
                    ].map((row, idx) => (
                      <Grid size={{ xs: idx < 2 ? 6 : 12, sm: 6 }} key={idx}>
                         <Box display="flex" alignItems="center" gap={1}>
                            <Box sx={{ color: theme.palette.text.disabled, display: 'flex' }}>{row.icon}</Box>
                            <Box>
                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', textTransform: 'uppercase', fontWeight: 600, display: 'block' }}>{row.label}</Typography>
                                <Typography variant="body2" fontWeight="700" sx={{ fontSize: isExtraSmall ? '0.75rem' : '0.85rem' }}>{row.val}</Typography>
                            </Box>
                         </Box>
                      </Grid>
                    ))}
                  </Grid>

                  {/* Card Footer - Prominent Action */}
                  {isPending && !selectionMode && (
                    <Button 
                      fullWidth variant="contained" size="small"
                      startIcon={<Settings2 size={16} />}
                      onClick={() => { setSelectedPermit(permit); setActionType('Approve'); setActionDialogOpen(true); }}
                      sx={{ borderRadius: '10px', fontWeight: 800, py: 1, textTransform: 'none', bgcolor: theme.palette.text.primary, color: theme.palette.background.paper }}
                    >
                      Process Decision
                    </Button>
                  )}
                </Box>
              </Paper>
            );
          })
        )}
      </Box>

      {/* Pagination Fix */}
      {!loading && filteredPermits.length > itemsPerPage && (
        <Box display="flex" justifyContent="center" py={1}>
          <Pagination count={Math.ceil(filteredPermits.length / itemsPerPage)} page={page} onChange={handlePageChange} size="small" />
        </Box>
      )}

      {/* Floating Bulk Action Bar (Compact) */}
      {selectedIds.length > 0 && (
          <Box sx={{ position: 'fixed', bottom: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 1200, width: isMobile ? 'calc(100% - 32px)' : 'fit-content' }}>
            <Paper elevation={6} sx={{ p: 1, borderRadius: '50px', bgcolor: 'black', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 3, gap: 2 }}>
               <Typography variant="body2" fontWeight="800">{selectedIds.length}</Typography>
               <Box display="flex" gap={1}>
                  <IconButton onClick={() => handleBulkAction('Approved')} sx={{ color: '#4ade80' }}><CheckCircle2 size={24} /></IconButton>
                  <IconButton onClick={() => handleBulkAction('Rejected')} sx={{ color: '#f87171' }}><XCircle size={24} /></IconButton>
               </Box>
               <IconButton onClick={() => setSelectedIds([])} sx={{ color: 'white', opacity: 0.5 }}><ListRestart size={20} /></IconButton>
            </Paper>
          </Box>
      )}

      {/* Action Dialog (Real-World) */}
      <Dialog open={actionDialogOpen} onClose={() => !processing && setActionDialogOpen(false)} PaperProps={{ sx: { borderRadius: '24px', maxWidth: '400px' } }}>
        <DialogTitle sx={{ fontWeight: 800, textAlign: 'center' }}>Permit Decision</DialogTitle>
        <DialogContent sx={{ textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary" mb={3}>Review for <strong>{selectedPermit?.profiles?.full_name}</strong></Typography>
          <Box p={2} sx={{ border: `1px dashed ${theme.palette.divider}`, borderRadius: '16px', textAlign: 'left' }}>
            <FormControlLabel 
              control={<Switch checked={useManualAssignment} onChange={(e) => setUseManualAssignment(e.target.checked)} size="small" />}
              label={<Typography variant="caption" fontWeight="700">MANUAL OVERWRITE</Typography>}
            />
            {useManualAssignment && (
              <Stack spacing={2} mt={2}>
                <FormControl size="small" fullWidth>
                  <InputLabel sx={{ fontSize: '0.8rem' }}>Zone</InputLabel>
                  <Select 
                    value={manualZone} 
                    label="Zone" 
                    onChange={(e) => setManualZone(e.target.value)}
                    sx={{ borderRadius: '10px', fontSize: '0.85rem' }}
                    MenuProps={{
                      PaperProps: {
                        style: {
                          maxHeight: 250,
                          borderRadius: '12px'
                        }
                      }
                    }}
                  >
                    <MenuItem value="Zone A" sx={{ fontSize: '0.8rem' }}>Zone A</MenuItem>
                    <MenuItem value="Zone B" sx={{ fontSize: '0.8rem' }}>Zone B</MenuItem>
                    <MenuItem value="Staff" sx={{ fontSize: '0.8rem' }}>Faculty</MenuItem>
                  </Select>
                </FormControl>
                <TextField label="Spot ID" size="small" value={manualSpot} onChange={(e) => setManualSpot(e.target.value)} placeholder="e.g. A-101" />
              </Stack>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ pb: 3, justifyContent: 'center', gap: 2 }}>
            <Button onClick={() => { setActionType('Reject'); handleAction(); }} color="error" disabled={processing}>Reject</Button>
            <Button variant="contained" onClick={handleAction} disabled={processing}>Approve</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PermitReviewPage;
