import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { api } from '@utils/services/api';
import { 
  Bell, 
  Lock, 
  Eye, 
  Globe, 
  Moon, 
  Sun,
  Shield,
  Smartphone,
  Mail,
  User,
  Save,
  Check,
  Loader2
} from 'lucide-react';
import { IRootState } from '@app/appReducer';
import { setThemeMode } from '@modules/Auth/authActions';

const SettingsPage: React.FC = () => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isSmallMobile = useMediaQuery('(max-width:400px)');
  const isTinyMobile = useMediaQuery('(max-width:340px)');

  const { theme: themeMode, user } = useSelector((state: IRootState) => state.app.auth);
  const isDark = theme.palette.mode === 'dark';

  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    sms: false,
    permitUpdates: true,
    securityAlerts: true
  });

  const [saveStatus, setSaveStatus] = useState<null | 'saving' | 'saved'>(null);

  useEffect(() => {
    if (user?.id) {
        api.fetchUserProfile(user.id).then(profile => {
            if (profile.preferences?.notifications) {
                setNotifications(profile.preferences.notifications);
            }
        });
    }
  }, [user?.id]);

  const toggleNotification = (key: keyof typeof notifications) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleToggleTheme = () => {
    dispatch(setThemeMode(themeMode === 'light' ? 'dark' : 'light'));
  };

  const handleSave = async () => {
    if (!user?.id) return;
    setSaveStatus('saving');
    try {
        await api.updateUserProfile(user.id, {
            preferences: { notifications }
        });
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus(null), 2000);
    } catch (err) {
        setSaveStatus(null);
        console.error('Failed to save settings', err);
    }
  };

  return (
    <>
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: isTinyMobile ? '0.25rem' : '0' }}>
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
            }}>Settings</h1>
            <p style={{ color: theme.palette.text.secondary, fontSize: '0.8125rem' }}>Customize your experience.</p>
          </div>
          <button 
            onClick={handleSave}
            disabled={saveStatus === 'saving'}
            style={{
              backgroundColor: saveStatus === 'saved' ? theme.palette.success.main : theme.palette.primary.main,
              color: 'white',
              border: 'none',
              padding: isMobile ? '0.75rem' : '0.875rem 2rem',
              borderRadius: isMobile ? '50%' : '14px',
              fontWeight: 700,
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem',
              width: isMobile ? '44px' : 'auto',
              height: isMobile ? '44px' : 'auto',
              cursor: saveStatus === 'saving' ? 'wait' : 'pointer',
              boxShadow: !isDark ? '0 10px 15px -3px rgba(99, 102, 241, 0.3)' : 'none',
              transition: 'all 0.3s ease',
              flexShrink: 0
            }}
            title="Save Settings"
          >
            {saveStatus === 'saving' ? <Loader2 size={20} className="spin" /> : saveStatus === 'saved' ? <Check size={20} /> : <Save size={isMobile ? 20 : 18} />}
            {!isMobile && (saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved' : 'Save Settings')}
          </button>
        </header>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(450px, 1fr))', 
          gap: isMobile ? '1.25rem' : '2rem' 
        }}>
          {/* Notifications Section */}
          <section style={cardStyle(theme, isDark, isMobile)}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <div style={iconBox(theme, theme.palette.primary.main)}><Bell size={20} /></div>
              <h2 style={{ fontSize: isSmallMobile ? '1.125rem' : '1.25rem', fontWeight: 700, margin: 0 }}>Notifications</h2>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <ToggleRow 
                icon={<Mail size={18} />} 
                title="Emails" 
                desc="Permit approvals and statements."
                checked={notifications.email}
                onToggle={() => toggleNotification('email')}
                theme={theme}
                isMobile={isMobile}
              />
              <ToggleRow 
                icon={<Smartphone size={18} />} 
                title="Push Alerts" 
                desc="Real-time security and facility updates."
                checked={notifications.push}
                onToggle={() => toggleNotification('push')}
                theme={theme}
                isMobile={isMobile}
              />
              <ToggleRow 
                icon={<Shield size={18} />} 
                title="Security" 
                desc="Urgent security notifications."
                checked={notifications.securityAlerts}
                onToggle={() => toggleNotification('securityAlerts')}
                theme={theme}
                isMobile={isMobile}
              />
            </div>
          </section>

          {/* Account & Security Section */}
          <section style={cardStyle(theme, isDark, isMobile)}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <div style={iconBox(theme, theme.palette.secondary.main)}><Lock size={20} /></div>
              <h2 style={{ fontSize: isSmallMobile ? '1.125rem' : '1.25rem', fontWeight: 700, margin: 0 }}>Security</h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <ActionRow 
                icon={<User size={18} />} 
                title="Personal Info" 
                actionLabel="Update"
                theme={theme}
                isMobile={isMobile}
              />
              <ActionRow 
                icon={<Shield size={18} />} 
                title="Multi-Factor" 
                actionLabel="Enable"
                theme={theme}
                isMobile={isMobile}
              />
              <ActionRow 
                icon={<Eye size={18} />} 
                title="Password" 
                actionLabel="Change"
                theme={theme}
                isMobile={isMobile}
              />
            </div>
          </section>

          {/* Appearance Section */}
          <section style={cardStyle(theme, isDark, isMobile)}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <div style={iconBox(theme, theme.palette.info.main)}><Eye size={20} /></div>
              <h2 style={{ fontSize: isSmallMobile ? '1.125rem' : '1.25rem', fontWeight: 700, margin: 0 }}>Appearance</h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: isSmallMobile ? 'flex-start' : 'center',
                flexDirection: isSmallMobile ? 'column' : 'row',
                gap: isSmallMobile ? '1rem' : '0'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ color: theme.palette.text.secondary }}>{themeMode === 'light' ? <Sun size={18} /> : <Moon size={18} />}</div>
                  <div>
                    <div style={{ fontWeight: 600, color: theme.palette.text.primary, fontSize: '0.9375rem' }}>Theme Mode</div>
                    <div style={{ fontSize: '0.75rem', color: theme.palette.text.secondary }}>Currently: {themeMode}</div>
                  </div>
                </div>
                <button 
                  onClick={handleToggleTheme}
                  style={{
                    backgroundColor: theme.palette.background.default,
                    border: `1px solid ${theme.palette.divider}`,
                    padding: '0.5rem 0.875rem',
                    borderRadius: '10px',
                    fontWeight: 600,
                    fontSize: '0.8125rem',
                    cursor: 'pointer',
                    color: theme.palette.text.primary,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    width: isSmallMobile ? '100%' : 'auto',
                    justifyContent: 'center'
                  }}
                  className="hover-bg"
                >
                  {isTinyMobile ? 'Switch' : `Switch to ${themeMode === 'light' ? 'Dark' : 'Light'}`}
                </button>
              </div>
            </div>
          </section>

          {/* Language & Local Section */}
          <section style={cardStyle(theme, isDark, isMobile)}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <div style={iconBox(theme, theme.palette.warning.main)}><Globe size={20} /></div>
              <h2 style={{ fontSize: isSmallMobile ? '1.125rem' : '1.25rem', fontWeight: 700, margin: 0 }}>Regional</h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={fieldStyle}>
                <label style={labelStyle(theme)}>Language</label>
                <select style={selectStyle(theme)}>
                  <option value="en">English (US)</option>
                  <option value="es">Español</option>
                  <option value="fr">Français</option>
                </select>
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle(theme)}>Date Format</label>
                <select style={selectStyle(theme)}>
                  <option value="mdy">MM/DD/YYYY</option>
                  <option value="dmy">DD/MM/YYYY</option>
                </select>
              </div>
            </div>
          </section>
        </div>
      </div>

      <style>{`
        .hover-bg:hover { background-color: ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)'}; }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
};

// --- Subcomponents ---

const ToggleRow = ({ icon, title, desc, checked, onToggle, theme, isMobile }: any) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 0 }}>
      <div style={{ color: theme.palette.text.secondary, display: 'flex' }}>{icon}</div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontWeight: 600, color: theme.palette.text.primary, fontSize: '0.9375rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</div>
        {!isMobile && <div style={{ fontSize: '0.75rem', color: theme.palette.text.secondary, maxWidth: '280px' }}>{desc}</div>}
      </div>
    </div>
    <div 
      onClick={onToggle}
      style={{
        width: '40px',
        height: '22px',
        backgroundColor: checked ? theme.palette.primary.main : theme.palette.divider,
        borderRadius: '11px',
        position: 'relative',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        flexShrink: 0
      }}
    >
      <div style={{
        position: 'absolute',
        top: '2px',
        left: checked ? '20px' : '2px',
        width: '18px',
        height: '18px',
        backgroundColor: 'white',
        borderRadius: '50%',
        transition: 'all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
      }} />
    </div>
  </div>
);

const ActionRow = ({ icon, title, actionLabel, theme }: any) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 0 }}>
      <div style={{ color: theme.palette.text.secondary, display: 'flex' }}>{icon}</div>
      <div style={{ fontWeight: 600, color: theme.palette.text.primary, fontSize: '0.9375rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</div>
    </div>
    <button style={{
      color: theme.palette.primary.main,
      background: 'none',
      border: 'none',
      fontWeight: 700,
      fontSize: '0.8125rem',
      cursor: 'pointer',
      padding: '4px 8px',
      whiteSpace: 'nowrap'
    }}>
      {actionLabel}
    </button>
  </div>
);

// --- Styles ---

const cardStyle = (theme: any, isDark: boolean, isMobile: boolean) => ({
  backgroundColor: theme.palette.background.paper,
  padding: isMobile ? '1.5rem' : '2.5rem',
  borderRadius: '32px',
  border: isDark ? `1px solid ${theme.palette.divider}` : 'none',
  boxShadow: !isDark ? '0 10px 15px -3px rgba(0,0,0,0.05)' : 'none'
});

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

const selectStyle = (theme: any) => ({
  width: '100%',
  padding: '0.75rem 1rem',
  borderRadius: '12px',
  border: `1.5px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.background.default,
  color: theme.palette.text.primary,
  outline: 'none',
  fontSize: '0.875rem',
  cursor: 'pointer'
});

export default SettingsPage;
