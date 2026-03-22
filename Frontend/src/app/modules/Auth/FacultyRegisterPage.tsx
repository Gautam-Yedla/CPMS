import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthLayout from '@app/Layout/legacy/AuthLayout';
import { supabase } from '@utils/lib/supabase';
import { UserPlus, User, Mail, Building, Car, KeyRound, Eye, EyeOff } from 'lucide-react';
import { mapErrorMessage } from '@utils/errorHelpers';
import Notification from '@shared/components/legacy/Notification';

const FacultyRegisterPage: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        department: '',
        vehicleNumber: '',
        vehicleType: 'Four-wheeler',
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
                        role: 'faculty',
                    },
                },
            });

            if (signUpError) throw signUpError;

            if (data.user) {
                // Upsert profile with is_approved = false
                const { error: profileError } = await supabase
                    .from('profiles')
                    .upsert({
                        id: data.user.id,
                        full_name: formData.fullName,
                        department: formData.department,
                        vehicle_number: formData.vehicleNumber,
                        vehicle_type: formData.vehicleType,
                        role: 'faculty',
                        is_approved: false, // Explicitly set even though trigger handles it
                    });

                if (profileError) throw profileError;

                // 🔔 Notify Admins (Future: this would be an API call)
                // For now, it will be handled by the admin checking the app requests tab
            }

            setSuccessMsg('Registration submitted! An Admin will review your request. Redirecting...');
            setTimeout(() => navigate('/login'), 4000);
        } catch (err: any) {
            setError(mapErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout 
            title="Faculty Registration" 
            subtitle="Join the campus parking management system"
            brandSubtitle="Secure parking for our faculty"
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
                <div className="auth-section-divider">
                    <span className="auth-section-label">Faculty Details</span>
                </div>

                <div className="auth-grid-2">
                    <div className="auth-input-group">
                        <label className="auth-input-label">Full Name</label>
                        <div className="auth-input-wrapper">
                            <span className="auth-input-icon"><User size={18} /></span>
                            <input name="fullName" value={formData.fullName} onChange={handleChange} required placeholder="Dr. Smith" />
                        </div>
                    </div>
                    <div className="auth-input-group">
                        <label className="auth-input-label">College Email</label>
                        <div className="auth-input-wrapper">
                            <span className="auth-input-icon"><Mail size={18} /></span>
                            <input name="email" type="email" value={formData.email} onChange={handleChange} required placeholder="smith@college.edu" />
                        </div>
                    </div>
                </div>

                <div className="auth-input-group">
                    <label className="auth-input-label">Department</label>
                    <div className="auth-input-wrapper">
                        <span className="auth-input-icon"><Building size={18} /></span>
                        <input name="department" value={formData.department} onChange={handleChange} required placeholder="Engineering Department" />
                    </div>
                </div>

                <div className="auth-section-divider">
                    <span className="auth-section-label">Vehicle Information</span>
                </div>

                <div className="auth-grid-2">
                    <div className="auth-input-group">
                        <label className="auth-input-label">Vehicle Number</label>
                        <div className="auth-input-wrapper">
                            <span className="auth-input-icon"><Car size={18} /></span>
                            <input name="vehicleNumber" value={formData.vehicleNumber} onChange={handleChange} required placeholder="FAC-1234" />
                        </div>
                    </div>
                    <div className="auth-input-group">
                        <label className="auth-input-label">Vehicle Type</label>
                        <div className="auth-input-wrapper">
                            <span className="auth-input-icon"><Car size={18} /></span>
                            <select name="vehicleType" value={formData.vehicleType} onChange={handleChange}>
                                <option value="Four-wheeler">Four-wheeler (Car)</option>
                                <option value="Two-wheeler">Two-wheeler (Bike)</option>
                            </select>
                        </div>
                    </div>
                </div>

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

                <button 
                    type="submit" 
                    className="auth-submit-btn"
                    disabled={loading}
                >
                    {loading ? (
                        <>
                            <span className="auth-spinner" />
                            Submitting...
                        </>
                    ) : (
                        <>
                            <UserPlus size={20} />
                            Register as Faculty
                        </>
                    )}
                </button>

                <p className="auth-footer-text">
                    Already have an account?{' '}
                    <Link to="/login" className="auth-footer-link">Sign in</Link>
                </p>
                
                <p className="auth-footer-text" style={{ marginTop: '0.5rem', fontSize: '0.8rem', opacity: 0.7 }}>
                    Students should use the <Link to="/register" style={{ color: 'inherit', fontWeight: 600 }}>Student Registration</Link> link.
                </p>
            </form>
        </AuthLayout>
    );
};

export default FacultyRegisterPage;
