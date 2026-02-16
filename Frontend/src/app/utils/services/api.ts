import { supabase } from '../lib/supabase';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const getAuthToken = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token;
};

const request = async (endpoint: string, options: RequestInit = {}) => {
  const token = await getAuthToken();
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'API Request Failed');
  }

  return response.json();
};

export const api = {
  // User
  fetchUserProfile: (userId: string) => request(`/user/${userId}/profile`),
  updateUserProfile: (userId: string, data: any) => request(`/user/${userId}/profile`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  // Notifications
  fetchNotifications: () => request('/notifications'),
  markNotificationRead: (id: string) => request(`/notifications/${id}/read`, { method: 'POST' }),
  markAllNotificationsRead: () => request('/notifications/read-all', { method: 'POST' }),

  // Permits
  fetchActivePermit: () => request('/permits/active'),
  fetchPermitHistory: () => request('/permits/history'),
  applyPermit: (data: any) => request('/permits/apply', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // Dashboard
  fetchDashboardStats: () => request('/dashboard/stats'),

  // Vehicles
  fetchVehicle: () => request('/vehicles'),
  registerVehicle: (data: any) => request('/vehicles', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  deleteVehicle: () => request('/vehicles', { method: 'DELETE' }),

  // Reports
  submitReport: (data: any) => request('/support', {
    method: 'POST',
    body: JSON.stringify({
        subject: data.subject,
        message: data.description,
    }),
  }),

  createTicket: (data: any) => request('/support', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  updateTicket: (id: string, data: any) => request(`/support/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  fetchTickets: () => request('/support'),

  // Users (Admin)
  fetchUsers: () => request('/auth/users'),

  // Activity
  fetchActivityLogs: () => request('/activity'),

  /*
  - [x] Fix Admin Pages whitespace/crash issues
  - [x] Implement error handling for Support/User Management
  - [/] Verify Student Report Page integration with Support Tickets
  - [ ] Final Verificationa)
  */

  // Media Upload (Special handling for FormData)
  uploadMedia: async (formData: FormData) => {
    const token = await getAuthToken();
    const response = await fetch(`${API_BASE_URL}/stream/upload`, {
      method: 'POST',
      headers: {
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Upload Failed');
    }

    return response.json();
  },

  // ML Pipeline
  fetchMLStatus: () => request('/ml/status'),

  // Cameras
  fetchCameras: () => request('/cameras'),
  addCamera: (data: any) => request('/cameras', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateCamera: (id: string, data: any) => request(`/cameras/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  deleteCamera: (id: string) => request(`/cameras/${id}`, { method: 'DELETE' }),

  // Streaming
  processStreamFrame: (cameraId: string, image: string, timestamp?: string) => request('/stream/process', {
    method: 'POST',
    body: JSON.stringify({ cameraId, image, timestamp }),
  }),
  fetchStreamHealth: () => request('/stream/health'),
};
