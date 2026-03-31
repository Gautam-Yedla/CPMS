import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '@mui/material/styles';
import { 
  Box, 
  Paper, 
  Typography, 
  Chip, 
  CircularProgress, 
  useMediaQuery, 
  TextField, 
  MenuItem, 
  Select, 
  FormControl, 
  InputLabel, 
  Button,
  Stack,
  Divider,
  Fade
} from '@mui/material';
import { 
  Send, 
  Image as ImageIcon, 
  CheckCircle2,
  Loader2,
  Clock,
  Tag,
  ChevronRight,
  FileSearch
} from 'lucide-react';
import { api } from '@utils/services/api';
import Notification from '@shared/components/legacy/Notification';

const COLORS = {
  primary: '#3b82f6',
  open: '#10b981',
  pending: '#f59e0b',
  closed: '#64748b',
  high: '#ef4444',
  medium: '#3b82f6',
  low: '#8b5cf6',
  critical: '#e11d48'
};

const ReportPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isExtraSmall = useMediaQuery('(max-width:400px)');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [view, setView] = useState<'report' | 'history'>('report');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({ category: 'Parking', priority: 'Low', subject: '', description: '' });

  const handleUploadClick = () => fileInputRef.current?.click();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.subject || !formData.description) { setError('Please provide a subject and description.'); return; }
    setLoading(true); setError(null);
    try { await api.submitReport(formData); setSubmitted(true); } catch (err: any) { setError(err.message || 'Failed to submit report.'); } finally { setLoading(false); }
  };

  if (submitted) {
    return (
      <Box sx={{ maxWidth: '600px', margin: '4rem auto', textAlign: 'center', p: 3, borderRadius: '16px', border: `1px solid ${theme.palette.divider}`, bgcolor: theme.palette.background.paper }}>
        <Box sx={{ bgcolor: `${COLORS.open}15`, color: COLORS.open, width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem' }}><CheckCircle2 size={32} /></Box>
        <Typography variant="h5" fontWeight="800" sx={{ mb: 2 }}>Ticket Submitted</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4, lineHeight: 1.6 }}>Your support ticket has been logged. Our administration team will review the details.</Typography>
        <Stack direction={isMobile ? 'column' : 'row'} spacing={2} justifyContent="center"><Button variant="contained" onClick={() => { setSubmitted(false); setView('report'); }}>Create New Ticket</Button><Button variant="outlined" onClick={() => { setSubmitted(false); setView('history'); }}>View History</Button></Stack>
      </Box>
    );
  }

  return (
    <Box sx={{ p: isMobile ? 2 : 4, minHeight: 'calc(100vh - 100px)' }}>
      {error && <Notification message={error} type="error" onClose={() => setError(null)} />}
      <Box sx={{ maxWidth: '800px', margin: '0 auto' }}>
        <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', gap: 3, mb: 6 }}>
            <Box><Typography variant="h4" fontWeight="800" color="text.primary" sx={{ mb: 1 }}>{view === 'report' ? 'New Support Ticket' : 'Support History'}</Typography><Typography variant="body2" color="text.secondary">Request assistance and track your previous requests.</Typography></Box>
            <Paper elevation={0} sx={{ p: 0.5, borderRadius: '12px', bgcolor: 'rgba(0,0,0,0.03)', border: `1px solid ${theme.palette.divider}`, display: 'flex', width: isExtraSmall ? '100%' : 'auto' }}><Button onClick={() => setView('report')} sx={{ borderRadius: '10px', px: 3, bgcolor: view === 'report' ? theme.palette.background.paper : 'transparent', flex: 1 }}>Submit</Button><Button onClick={() => setView('history')} sx={{ borderRadius: '10px', px: 3, bgcolor: view === 'history' ? theme.palette.background.paper : 'transparent', flex: 1 }}>History</Button></Paper>
        </Box>

        {view === 'report' ? (
          <Fade in={true}>
              <Paper elevation={0} sx={{ p: isMobile ? 3 : 5, borderRadius: '16px', border: `1px solid ${theme.palette.divider}` }}>
                <form onSubmit={handleSubmit}>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
                        <Box sx={{ gridColumn: 'span 1' }}><FormControl fullWidth size="small"><InputLabel>Category</InputLabel><Select value={formData.category} label="Category" onChange={(e) => setFormData({...formData, category: e.target.value as string})} sx={{ borderRadius: '10px' }}><MenuItem value="Parking">Parking & Spot Issues</MenuItem><MenuItem value="Security">Security Concerns</MenuItem><MenuItem value="App">System Fault</MenuItem><MenuItem value="Permit">Permit / Billing</MenuItem><MenuItem value="Other">General Assistance</MenuItem></Select></FormControl></Box>
                        <Box sx={{ gridColumn: 'span 1' }}><FormControl fullWidth size="small"><InputLabel>Priority</InputLabel><Select value={formData.priority} label="Priority" onChange={(e) => setFormData({...formData, priority: e.target.value as string})} sx={{ borderRadius: '10px' }}><MenuItem value="Low">Low</MenuItem><MenuItem value="Medium">Medium</MenuItem><MenuItem value="High">High (Urgent)</MenuItem></Select></FormControl></Box>
                        <Box sx={{ gridColumn: { xs: 'span 1', md: 'span 2' } }}><TextField label="Subject" fullWidth size="small" value={formData.subject} onChange={(e) => setFormData({...formData, subject: e.target.value})} InputProps={{ sx: { borderRadius: '10px' } }} /></Box>
                        <Box sx={{ gridColumn: { xs: 'span 1', md: 'span 2' } }}><TextField label="Description" fullWidth multiline rows={4} value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} InputProps={{ sx: { borderRadius: '12px' } }} /></Box>
                        <Box sx={{ gridColumn: { xs: 'span 1', md: 'span 2' } }}><Box onClick={handleUploadClick} sx={{ border: `1px dashed ${theme.palette.divider}`, borderRadius: '12px', p: 3, textAlign: 'center', cursor: 'pointer', transition: '0.2s', '&:hover': { bgcolor: 'rgba(0,0,0,0.02)' } }}><input type="file" ref={fileInputRef} style={{ display: 'none' }} multiple /><Stack spacing={1} alignItems="center"><ImageIcon size={24} color={theme.palette.text.secondary} /><Typography variant="body2" fontWeight="700">Attach Images (Optional)</Typography></Stack></Box></Box>
                        <Box sx={{ gridColumn: { xs: 'span 1', md: 'span 2' } }}><Stack direction="row" spacing={2} justifyContent="flex-end"><Button onClick={() => setView('history')} sx={{ borderRadius: '10px' }}>Cancel</Button><Button type="submit" variant="contained" disabled={loading} endIcon={loading ? <Loader2 className="spin" size={18} /> : <Send size={18} />} sx={{ borderRadius: '10px' }}>{loading ? 'Submitting...' : 'Submit Ticket'}</Button></Stack></Box>
                    </Box>
                </form>
              </Paper>
          </Fade>
        ) : (
          <Fade in={true}>
              <Box><TicketHistory isMobile={isMobile} COLORS={COLORS} /></Box>
          </Fade>
        )}
      </Box>
      <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </Box>
  );
};

