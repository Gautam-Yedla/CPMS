import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  TextField, 
  Button, 
  Avatar, 
  Divider,
  Alert
} from '@mui/material';
import { User, Save, Lock } from 'lucide-react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { toast } from 'react-toastify';
// Import IRootState based on assumption it's in src/app/appReducer.ts
// If alias @app works, use it. If not, relative path.
import { IRootState } from '@app/appReducer';

const AdminProfilePage: React.FC = () => {
    // Get user from Redux
    const user = useSelector((state: IRootState) => state.app.auth.user);
    
    if (!user) {
        return <Box p={3}>Loading Profile...</Box>;
    }
    
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        department: '',
        role: ''
    });

    // Password Change State
    const [passwords, setPasswords] = useState({
        current: '',
        new: '',
        confirm: ''
    });
    const [passError, setPassError] = useState('');

    useEffect(() => {
        if (user) {
            setFormData({
                full_name: user.full_name || '',
                email: user.email || '',
                department: user.department || '',
                role: user.role || 'User'
            });
        }
    }, [user]);

    const handleProfileUpdate = async () => {
        if (!user) return;
        setLoading(true);
        try {
            await axios.put(`/api/user/${user.id}/profile`, {
                full_name: formData.full_name,
                department: formData.department
            });
            toast.success('Profile updated successfully');
            // Dispatch update to Redux would be good here, but for now refresh will happen on reload
        } catch (error) {
            console.error(error);
            toast.error('Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordChange = async () => {
        if (passwords.new !== passwords.confirm) {
            setPassError("New passwords don't match");
            return;
        }
        if (passwords.new.length < 6) {
           setPassError("Password must be at least 6 characters");
           return;
        }

        try {
             toast.info('Password change functionality requires Auth integration.');
             setPassError('');
             setPasswords({ current: '', new: '', confirm: '' });
        } catch (error) {
            toast.error('Failed to change password');
        }
    };

    return (
        <Box sx={{ p: 3, maxWidth: 1000, margin: '0 auto' }}>
            <Typography variant="h4" fontWeight="600" mb={3}>
                My Profile
            </Typography>

            <Box display="flex" flexWrap="wrap" gap={3}>
                {/* Profile Card */}
                <Box flexBasis={{ xs: '100%', md: '30%' }} flexGrow={1}>
                    <Paper sx={{ p: 3, textAlign: 'center', height: '100%' }}>
                        <Avatar 
                            src={user?.avatar_url || ''} // Removed conditional rendering logic that might crash if user is null
                            sx={{ width: 100, height: 100, margin: '0 auto', mb: 2, bgcolor: 'primary.main' }}
                        >
                            {user?.full_name?.charAt(0) || <User />}
                        </Avatar>
                        <Typography variant="h5" fontWeight="600">{user?.full_name}</Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>{user?.email}</Typography>
                        
                        <Box mt={2}>
                             <Button variant="outlined" fullWidth component="label">
                                Change Avatar
                                <input type="file" hidden accept="image/*" />
                             </Button>
                        </Box>
                         
                        <Box mt={3} textAlign="left">
                            <Typography variant="subtitle2" color="text.secondary">Role</Typography>
                            <Typography variant="body1" fontWeight="500">{formData.role}</Typography>
                            <Divider sx={{ my: 1 }} />
                             <Typography variant="subtitle2" color="text.secondary">Member Since</Typography>
                            <Typography variant="body1" fontWeight="500">
                                {/* user is untyped here potentially, need to be careful */}
                                {user && user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                            </Typography>
                        </Box>
                    </Paper>
                </Box>

                {/* Edit Form */}
                <Box flexBasis={{ xs: '100%', md: '65%' }} flexGrow={2}>
                    <Paper sx={{ p: 3, mb: 3 }}>
                        <Typography variant="h6" gutterBottom mb={2}>Edit Details</Typography>
                        <Box display="flex" flexWrap="wrap" gap={2}>
                            <Box flexGrow={1} minWidth="200px">
                                <TextField 
                                    label="Full Name" 
                                    fullWidth 
                                    value={formData.full_name}
                                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                />
                            </Box>
                            <Box flexGrow={1} minWidth="200px">
                                <TextField 
                                    label="Department" 
                                    fullWidth 
                                    value={formData.department}
                                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                />
                            </Box>
                            <Box width="100%">
                                <TextField 
                                    label="Email Address" 
                                    fullWidth 
                                    value={formData.email}
                                    disabled
                                    helperText="Contact admin to change email"
                                />
                            </Box>
                        </Box>
                        <Box mt={3} display="flex" justifyContent="flex-end">
                            <Button 
                                variant="contained" 
                                startIcon={<Save size={18} />} 
                                onClick={handleProfileUpdate}
                                disabled={loading}
                            >
                                {loading ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </Box>
                    </Paper>

                    {/* Change Password */}
                     <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom mb={2} display="flex" alignItems="center" gap={1}>
                            <Lock size={20} /> Change Password
                        </Typography>
                        
                        {passError && <Alert severity="error" sx={{ mb: 2 }}>{passError}</Alert>}

                         <Box display="flex" flexWrap="wrap" gap={2}>
                            <Box width="100%">
                                <TextField 
                                    label="Current Password" 
                                    type="password" 
                                    fullWidth 
                                    value={passwords.current}
                                    onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                                />
                            </Box>
                             <Box flexGrow={1} minWidth="200px">
                                <TextField 
                                    label="New Password" 
                                    type="password" 
                                    fullWidth 
                                    value={passwords.new}
                                    onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                                />
                            </Box>
                             <Box flexGrow={1} minWidth="200px">
                                <TextField 
                                    label="Confirm New Password" 
                                    type="password" 
                                    fullWidth 
                                    value={passwords.confirm}
                                    onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                                />
                            </Box>
                        </Box>
                         <Box mt={3} display="flex" justifyContent="flex-end">
                            <Button 
                                variant="outlined" 
                                color="error"
                                onClick={handlePasswordChange}
                            >
                                Update Password
                            </Button>
                        </Box>
                    </Paper>
                </Box>
            </Box>
        </Box>
    );
};

export default AdminProfilePage;
