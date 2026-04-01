import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import LoginPage from '@modules/Auth/LoginPage';
import StudentRegisterPage from '@modules/Auth/StudentRegisterPage';
import FacultyRegisterPage from '@modules/Auth/FacultyRegisterPage';
import { IRootState } from '@app/appReducer';
import { IPermission } from '@modules/Auth/authReducer';
import { Lending } from '@app/Layout/Lending';
import AppLayout from '@app/Layout/AppLayout';
import StudentDashboard from '@modules/Student/Dashboard/StudentDashboardWrapper';
import VehiclesPage from '@modules/Student/Vehicles/VehiclesPage';
import StatusPage from '@modules/Student/Status/StatusPage';
import HistoryPage from '@modules/Student/History/HistoryPage';
import ProfilePage from '@modules/Student/Profile/ProfilePage';
import SettingsPage from '@modules/Student/Settings/SettingsPage';
import StudentNotificationsPage from '@modules/Student/Notifications/StudentNotificationsPage';
import ActivityLogPage from '@modules/Student/Activity/ActivityLogPage';
import FacultyDashboardHome from '@modules/Faculty/Dashboard/FacultyDashboardHome';

import AdminDashboard from '@modules/Admin/Dashboard/AdminDashboard';
import AdminDashboardHome from '@modules/Admin/Dashboard/components/AdminDashboardHome';
import LiveStreams from '@modules/Admin/Cameras/LiveStreams';
import CameraManagement from '@modules/Admin/Cameras/CameraManagement';
import MediaUploads from '@modules/Admin/Cameras/MediaUploads';
import SystemStatus from '@modules/Admin/Cameras/SystemStatus';
import RolesPage from '@modules/Admin/Authorization/Roles/RolesPage';
import PermissionsPage from '@modules/Admin/Authorization/Permissions/PermissionsPage';
import UsersPage from '@modules/Admin/Authorization/Users/UsersPage';
import ReportPage from '@modules/Student/Report/ReportPage';
import UserManagementPage from '@modules/Admin/UserManagement/UserManagementPage';
import SupportTicketsPage from '@modules/Admin/Support/SupportTicketsPage';
import ViolationsPage from '@modules/Admin/Violations/ViolationsPage';
import ReportsPage from '@modules/Admin/Reports/ReportsPage';
import ParkingManagementPage from '@modules/Admin/Parking/ParkingManagementPage';
import PermitReviewPage from '@modules/Admin/Parking/PermitReviewPage';
import MyFinesPage from '@modules/Shared/Fines/MyFinesPage';
import AdminFinesPage from '@modules/Admin/Fines/AdminFinesPage';
import AdminNotificationsPage from '@modules/Admin/Notifications/AdminNotificationsPage';

const PrivateRoute = () => {
  const { isLoggedIn } = useSelector((state: IRootState) => state.app.auth);
  return isLoggedIn ? <Outlet /> : <Navigate to="/login" replace />;
};

const RoleRoute = ({ allowedRoles }: { allowedRoles: string[] }) => {
  const { user } = useSelector((state: IRootState) => state.app.auth);
  // Case-insensitive role check
  const userRole = user?.role?.toLowerCase() || '';
  const normalizedAllowedRoles = allowedRoles.map(r => r.toLowerCase());

  return user && normalizedAllowedRoles.includes(userRole) ? <Outlet /> : <Navigate to="/" replace />;
};

const PermissionRoute = ({ permission }: { permission: string }) => {
  const { user } = useSelector((state: IRootState) => state.app.auth);
  const userRole = user?.role?.toLowerCase();
  const isAdmin = userRole === 'admin';

  // Faculty and Admins usually have most view permissions by default if DB seeding fails
  const hasDefaultAccess = (userRole === 'faculty' && permission.startsWith('zones.')) ||
    (userRole === 'student' && (permission === 'vehicles.manage' || permission === 'history.view'));

  const hasPermission = user?.permissions?.some((p: IPermission) => p.name === permission);

  return isAdmin || hasPermission || hasDefaultAccess ? <Outlet /> : <Navigate to="/" replace />;
};

