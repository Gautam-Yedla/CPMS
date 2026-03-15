import React, { useState } from 'react';
import { useTheme } from '@mui/material/styles';
import { Box, Paper, Typography, Chip, CircularProgress } from '@mui/material';
import { 
  Send, 
  Image as ImageIcon, 
  CheckCircle2,
  Info,
  Loader2,
  Clock,
  Tag,
  MessageSquare,
  AlertTriangle,
  ChevronRight,
  History,
  PlusCircle
} from 'lucide-react';
import { api } from '@utils/services/api';
import Notification from '@shared/components/legacy/Notification';

const ReportPage: React.FC = () => {
  const theme = useTheme();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [view, setView] = useState<'report' | 'history'>('report');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    category: 'Parking',
    priority: 'Low',
    subject: '',
    description: ''
  });

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await api.submitReport(formData);
      setSubmitted(true);
    } catch (err: any) {
      console.error('Report submission failed', err);
      setError(err.message || 'Failed to submit report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div style={{ 
        maxWidth: '600px', 
        margin: '4rem auto', 
        textAlign: 'center',
        backgroundColor: theme.palette.background.paper,
        padding: '3rem',
        borderRadius: '24px',
        boxShadow: theme.palette.mode === 'light' ? '0 10px 15px -3px rgba(0,0,0,0.05)' : 'none',
        border: theme.palette.mode === 'dark' ? `1px solid ${theme.palette.divider}` : 'none'
      }}>
        <div style={{ 
          backgroundColor: theme.palette.success.main + '10',
          color: theme.palette.success.main,
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.5rem'
        }}>
          <CheckCircle2 size={48} />
        </div>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: theme.palette.text.primary, marginBottom: '1rem' }}>Support Ticket Created</h2>
        <p style={{ color: theme.palette.text.secondary, marginBottom: '2rem', lineHeight: 1.6 }}>
          Your request has been submitted. Our team will review it and provide an update in your history.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <button 
            onClick={() => {
              setSubmitted(false);
              setFormData({ category: 'Parking', priority: 'Low', subject: '', description: '' });
              setView('report');
            }}
            style={{
              backgroundColor: theme.palette.primary.main,
              color: 'white',
              border: 'none',
              padding: '0.875rem 2rem',
              borderRadius: '12px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Create Another
          </button>
          <button 
            onClick={() => {
              setSubmitted(false);
              setView('history');
            }}
            style={{
              backgroundColor: 'transparent',
              color: theme.palette.text.primary,
              border: `1.5px solid ${theme.palette.divider}`,
              padding: '0.875rem 2rem',
              borderRadius: '12px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            View My Tickets
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {error && <Notification message={error} type="error" onClose={() => setError(null)} />}
      
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <header style={{ 
          marginBottom: '2.5rem', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'flex-end',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div>
            <h1 style={{ 
              fontSize: '2.25rem', 
              fontWeight: 900, 
              color: theme.palette.text.primary, 
              marginBottom: '0.5rem',
              letterSpacing: '-0.02em'
            }}>
              {view === 'report' ? 'Support Portal' : 'My Support Tickets'}
            </h1>
            <p style={{ color: theme.palette.text.secondary }}>
              {view === 'report' 
                ? 'Tell us about the issue you are facing and we will help you out.' 
                : 'Here are the tickets you have submitted. Track their status here.'}
            </p>
          </div>

          <Box sx={{ 
            display: 'flex', 
            bgcolor: theme.palette.background.paper, 
            p: 0.75, 
            borderRadius: '16px',
            border: `1px solid ${theme.palette.divider}`,
            boxShadow: theme.palette.mode === 'light' ? '0 4px 6px -1px rgba(0,0,0,0.05)' : 'none'
          }}>
            <button
              onClick={() => setView('report')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.625rem 1.25rem',
                borderRadius: '12px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.875rem',
                transition: 'all 0.2s',
                backgroundColor: view === 'report' ? theme.palette.primary.main : 'transparent',
                color: view === 'report' ? '#fff' : theme.palette.text.secondary
              }}
            >
              <PlusCircle size={18} /> New Ticket
            </button>
            <button
              onClick={() => setView('history')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.625rem 1.25rem',
                borderRadius: '12px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.875rem',
                transition: 'all 0.2s',
                backgroundColor: view === 'history' ? theme.palette.primary.main : 'transparent',
                color: view === 'history' ? '#fff' : theme.palette.text.secondary
              }}
            >
              <History size={18} /> My Tickets
            </button>
          </Box>
        </header>

        {view === 'report' ? (
          <form onSubmit={handleSubmit} style={{ 
            backgroundColor: theme.palette.background.paper,
            padding: '2.5rem',
            borderRadius: '24px',
            boxShadow: theme.palette.mode === 'light' ? '0 10px 25px -5px rgba(0,0,0,0.05)' : 'none',
            border: theme.palette.mode === 'dark' ? `1px solid ${theme.palette.divider}` : 'none'
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
              <div>
                <label style={labelStyle(theme)}>Issue Category</label>
                <select 
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  style={inputStyle(theme)}
                >
                  <option value="Parking">Parking & Spot Issues</option>
                  <option value="Security">Security Concerns</option>
                  <option value="App">App / Technical Issues</option>
                  <option value="Permit">Permit / Payment Issues</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label style={labelStyle(theme)}>Priority level</label>
                <select 
                  value={formData.priority}
                  onChange={(e) => setFormData({...formData, priority: e.target.value})}
                  style={inputStyle(theme)}
                >
                  <option value="Low">Low - General inquiry</option>
                  <option value="Medium">Medium - Improvement/Minor bug</option>
                  <option value="High">High - Urgent issue</option>
                  <option value="Critical">Critical - Safety/Blocking</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={labelStyle(theme)}>Subject</label>
              <input 
                type="text" 
                placeholder="Give your ticket a clear subject"
                value={formData.subject}
                onChange={(e) => setFormData({...formData, subject: e.target.value})}
                required
                style={inputStyle(theme)}
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={labelStyle(theme)}>Detailed Description</label>
              <textarea 
                rows={5}
                placeholder="Describe your issue in detail so we can help you better..."
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                required
                style={{...inputStyle(theme), resize: 'vertical'}}
              />
            </div>

            <div 
              onClick={handleUploadClick}
              style={{ 
                border: `2px dashed ${theme.palette.divider}`, 
                borderRadius: '16px', 
                padding: '2rem', 
                textAlign: 'center',
                marginBottom: '2rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
                // The hover effect is now handled by the global style tag or sx prop if this were a MUI component
              }} className="upload-area">
              <input 
                type="file" 
                ref={fileInputRef} 
                style={{ display: 'none' }} 
                onChange={(e) => console.log('File selected:', e.target.files?.[0])}
                multiple
              />
              <div style={{ color: theme.palette.text.secondary, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                <ImageIcon size={32} strokeWidth={1.5} />
                <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                  Click to upload screenshots or drag and drop
                </div>
                <div style={{ fontSize: '0.75rem' }}>PNG, JPG or PDF (MAX. 5MB)</div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button type="button" 
                onClick={() => setView('history')}
                style={{
                  backgroundColor: 'transparent',
                  color: theme.palette.text.secondary,
                  border: `1.5px solid ${theme.palette.divider}`,
                  padding: '0.875rem 2rem',
                  borderRadius: '12px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}>Cancel</button>
              <button 
                type="submit" 
                disabled={loading}
                style={{
                  backgroundColor: theme.palette.primary.main,
                  color: 'white',
                  border: 'none',
                  padding: '0.875rem 2.5rem',
                  borderRadius: '12px',
                  fontWeight: 700,
                  cursor: loading ? 'wait' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  boxShadow: theme.palette.mode === 'light' ? `0 10px 15px -3px ${theme.palette.primary.main}40` : 'none',
                  opacity: loading ? 0.7 : 1
                }}>
                {loading ? <Loader2 className="spin" size={18} /> : <Send size={18} />}
                {loading ? 'Submitting...' : 'Submit Ticket'}
              </button>
            </div>
            
            <div style={{ 
              marginTop: '2.5rem', 
              padding: '1.25rem', 
              backgroundColor: theme.palette.info.main + '10', 
              borderRadius: '16px',
              display: 'flex',
              gap: '1rem',
              alignItems: 'flex-start',
              border: `1px solid ${theme.palette.info.main}20`
            }}>
              <Info size={20} color={theme.palette.info.main} style={{ marginTop: '2px' }} />
              <p style={{ fontSize: '0.875rem', color: theme.palette.text.secondary, margin: 0, lineHeight: 1.5 }}>
                For emergencies, please contact campus security at <strong>(555) 123-4567</strong>.
              </p>
            </div>
          </form>
        ) : (
          <Box>
            <TicketHistory />
          </Box>
        )}
      </div>

      <style>{`
        .upload-area:hover { border-color: ${theme.palette.primary.main}; background-color: ${theme.palette.primary.main}05; }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
};

const TicketHistory = () => {
    const theme = useTheme();
    const [tickets, setTickets] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        const loadTickets = async () => {
             try {
                 const data = await api.fetchTickets();
                 if (Array.isArray(data)) setTickets(data);
             } catch (e) {
                 console.error("Failed to load tickets", e);
             } finally {
                 setLoading(false);
             }
        };
        loadTickets();
    }, []);

    if (loading) return (
        <Box display="flex" justifyContent="center" alignItems="center" py={10}>
            <CircularProgress size={40} thickness={4} />
        </Box>
    );
    
    if (tickets.length === 0) return (
        <Paper elevation={0} sx={{ 
            textAlign: 'center', 
            py: 10, 
            borderRadius: '32px', 
            border: `2px dashed ${theme.palette.divider}`,
            background: 'transparent',
            opacity: 0.8
        }}>
            <Box sx={{ 
                width: 80, height: 80, borderRadius: '50%', 
                bgcolor: theme.palette.action.selected, 
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 1.5rem'
            }}>
                <MessageSquare size={40} style={{ opacity: 0.2 }} />
            </Box>
            <Typography variant="h5" fontWeight="800" gutterBottom>No Tickets Found</Typography>
            <Typography variant="body1" color="text.secondary">All your support requests will be listed here.</Typography>
        </Paper>
    );

    const getStatusGradient = (status: string) => {
        const s = status?.toLowerCase() || 'open';
        switch (s) {
            case 'open': return 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
            case 'pending': return 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
            case 'closed': return 'linear-gradient(135deg, #64748b 0%, #475569 100%)';
            default: return 'linear-gradient(135deg, #94a3b8 0%, #64748b 100%)';
        }
    };

    return (
        <div style={{ display: 'grid', gap: '1.5rem' }}>
            {tickets.map(ticket => {
                const statusStr = ticket.status?.toLowerCase() || 'open';
                const statusColor = statusStr === 'open' ? '#10b981' : 
                                  statusStr === 'pending' ? '#f59e0b' : '#64748b';
                
                return (
                    <Paper key={`${ticket.id}-${statusStr}`} elevation={0} sx={{
                        p: 0,
                        backgroundColor: theme.palette.background.paper,
                        borderRadius: '24px',
                        border: `1px solid ${theme.palette.divider}`,
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        {/* Status Header Bar */}
                        <Box sx={{ 
                            height: '6px', 
                            background: getStatusGradient(ticket.status)
                        }} />

                        <Box sx={{ p: 3 }}>
                            <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                                <Box display="flex" gap={1.5} alignItems="center">
                                    <Box sx={{ 
                                        p: 1.5, 
                                        borderRadius: '12px', 
                                        bgcolor: `${statusColor}10`,
                                        color: statusColor,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        <Tag size={20} />
                                    </Box>
                                    <div>
                                        <Typography variant="h6" fontWeight="700" sx={{ lineHeight: 1.3 }}>
                                            {ticket.subject}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                                            <Clock size={12} /> {new Date(ticket.created_at).toLocaleDateString()} • {ticket.category || 'Support'}
                                        </Typography>
                                    </div>
                                </Box>
                                <Chip 
                                    label={statusStr.charAt(0).toUpperCase() + statusStr.slice(1)} 
                                    size="small"
                                    sx={{ 
                                        fontWeight: 800, 
                                        fontSize: '0.65rem',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.05em',
                                        bgcolor: `${statusColor}15`,
                                        color: statusColor,
                                        border: `1px solid ${statusColor}30`,
                                        borderRadius: '6px',
                                        px: 0.5
                                    }} 
                                />
                            </Box>

                            <Typography variant="body2" color="text.secondary" sx={{ 
                                mb: 3, 
                                lineHeight: 1.6,
                                color: theme.palette.text.secondary,
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden'
                            }}>
                                {ticket.message}
                            </Typography>

                            <Box display="flex" justifyContent="space-between" alignItems="center">
                                <Box display="flex" gap={2}>
                                    <Box display="flex" alignItems="center" gap={0.5} sx={{ color: ticket.priority?.toLowerCase() === 'high' ? theme.palette.error.main : theme.palette.text.secondary }}>
                                        <AlertTriangle size={14} />
                                        <Typography variant="caption" fontWeight="600" sx={{ textTransform: 'capitalize' }}>
                                            {ticket.priority || 'Normal'} Priority
                                        </Typography>
                                    </Box>
                                </Box>
                                <Box display="flex" alignItems="center" gap={0.5} sx={{ 
                                    color: theme.palette.primary.main, 
                                    fontWeight: 700, 
                                    fontSize: '0.8rem'
                                }}>
                                    View Conversation <ChevronRight size={16} />
                                </Box>
                            </Box>
                        </Box>
                    </Paper>
                );
            })}
        </div>
    );
}


const labelStyle = (theme: any) => ({
  display: 'block',
  fontSize: '0.875rem',
  fontWeight: 600,
  color: theme.palette.text.secondary,
  marginBottom: '0.5rem'
});

const inputStyle = (theme: any) => ({
  width: '100%',
  padding: '0.875rem 1rem',
  borderRadius: '12px',
  border: `1.5px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.background.default,
  color: theme.palette.text.primary,
  outline: 'none',
  fontSize: '0.9375rem',
  transition: 'border-color 0.2s',
  '&:focus': {
    borderColor: theme.palette.primary.main
  }
} as any);

export default ReportPage;
