import React from 'react';
import { Car, Shield, Bell } from 'lucide-react';
import '../../../styles/auth.css';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  brandSubtitle?: string;
  wide?: boolean;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ 
  children, 
  title, 
  subtitle, 
  brandSubtitle,
  wide = false 
}) => {
  return (
    <div className="auth-split-container">
      {/* Branded Left Panel */}
      <div className="auth-brand-panel">
        <div className="auth-brand-dots" />
        <div className="auth-brand-content">
          <div className="auth-brand-logo">
            <Car size={36} />
          </div>
          <h1 className="auth-brand-name">CPMS</h1>
          <p className="auth-brand-tagline">
            {brandSubtitle || 'Campus Parking Management System'}
          </p>
          
          <div className="auth-brand-features">
            <div className="auth-brand-feature">
              <div className="auth-brand-feature-icon">
                <Car size={18} color="#ffffff" />
              </div>
              <span className="auth-brand-feature-text">Smart Vehicle Tracking</span>
            </div>
            <div className="auth-brand-feature">
              <div className="auth-brand-feature-icon">
                <Shield size={18} color="#ffffff" />
              </div>
              <span className="auth-brand-feature-text">Real-time Security Monitoring</span>
            </div>
            <div className="auth-brand-feature">
              <div className="auth-brand-feature-icon">
                <Bell size={18} color="#ffffff" />
              </div>
              <span className="auth-brand-feature-text">Instant Violation Alerts</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="auth-form-panel">
        <div className={`auth-form-card${wide ? ' auth-form-wide' : ''}`}>
          <div className="auth-form-header">
            <h2 className="auth-form-title">{title}</h2>
            {subtitle && <p className="auth-form-subtitle">{subtitle}</p>}
          </div>
          {children}
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
