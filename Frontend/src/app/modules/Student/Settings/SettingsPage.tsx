import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useTheme } from '@mui/material/styles';
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
  Check
} from 'lucide-react';
import { IRootState } from '@app/appReducer';
import { setThemeMode } from '@modules/Auth/authActions';

const SettingsPage: React.FC = () => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { theme: themeMode } = useSelector((state: IRootState) => state.app.auth);
  const isDark = theme.palette.mode === 'dark';

  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    sms: false,
    permitUpdates: true,
    securityAlerts: true
  });

  const [saveStatus, setSaveStatus] = useState<null | 'saving' | 'saved'>(null);

  const toggleNotification = (key: keyof typeof notifications) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleToggleTheme = () => {
    dispatch(setThemeMode(themeMode === 'light' ? 'dark' : 'light'));
  };

  const handleSave = () => {
    setSaveStatus('saving');
    setTimeout(() => {
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus(null), 2000);
    }, 1000);
  };

  return (
    <>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <header style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '3rem' 
        }}>
          <div>
            <h1 style={{ 
              fontSize: '2.25rem', 
              fontWeight: 800, 
              color: theme.palette.text.primary, 
              marginBottom: '0.5rem',
              letterSpacing: '-0.025em'
            }}>Settings</h1>
            <p style={{ color: theme.palette.text.secondary }}>Customize your experience and manage security preferences.</p>
          </div>
          <button 
            onClick={handleSave}
            disabled={saveStatus === 'saving'}
            style={{
              backgroundColor: saveStatus === 'saved' ? theme.palette.success.main : theme.palette.primary.main,
              color: 'white',
              border: 'none',
              padding: '0.875rem 2rem',
              borderRadius: '14px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              cursor: saveStatus === 'saving' ? 'wait' : 'pointer',
              boxShadow: !isDark ? '0 10px 15px -3px rgba(99, 102, 241, 0.3)' : 'none',
              transition: 'all 0.3s ease'
            }}
          >
            {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? <><Check size={18} /> Changes Saved</> : <><Save size={18} /> Save Settings</>}
          </button>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '2rem' }}>
          {/* Notifications Section */}
          <section style={cardStyle(theme, isDark)}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
              <div style={iconBox(theme, theme.palette.primary.main)}><Bell size={20} /></div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Notification Preferences</h2>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <ToggleRow 
                icon={<Mail size={18} />} 
                title="Email Notifications" 
                desc="Receive permit approvals and monthly statements via email."
                checked={notifications.email}
                onToggle={() => toggleNotification('email')}
                theme={theme}
              />
              <ToggleRow 
                icon={<Smartphone size={18} />} 
                title="Push Notifications" 
                desc="Real-time alerts for security and facility updates."
                checked={notifications.push}
                onToggle={() => toggleNotification('push')}
                theme={theme}
              />
              <ToggleRow 
                icon={<Shield size={18} />} 
                title="Security Alerts" 
                desc="Urgent security notifications as they happen."
                checked={notifications.securityAlerts}
                onToggle={() => toggleNotification('securityAlerts')}
                theme={theme}
              />
            </div>
          </section>

          {/* Account & Security Section */}
          <section style={cardStyle(theme, isDark)}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
              <div style={iconBox(theme, theme.palette.secondary.main)}><Lock size={20} /></div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Account & Security</h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <ActionRow 
                icon={<User size={18} />} 
                title="Personal Information" 
                actionLabel="Update"
                theme={theme}
              />
              <ActionRow 
                icon={<Shield size={18} />} 
                title="Two-Factor Authentication" 
                actionLabel="Enable"
                theme={theme}
              />
              <ActionRow 
                icon={<Eye size={18} />} 
                title="Password" 
                actionLabel="Change"
                theme={theme}
              />
            </div>
          </section>

          {/* Appearance Section */}
          <section style={cardStyle(theme, isDark)}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
              <div style={iconBox(theme, theme.palette.info.main)}><Eye size={20} /></div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Appearance</h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ color: theme.palette.text.secondary }}>{themeMode === 'light' ? <Sun size={18} /> : <Moon size={18} />}</div>
                  <div>
                    <div style={{ fontWeight: 600, color: theme.palette.text.primary }}>Current Theme</div>
                    <div style={{ fontSize: '0.8125rem', color: theme.palette.text.secondary }}>Currently using {themeMode} mode</div>
                  </div>
                </div>
                <button 
                  onClick={handleToggleTheme}
                  style={{
                    backgroundColor: theme.palette.background.default,
                    border: `1px solid ${theme.palette.divider}`,
                    padding: '0.5rem 1rem',
                    borderRadius: '10px',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    color: theme.palette.text.primary,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                  className="hover-bg"
                >
                  Switch to {themeMode === 'light' ? 'Dark' : 'Light'}
                </button>
              </div>
            </div>
          </section>

          {/* Language & Local Section */}
          <section style={cardStyle(theme, isDark)}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
              <div style={iconBox(theme, theme.palette.warning.main)}><Globe size={20} /></div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Language & Regional</h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={fieldStyle}>
                <label style={labelStyle(theme)}>Display Language</label>
                <select style={selectStyle(theme)}>
                  <option value="en">English (United States)</option>
                  <option value="es">Español</option>
                  <option value="fr">Français</option>
                </select>
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle(theme)}>Date & Time Format</label>
                <select style={selectStyle(theme)}>
                  <option value="mdy">MM/DD/YYYY (12-hour)</option>
                  <option value="dmy">DD/MM/YYYY (24-hour)</option>
                </select>
              </div>
            </div>
          </section>
        </div>
      </div>

      <style>{`
        .hover-bg:hover { background-color: ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)'}; }
      `}</style>
    </>
  );
};

