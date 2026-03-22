import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { LogIn, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@utils/lib/supabase';
import { mapErrorMessage } from '@utils/errorHelpers';
import AuthLayout from '@app/Layout/legacy/AuthLayout';
import Notification from '@shared/components/legacy/Notification';
import { useTheme } from '@mui/material/styles';
import { 
  sessionLogin, 
  sessionLoginSuccess, 
  sessionLoginFail,
  clearAuthError
} from './authActions';
import { IRootState } from '@app/appReducer';

const LoginPage: React.FC = () => {
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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

        // Check if approved
        if (profile.is_approved === false) {
            await supabase.auth.signOut();
            throw new Error('Your account is pending admin approval. Please wait for an administrator to activate your access.');
        }

        // Fetch role ID (case-insensitive)
        const roleName = profile.role || '';
        const { data: roleData } = await supabase
          .from('roles')
          .select('id')
          .ilike('name', roleName)
          .maybeSingle();

        const roleId = roleData?.id;
        let userPermissions: any[] = [];

        if (roleId) {
          try {
            // Fetch permissions for the found role
            const { data: permData, error: permError } = await supabase
              .from('role_permissions')
              .select('permissions(*)')
              .eq('role_id', roleId);
            
            if (!permError && permData) {
              userPermissions = permData.map((p: any) => p.permissions).filter(Boolean);
            }
          } catch (pErr) {
            console.warn('Failed to fetch specific permissions:', pErr);
          }
        } else {
          console.warn(`Role '${roleName}' not found in database for permission lookup.`);
        }
        
        const userWithPermissions = { 
          ...profile, 
          permissions: userPermissions
        };

        dispatch(sessionLoginSuccess(userWithPermissions));
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
        {/* Email Field */}
        <div className="auth-input-group">
          <label className="auth-input-label">College Email</label>
          <div className="auth-input-wrapper">
            <span className="auth-input-icon">
              <Mail size={18} />
            </span>
            <input
              type="email"
              placeholder="email@college.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        </div>
        
        {/* Password Field */}
        <div className="auth-input-group">
          <div className="auth-label-row">
            <label className="auth-input-label">Password</label>
            <Link to="/forgot-password" className="auth-forgot-link">Forgot password?</Link>
          </div>
          <div className="auth-input-wrapper">
            <span className="auth-input-icon">
              <Lock size={18} />
            </span>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
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

        {/* Submit Button */}
        <button 
          type="submit" 
          className="auth-submit-btn"
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="auth-spinner" />
              Signing in...
            </>
          ) : (
            <>
              <LogIn size={20} />
              Sign In
            </>
          )}
        </button>

        <p className="auth-footer-text">
          New student?{' '}
          <Link to="/register" className="auth-footer-link">Create an account</Link>
        </p>
        <p className="auth-footer-text" style={{ marginTop: '0.5rem' }}>
          Faculty member?{' '}
          <Link to="/register-faculty" className="auth-footer-link" style={{ color: theme.palette.secondary.main }}>Register here</Link>
        </p>
      </form>
    </AuthLayout>
  );
};

export default LoginPage;