export const RouteNavigation = () => {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<StudentRegisterPage />} />
        <Route path="/register-faculty" element={<FacultyRegisterPage />} />

        {/* Protected Routes */}
        <Route element={<PrivateRoute />}>
          <Route path="/" element={<Lending />} />

          <Route element={<AppLayout />}>
            {/* Common Routes */}
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/notifications" element={<StudentNotificationsPage />} />
            <Route path="/support" element={<ReportPage />} />
            <Route path="/status" element={<StatusPage />} />

            {/* Permission Based Routes */}
            <Route element={<PermissionRoute permission="vehicles.manage" />}>
              <Route path="/vehicles" element={<VehiclesPage />} />
            </Route>

            <Route element={<PermissionRoute permission="history.view" />}>
              <Route path="/history" element={<HistoryPage />} />
            </Route>

            <Route element={<PermissionRoute permission="zones.faculty.view" />}>
              <Route path="/zones" element={<React.Suspense fallback={<div>Loading...</div>}>
                {React.createElement(React.lazy(() => import('@modules/Faculty/Zones/ZoneMonitoringPage')))}
              </React.Suspense>} />
            </Route>

            <Route element={<PermissionRoute permission="system.health.view" />}>
              <Route path="/system-health" element={<SystemStatus />} />
            </Route>

            <Route element={<PermissionRoute permission="fines.view.own" />}>
              <Route path="/fines" element={<MyFinesPage />} />
            </Route>

            {/* Role Based Dashboards */}
            <Route element={<RoleRoute allowedRoles={['student']} />}>
              <Route path="/student-dashboard" element={<StudentDashboard />} />
              <Route path="/student/vehicles" element={<Navigate to="/vehicles" replace />} />
              <Route path="/student/status" element={<Navigate to="/status" replace />} />
              <Route path="/student/history" element={<Navigate to="/history" replace />} />
              <Route path="/student/report" element={<Navigate to="/support" replace />} />
              <Route path="/student/profile" element={<Navigate to="/profile" replace />} />
              <Route path="/student/settings" element={<Navigate to="/settings" replace />} />
              <Route path="/student/notifications" element={<Navigate to="/notifications" replace />} />
              <Route path="/student/activity" element={<ActivityLogPage />} />
            </Route>

            <Route element={<RoleRoute allowedRoles={['faculty']} />}>
              <Route path="/faculty-dashboard" element={<FacultyDashboardHome />} />
            </Route>

            <Route element={<RoleRoute allowedRoles={['security']} />}>
              <Route path="/security-dashboard" element={<div style={{ padding: '2rem' }}><h1>Security Dashboard</h1></div>} />
            </Route>

            <Route element={<RoleRoute allowedRoles={['admin']} />}>
              <Route element={<AdminDashboard />}>
                <Route path="/admin-dashboard" element={<AdminDashboardHome />} />
                <Route path="/admin/live-streams" element={<LiveStreams />} />
                <Route path="/admin/cameras" element={<CameraManagement />} />
                <Route path="/admin/media-uploads" element={<MediaUploads />} />
                <Route path="/admin/system-status" element={<SystemStatus />} />

                <Route path="/admin/auth/roles" element={<RolesPage />} />
                <Route path="/admin/auth/permissions" element={<PermissionsPage />} />
                <Route path="/admin/auth/users" element={<UsersPage />} />

                <Route path="/admin/users" element={<UserManagementPage />} />
                <Route path="/admin/parking" element={<ParkingManagementPage />} />
                <Route path="/admin/permits" element={<PermitReviewPage />} />
                <Route path="/admin/violations" element={<ViolationsPage />} />
                <Route path="/admin/reports" element={<ReportsPage />} />
                <Route path="/admin/support" element={<SupportTicketsPage />} />
                
                <Route element={<PermissionRoute permission="notifications.view.all" />}>
                  <Route path="/admin/notifications" element={<AdminNotificationsPage />} />
                </Route>

                <Route element={<PermissionRoute permission="fines.view.all" />}>
                  <Route path="/admin/fines" element={<AdminFinesPage />} />
                </Route>
              </Route>
            </Route>
          </Route>
        </Route>

        {/* Default route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};
