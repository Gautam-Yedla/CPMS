import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthLayout from '@app/Layout/legacy/AuthLayout';
import { supabase } from '@utils/lib/supabase';
import { UserPlus, User, Mail, IdCard, Building, Car, KeyRound, Eye, EyeOff } from 'lucide-react';
import { mapErrorMessage } from '@utils/errorHelpers';
import Notification from '@shared/components/legacy/Notification';

const StudentRegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    studentId: '',
    department: '',
    vehicleNumber: '',
    vehicleType: 'Two-wheeler',
    password: '',
    confirmPassword: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = formData.email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!emailRegex.test(email)) {
      setError('Please enter a valid college email address');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            role: 'student',
          },
        },
      });

      if (signUpError) throw signUpError;

      if (data.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: data.user.id,
            full_name: formData.fullName,
            student_id: formData.studentId,
            department: formData.department,
            vehicle_number: formData.vehicleNumber,
            vehicle_type: formData.vehicleType,
            role: 'student',
          });

        if (profileError) throw profileError;
      }

      setSuccessMsg('Registration successful! Redirecting to login...');
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: any) {
      setError(mapErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout 
      title="Student Registration" 
      subtitle="Only students can self-register. Faculty and staff accounts are created by admin."
      brandSubtitle="Join your campus parking community"
      wide
    >
      {successMsg && (
        <Notification 
          type="success" 
          message={successMsg} 
          onClose={() => setSuccessMsg(null)} 
        />
      )}

      {error && (
        <Notification 
          type="error" 
          message={error} 
          onClose={() => setError(null)} 
        />
      )}
      
      <form onSubmit={handleRegister}>
        {/* ---- Personal Information ---- */}
        <div className="auth-section-divider">
          <span className="auth-section-label">Personal Information</span>
        </div>

        <div className="auth-grid-2">
          <div className="auth-input-group">
            <label className="auth-input-label">Full Name</label>
            <div className="auth-input-wrapper">
              <span className="auth-input-icon"><User size={18} /></span>
              <input name="fullName" value={formData.fullName} onChange={handleChange} required placeholder="John Doe" />
            </div>
          </div>
          <div className="auth-input-group">
            <label className="auth-input-label">College Email</label>
            <div className="auth-input-wrapper">
              <span className="auth-input-icon"><Mail size={18} /></span>
              <input name="email" type="email" value={formData.email} onChange={handleChange} required placeholder="john@college.edu" />
            </div>
          </div>
        </div>

        <div className="auth-grid-2">
          <div className="auth-input-group">
            <label className="auth-input-label">Student ID</label>
            <div className="auth-input-wrapper">
              <span className="auth-input-icon"><IdCard size={18} /></span>
              <input name="studentId" value={formData.studentId} onChange={handleChange} required placeholder="ID-12345" />
            </div>
          </div>
          <div className="auth-input-group">
            <label className="auth-input-label">Department</label>
            <div className="auth-input-wrapper">
              <span className="auth-input-icon"><Building size={18} /></span>
              <input name="department" value={formData.department} onChange={handleChange} required placeholder="Computer Science" />
            </div>
          </div>
        </div>

        {/* ---- Vehicle Information ---- */}
        <div className="auth-section-divider">
          <span className="auth-section-label">Vehicle Information</span>
        </div>

        <div className="auth-grid-2">
          <div className="auth-input-group">
            <label className="auth-input-label">Vehicle Number</label>
            <div className="auth-input-wrapper">
              <span className="auth-input-icon"><Car size={18} /></span>
              <input name="vehicleNumber" value={formData.vehicleNumber} onChange={handleChange} required placeholder="ABC-1234" />
            </div>
          </div>
          <div className="auth-input-group">
            <label className="auth-input-label">Vehicle Type</label>
            <div className="auth-input-wrapper">
              <span className="auth-input-icon"><Car size={18} /></span>
              <select name="vehicleType" value={formData.vehicleType} onChange={handleChange}>
                <option value="Two-wheeler">Two-wheeler</option>
                <option value="Four-wheeler">Four-wheeler</option>
              </select>
            </div>
          </div>
        </div>

        {/* ---- Security ---- */}
        <div className="auth-section-divider">
          <span className="auth-section-label">Security</span>
        </div>

        <div className="auth-grid-2">
          <div className="auth-input-group">
            <label className="auth-input-label">Password</label>
            <div className="auth-input-wrapper">
              <span className="auth-input-icon"><KeyRound size={18} /></span>
              <input
                name="password" 
                type={showPassword ? 'text' : 'password'} 
                value={formData.password} 
                onChange={handleChange} 
                required 
                placeholder="••••••••" 
              />
              <button
                type="button"
                className="auth-password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <div className="auth-input-group">
            <label className="auth-input-label">Confirm Password</label>
            <div className="auth-input-wrapper">
              <span className="auth-input-icon"><KeyRound size={18} /></span>
              <input
                name="confirmPassword" 
                type={showConfirmPassword ? 'text' : 'password'} 
                value={formData.confirmPassword} 
                onChange={handleChange} 
                required 
                placeholder="••••••••" 
              />
              <button
                type="button"
                className="auth-password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                tabIndex={-1}
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
        </div>

        {/* Submit */}
        <button 
          type="submit" 
          className="auth-submit-btn"
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="auth-spinner" />
              Creating Account...
            </>
          ) : (
            <>
              <UserPlus size={20} />
              Register as Student
            </>
          )}
        </button>

        <p className="auth-footer-text">
          Already have an account?{' '}
          <Link to="/login" className="auth-footer-link">Sign in</Link>
        </p>
      </form>
    </AuthLayout>
  );
};

export default StudentRegisterPage;
