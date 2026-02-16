import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { LogIn } from 'lucide-react';
import { supabase } from '@utils/lib/supabase';
import { mapErrorMessage } from '@utils/errorHelpers';
import AuthLayout from '@app/Layout/legacy/AuthLayout';
import Notification from '@shared/components/legacy/Notification';
import { 
  sessionLogin, 
  sessionLoginSuccess, 
  sessionLoginFail,
  clearAuthError
} from './authActions';
import { IRootState } from '@app/appReducer';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { loading, isLoggedIn, user, error: authError } = useSelector((state: IRootState) => state.app.auth);

  useEffect(() => {
    if (isLoggedIn && user) {
      navigate(`/${user.role}-dashboard`);
    }
  }, [isLoggedIn, user, navigate]);

  useEffect(() => {
    if (authError) {
      setError(authError);
    }
  }, [authError]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    dispatch(sessionLogin());

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      if (data.user) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (profileError) throw profileError;

        dispatch(sessionLoginSuccess(profile));
      }
    } catch (err: any) {
      dispatch(sessionLoginFail(mapErrorMessage(err)));
    }
  };

  return (
    <AuthLayout 
      title="Welcome Back" 
      subtitle="Sign in to your campus parking account"
    >
      {(error || authError) && (
        <Notification 
          type="error" 
          message={error || authError || ''} 
          onClose={() => {
            setError(null);
            dispatch(clearAuthError());
          }} 
        />
      )}
      <form onSubmit={handleLogin}>
        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>College Email</label>
          <input
            type="email"
            placeholder="email@college.edu"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #ddd' }}
          />
        </div>
        
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <label style={{ fontWeight: 500 }}>Password</label>
            <Link to="/forgot-password" style={{ fontSize: '0.875rem', color: '#6366f1' }}>Forgot password?</Link>
          </div>
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #ddd' }}
          />
        </div>

        <button 
          type="submit" 
          disabled={loading}
          style={{ 
            width: '100%', 
            padding: '0.75rem', 
            borderRadius: '0.5rem', 
            border: 'none', 
            backgroundColor: '#6366f1', 
            color: 'white', 
            fontWeight: 600, 
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            opacity: loading ? 0.7 : 1
          }}
        >
          {loading ? 'Signing in...' : (
            <>
              <LogIn size={20} />
              Sign In
            </>
          )}
        </button>

        <p style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem', color: '#666' }}>
          New student? <Link to="/register" style={{ fontWeight: 600, color: '#6366f1' }}>Create an account</Link>
        </p>
      </form>
    </AuthLayout>
  );
};

export default LoginPage;
