import React, { useEffect, useState } from 'react';
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
  InputAdornment,
  Avatar
} from '@mui/material';
import { Plus, MessageSquare, Clock, AlertTriangle, Search, Flag, Tag, CheckCircle2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { api } from '@services/api';
import ErrorBoundary from '@shared/components/ErrorBoundary';

interface UserProfile {
    full_name: string;
    email: string;
}

interface Ticket {
  id: string; // Ensure this matches backend UUID
  subject: string;
  message: string;
  status: 'open' | 'pending' | 'closed';
  priority: 'low' | 'medium' | 'high';
  created_at: string;
  profiles?: UserProfile | null;
}

const SupportTicketsPageContent: React.FC = () => {
  const theme = useTheme();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // New Ticket State
  const [newTicket, setNewTicket] = useState({ subject: '', message: '', priority: 'medium' });

  // View/Edit Ticket State
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const data = await api.fetchTickets();
      if (Array.isArray(data)) {
          setTickets(data);
      } else {
          setTickets([]);
          toast.error('Received invalid data from server');
      }
    } catch (error) {
      toast.error('Failed to load tickets');
      setTickets([]);
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
        toast.warning('Please fill in all fields');
        return;
      }
      
      await api.createTicket(newTicket);
      toast.success('Ticket submitted successfully');
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return theme.palette.success.main;
      case 'pending': return theme.palette.warning.main;
      case 'closed': return theme.palette.text.disabled;
      default: return theme.palette.text.disabled;
    }
  };

  const getPriorityColor = (priority: string) => {
      switch (priority) {
          case 'high': return theme.palette.error.main;
          case 'medium': return theme.palette.info.main;
          case 'low': return theme.palette.success.main;
          default: return theme.palette.text.disabled;
      }
  };

  const filteredTickets = tickets.filter(t => 
    t.subject.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box p={2} minHeight="calc(100vh - 100px)" display="flex" flexDirection="column">
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <div>
          <Typography fontWeight="700" sx={{ fontSize: '1.875rem', color: theme.palette.text.primary, mb: 0.5 }}>
            Support Tickets
          </Typography>
          <Typography variant="body1" color="text.secondary">Review and respond to system and campus assistance requests.</Typography>
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
              width: '320px'
            }}
          >
            <TextField 
              variant="standard" 
              placeholder="Search requests by subject or user..." 
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
            startIcon={<Plus />} 
            onClick={() => setOpenDialog(true)}
            sx={{ 
              borderRadius: '12px', 
              textTransform: 'none', 
              fontWeight: 700,
              px: 3,
              height: '42px',
              boxShadow: `0 8px 16px ${theme.palette.primary.main}40`
            }}
          >
            Submit Ticket
          </Button>
        </Box>
      </Box>

      {/* Masonry Grid of Tickets */}
      {loading ? (
         <Typography color="text.secondary" textAlign="center" py={4}>Loading support requests...</Typography>
      ) : filteredTickets.length === 0 ? (
         <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" py={8} sx={{ opacity: 0.5 }}>
            <MessageSquare size={64} style={{ marginBottom: '16px' }} />
            <Typography variant="h6">No tickets found</Typography>
         </Box>
      ) : (
        <Box 
          sx={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', 
            gap: 3 
          }}
        >
          {filteredTickets.map((ticket) => {
            const statusColor = getStatusColor(ticket.status);
            const priorityColor = getPriorityColor(ticket.priority);

            return (
              <Fade in={true} key={ticket.id}>
                <Paper
                  onClick={() => { setSelectedTicket(ticket); setViewDialogOpen(true); }}
                  elevation={0}
                  sx={{
                    p: 3,
                    borderRadius: '20px',
                    border: `1px solid ${theme.palette.divider}`,
                    background: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
                    backdropFilter: 'blur(10px)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    position: 'relative',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                    cursor: 'pointer',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      background: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                      boxShadow: `0 12px 24px ${theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.05)'}`,
                      borderColor: statusColor
                    }
                  }}
                >
                  {/* Decorative Left Border based on priority */}
                  <Box 
                    sx={{ 
                      position: 'absolute', 
                      top: 0, 
                      bottom: 0,
                      left: 0, 
                      width: '4px', 
                      background: priorityColor
                    }} 
                  />

                  {/* Top Row: User + Status/Priority */}
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                    <Box display="flex" alignItems="center" gap={1.5}>
                      <Avatar sx={{ width: 32, height: 32, fontSize: '0.875rem', bgcolor: `${priorityColor}20`, color: priorityColor, fontWeight: 700 }}>
                        {ticket.profiles?.full_name?.charAt(0) || 'U'}
                      </Avatar>
                      <Box>
                         <Typography variant="body2" fontWeight="700" color="text.primary">{ticket.profiles?.full_name || 'Unknown User'}</Typography>
                         <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                           <Clock size={12} /> {new Date(ticket.created_at).toLocaleDateString()}
                         </Typography>
                      </Box>
                    </Box>
                    <Box display="flex" gap={1}>
                       <Chip 
                         icon={<AlertTriangle size={12} />} 
                         label={ticket.priority} 
                         size="small" 
                         sx={{ 
                           height: 22, 
                           fontWeight: 700, 
                           fontSize: '0.65rem', 
                           textTransform: 'uppercase',
                           background: `${priorityColor}15`,
                           color: priorityColor,
                           border: `1px solid ${priorityColor}30`
                         }} 
                       />
                       <Chip 
                         icon={ticket.status === 'closed' ? <CheckCircle2 size={12} /> : <Tag size={12} />} 
                         label={ticket.status} 
                         size="small" 
                         sx={{ 
                           height: 22, 
                           fontWeight: 700, 
                           fontSize: '0.65rem', 
                           textTransform: 'uppercase',
                           background: `${statusColor}15`,
                           color: statusColor,
                           border: `1px solid ${statusColor}30`,
                           opacity: ticket.status === 'closed' ? 0.7 : 1
                         }} 
                       />
                    </Box>
                  </Box>

                  {/* Mid Row: Subject + Message Snippet */}
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="h6" fontWeight="800" sx={{ lineHeight: 1.3, mb: 1, fontSize: '1.1rem' }}>
                      {ticket.subject}
                    </Typography>
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      sx={{
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        lineHeight: 1.6
                      }}
                    >
                      {ticket.message}
                    </Typography>
                  </Box>
                </Paper>
              </Fade>
            );
          })}
        </Box>
      )}

      {/* Premium Create Ticket Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={() => setOpenDialog(false)} 
        maxWidth="sm" 
        fullWidth
        TransitionComponent={Fade}
        PaperProps={{ 
          sx: { 
            borderRadius: '24px',
            background: theme.palette.mode === 'dark' ? '#1e1e1e' : '#ffffff',
            backgroundImage: 'none',
            boxShadow: theme.palette.mode === 'dark' ? '0 24px 48px rgba(0,0,0,0.5)' : '0 24px 48px rgba(0,0,0,0.1)'
          } 
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: '1.25rem', p: 3, pb: 2, display: 'flex', alignItems: 'center', gap: 1.5, borderBottom: `1px solid ${theme.palette.divider}` }}>
          <Box sx={{ p: 1, borderRadius: '8px', background: `${theme.palette.primary.main}1A`, color: theme.palette.primary.main, display: 'flex' }}>
            <MessageSquare size={20} />
          </Box>
          Create Support Request
        </DialogTitle>
        <DialogContent sx={{ p: 3, pt: 3 }}>
          <Box display="flex" flexDirection="column" gap={3}>
            <TextField
              label="Request Subject"
              variant="filled"
              fullWidth
              value={newTicket.subject}
              onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
              InputProps={{ disableUnderline: true, sx: { borderRadius: '12px' } }}
            />
            <TextField
              label="Urgency Level"
              select
              variant="filled"
              fullWidth
              value={newTicket.priority}
              onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value })}
              InputProps={{ disableUnderline: true, sx: { borderRadius: '12px' } }}
            >
                <MenuItem value="low">Low Priority (Standard Response)</MenuItem>
                <MenuItem value="medium">Medium Priority (Requires Attention)</MenuItem>
                <MenuItem value="high" sx={{ color: theme.palette.error.main, fontWeight: 700 }}>High Priority (Immediate Action)</MenuItem>
            </TextField>
            <TextField
              label="Provide details..."
              variant="filled"
              fullWidth
              multiline
              rows={5}
              value={newTicket.message}
              onChange={(e) => setNewTicket({ ...newTicket, message: e.target.value })}
              InputProps={{ disableUnderline: true, sx: { borderRadius: '12px' } }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1, borderTop: `1px solid ${theme.palette.divider}` }}>
          <Button onClick={() => setOpenDialog(false)} color="inherit" sx={{ borderRadius: '10px', px: 3, fontWeight: 600 }}>Cancel</Button>
          <Button 
            onClick={handleCreateTicket} 
            variant="contained" 
            disabled={!newTicket.subject || !newTicket.message}
            sx={{ 
              borderRadius: '10px', 
              px: 4, 
              fontWeight: 700,
              boxShadow: `0 8px 16px ${theme.palette.primary.main}40`
            }}
          >
            Submit Request
          </Button>
        </DialogActions>
      </Dialog>

      {/* Premium View/Respond Ticket Dialog */}
      <Dialog 
        open={viewDialogOpen} 
        onClose={() => setViewDialogOpen(false)} 
        maxWidth="md" 
        fullWidth
        TransitionComponent={Fade}
        PaperProps={{ 
          sx: { 
            borderRadius: '24px',
            background: theme.palette.mode === 'dark' ? '#1e1e1e' : '#ffffff',
            backgroundImage: 'none',
            boxShadow: theme.palette.mode === 'dark' ? '0 24px 48px rgba(0,0,0,0.5)' : '0 24px 48px rgba(0,0,0,0.1)'
          } 
        }}
      >
          {selectedTicket && (
              <>
                <DialogTitle sx={{ fontWeight: 700, fontSize: '1.25rem', p: 3, pb: 2, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', borderBottom: `1px solid ${theme.palette.divider}` }}>
                  <Box display="flex" alignItems="center" gap={1.5}>
                    <Box sx={{ p: 1, borderRadius: '8px', background: `${getPriorityColor(selectedTicket.priority)}1A`, color: getPriorityColor(selectedTicket.priority), display: 'flex' }}>
                      <Flag size={20} />
                    </Box>
                    <Box display="flex" flexDirection="column" gap={0.25}>
                      {selectedTicket.subject}
                      <Typography variant="caption" color="text.secondary" fontWeight="500">
                        Request Tracker: #{selectedTicket.id.split('-')[0]}
                      </Typography>
                    </Box>
                  </Box>
                  <Chip 
                    label={selectedTicket.status} 
                    sx={{ 
                      height: 24, 
                      fontWeight: 800, 
                      fontSize: '0.7rem', 
                      textTransform: 'uppercase',
                      background: `${getStatusColor(selectedTicket.status)}20`,
                      color: getStatusColor(selectedTicket.status)
                    }} 
                  />
                </DialogTitle>
                <DialogContent sx={{ p: 0 }}>
                    {/* User Profile Strip */}
                    <Box sx={{ p: 3, borderBottom: `1px solid ${theme.palette.divider}`, display: 'flex', alignItems: 'center', gap: 2, background: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.01)' }}>
                      <Avatar sx={{ width: 48, height: 48, fontWeight: 700, bgcolor: theme.palette.background.paper, color: theme.palette.text.primary, border: `1px solid ${theme.palette.divider}` }}>
                        {selectedTicket.profiles?.full_name?.charAt(0) || 'U'}
                      </Avatar>
                      <Box flex={1}>
                        <Typography variant="body1" fontWeight="700">{selectedTicket.profiles?.full_name || 'Unknown User'}</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                           <Clock size={12} /> Submitted {new Date(selectedTicket.created_at).toLocaleString()}
                        </Typography>
                      </Box>
                    </Box>
                    {/* Message Body */}
                    <Box sx={{ p: 4, minHeight: '150px' }}>
                        <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.7, color: theme.palette.text.primary }}>
                          {selectedTicket.message}
                        </Typography>
                    </Box>
                </DialogContent>
                {/* Resolution Actions Grid */}
                <DialogActions sx={{ p: 3, background: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', borderTop: `1px solid ${theme.palette.divider}`, display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: 2 }}>
                    <Typography variant="caption" fontWeight="700" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>Administrator Actions</Typography>
                    <Box display="flex" gap={2}>
                        <Button 
                          variant={selectedTicket.status === 'open' ? 'contained' : 'outlined'}
                          color="success" 
                          onClick={() => handleUpdateStatus('open')}
                          sx={{ flex: 1, borderRadius: '10px', py: 1.5, fontWeight: 700, boxShadow: selectedTicket.status === 'open' ? `0 4px 12px ${theme.palette.success.main}30` : 'none' }}>
                          Mark as Open
                        </Button>
                        <Button 
                          variant={selectedTicket.status === 'pending' ? 'contained' : 'outlined'}
                          color="warning" 
                          onClick={() => handleUpdateStatus('pending')}
                          sx={{ flex: 1, borderRadius: '10px', py: 1.5, fontWeight: 700, boxShadow: selectedTicket.status === 'pending' ? `0 4px 12px ${theme.palette.warning.main}30` : 'none' }}>
                          Wait / Pending
                        </Button>
                        <Button 
                          variant={selectedTicket.status === 'closed' ? 'contained' : 'outlined'} color="inherit" 
                          onClick={() => handleUpdateStatus('closed')}
                          sx={{ flex: 1, borderRadius: '10px', py: 1.5, fontWeight: 700 }}>
                          Resolve & Close
                        </Button>
                    </Box>
                </DialogActions>
              </>
          )}
      </Dialog>
    </Box>
  );
};

const SupportTicketsPage: React.FC = () => {
    return (
        <ErrorBoundary>
            <SupportTicketsPageContent />
        </ErrorBoundary>
    );
};

export default SupportTicketsPage;
