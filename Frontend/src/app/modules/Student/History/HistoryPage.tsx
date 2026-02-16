import React, { useState, useEffect } from 'react';
import { useTheme } from '@mui/material/styles';
import { 
  Search, 
  Filter, 
  Download,
  Calendar,
  ArrowUpRight,
  Loader2,
  X,
  FileText
} from 'lucide-react';
import { api } from '@utils/services/api';

const HistoryPage: React.FC = () => {
  const theme = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Feature States
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedPermit, setSelectedPermit] = useState<any>(null); // For Details Modal

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const data = await api.fetchPermitHistory();
      setHistoryData(data);
    } catch (err) {
      console.error('Failed to load history', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredData = historyData.filter(row => {
    const matchesSearch = 
      row.zone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.spot?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      new Date(row.issue_date).toLocaleDateString().includes(searchTerm);
      
    const matchesStatus = statusFilter === 'All' || row.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleExport = () => {
    if (filteredData.length === 0) return;

    const headers = ['Issue Date', 'Expiry Date', 'Type', 'Zone', 'Spot', 'Status'];
    const csvContent = [
      headers.join(','),
      ...filteredData.map(row => [
        new Date(row.issue_date).toLocaleDateString(),
        new Date(row.expiry_date).toLocaleDateString(),
        row.permit_type,
        row.zone,
        row.spot,
        row.status
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `parking_history_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <header style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'flex-end', 
          marginBottom: '2.5rem' 
        }}>
          <div>
            <h1 style={{ 
              fontSize: '2rem', 
              fontWeight: 800, 
              color: theme.palette.text.primary, 
              marginBottom: '0.5rem',
              letterSpacing: '-0.025em'
            }}>Parking History</h1>
            <p style={{ color: theme.palette.text.secondary }}>Review your previous parking sessions and durations.</p>
          </div>
          <button 
            onClick={handleExport}
            style={{
              backgroundColor: theme.palette.primary.main,
              color: 'white',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '12px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              cursor: filteredData.length === 0 ? 'not-allowed' : 'pointer',
              opacity: filteredData.length === 0 ? 0.6 : 1,
              boxShadow: theme.palette.mode === 'light' ? '0 10px 15px -3px rgba(99, 102, 241, 0.3)' : 'none'
            }}
          >
            <Download size={20} />
            Export Data
          </button>
        </header>

        {/* Filters/Search Bar */}
        <div style={{ 
          backgroundColor: theme.palette.background.paper, 
          padding: '1.25rem', 
          borderRadius: '16px',
          marginBottom: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          boxShadow: theme.palette.mode === 'light' ? '0 1px 3px rgba(0,0,0,0.05)' : 'none',
          border: theme.palette.mode === 'dark' ? `1px solid ${theme.palette.divider}` : 'none'
        }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', width: '100%' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search 
              size={18} 
              style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: theme.palette.text.secondary }} 
            />
            <input 
              type="text" 
              placeholder="Search by date, zone, or spot..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem 1rem 0.75rem 2.75rem',
                borderRadius: '10px',
                border: `1.5px solid ${theme.palette.divider}`,
                backgroundColor: theme.palette.background.default,
                color: theme.palette.text.primary,
                outline: 'none',
                fontSize: '0.875rem'
              }}
            />
          </div>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            style={{
             backgroundColor: showFilters ? theme.palette.primary.main : theme.palette.background.default,
             border: showFilters ? 'none' : `1.5px solid ${theme.palette.divider}`,
             padding: '0.75rem 1rem',
             borderRadius: '10px',
             color: showFilters ? 'white' : theme.palette.text.secondary,
             cursor: 'pointer',
             display: 'flex',
             alignItems: 'center',
             gap: '0.5rem',
             fontWeight: 500,
             transition: 'all 0.2s'
          }}>
            <Filter size={18} />
            Filters
          </button>
          </div>
          
          {showFilters && (
            <div style={{ 
              paddingTop: '1rem', 
              borderTop: `1px solid ${theme.palette.divider}`,
              display: 'flex',
              gap: '1rem',
              width: '100%'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: theme.palette.text.secondary }}>Status</span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {['All', 'Active', 'Completed', 'Expired'].map(status => (
                    <button
                      key={status}
                      onClick={() => setStatusFilter(status)}
                      style={{
                        padding: '0.5rem 1rem',
                        borderRadius: '8px',
                        border: 'none',
                        backgroundColor: statusFilter === status ? theme.palette.primary.main : theme.palette.action.hover,
                        color: statusFilter === status ? 'white' : theme.palette.text.primary,
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Table Container */}
        <div style={{ 
          backgroundColor: theme.palette.background.paper, 
          borderRadius: '24px',
          overflow: 'hidden',
          boxShadow: theme.palette.mode === 'light' ? '0 4px 6px -1px rgba(0, 0, 0, 0.05)' : 'none',
          border: theme.palette.mode === 'dark' ? `1px solid ${theme.palette.divider}` : 'none'
        }}>
          {loading ? (
             <div style={{ padding: '3rem', textAlign: 'center' }}><Loader2 className="spin" /> Loading history...</div>
          ) : filteredData.length === 0 ? (
             <div style={{ padding: '3rem', textAlign: 'center', color: theme.palette.text.secondary }}>No history found.</div>
          ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: theme.palette.mode === 'light' ? '#f8fafc' : '#1e1e2d' }}>
                  {['Issue Date', 'Expiry Date', 'Permit Type', 'Location', 'Status', ''].map((head) => (
                    <th key={head} style={{ 
                      padding: '1.25rem 1.5rem', 
                      fontSize: '0.75rem', 
                      fontWeight: 700, 
                      textTransform: 'uppercase', 
                      letterSpacing: '0.05em',
                      color: theme.palette.text.secondary,
                      borderBottom: `1px solid ${theme.palette.divider}`
                    }}>
                      {head}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredData.map((row, i) => (
                  <tr key={row.id} style={{ 
                    borderBottom: i === filteredData.length - 1 ? 'none' : `1px solid ${theme.palette.divider}`,
                    transition: 'background-color 0.2s'
                  }} className="table-row">
                    <td style={{ padding: '1.25rem 1.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ color: theme.palette.primary.main }}><Calendar size={16} /></div>
                        <div style={{ fontWeight: 600, color: theme.palette.text.primary }}>{new Date(row.issue_date).toLocaleDateString()}</div>
                      </div>
                    </td>
                    <td style={{ padding: '1.25rem 1.5rem', color: theme.palette.text.primary }}>{new Date(row.expiry_date).toLocaleDateString()}</td>
                    <td style={{ padding: '1.25rem 1.5rem', color: theme.palette.text.primary }}>{row.permit_type}</td>
                    <td style={{ padding: '1.25rem 1.5rem' }}>
                      <div style={{ fontSize: '0.875rem', fontWeight: 600, color: theme.palette.text.primary }}>{row.zone}</div>
                      <div style={{ fontSize: '0.75rem', color: theme.palette.text.secondary }}>Spot: {row.spot}</div>
                    </td>
                    <td style={{ padding: '1.25rem 1.5rem' }}>
                      <div style={{ 
                        backgroundColor: theme.palette.text.disabled + '20', 
                        color: theme.palette.text.disabled,
                        padding: '0.25rem 0.625rem',
                        borderRadius: '20px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        display: 'inline-block'
                      }}>
                        {row.status}
                      </div>
                    </td>
                    <td style={{ padding: '1.25rem 1.5rem', textAlign: 'right' }}>
                      <button 
                        onClick={() => setSelectedPermit(row)}
                        style={{
                        background: 'none',
                        border: 'none',
                        color: theme.palette.text.secondary,
                        cursor: 'pointer',
                        padding: '0.5rem',
                        borderRadius: '8px'
                      }} className="hover-icon">
                        <ArrowUpRight size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )}
        </div>
      </div>

      {/* Details Modal */}
      {selectedPermit && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1.5rem'
        }}>
          <div style={{
            backgroundColor: theme.palette.background.paper,
            borderRadius: '24px',
            width: '100%',
            maxWidth: '500px',
            padding: '2.5rem',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            position: 'relative'
          }}>
             <button 
               onClick={() => setSelectedPermit(null)} 
               style={{ 
                 position: 'absolute', 
                 top: '1.5rem', 
                 right: '1.5rem',
                 background: 'none', 
                 border: 'none', 
                 cursor: 'pointer',
                 color: theme.palette.text.secondary
               }}
             >
               <X size={24} />
             </button>

             <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
               <div style={{ 
                 display: 'inline-flex', 
                 padding: '1rem', 
                 borderRadius: '50%', 
                 backgroundColor: theme.palette.primary.main + '10',
                 color: theme.palette.primary.main,
                 marginBottom: '1rem'
               }}>
                 <FileText size={32} />
               </div>
               <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: theme.palette.text.primary, marginBottom: '0.5rem' }}>Permit Details</h2>
               <p style={{ color: theme.palette.text.secondary }}>Full information about this parking session.</p>
             </div>

             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
               <div>
                 <div style={{ fontSize: '0.875rem', color: theme.palette.text.secondary, marginBottom: '0.25rem' }}>Permit Type</div>
                 <div style={{ fontWeight: 600, color: theme.palette.text.primary }}>{selectedPermit.permit_type}</div>
               </div>
               <div>
                 <div style={{ fontSize: '0.875rem', color: theme.palette.text.secondary, marginBottom: '0.25rem' }}>Status</div>
                 <div style={{ fontWeight: 600, color: theme.palette.text.primary }}>{selectedPermit.status}</div>
               </div>
               <div>
                 <div style={{ fontSize: '0.875rem', color: theme.palette.text.secondary, marginBottom: '0.25rem' }}>Zone</div>
                 <div style={{ fontWeight: 600, color: theme.palette.text.primary }}>{selectedPermit.zone}</div>
               </div>
                <div>
                 <div style={{ fontSize: '0.875rem', color: theme.palette.text.secondary, marginBottom: '0.25rem' }}>Spot</div>
                 <div style={{ fontWeight: 600, color: theme.palette.text.primary }}>{selectedPermit.spot}</div>
               </div>
               <div>
                 <div style={{ fontSize: '0.875rem', color: theme.palette.text.secondary, marginBottom: '0.25rem' }}>Issue Date</div>
                 <div style={{ fontWeight: 600, color: theme.palette.text.primary }}>{new Date(selectedPermit.issue_date).toLocaleDateString()}</div>
               </div>
               <div>
                 <div style={{ fontSize: '0.875rem', color: theme.palette.text.secondary, marginBottom: '0.25rem' }}>Expiry Date</div>
                 <div style={{ fontWeight: 600, color: theme.palette.text.primary }}>{new Date(selectedPermit.expiry_date).toLocaleDateString()}</div>
               </div>
             </div>

             <button 
                onClick={() => setSelectedPermit(null)}
                style={{
                  width: '100%',
                  backgroundColor: theme.palette.background.default,
                  color: theme.palette.text.primary,
                  border: `1.5px solid ${theme.palette.divider}`,
                  padding: '1rem',
                  borderRadius: '12px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
          </div>
        </div>
      )}

      <style>{`
        .table-row:hover { background-color: ${theme.palette.mode === 'light' ? '#f8fafc' : '#232334'}; }
        .hover-bg:hover { background-color: ${theme.palette.mode === 'light' ? '#f1f5f9' : '#334155'}; }
        .hover-icon:hover { color: ${theme.palette.primary.main} !important; background-color: ${theme.palette.primary.main}10; }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
};

export default HistoryPage;
