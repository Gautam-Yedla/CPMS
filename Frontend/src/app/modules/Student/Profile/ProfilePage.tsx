import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { 
  Car, 
  Shield,
  Edit2,
  Camera,
  X,
  Save,
  Loader2,
  User as UserIcon
} from 'lucide-react';
import { IRootState } from '@app/appReducer';
import { api } from '@utils/services/api';
import { receiveUserData } from '@modules/Auth/authActions';
import Notification, { NotificationType } from '@shared/components/legacy/Notification';

const ProfilePage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isSmallMobile = useMediaQuery('(max-width:400px)');
  const isTinyMobile = useMediaQuery('(max-width:340px)');
  
  const dispatch = useDispatch();
  const { user } = useSelector((state: IRootState) => state.app.auth);
  const isDark = theme.palette.mode === 'dark';
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [vehicle, setVehicle] = useState<any>(null);
  
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: '',
    department: '',
    student_id: ''
  });
  const [saving, setSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [notification, setNotification] = useState<{ message: string, type: NotificationType } | null>(null);

  useEffect(() => {
    loadProfileData();
  }, [user?.id]);

  const loadProfileData = async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const promises: Promise<any>[] = [api.fetchUserProfile(user.id)];
      if (user.role === 'student') promises.push(api.fetchVehicle());
      const results = await Promise.all(promises);
      setProfile(results[0]);
      if (user.role === 'student' && results[1]) setVehicle(results[1]);
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

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;

    try {
      setAvatarUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      
      const uploadRes = await api.uploadMedia(formData);
      const avatarUrl = uploadRes.url;

      const updatedProfile = await api.updateUserProfile(user.id, {
        avatar_url: avatarUrl
      });

      setProfile(updatedProfile);
      dispatch(receiveUserData({ ...user, ...updatedProfile }));
      setNotification({ message: 'Profile picture updated!', type: 'success' });
    } catch (err) {
      console.error('Avatar upload failed', err);
      setNotification({ message: 'Failed to upload image.', type: 'error' });
    } finally {
      setAvatarUploading(false);
    }
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
    return <div style={{ padding: '4rem', textAlign: 'center', color: theme.palette.text.secondary }}>Loading Profile...</div>;
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

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: isTinyMobile ? '0.25rem' : '0' }}>
        <header style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: isMobile ? 'flex-start' : 'center',
          flexDirection: 'row', // Keep it row to allow button on top right
          gap: '1rem',
          marginBottom: isMobile ? '1.5rem' : '3rem' 
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ 
              fontSize: isSmallMobile ? '1.5rem' : '1.875rem', 
              fontWeight: 700, 
              color: theme.palette.text.primary, 
              marginBottom: '0.25rem',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>My Profile</h1>
            <p style={{ color: theme.palette.text.secondary, fontSize: '0.8125rem' }}>Personal identification and status.</p>
          </div>
          <button 
            onClick={handleEditClick}
            style={{
              backgroundColor: theme.palette.primary.main,
              color: 'white',
              border: 'none',
              padding: isMobile ? '0.75rem' : '0.875rem 1.5rem',
              borderRadius: isMobile ? '50%' : '14px',
              fontWeight: 700,
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem',
              width: isMobile ? '44px' : 'auto',
              height: isMobile ? '44px' : 'auto',
              cursor: 'pointer',
              boxShadow: !isDark ? '0 10px 15px -3px rgba(99, 102, 241, 0.3)' : 'none',
              transition: 'all 0.3s ease',
              flexShrink: 0
            }}
            title="Edit Details"
          >
            <Edit2 size={isMobile ? 20 : 18} /> 
            {!isMobile && 'Edit Details'}
          </button>
        </header>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(400px, 1fr))', 
          gap: isMobile ? '1.25rem' : '2rem' 
        }}>
          {/* Avatar & Summary Card */}
          <section style={cardStyle(theme, isDark, isMobile)}>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              style={{ display: 'none' }} 
              accept="image/*" 
            />
            <div style={{ textAlign: 'center', padding: isMobile ? '0.5rem 0' : '1.5rem 0' }}>
               <div style={{ position: 'relative', width: '120px', height: '120px', margin: '0 auto 1.5rem' }}>
                  <div style={{ 
                    width: '100%', 
                    height: '100%', 
                    borderRadius: '40px', 
                    backgroundColor: theme.palette.primary.main + '15',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '3rem',
                    fontWeight: 800,
                    color: theme.palette.primary.main,
                    overflow: 'hidden',
                    position: 'relative'
                  }}>
                    {avatarUploading ? (
                      <Loader2 className="spin" size={40} />
                    ) : profile?.avatar_url ? (
                      <img 
                        src={profile.avatar_url} 
                        alt="Avatar" 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                      />
                    ) : (
                      profile?.full_name?.charAt(0) || user?.full_name?.charAt(0)
                    )}
                  </div>
                  <button 
                    onClick={handleAvatarClick}
                    disabled={avatarUploading}
                    style={{
                      position: 'absolute',
                      bottom: '-5px',
                      right: '-5px',
                      width: '36px',
                      height: '36px',
                      borderRadius: '11px',
                      backgroundColor: theme.palette.primary.main,
                      color: 'white',
                      border: `3px solid ${theme.palette.background.paper}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: avatarUploading ? 'wait' : 'pointer',
                      zIndex: 2,
                      boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                    }}
                    title="Change Photo"
                  >
                    <Camera size={16} />
                  </button>
               </div>
               <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.25rem' }}>{profile?.full_name || user?.full_name}</h2>
               <p style={{ color: theme.palette.text.secondary, fontSize: '0.875rem' }}>
                  {user?.role === 'student' ? `Student ID: ${profile?.student_id || 'N/A'}` : `${capitalize(user?.role || '')} Account`}
               </p>
            </div>
          </section>

          {/* Personal Information */}
          <section style={cardStyle(theme, isDark, isMobile)}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <div style={iconBox(theme, theme.palette.primary.main)}><UserIcon size={20} /></div>
              <h2 style={{ fontSize: isSmallMobile ? '1.125rem' : '1.25rem', fontWeight: 700, margin: 0 }}>Info Details</h2>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <FieldRow label="Full Name" value={profile?.full_name || user?.full_name} theme={theme} />
              <FieldRow label="Department" value={profile?.department || 'Not set'} theme={theme} />
              <FieldRow label="Account Type" value={capitalize(user?.role || '')} theme={theme} />
            </div>
          </section>

          {/* Facility Access Section */}
          <section style={cardStyle(theme, isDark, isMobile)}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <div style={iconBox(theme, theme.palette.secondary.main)}><Shield size={20} /></div>
              <h2 style={{ fontSize: isSmallMobile ? '1.125rem' : '1.25rem', fontWeight: 700, margin: 0 }}>Facility Access</h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
               <FieldRow 
                label="Permit Level" 
                value="Zone A - Standard" 
                badge="ACTIVE"
                theme={theme} 
               />
               <FieldRow 
                label="Expiry Date" 
                value={profile?.permit_expiry ? new Date(profile.permit_expiry).toLocaleDateString() : 'N/A'} 
                theme={theme} 
               />
            </div>
          </section>

          {/* Vehicle Information */}
          <section style={cardStyle(theme, isDark, isMobile)}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <div style={iconBox(theme, theme.palette.info.main)}><Car size={20} /></div>
              <h2 style={{ fontSize: isSmallMobile ? '1.125rem' : '1.25rem', fontWeight: 700, margin: 0 }}>Vehicle Details</h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {vehicle?.vehicle_number ? (
                <>
                  <FieldRow label="Plate Number" value={vehicle.vehicle_number} theme={theme} />
                  <FieldRow label="Make & Model" value={vehicle.vehicle_make_model || 'N/A'} theme={theme} />
                </>
              ) : (
                <p style={{ fontSize: '0.875rem', color: theme.palette.text.secondary, textAlign: 'center', padding: '1rem' }}>
                  No vehicle registered.
                </p>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Edit Modal */}
      {isEditOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: isTinyMobile ? '0' : '1rem'
        }}>
          <div style={{
            backgroundColor: theme.palette.background.paper,
            borderRadius: isTinyMobile ? '0' : '28px',
            width: '100%', maxWidth: '480px', height: isTinyMobile ? '100%' : 'auto',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflowX: 'hidden', overflowY: 'auto'
          }}>
            <div style={{ 
              padding: '1.5rem', borderBottom: `1px solid ${theme.palette.divider}`,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>Edit Info</h2>
              <button onClick={() => setIsEditOpen(false)} style={{ background: 'none', border: 'none', color: theme.palette.text.secondary }}><X size={24} /></button>
            </div>
            
            <div style={{ padding: isSmallMobile ? '1.5rem' : '2.5rem' }}>
              <div style={fieldStyle}>
                <label style={labelStyle(theme)}>Full Name</label>
                <input 
                  type="text" 
                  value={editForm.full_name} 
                  onChange={(e) => setEditForm({...editForm, full_name: e.target.value})} 
                  style={inputStyle(theme)}
                />
              </div>
              <div style={{ ...fieldStyle, marginTop: '1.5rem' }}>
                <label style={labelStyle(theme)}>Department</label>
                <input 
                  type="text" 
                  value={editForm.department} 
                  onChange={(e) => setEditForm({...editForm, department: e.target.value})} 
                  style={inputStyle(theme)}
                />
              </div>
              
              <div style={{ display: 'flex', flexDirection: isSmallMobile ? 'column' : 'row', gap: '0.75rem', marginTop: '2.5rem' }}>
                 <button onClick={() => setIsEditOpen(false)} style={modalButtonStyle(theme, false)}>Cancel</button>
                 <button onClick={handleSaveProfile} disabled={saving} style={modalButtonStyle(theme, true)}>
                   {saving ? <Loader2 className="spin" size={20} /> : <Save size={20} />} Save
                 </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
};

// --- Subcomponents ---

const FieldRow = ({ label, value, badge, theme }: any) => (
  <div style={fieldStyle}>
    <label style={labelStyle(theme)}>{label}</label>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
      <div style={valueStyle(theme)}>{value}</div>
      {badge && (
        <span style={{ 
          fontSize: '0.625rem', 
          fontWeight: 800, 
          color: theme.palette.success.main, 
          backgroundColor: theme.palette.success.main + '15', 
          padding: '4px 8px', 
          borderRadius: '8px',
          letterSpacing: '0.05em'
        }}>{badge}</span>
      )}
    </div>
  </div>
);

// --- Styles (Identical to SettingsPage for consistency) ---

const sectionCardStyle = (theme: any, isDark: boolean, isMobile: boolean) => ({
  backgroundColor: theme.palette.background.paper,
  padding: isMobile ? '1.5rem' : '2.5rem',
  borderRadius: '32px',
  border: isDark ? `1px solid ${theme.palette.divider}` : 'none',
  boxShadow: !isDark ? '0 10px 15px -3px rgba(0,0,0,0.05)' : 'none'
});

const cardStyle = sectionCardStyle;

const iconBox = (_theme: any, color: string) => ({
  backgroundColor: color + '15',
  color: color,
  padding: '0.625rem',
  borderRadius: '12px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
});

const fieldStyle = {
  display: 'flex',
  flexDirection: 'column' as any,
  gap: '0.375rem'
};

const labelStyle = (theme: any) => ({
  fontSize: '0.75rem',
  fontWeight: 700,
  color: theme.palette.text.secondary,
  textTransform: 'uppercase' as any,
  letterSpacing: '0.05em'
});

const valueStyle = (theme: any) => ({
  fontSize: '1rem',
  fontWeight: 600,
  color: theme.palette.text.primary,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis'
});

const inputStyle = (theme: any) => ({
  width: '100%',
  padding: '0.75rem 1rem',
  borderRadius: '12px',
  border: `1.5px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.background.default,
  color: theme.palette.text.primary,
  fontSize: '0.9375rem',
  outline: 'none'
});

const modalButtonStyle = (theme: any, primary: boolean) => ({
  flex: 1, padding: '1rem', borderRadius: '16px', border: primary ? 'none' : `1px solid ${theme.palette.divider}`,
  backgroundColor: primary ? theme.palette.primary.main : 'transparent',
  color: primary ? 'white' : theme.palette.text.primary,
  fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '0.875rem'
});

const capitalize = (s: string) => s ? s.charAt(0).toUpperCase() + s.slice(1) : '';

export default ProfilePage;
