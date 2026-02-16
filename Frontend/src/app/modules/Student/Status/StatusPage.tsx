import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useTheme } from '@mui/material/styles';
import { 
  ShieldCheck, 
  MapPin, 
  Clock, 
  Calendar,
  AlertTriangle,
  FileText,
  ExternalLink,
  Car,
  Loader2
} from 'lucide-react';
import { IRootState } from '@app/appReducer';
import { api } from '@utils/services/api';
import Notification, { NotificationType } from '@shared/components/legacy/Notification';

const StatusPage: React.FC = () => {
  const theme = useTheme();
  // const dispatch = useDispatch();
  const { user } = useSelector((state: IRootState) => state.app.auth);
  
  const [loading, setLoading] = useState(true);
  const [permit, setPermit] = useState<any>(null);
  const [vehicle, setVehicle] = useState<any>(null);
  const [notification, setNotification] = useState<{ message: string, type: NotificationType } | null>(null);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    loadData();
  }, [user?.id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [permitData, vehicleData] = await Promise.all([
        api.fetchActivePermit(),
        api.fetchVehicle()
      ]);
      setPermit(permitData);
      setVehicle(vehicleData);
    } catch (err) {
      console.error('Failed to load status data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyPermit = async () => {
    if (!vehicle?.vehicle_number) {
      setNotification({ message: 'Please register a vehicle first.', type: 'error' });
      return;
    }

    try {
      setApplying(true);
      const newPermit = await api.applyPermit({
        vehicle_number: vehicle.vehicle_number,
        permit_type: 'Standard', // Default for now
        zone: 'Zone A' // Default/Auto-assigned
      });
      setPermit(newPermit);
      setNotification({ message: 'Permit application successful!', type: 'success' });
    } catch (err: any) {
      setNotification({ message: err.message || 'Failed to apply for permit', type: 'error' });
    } finally {
      setApplying(false);
    }
  };

  const calculateTimeRemaining = (expiryDate: string) => {
    const now = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = Math.abs(expiry.getTime() - now.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > 30) {
      const months = Math.floor(diffDays / 30);
      return `${months} Month${months > 1 ? 's' : ''}`;
    }
    return `${diffDays} Day${diffDays > 1 ? 's' : ''}`;
  };

  const calculateProgress = (issueDate: string, expiryDate: string) => {
    const start = new Date(issueDate).getTime();
    const end = new Date(expiryDate).getTime();
    const now = new Date().getTime();
    
    if (now > end) return 0;
    if (now < start) return 100;
    
    const total = end - start;
    const remaining = end - now;
    return (remaining / total) * 100;
  };

  if (loading) {
    return <div style={{ padding: '4rem', textAlign: 'center' }}>Loading status...</div>;
  }

  return (
    <>
      {notification && (
        <Notification 
          message={notification.message} 
          type={notification.type} 
          onClose={() => setNotification(null)} 
        />
      )}

      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <header style={{ marginBottom: '2.5rem' }}>
          <h1 style={{ 
            fontSize: '2rem', 
            fontWeight: 800, 
            color: theme.palette.text.primary, 
            marginBottom: '0.5rem',
            letterSpacing: '-0.025em'
          }}>Parking Status</h1>
          <p style={{ color: theme.palette.text.secondary }}>Overview of your active parking permits and assignments.</p>
        </header>

        {!permit ? (
      <div style={{ 
            backgroundColor: theme.palette.background.paper,
            padding: '3rem',
            borderRadius: '24px',
            border: theme.palette.mode === 'dark' ? `1px solid ${theme.palette.divider}` : 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center'
          }}>
            <div style={{ 
              backgroundColor: theme.palette.warning.main + '10',
              color: theme.palette.warning.main,
              padding: '1.5rem',
              borderRadius: '24px',
              marginBottom: '1.5rem'
            }}>
              <AlertTriangle size={48} />
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: theme.palette.text.primary, marginBottom: '1rem' }}>No Active Permit Found</h2>
            <p style={{ color: theme.palette.text.secondary, maxWidth: '500px', marginBottom: '2rem', lineHeight: 1.6 }}>
              You don't have an active parking permit for the current semester. 
              {!vehicle?.vehicle_number ? ' Please register a vehicle first.' : ' You can apply for one now.'}
            </p>
            
            {!vehicle?.vehicle_number ? (
               <div style={{ 
                 padding: '1rem', 
                 backgroundColor: theme.palette.action.hover, 
                 borderRadius: '12px',
                 display: 'flex',
                 alignItems: 'center',
                 gap: '0.5rem',
                 color: theme.palette.text.secondary
               }}>
                 <Car size={16} /> Register a vehicle in the 'Vehicles' tab to apply.
               </div>
            ) : (
              <button 
                onClick={handleApplyPermit}
                disabled={applying}
                style={{
                  backgroundColor: theme.palette.primary.main,
                  color: 'white',
                  border: 'none',
                  padding: '0.875rem 2.5rem',
                  borderRadius: '12px',
                  fontWeight: 600,
                  cursor: applying ? 'wait' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                {applying && <Loader2 className="spin" size={18} />}
                Apply for Standard Permit
              </button>
            )}
          </div>
        ) : permit.status === 'Pending' ? (
          /* Pending State UI */
          <div style={{ 
            backgroundColor: theme.palette.background.paper,
            padding: '3rem',
            borderRadius: '24px',
            border: theme.palette.mode === 'dark' ? `1px solid ${theme.palette.divider}` : 'none',
            display: 'flex', // Corrected display property
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center'
          }}>
            <div style={{ 
              backgroundColor: theme.palette.info.main + '10',
              color: theme.palette.info.main,
              padding: '1.5rem',
              borderRadius: '24px',
              marginBottom: '1.5rem'
            }}>
              <Clock size={48} />
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: theme.palette.text.primary, marginBottom: '1rem' }}>Application Under Review</h2>
            <p style={{ color: theme.palette.text.secondary, maxWidth: '500px', marginBottom: '2rem', lineHeight: 1.6 }}>
              Your application for a <strong>{permit.permit_type} Permit</strong> for vehicle <strong>{permit.vehicle_number}</strong> has been submitted and is currently pending approval by the administration.
            </p>
            <div style={{ 
              padding: '1rem 2rem', 
              backgroundColor: theme.palette.background.default, 
              borderRadius: '12px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.75rem',
              fontWeight: 600,
              color: theme.palette.text.secondary,
              border: `1px solid ${theme.palette.divider}`
            }}>
               <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: theme.palette.info.main }}></div>
               Status: Pending Approval
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
            {/* Status Card */}
            <div style={{ 
              gridColumn: '1 / -1',
              backgroundColor: theme.palette.background.paper,
              borderRadius: '24px',
              padding: '2rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              boxShadow: theme.palette.mode === 'light' ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)' : 'none',
              border: theme.palette.mode === 'dark' ? `1px solid ${theme.palette.divider}` : 'none'
            }}>
              <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                <div style={{ 
                  backgroundColor: theme.palette.success.main + '10',
                  color: theme.palette.success.main,
                  padding: '1.5rem',
                  borderRadius: '24px'
                }}>
                  <ShieldCheck size={40} />
                </div>
                <div>
                  <div style={{ 
                    backgroundColor: theme.palette.success.main + '15',
                    color: theme.palette.success.main,
                    padding: '0.25rem 0.75rem',
                    borderRadius: '20px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    marginBottom: '0.5rem'
                  }}>
                    {permit.status.toUpperCase()}
                  </div>
                  <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: theme.palette.text.primary }}>{permit.permit_type} Permit</h2>
                  <p style={{ color: theme.palette.text.secondary, margin: 0 }}>Valid for vehicle: <strong>{permit.vehicle_number}</strong></p>
                </div>
              </div>
              <div style={{ textAlign: 'right', display: 'block' }}>
                <div style={{ fontSize: '0.875rem', color: theme.palette.text.secondary }}>Expires On</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: theme.palette.text.primary }}>{new Date(permit.expiry_date).toLocaleDateString()}</div>
              </div>
            </div>

            {/* Location Details */}
            <div style={{ 
              backgroundColor: theme.palette.background.paper,
              borderRadius: '24px',
              padding: '2rem',
              border: theme.palette.mode === 'dark' ? `1px solid ${theme.palette.divider}` : 'none',
              boxShadow: theme.palette.mode === 'light' ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)' : 'none'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <div style={{ color: theme.palette.primary.main }}><MapPin size={24} /></div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Assigned Location</h3>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div>
                  <div style={{ fontSize: '0.875rem', color: theme.palette.text.secondary, marginBottom: '0.25rem' }}>Parking Zone</div>
                  <div style={{ fontWeight: 600, color: theme.palette.text.primary }}>{permit.zone}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.875rem', color: theme.palette.text.secondary, marginBottom: '0.25rem' }}>Specific Spot</div>
                  <div style={{ 
                    fontSize: '2rem', 
                    fontWeight: 800, 
                    color: theme.palette.primary.main,
                    letterSpacing: '0.05em' 
                  }}>{permit.spot}</div>
                </div>
              </div>
            </div>

            {/* Time Details */}
            <div style={{ 
              backgroundColor: theme.palette.background.paper,
              borderRadius: '24px',
              padding: '2rem',
              border: theme.palette.mode === 'dark' ? `1px solid ${theme.palette.divider}` : 'none',
              boxShadow: theme.palette.mode === 'light' ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)' : 'none'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <div style={{ color: theme.palette.info.main }}><Clock size={24} /></div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Validity Period</h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ color: theme.palette.text.secondary }}><Calendar size={20} /></div>
                  <div>
                    <div style={{ fontSize: '0.875rem', color: theme.palette.text.secondary }}>Renewal Date</div>
                    <div style={{ fontWeight: 600, color: theme.palette.text.primary }}>{new Date(new Date(permit.expiry_date).getTime() + 86400000).toLocaleDateString()}</div>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.875rem', color: theme.palette.text.secondary, marginBottom: '0.75rem' }}>Time Remaining</div>
                  <div style={{ 
                    height: '10px', 
                    backgroundColor: theme.palette.divider, 
                    borderRadius: '5px',
                    overflow: 'hidden',
                    marginBottom: '0.5rem'
                  }}>
                    <div style={{ 
                      width: `${calculateProgress(permit.issue_date, permit.expiry_date)}%`, 
                      height: '100%', 
                      backgroundColor: theme.palette.success.main 
                    }}></div>
                  </div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: theme.palette.success.main }}>
                    {calculateTimeRemaining(permit.expiry_date)} Left
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div style={{ 
              backgroundColor: theme.palette.background.paper,
              borderRadius: '24px',
              padding: '2rem',
              border: theme.palette.mode === 'dark' ? `1px solid ${theme.palette.divider}` : 'none',
              boxShadow: theme.palette.mode === 'light' ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)' : 'none',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.5rem'
            }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Resources</h3>
              
              <a href="#" style={{ ...linkStyle, color: theme.palette.text.primary, borderBottom: `1px solid ${theme.palette.divider}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <FileText size={20} color={theme.palette.primary.main} />
                  Download Permit PDF
                </div>
                <ExternalLink size={16} color={theme.palette.text.secondary} />
              </a>

              <a href="#" style={{ ...linkStyle, color: theme.palette.text.primary, borderBottom: `1px solid ${theme.palette.divider}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <MapPin size={20} color={theme.palette.primary.main} />
                  View Campus Parking Map
                </div>
                <ExternalLink size={16} color={theme.palette.text.secondary} />
              </a>

              <a href="#" style={{ ...linkStyle, color: theme.palette.text.primary }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <AlertTriangle size={20} color={theme.palette.warning.main} />
                  Parking Rules & Regulations
                </div>
                <ExternalLink size={16} color={theme.palette.text.secondary} />
              </a>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
};

const linkStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '1rem 0',
  textDecoration: 'none',
  fontSize: '0.9375rem',
  fontWeight: 500,
  transition: 'all 0.2s'
};

export default StatusPage;
