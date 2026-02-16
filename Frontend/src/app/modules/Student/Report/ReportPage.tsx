import React, { useState } from 'react';
import { useTheme } from '@mui/material/styles';
import { 
  Send, 
  Image as ImageIcon, 
  CheckCircle2,
  Info,
  Loader2
} from 'lucide-react';
import { api } from '@utils/services/api';
import Notification from '@shared/components/legacy/Notification';

const ReportPage: React.FC = () => {
  const theme = useTheme();
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    category: 'Parking',
    priority: 'Low',
    subject: '',
    description: ''
  });

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
      <>
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
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: theme.palette.text.primary, marginBottom: '1rem' }}>Issue Reported Successfully</h2>
          <p style={{ color: theme.palette.text.secondary, marginBottom: '2rem', lineHeight: 1.6 }}>
            Your ticket has been created. Our support team will review it and get back to you shortly.
          </p>
          <button 
            onClick={() => {
              setSubmitted(false);
              setFormData({ category: 'Parking', priority: 'Low', subject: '', description: '' });
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
            Report Another Issue
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      {error && <Notification message={error} type="error" onClose={() => setError(null)} />}
      
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <header style={{ marginBottom: '2.5rem' }}>
          <h1 style={{ 
            fontSize: '2rem', 
            fontWeight: 800, 
            color: theme.palette.text.primary, 
            marginBottom: '0.5rem' 
          }}>Report an Issue</h1>
          <p style={{ color: theme.palette.text.secondary }}>Encountering problems? Tell us about it and we'll help you out.</p>
        </header>

        <form onSubmit={handleSubmit} style={{ 
          backgroundColor: theme.palette.background.paper,
          padding: '2.5rem',
          borderRadius: '24px',
          boxShadow: theme.palette.mode === 'light' ? '0 4px 6px -1px rgba(0,0,0,0.05)' : 'none',
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
              placeholder="Briefly describe the issue"
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
              placeholder="Please provide as much detail as possible..."
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              required
              style={{...inputStyle(theme), resize: 'vertical'}}
            />
          </div>

          <div style={{ 
            border: `2px dashed ${theme.palette.divider}`, 
            borderRadius: '16px', 
            padding: '2rem', 
            textAlign: 'center',
            marginBottom: '2rem',
            cursor: 'pointer'
          }} className="upload-area">
            <div style={{ color: theme.palette.text.secondary, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
              <ImageIcon size={32} strokeWidth={1.5} />
              <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                Click to upload screenshots or drag and drop
              </div>
              <div style={{ fontSize: '0.75rem' }}>PNG, JPG or PDF (MAX. 5MB)</div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
            <button type="button" style={{
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
                fontWeight: 600,
                cursor: loading ? 'wait' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                boxShadow: theme.palette.mode === 'light' ? '0 10px 15px -3px rgba(99, 102, 241, 0.3)' : 'none',
                opacity: loading ? 0.7 : 1
              }}>
              {loading ? <Loader2 className="spin" size={18} /> : <Send size={18} />}
              {loading ? 'Submitting...' : 'Submit Ticket'}
            </button>
          </div>
        </form>

        <div style={{ 
          marginTop: '2rem', 
          padding: '1.5rem', 
          backgroundColor: theme.palette.info.main + '10', 
          borderRadius: '16px',
          display: 'flex',
          gap: '1rem',
          alignItems: 'flex-start'
        }}>
          <Info size={20} color={theme.palette.info.main} style={{ marginTop: '2px' }} />
          <p style={{ fontSize: '0.875rem', color: theme.palette.text.secondary, margin: 0, lineHeight: 1.5 }}>
            For immediate security assistance or emergencies, please contact the campus security office directly at <strong>(555) 123-4567</strong> or use the emergency call buttons located in each parking zone.
          </p>
        </div>
      </div>

      {/* Ticket History Section */}
      <div style={{ maxWidth: '800px', margin: '3rem auto 0' }}>
         <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: theme.palette.text.primary, marginBottom: '1.5rem' }}>My Recent Tickets</h2>
         <TicketHistory />
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

    if (loading) return <div style={{textAlign: 'center', padding: '2rem'}}>Loading...</div>;
    if (tickets.length === 0) return <div style={{textAlign: 'center', padding: '2rem', color: theme.palette.text.secondary}}>No tickets found.</div>;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {tickets.map(ticket => (
                <div key={ticket.id} style={{
                    padding: '1.5rem',
                    backgroundColor: theme.palette.background.paper,
                    borderRadius: '16px',
                    boxShadow: theme.palette.mode === 'light' ? '0 2px 4px -1px rgba(0,0,0,0.05)' : 'none',
                    border: theme.palette.mode === 'dark' ? `1px solid ${theme.palette.divider}` : 'none'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>{ticket.subject}</h4>
                        <span style={{
                            padding: '0.25rem 0.75rem',
                            borderRadius: '999px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            backgroundColor: ticket.status === 'open' ? theme.palette.success.main + '20' : theme.palette.action.selected,
                            color: ticket.status === 'open' ? theme.palette.success.main : theme.palette.text.secondary,
                            textTransform: 'capitalize'
                        }}>{ticket.status}</span>
                    </div>
                    <p style={{ margin: '0 0 0.5rem', color: theme.palette.text.secondary, fontSize: '0.9rem' }}>{ticket.message}</p>
                    <div style={{ fontSize: '0.8rem', color: theme.palette.text.disabled }}>
                        {new Date(ticket.created_at).toLocaleDateString()} • {ticket.category || 'General'}
                    </div>
                </div>
            ))}
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
