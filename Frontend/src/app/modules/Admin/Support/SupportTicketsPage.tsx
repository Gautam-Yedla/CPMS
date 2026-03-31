import React, { useEffect, useState, useMemo } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Chip, 
  Button, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions,
  TextField,
  MenuItem, 
  useTheme,
  Fade,
  Avatar,
  useMediaQuery,
  CircularProgress,
  Stack,
  IconButton,
  Divider,
  FormControl,
  InputLabel,
  Select
} from '@mui/material';
import { 
  Plus, 
  Clock, 
  AlertOctagon, 
  Search, 
  Tag, 
  ChevronRight, 
  X,
  Activity,
  Info
} from 'lucide-react';
import { toast } from 'react-toastify';
import { api } from '@utils/services/api';
import ErrorBoundary from '@shared/components/ErrorBoundary';

interface UserProfile {
    full_name: string;
    email: string;
}

interface Ticket {
  id: string;
  subject: string;
  message: string;
  status: 'open' | 'pending' | 'closed';
  priority: 'low' | 'medium' | 'high';
  created_at: string;
  profiles?: UserProfile | null;
}

const SupportTicketsPage: React.FC = () => {
    return (
        <ErrorBoundary>
            <SupportTicketsPageContent />
        </ErrorBoundary>
    );
}

