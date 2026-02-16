import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useTheme } from '@mui/material/styles';
import { 
  Car, 
  Shield,
  Edit2,
  Camera,
  X,
  Save,
  Loader2
} from 'lucide-react';
import { IRootState } from '@app/appReducer';
import { api } from '@utils/services/api';
import { receiveUserData } from '@modules/Auth/authActions';
import Notification, { NotificationType } from '@shared/components/legacy/Notification';

const ProfilePage: React.FC = () => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { user } = useSelector((state: IRootState) => state.app.auth);
  const isDark = theme.palette.mode === 'dark';

  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [vehicle, setVehicle] = useState<any>(null);
  
  // Edit Modal State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: '',
    department: '',
    student_id: ''
  });
  const [saving, setSaving] = useState(false);

  // Notification State
  const [notification, setNotification] = useState<{ message: string, type: NotificationType } | null>(null);

  useEffect(() => {
    loadProfileData();
  }, [user?.id]);

  const loadProfileData = async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      
      const promises: Promise<any>[] = [api.fetchUserProfile(user.id)];
      
      // Only fetch vehicle for students
      if (user.role === 'student') {
          promises.push(api.fetchVehicle());
      }

      const results = await Promise.all(promises);
      setProfile(results[0]);
      
      if (user.role === 'student' && results[1]) {
          setVehicle(results[1]);
      }
    } catch (err) {
      console.error('Failed to load profile data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = () => {
    setEditForm({
      full_name: profile?.full_name || user?.full_name || '',
      department: profile?.department || '',
      student_id: profile?.student_id || ''
    });
    setIsEditOpen(true);
  };

  const handleSaveProfile = async () => {
    if (!user?.id) return;
    try {
      setSaving(true);
      const updatedProfile = await api.updateUserProfile(user.id, {
        full_name: editForm.full_name,
        department: editForm.department
      });
      
      setProfile(updatedProfile);
      dispatch(receiveUserData({ ...user, ...updatedProfile }));
      setIsEditOpen(false);
      setNotification({ message: 'Profile updated successfully!', type: 'success' });
    } catch (err) {
      setNotification({ message: 'Failed to update profile.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading && !profile) {
    return <div style={{ padding: '4rem', textAlign: 'center' }}>Loading profile...</div>;
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

      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <header style={{ marginBottom: '3rem' }}>
          <h1 style={{ 
            fontSize: '2.25rem', 
            fontWeight: 800, 
            color: theme.palette.text.primary, 
            marginBottom: '0.5rem',
            letterSpacing: '-0.025em'
          }}>My Profile</h1>
          <p style={{ color: theme.palette.text.secondary }}>Manage your personal information and account preferences.</p>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2.5rem' }}>
          {/* Left Column - Avatar & Quick Info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ 
              backgroundColor: theme.palette.background.paper,
              padding: '2rem',
              borderRadius: '24px',
              textAlign: 'center',
              border: isDark ? `1px solid ${theme.palette.divider}` : 'none',
              boxShadow: !isDark ? '0 10px 15px -3px rgba(0,0,0,0.05)' : 'none'
            }}>
              <div style={{ position: 'relative', width: '120px', height: '120px', margin: '0 auto 1.5rem' }}>
                <div style={{ 
                  width: '100%', 
                  height: '100%', 
                  borderRadius: '32px', 
                  backgroundColor: theme.palette.primary.main + '15',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: theme.palette.primary.main,
                  fontSize: '2.5rem',
                  fontWeight: 700
                }}>
                  {profile?.full_name?.charAt(0) || user?.full_name?.charAt(0)}
                </div>
                <button style={{
                  position: 'absolute',
                  bottom: '-5px',
                  right: '-5px',
                  width: '36px',
                  height: '36px',
                  borderRadius: '12px',
                  backgroundColor: theme.palette.primary.main,
                  color: 'white',
                  border: `3px solid ${theme.palette.background.paper}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}>
                  <Camera size={16} />
                </button>
              </div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 0.25rem' }}>{profile?.full_name || user?.full_name}</h2>
              <p style={{ color: theme.palette.text.secondary, fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                  {user?.role === 'student' ? `Student ID: ${profile?.student_id || 'N/A'}` : capitalize(user?.role || 'User')}
              </p>
              
              <div style={{ 
                backgroundColor: theme.palette.success.main + '10',
                color: theme.palette.success.main,
                padding: '0.5rem',
                borderRadius: '12px',
                fontSize: '0.75rem',
                fontWeight: 700,
                display: 'inline-block'
              }}>
                ACCOUNT ACTIVE
              </div>
            </div>

            {user?.role === 'student' && (
             <div style={{ 
               backgroundColor: theme.palette.background.paper,
               padding: '1.5rem',
               borderRadius: '24px',
               border: isDark ? `1px solid ${theme.palette.divider}` : 'none',
               boxShadow: !isDark ? '0 4px 6px -1px rgba(0,0,0,0.05)' : 'none'
             }}>
               <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: theme.palette.text.secondary, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>Active Permit</h3>
               <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                 <div style={{ color: theme.palette.primary.main }}><Shield size={20} /></div>
                 <div>
                   <div style={{ fontWeight: 600, fontSize: '0.9375rem' }}>Zone A - Standard</div>
                   <div style={{ fontSize: '0.75rem', color: theme.palette.text.secondary }}>Expires: {profile?.permit_expiry ? new Date(profile.permit_expiry).toLocaleDateString() : 'No active permit'}</div>
                 </div>
               </div>
             </div>
            )}
           </div>

           {/* Right Column - Forms/Details */}
           <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
             <div style={sectionCardStyle(theme, isDark)}>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                 <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Personal Information</h3>
                 <button onClick={handleEditClick} style={editButtonStyle(theme)}>
                   <Edit2 size={16} />
                   Edit Details
                 </button>
               </div>

               <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
                 <div style={fieldStyle}>
                   <label style={labelStyle(theme)}>Full Name</label>
                   <div style={valueStyle(theme)}>{profile?.full_name || user?.full_name}</div>
                 </div>
                 <div style={fieldStyle}>
                   <label style={labelStyle(theme)}>Department</label>
                   <div style={valueStyle(theme)}>{profile?.department || 'Not set'}</div>
                 </div>
                  <div style={fieldStyle}>
                   <label style={labelStyle(theme)}>{user?.role === 'student' ? 'Student ID' : 'User ID'}</label>
                   <div style={{ ...valueStyle(theme), fontFamily: 'monospace', fontSize: '0.875rem' }}>
                       {user?.role === 'student' ? (profile?.student_id || 'N/A') : user?.id}
                   </div>
                 </div>
               </div>
             </div>

             {user?.role === 'student' && (
             <div style={sectionCardStyle(theme, isDark)}>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                 <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Vehicle Details</h3>
                 {/* Vehicle management is done on Vehicles page */}
               </div>

               {vehicle?.vehicle_number ? (
                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                   <div style={fieldStyle}>
                     <label style={labelStyle(theme)}>Primary Vehicle</label>
                     <div style={{ ...valueStyle(theme), display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                       <Car size={18} color={theme.palette.primary.main} />
                       {vehicle.vehicle_number}
                     </div>
                   </div>
                   <div style={fieldStyle}>
                     <label style={labelStyle(theme)}>Type</label>
                     <div style={valueStyle(theme)}>{vehicle.vehicle_type}</div>
                   </div>
                   <div style={fieldStyle}>
                     <label style={labelStyle(theme)}>Make & Model</label>
                     <div style={valueStyle(theme)}>{vehicle.vehicle_make_model || 'N/A'}</div>
                   </div>
                   <div style={fieldStyle}>
                     <label style={labelStyle(theme)}>Color</label>
                     <div style={valueStyle(theme)}>{vehicle.vehicle_color || 'N/A'}</div>
                   </div>
                 </div>
               ) : (
                 <div style={{ color: theme.palette.text.secondary, textAlign: 'center', padding: '1rem' }}>
                   No vehicle registered. Go to Vehicles page to add one.
                 </div>
               )}
             </div>
             )}
           </div>
         </div>
       </div>

      {/* Edit Profile Modal */}
      {isEditOpen && (
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
          padding: '1rem'
        }}>
          <div style={{
            backgroundColor: theme.palette.background.paper,
            borderRadius: '24px',
            width: '100%',
            maxWidth: '500px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            overflow: 'hidden'
          }}>
            <div style={{ 
              padding: '1.5rem', 
              borderBottom: `1px solid ${theme.palette.divider}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Edit Profile</h2>
              <button 
                onClick={() => setIsEditOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.palette.text.secondary }}
              >
                <X size={20} />
              </button>
            </div>
            
            <div style={{ padding: '2rem' }}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={labelStyle(theme)}>Full Name</label>
                <input 
                  type="text" 
                  value={editForm.full_name} 
                  onChange={(e) => setEditForm({...editForm, full_name: e.target.value})}
                  style={inputStyle(theme)}
                />
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={labelStyle(theme)}>Department</label>
                <input 
                  type="text" 
                  value={editForm.department} 
                  onChange={(e) => setEditForm({...editForm, department: e.target.value})}
                  style={inputStyle(theme)}
                />
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '2rem' }}>
                 <button 
                  onClick={() => setIsEditOpen(false)}
                  style={{
                    flex: 1,
                    padding: '0.875rem',
                    borderRadius: '12px',
                    border: `1px solid ${theme.palette.divider}`,
                    backgroundColor: 'transparent',
                    fontWeight: 600,
                    cursor: 'pointer',
                    color: theme.palette.text.primary
                  }}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSaveProfile}
                  disabled={saving}
                  style={{
                    flex: 1,
                    padding: '0.875rem',
                    borderRadius: '12px',
                    border: 'none',
                    backgroundColor: theme.palette.primary.main,
                    color: 'white',
                    fontWeight: 600,
                    cursor: saving ? 'wait' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}
                >
                  {saving ? <Loader2 className="spin" size={18} /> : <Save size={18} />}
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .hover-lift:hover { transform: translateY(-2px); }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
};

const sectionCardStyle = (theme: any, isDark: boolean) => ({
  backgroundColor: theme.palette.background.paper,
  padding: '2.5rem',
  borderRadius: '32px',
  border: isDark ? `1px solid ${theme.palette.divider}` : 'none',
  boxShadow: !isDark ? '0 10px 15px -3px rgba(0,0,0,0.05)' : 'none'
});

const fieldStyle = {
  display: 'flex',
  flexDirection: 'column' as any,
  gap: '0.5rem'
};

const labelStyle = (theme: any) => ({
  display: 'block',
  fontSize: '0.8125rem',
  fontWeight: 600,
  color: theme.palette.text.secondary,
  textTransform: 'uppercase' as any,
  letterSpacing: '0.05em',
  marginBottom: '0.5rem'
});

const valueStyle = (theme: any) => ({
  fontSize: '1rem',
  fontWeight: 500,
  color: theme.palette.text.primary,
  padding: '0.75rem 1rem',
  backgroundColor: theme.palette.background.default,
  borderRadius: '12px',
  border: `1px solid ${theme.palette.divider}`
});

const inputStyle = (theme: any) => ({
  width: '100%',
  padding: '0.75rem 1rem',
  borderRadius: '12px',
  border: `1.5px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.background.default,
  color: theme.palette.text.primary,
  fontSize: '1rem',
  outline: 'none'
});

const editButtonStyle = (theme: any) => ({
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  backgroundColor: theme.palette.primary.main + '10',
  color: theme.palette.primary.main,
  border: 'none',
  padding: '0.625rem 1rem',
  borderRadius: '12px',
  fontWeight: 600,
  fontSize: '0.875rem',
  cursor: 'pointer',
  transition: 'all 0.2s'
});

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export default ProfilePage;
