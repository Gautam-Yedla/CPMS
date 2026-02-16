import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import LoginPage from '@modules/Auth/LoginPage';
import StudentRegisterPage from '@modules/Auth/StudentRegisterPage';
import { IRootState } from '@app/appReducer';
import { Lending } from '@app/Layout/Lending';
import StudentLayout from '@app/Layout/StudentLayout';
import StudentDashboard from '@modules/Student/Dashboard/StudentDashboardWrapper';
import VehiclesPage from '@modules/Student/Vehicles/VehiclesPage';
import StatusPage from '@modules/Student/Status/StatusPage';
import HistoryPage from '@modules/Student/History/HistoryPage';
import ReportPage from '@modules/Student/Report/ReportPage';
import ProfilePage from '@modules/Student/Profile/ProfilePage';
import SettingsPage from '@modules/Student/Settings/SettingsPage';
import StudentNotificationsPage from '@modules/Student/Notifications/StudentNotificationsPage';
import ActivityLogPage from '@modules/Student/Activity/ActivityLogPage';

import AdminLayout from '@app/Layout/AdminLayout';
import AdminDashboard from '@modules/Admin/Dashboard/AdminDashboard';
import AdminDashboardHome from '@modules/Admin/Dashboard/components/AdminDashboardHome';
import LiveStreams from '@modules/Admin/Cameras/LiveStreams';
import CameraManagement from '@modules/Admin/Cameras/CameraManagement';
import MediaUploads from '@modules/Admin/Cameras/MediaUploads';
import SystemStatus from '@modules/Admin/Cameras/SystemStatus';
import RolesPage from '@modules/Admin/Authorization/Roles/RolesPage';
import UsersPage from '@modules/Admin/Authorization/Users/UsersPage';
import UserManagementPage from '@modules/Admin/UserManagement/UserManagementPage';
import SupportTicketsPage from '@modules/Admin/Support/SupportTicketsPage';

const PrivateRoute = () => {
  const { isLoggedIn } = useSelector((state: IRootState) => state.app.auth);
  return isLoggedIn ? <Outlet /> : <Navigate to="/login" replace />;
};

const RoleRoute = ({ allowedRoles }: { allowedRoles: string[] }) => {
  const { user } = useSelector((state: IRootState) => state.app.auth);
  return user && allowedRoles.includes(user.role) ? <Outlet /> : <Navigate to="/" replace />;
};

export const RouteNavigation = () => {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<StudentRegisterPage />} />
        
        {/* Protected Routes */}
        <Route element={<PrivateRoute />}>
          <Route path="/" element={<Lending />} />
          
          <Route element={<RoleRoute allowedRoles={['student']} />}>
            <Route element={<StudentLayout />}>
              <Route path="/student-dashboard" element={<StudentDashboard />} />
              <Route path="/student/vehicles" element={<VehiclesPage />} />
              <Route path="/student/status" element={<StatusPage />} />
              <Route path="/student/history" element={<HistoryPage />} />
              <Route path="/student/report" element={<ReportPage />} />
              <Route path="/student/profile" element={<ProfilePage />} />
              <Route path="/student/settings" element={<SettingsPage />} />
              <Route path="/student/notifications" element={<StudentNotificationsPage />} />
              <Route path="/student/activity" element={<ActivityLogPage />} />
            </Route>
          </Route>

          <Route element={<RoleRoute allowedRoles={['faculty']} />}>
            <Route path="/faculty-dashboard" element={<div style={{ padding: '2rem' }}><h1>Faculty Dashboard</h1></div>} />
          </Route>

          <Route element={<RoleRoute allowedRoles={['security']} />}>
            <Route path="/security-dashboard" element={<div style={{ padding: '2rem' }}><h1>Security Dashboard</h1></div>} />
          </Route>

          <Route element={<RoleRoute allowedRoles={['admin']} />}>
            <Route element={<AdminLayout />}>
              <Route element={<AdminDashboard />}>
                <Route path="/admin-dashboard" element={<AdminDashboardHome />} />
                <Route path="/admin/live-streams" element={<LiveStreams />} />
                <Route path="/admin/cameras" element={<CameraManagement />} />
                <Route path="/admin/media-uploads" element={<MediaUploads />} />
                <Route path="/admin/system-status" element={<SystemStatus />} />
                
                {/* Authorization Routes */}
                <Route path="/admin/auth/roles" element={<RolesPage />} />
                <Route path="/admin/auth/users" element={<UsersPage />} />

                <Route path="/admin/users" element={<UserManagementPage />} />
                <Route path="/admin/parking" element={<div style={{ padding: '2rem' }}><h1>Parking Management</h1></div>} />
                <Route path="/admin/violations" element={<div style={{ padding: '2rem' }}><h1>Violations</h1></div>} />
                <Route path="/admin/reports" element={<div style={{ padding: '2rem' }}><h1>Reports</h1></div>} />
                
                <Route path="/admin/support" element={<SupportTicketsPage />} />
                <Route path="/admin/settings" element={<SettingsPage />} />
                <Route path="/admin/profile" element={<ProfilePage />} />
                <Route path="/admin/users" element={<UserManagementPage />} />
              </Route>
            </Route>
          </Route>

          <Route element={<RoleRoute allowedRoles={['guest']} />}>
            <Route path="/guest-access" element={<div style={{ padding: '2rem' }}><h1>Guest Access</h1></div>} />
          </Route>
        </Route>

        {/* Default route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};