const TicketHistory = ({ isMobile, COLORS }: { isMobile: boolean, COLORS: any }) => {
    const theme = useTheme();
    const [tickets, setTickets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadTickets = async () => {
             try { const data = await api.fetchTickets(); if (Array.isArray(data)) setTickets(data); } catch (e) { console.error("Failed to load tickets", e); } finally { setLoading(false); }
        };
        loadTickets();
    }, []);

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress thickness={4} size={40} /></Box>;
    if (tickets.length === 0) return <Paper elevation={0} sx={{ textAlign: 'center', py: 10, borderRadius: '16px', border: `1px solid ${theme.palette.divider}`, opacity: 0.6 }}><FileSearch size={60} style={{ margin: '0 auto 16px' }} /><Typography variant="h6" fontWeight="700">No History</Typography></Paper>;

    const getStatusData = (status: string) => {
        const s = status?.toLowerCase() || 'open';
        switch (s) {
            case 'open': return { label: 'Active', color: COLORS.open, bg: `${COLORS.open}10` };
            case 'pending': return { label: 'Pending', color: COLORS.pending, bg: `${COLORS.pending}10` };
            case 'closed': return { label: 'Closed', color: COLORS.closed, bg: `${COLORS.closed}10` };
            default: return { label: 'Sync', color: COLORS.closed, bg: `${COLORS.closed}10` };
        }
    };

    return (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: isMobile ? 2 : 3 }}>
            {tickets.map(ticket => {
                const sData = getStatusData(ticket.status);
                const pColor = ticket.priority?.toLowerCase() === 'high' ? COLORS.high : COLORS.medium;
                return (
                    <Paper key={ticket.id} elevation={0} sx={{ p: 3, borderRadius: '16px', border: `1px solid ${theme.palette.divider}`, background: theme.palette.background.paper, transition: 'all 0.2s ease', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 2, '&:hover': { boxShadow: theme.shadows[1], borderColor: theme.palette.primary.light } }}>
                             <Box sx={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: '4px', background: pColor }} />
                             <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><Tag size={16} color={pColor} /><Typography variant="subtitle2" fontWeight="800">{ticket.subject}</Typography></Box><Chip label={sData.label} size="small" sx={{ fontWeight: 800, fontSize: '0.6rem', bgcolor: sData.bg, color: sData.color }} /></Box>
                             <Typography variant="body2" color="text.secondary" sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{ticket.message}</Typography>
                             <Divider sx={{ opacity: 0.5 }} />
                             <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}><Clock size={12} /><Typography variant="caption" fontWeight="700">{new Date(ticket.created_at).toLocaleDateString()}</Typography></Box><ChevronRight size={16} /></Box>
                    </Paper>
                );
            })}
        </Box>
    );
}

export default ReportPage;
