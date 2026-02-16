import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthLayout from '@app/Layout/legacy/AuthLayout';
import { supabase } from '@utils/lib/supabase';
import { UserPlus } from 'lucide-react';
import { mapErrorMessage } from '@utils/errorHelpers';

import Notification from '@shared/components/legacy/Notification';

const StudentRegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
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
        // Update profile with extra fields
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
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 500, fontSize: '0.875rem' }}>Full Name</label>
            <input name="fullName" value={formData.fullName} onChange={handleChange} required placeholder="John Doe" />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 500, fontSize: '0.875rem' }}>College Email</label>
            <input name="email" type="email" value={formData.email} onChange={handleChange} required placeholder="john@college.edu" />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 500, fontSize: '0.875rem' }}>Student ID</label>
            <input name="studentId" value={formData.studentId} onChange={handleChange} required placeholder="ID-12345" />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 500, fontSize: '0.875rem' }}>Department</label>
            <input name="department" value={formData.department} onChange={handleChange} required placeholder="Computer Science" />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 500, fontSize: '0.875rem' }}>Vehicle Number</label>
            <input name="vehicleNumber" value={formData.vehicleNumber} onChange={handleChange} required placeholder="ABC-1234" />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 500, fontSize: '0.875rem' }}>Vehicle Type</label>
            <select name="vehicleType" value={formData.vehicleType} onChange={handleChange}>
              <option value="Two-wheeler">Two-wheeler</option>
              <option value="Four-wheeler">Four-wheeler</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 500, fontSize: '0.875rem' }}>Password</label>
            <input name="password" type="password" value={formData.password} onChange={handleChange} required placeholder="••••••••" />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 500, fontSize: '0.875rem' }}>Confirm Password</label>
            <input name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} required placeholder="••••••••" />
          </div>
        </div>


        <button 
          type="submit" 
          className={`btn-primary ${loading ? 'loading' : ''}`}
          disabled={loading}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
        >
          {loading ? 'Creating Account...' : (
            <>
              <UserPlus size={20} />
              Register as Student
            </>
          )}
        </button>

        <p style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          Already have an account? <Link to="/login" style={{ fontWeight: 600 }}>Sign in</Link>
        </p>
      </form>
    </AuthLayout>
  );
};

export default StudentRegisterPage;