// --- Subcomponents ---

const ToggleRow = ({ icon, title, desc, checked, onToggle, theme }: any) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
      <div style={{ color: theme.palette.text.secondary }}>{icon}</div>
      <div>
        <div style={{ fontWeight: 600, color: theme.palette.text.primary }}>{title}</div>
        <div style={{ fontSize: '0.8125rem', color: theme.palette.text.secondary, maxWidth: '280px' }}>{desc}</div>
      </div>
    </div>
    <div 
      onClick={onToggle}
      style={{
        width: '44px',
        height: '24px',
        backgroundColor: checked ? theme.palette.primary.main : theme.palette.divider,
        borderRadius: '12px',
        position: 'relative',
        cursor: 'pointer',
        transition: 'all 0.3s ease'
      }}
    >
      <div style={{
        position: 'absolute',
        top: '3px',
        left: checked ? '23px' : '3px',
        width: '18px',
        height: '18px',
        backgroundColor: 'white',
        borderRadius: '50%',
        transition: 'all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
      }} />
    </div>
  </div>
);

const ActionRow = ({ icon, title, actionLabel, theme }: any) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
      <div style={{ color: theme.palette.text.secondary }}>{icon}</div>
      <div style={{ fontWeight: 600, color: theme.palette.text.primary }}>{title}</div>
    </div>
    <button style={{
      color: theme.palette.primary.main,
      background: 'none',
      border: 'none',
      fontWeight: 700,
      fontSize: '0.875rem',
      cursor: 'pointer'
    }}>
      {actionLabel}
    </button>
  </div>
);

// --- Styles ---

const cardStyle = (theme: any, isDark: boolean) => ({
  backgroundColor: theme.palette.background.paper,
  padding: '2.5rem',
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
  gap: '0.5rem'
};

const labelStyle = (theme: any) => ({
  fontSize: '0.8125rem',
  fontWeight: 700,
  color: theme.palette.text.secondary,
  textTransform: 'uppercase' as any,
  letterSpacing: '0.05em'
});

const selectStyle = (theme: any) => ({
  width: '100%',
  padding: '0.875rem 1rem',
  borderRadius: '12px',
  border: `1.5px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.background.default,
  color: theme.palette.text.primary,
  outline: 'none',
  fontSize: '0.9375rem',
  cursor: 'pointer'
});

export default SettingsPage;
