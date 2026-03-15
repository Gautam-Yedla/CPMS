import React, { useEffect, useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Chip,
  Button,
  IconButton,
  TextField,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  Tooltip,
  CircularProgress
} from '@mui/material';
import { 
  Search, 
  CheckCircle2, 
  XCircle, 
  MapPin
} from 'lucide-react';
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

  const handleAction = async () => {
    if (!selectedPermit || !actionType) return;
    
    setProcessing(true);
    try {
      const status = actionType === 'Approve' ? 'Approved' : 'Rejected';
      await api.updatePermitStatus(selectedPermit.id, { status });
      toast.success(`Permit ${actionType.toLowerCase()}d successfully`);
      setActionDialogOpen(false);
      setSelectedPermit(null);
      loadPermits();
    } catch (err) {
      console.error(`Failed to ${actionType.toLowerCase()} permit:`, err);
      toast.error(`Failed to ${actionType.toLowerCase()} permit`);
    } finally {
      setProcessing(false);
    }
  };

  const filteredPermits = permits.filter(p => {
    const matchesSearch = 
      p.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.vehicle_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.profiles?.student_id?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filter === 'All' || p.status === filter;
    
    return matchesSearch && matchesFilter;
  });

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
    <Box p={3} sx={{ height: 'calc(100vh - 100px)', overflow: 'auto' }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" fontWeight="800" color="text.primary" gutterBottom>
            Permit Applications
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Review and manage student parking permit requests.
          </Typography>
        </Box>
        
        <Box display="flex" gap={2}>
          <Paper elevation={0} sx={{ 
            px: 2, 
            py: 0.5, 
            borderRadius: '12px', 
            border: `1px solid ${theme.palette.divider}`,
            display: 'flex',
            alignItems: 'center',
            width: '300px'
          }}>
            <Search size={18} color={theme.palette.text.secondary} />
            <TextField 
              placeholder="Search student or vehicle..." 
              variant="standard" 
              fullWidth 
              sx={{ ml: 1 }}
              InputProps={{ disableUnderline: true }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </Paper>

          <Box sx={{ display: 'flex', bgcolor: theme.palette.background.paper, p: 0.5, borderRadius: '12px', border: `1px solid ${theme.palette.divider}` }}>
            {['All', 'Pending', 'Approved', 'Rejected'].map((f) => (
              <Button
                key={f}
                size="small"
                onClick={() => setFilter(f as any)}
                sx={{
                  borderRadius: '8px',
                  px: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                  bgcolor: filter === f ? theme.palette.primary.main : 'transparent',
                  color: filter === f ? 'white' : theme.palette.text.secondary,
                  '&:hover': {
                    bgcolor: filter === f ? theme.palette.primary.main : theme.palette.action.hover,
                  }
                }}
              >
                {f}
              </Button>
            ))}
          </Box>
        </Box>
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" height="400px">
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper} elevation={0} sx={{ 
          borderRadius: '20px', 
          border: `1px solid ${theme.palette.divider}`,
          overflow: 'hidden'
        }}>
          <Table>
            <TableHead sx={{ bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Student</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Vehicle Info</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Type / Zone</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Applied On</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredPermits.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                    <Typography color="text.secondary">No permit applications found.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredPermits.map((permit) => (
                  <TableRow key={permit.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1.5}>
                        <Avatar sx={{ 
                          width: 40, 
                          height: 40, 
                          bgcolor: `${theme.palette.primary.main}15`,
                          color: theme.palette.primary.main,
                          fontWeight: 700,
                          fontSize: '0.875rem'
                        }}>
                          {permit.profiles?.full_name?.charAt(0) || 'U'}
                        </Avatar>
                        <Box>
                          <Typography fontWeight="700" variant="body2">{permit.profiles?.full_name}</Typography>
                          <Typography variant="caption" color="text.secondary">ID: {permit.profiles?.student_id}</Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="600">{permit.vehicle_number}</Typography>
                      <Typography variant="caption" color="text.secondary">Standard Issue</Typography>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" flexDirection="column">
                        <Chip label={permit.permit_type} size="small" sx={{ fontWeight: 700, mb: 0.5, width: 'fit-content' }} />
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <MapPin size={12} /> {permit.zone} • {permit.spot || 'Auto'}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{new Date(permit.created_at).toLocaleDateString()}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={permit.status} 
                        size="small"
                        sx={{ 
                          fontWeight: 700, 
                          bgcolor: `${getStatusColor(permit.status)}15`,
                          color: getStatusColor(permit.status),
                          border: `1px solid ${getStatusColor(permit.status)}30`
                        }} 
                      />
                    </TableCell>
                    <TableCell align="right">
                      {permit.status === 'Pending' ? (
                        <Box display="flex" gap={1} justifyContent="flex-end">
                          <Tooltip title="Approve Permit">
                            <IconButton 
                              onClick={() => { setSelectedPermit(permit); setActionType('Approve'); setActionDialogOpen(true); }}
                              sx={{ color: theme.palette.success.main, bgcolor: `${theme.palette.success.main}10`, '&:hover': { bgcolor: `${theme.palette.success.main}20` } }}
                            >
                              <CheckCircle2 size={18} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Reject Permit">
                            <IconButton 
                              onClick={() => { setSelectedPermit(permit); setActionType('Reject'); setActionDialogOpen(true); }}
                              sx={{ color: theme.palette.error.main, bgcolor: `${theme.palette.error.main}10`, '&:hover': { bgcolor: `${theme.palette.error.main}20` } }}
                            >
                              <XCircle size={18} />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      ) : (
                        <Typography variant="caption" color="text.disabled" fontWeight="600">PROCESSED</Typography>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Action Dialog */}
      <Dialog 
        open={actionDialogOpen} 
        onClose={() => !processing && setActionDialogOpen(false)}
        PaperProps={{ sx: { borderRadius: '20px', p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, textAlign: 'center' }}>
          {actionType === 'Approve' ? 'Approve' : 'Reject'} Permit Application?
        </DialogTitle>
        <DialogContent sx={{ textAlign: 'center' }}>
          <Typography color="text.secondary">
            Are you sure you want to {actionType?.toLowerCase()} this permit application for <strong>{selectedPermit?.profiles?.full_name}</strong>?
          </Typography>
          {actionType === 'Approve' && (
             <Box mt={3} p={2} sx={{ bgcolor: `${theme.palette.info.main}10`, borderRadius: '12px', textAlign: 'left' }}>
               <Typography variant="caption" color="info.main" fontWeight="700" sx={{ textTransform: 'uppercase' }}>Permit Details</Typography>
               <Box display="flex" gap={2} mt={1}>
                 <Box flex={1}>
                   <Typography variant="caption" color="text.secondary">Allocated Zone</Typography>
                   <Typography variant="body2" fontWeight="700">{selectedPermit?.zone}</Typography>
                 </Box>
                 <Box flex={1}>
                   <Typography variant="caption" color="text.secondary">Expiry Date</Typography>
                   <Typography variant="body2" fontWeight="700">6 Months from Issue</Typography>
                 </Box>
               </Box>
             </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, justifyContent: 'center', gap: 2 }}>
          <Button 
            onClick={() => setActionDialogOpen(false)} 
            disabled={processing}
            sx={{ borderRadius: '12px', px: 3, color: theme.palette.text.secondary }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleAction} 
            variant="contained" 
            disabled={processing}
            color={actionType === 'Approve' ? 'success' : 'error'}
            sx={{ borderRadius: '12px', px: 4, fontWeight: 700 }}
          >
            {processing ? <CircularProgress size={24} color="inherit" /> : `Yes, ${actionType}`}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PermitReviewPage;