const SupportTicketsPageContent: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isExtraSmall = useMediaQuery('(max-width:400px)');

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [newTicket, setNewTicket] = useState({ subject: '', message: '', priority: 'medium' });
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const data = await api.fetchTickets();
      if (Array.isArray(data)) setTickets(data);
    } catch (error) {
      toast.error('Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleCreateTicket = async () => {
    try {
      if (!newTicket.subject.trim() || !newTicket.message.trim()) {
        toast.warning('Please provide subject and message');
        return;
      }
      await api.createTicket(newTicket);
      toast.success('Support ticket created');
      setOpenDialog(false);
      setNewTicket({ subject: '', message: '', priority: 'medium' });
      fetchTickets();
    } catch (error) {
      toast.error('Failed to submit ticket');
    }
  };

  const handleUpdateStatus = async (status: string) => {
      if (!selectedTicket) return;
      try {
          await api.updateTicket(selectedTicket.id, { status });
          toast.success('Status updated');
          fetchTickets();
          setViewDialogOpen(false);
      } catch (error) {
          toast.error('Failed to update status');
      }
  };

  const COLORS = {
      open: '#10b981',
      pending: '#f59e0b',
      closed: '#64748b',
      high: '#ef4444',
      medium: '#3b82f6',
      low: '#8b5cf6'
  };

  const statusMap: Record<string, { label: string, color: string }> = {
      all: { label: 'All Tickets', color: theme.palette.text.secondary },
      open: { label: 'Active', color: COLORS.open },
      pending: { label: 'Pending', color: COLORS.pending },
      closed: { label: 'Closed', color: COLORS.closed }
  };

  const priorityMap: Record<string, { label: string, color: string, icon: React.ReactNode }> = {
      all: { label: 'All Levels', color: theme.palette.text.secondary, icon: <Tag size={16} /> },
      high: { label: 'High', color: COLORS.high, icon: <AlertOctagon size={16} /> },
      medium: { label: 'Medium', color: COLORS.medium, icon: <Activity size={16} /> },
      low: { label: 'Low', color: COLORS.low, icon: <Info size={16} /> }
  };

  const filteredTickets = useMemo(() => {
    return tickets.filter(t => {
        const matchesSearch = t.subject.toLowerCase().includes(searchTerm.toLowerCase()) || (t.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesStatus = statusFilter === 'All' || t.status === statusFilter.toLowerCase();
        const matchesPriority = priorityFilter === 'All' || t.priority === priorityFilter.toLowerCase();
        return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [tickets, searchTerm, statusFilter, priorityFilter]);

  const stats = useMemo(() => {
      return { total: tickets.length, high: tickets.filter(t => t.priority === 'high').length };
  }, [tickets]);

  return (
    <Box sx={{ p: isMobile ? 2 : 3, minHeight: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', gap: 3 }}>
        <Box>
            <Typography fontWeight="900" sx={{ fontSize: isExtraSmall ? '1.75rem' : isMobile ? '2.25rem' : '3.25rem', letterSpacing: '-0.03em', lineHeight: 1.1, color: theme.palette.text.primary, mb: 1 }}>
              Support
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, opacity: 0.9 }}>
              Manage and track administrative assistance requests.
            </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, width: isMobile ? '100%' : 'auto' }}>
           <Paper elevation={0} sx={{ p: isMobile ? 2 : 3, borderRadius: '12px', border: `1px solid ${theme.palette.divider}`, textAlign: 'center', minWidth: '130px' }}>
              <Typography variant="h5" fontWeight="800" color="primary">{stats.total}</Typography>
              <Typography variant="caption" fontWeight="700" color="text.secondary">TOTAL</Typography>
           </Paper>
           <Paper elevation={0} sx={{ p: isMobile ? 2 : 3, borderRadius: '12px', border: `1px solid ${theme.palette.divider}`, textAlign: 'center', minWidth: '130px' }}>
              <Typography variant="h5" fontWeight="800" color="error">{stats.high}</Typography>
              <Typography variant="caption" fontWeight="700" color="text.secondary">URGENT</Typography>
           </Paper>
        </Box>
      </Box>

      <Paper elevation={0} sx={{ p: 2, borderRadius: '16px', border: `1px solid ${theme.palette.divider}`, display: 'flex', flexDirection: isExtraSmall ? 'column' : 'row', gap: 2, alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, borderRight: isExtraSmall ? 'none' : `1px solid ${theme.palette.divider}`, pr: 2, minWidth: isExtraSmall ? '100%' : 'auto' }}>
            <Search size={18} color={theme.palette.text.secondary} />
            <TextField variant="standard" placeholder="Search..." fullWidth InputProps={{ disableUnderline: true, style: { fontWeight: 600 } }} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </Box>
          <Box sx={{ display: 'flex', gap: 1.5, flex: 1, width: isExtraSmall ? '100%' : 'auto' }}>
              <FormControl size="small" sx={{ flex: 1 }}><InputLabel>Status</InputLabel><Select value={statusFilter} label="Status" onChange={(e) => setStatusFilter(e.target.value)} sx={{ borderRadius: '10px' }}>{Object.entries(statusMap).map(([k, v]) => <MenuItem key={k} value={k.toUpperCase() === 'ALL' ? 'All' : k}>{v.label}</MenuItem>)}</Select></FormControl>
              <FormControl size="small" sx={{ flex: 1 }}><InputLabel>Priority</InputLabel><Select value={priorityFilter} label="Priority" onChange={(e) => setPriorityFilter(e.target.value)} sx={{ borderRadius: '10px' }}>{Object.entries(priorityMap).map(([k, v]) => <MenuItem key={k} value={k.toUpperCase() === 'ALL' ? 'All' : k}>{v.label}</MenuItem>)}</Select></FormControl>
          </Box>
          <Button variant="contained" startIcon={<Plus />} onClick={() => setOpenDialog(true)} sx={{ borderRadius: '10px', height: '40px' }}>New Ticket</Button>
      </Paper>

      <Box sx={{ flex: 1 }}>
        {loading ? (
             <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}><CircularProgress thickness={4} size={40} /></Box>
        ) : filteredTickets.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 15, opacity: 0.4 }}><Typography variant="h6" fontWeight="700">No Tickets</Typography></Box>
        ) : (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: '1fr 1fr 1fr' }, gap: isMobile ? 2 : 3 }}>
            {filteredTickets.map((ticket) => {
              const sColor = statusMap[ticket.status].color;
              const pData = priorityMap[ticket.priority];
              return (
                <Fade in={true} key={ticket.id}>
                    <Paper
                        onClick={() => { setSelectedTicket(ticket); setViewDialogOpen(true); }}
                        elevation={0}
                        sx={{ p: 3, borderRadius: '16px', border: `1px solid ${theme.palette.divider}`, display: 'flex', flexDirection: 'column', gap: 2, cursor: 'pointer', '&:hover': { borderColor: theme.palette.primary.main, boxShadow: theme.shadows[1] } }}
                    >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}><Avatar sx={{ width: 32, height: 32, fontSize: '0.8rem', bgcolor: `${pData.color}15`, color: pData.color, fontWeight: 800 }}>{ticket.profiles?.full_name?.charAt(0) || 'U'}</Avatar><Typography variant="body2" fontWeight="700">{ticket.profiles?.full_name || 'User'}</Typography></Box>
                            <Chip label={statusMap[ticket.status].label} size="small" sx={{ fontWeight: 800, fontSize: '0.65rem', background: `${sColor}12`, color: sColor }} />
                        </Box>
                        <Box sx={{ flex: 1 }}><Typography variant="subtitle2" fontWeight="800" sx={{ mb: 1 }}>{ticket.subject}</Typography><Typography variant="body2" color="text.secondary" sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{ticket.message}</Typography></Box>
                        <Divider />
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}><Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><Clock size={12} /> {new Date(ticket.created_at).toLocaleDateString()}</Typography><ChevronRight size={18} /></Box>
                    </Paper>
                </Fade>
              )
            })}
          </Box>
        )}
      </Box>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>New Ticket</DialogTitle>
        <DialogContent><Stack spacing={3} mt={1}><TextField label="Subject" fullWidth value={newTicket.subject} onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })} /><TextField label="Priority" select fullWidth value={newTicket.priority} onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value })}>{Object.entries(priorityMap).filter(([k])=>k!=='all').map(([k, v]) => <MenuItem key={k} value={k}>{v.label}</MenuItem>)}</TextField><TextField label="Message" fullWidth multiline rows={4} value={newTicket.message} onChange={(e) => setNewTicket({ ...newTicket, message: e.target.value })} /></Stack></DialogContent>
        <DialogActions sx={{ p: 3 }}><Button onClick={() => setOpenDialog(false)}>Cancel</Button><Button onClick={handleCreateTicket} variant="contained">Submit</Button></DialogActions>
      </Dialog>

      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} fullWidth maxWidth="sm" fullScreen={isExtraSmall}>
          {selectedTicket && (
              <>
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><Typography variant="h6" fontWeight="800">Support Details</Typography><IconButton onClick={() => setViewDialogOpen(false)}><X size={20} /></IconButton></DialogTitle>
                <DialogContent><Box sx={{ py: 2, display: 'flex', alignItems: 'center', gap: 2 }}><Avatar sx={{ fontWeight: 800 }}>{selectedTicket.profiles?.full_name?.charAt(0)}</Avatar><Box><Typography variant="subtitle1" fontWeight="800">{selectedTicket.profiles?.full_name}</Typography><Typography variant="caption" color="text.secondary">Received: {new Date(selectedTicket.created_at).toLocaleString()}</Typography></Box></Box><Divider sx={{ my: 2 }} /><Typography variant="subtitle2" color="text.secondary">SUBJECT</Typography><Typography variant="h6" fontWeight="800" sx={{ mb: 2 }}>{selectedTicket.subject}</Typography><Typography variant="subtitle2" color="text.secondary">MESSAGE</Typography><Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>{selectedTicket.message}</Typography></DialogContent>
                <DialogActions sx={{ p: 3, flexDirection: 'column', gap: 2 }}><Typography variant="caption" fontWeight="800" color="text.secondary">UPDATE STATUS</Typography><Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2, width: '100%' }}>{['open', 'pending', 'closed'].map(s => (<Button key={s} variant={selectedTicket.status === s ? 'contained' : 'outlined'} onClick={() => handleUpdateStatus(s)} sx={{ borderRadius: '10px' }}>{s.toUpperCase()}</Button>))}</Box></DialogActions>
              </>
          )}
      </Dialog>
    </Box>
  );
};

export default SupportTicketsPage;
