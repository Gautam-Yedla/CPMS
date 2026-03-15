# CPMS Frontend Documentation

## 1. Introduction
The Frontend of the Car Parking Management System (CPMS) is a modern, responsive single-page application (SPA) designed to provide an intuitive interface for students, faculty, security personnel, and administrators. It focuses on accessibility, real-time feedback, and efficient data visualization for parking occupancy and security monitoring.

---

## 2. Architecture & Design Patterns
The application architecture is built on **React 19** and **Vite**, utilizing a modular feature-based structure. 
- **Modularization**: Code is organized into functional modules (Admin, Student, Auth) to ensure scalability and maintainability.
- **Component-Driven Development**: Reusable UI components are created using Material UI and styled-components.
- **Role-Based Access Control (RBAC)**: Secure routing ensures users only access pages authorized for their roles.

---

## 3. Technology Stack

### Core Frameworks
| Technology | Role |
| :--- | :--- |
| **React 19** | Modern UI library for building component-based interfaces. |
| **Vite** | Lightning-fast build tool and development server. |
| **TypeScript** | Static typing for improved code quality and developer experience. |

### UI & Styling
- **Material UI (MUI)**: Primary UI framework for polished, accessible components (Data Grids, Modals, Buttons).
- **Lucide React**: Vector icons for a clean and consistent visual language.
- **Styled Components**: Component-level styling for flexible design implementation.

### State & Data Management
- **Redux Toolkit**: Centralized global state management (Auth status, persistent preferences).
- **React Query (v3)**: Server-state management for efficient caching, synchronization, and data fetching.
- **Supabase JS**: SDK for direct interaction with the Supabase backend services.

---

## 4. Project Structure
The `src/app` directory follows a structured pattern:
- **`Layout/`**: Definition of shared structural components (Sidebars, Headers) for different roles.
- **`modules/`**: Contains feature-specific logic. Each module includes its own components, hooks, and services.
    - `Auth`: User authentication flows.
    - `Student`: Features for parking permits and history.
    - `Admin`: Dashboard and system management tools.
- **`Routes/`**: Centralized route configuration with RBAC logic.
- **`shared/`**: Common UI components and utilities used across the entire app.

---

## 5. Component Documentation

### Shared Layouts
- **`AdminLayout`**: Dashboard view with a dedicated sidebar for system administration.
- **`StudentLayout`**: Simplified view focused on vehicle management and notifications.

### Primary Modules
- **Admin Dashboard**: Real-time overview of camera status, parking occupancy, and system health.
- **Parking Management**: Interface for managing zones, spots, and permits.
- **Camera Stream**: Integrated view for live RTSP stream monitoring.
- **Violation Center**: Table-based interface for auditing and processing infractions.

---

## 6. Routing & Navigation
Navigation is handled by **React Router Dom v7**.
### Role-Based Access Control (RBAC)
- **`PrivateRoute`**: Guards routes that require a logged-in session.
- **`RoleRoute`**: A wrapper that checks the user's role (e.g., 'admin', 'student') against authorized roles for specific paths.

| Module | Access Roles |
| :--- | :--- |
| Auth (Login/Register) | Public |
| Student Dashboard | Student |
| Admin Dashboard | Admin |
| Camera Management | Admin, Security |

---

## 7. State Management Flow
1. **Global Auth State**: Managed in Redux. `isLoggedIn` and `user` data are persisted across sessions.
2. **Data Fetching**: React Query hooks fetch data from Supabase. 
3. **Optimistic Updates**: Used in feature-rich pages (like Status updates) to provide an "instant" feel.
4. **Persistent State**: `redux-persist` ensures the application state survives page reloads.

---

## 8. UI/UX Guidelines
- **Responsive Design**: All pages are optimized for desktop and tablet viewports.
- **Feedback Systems**: `react-toastify` provides real-time notifications for success, error, and info messages.
- **Accessibility**: ARIA labels and keyboard navigation are implemented through MUI components.

---

## 9. Authentication Flow
- **Supabase Auth**: The frontend leverages Supabase for JWT-based authentication.
- **Session Handling**: Tokens are automatically handled by the Supabase client and integrated into the global Redux state.
- **Protected UI**: Unauthorized navigation attempts redirect users back to the landing or login page.

---

## 10. Internationalization (i18n)
Full support for multi-language interfaces using `i18next`. Translation keys are managed within `src/i18n`, allowing for easy localization of the interface for different user groups.

---

## 11. Conclusion
The CPMS Frontend is a performant and secure application that bridges the gap between complex ML-driven backend data and the end-user. By using industry-leading technologies like React, Redux, and MUI, it provides a stable and high-quality user experience tailored for campus parking operations.
