# CPMS Database Documentation

## 1. Project Database Overview
### Purpose
The Car Parking Management System (CPMS) database is designed to provide a robust, scalable, and secure backend for managing vehicle parking, permits, violations, and real-time camera-based monitoring. It serves as the central repository for user profiles, parking logs, security notifications, and machine learning (ML) detection data.

### Why Supabase?
Supabase was chosen as the backend-as-a-service (BaaS) provider because it offers:
- **PostgreSQL Database**: A powerful, open-source relational database.
- **Built-in Authentication**: Seamless integration with user management.
- **Real-time Capabilities**: Instant updates for parking status and notifications via PostgreSQL replication.
- **Row Level Security (RLS)**: Fine-grained access control directly at the database level.
- **Auto-generated APIs**: Instant REST and GraphQL APIs based on the database schema.

### Architecture
The database is built on **PostgreSQL**, hosted on Supabase's cloud infrastructure. It utilizes a modular schema design where core entities (Users, Permits, Logs) are separated from specialized modules (Cameras, ML Detections).

---

## 2. Database Architecture
### Design Philosophy
The database follows a relational model with a focus on data integrity through foreign key constraints and automated workflows using PostgreSQL triggers.

### Supabase Integration
- **Authentication**: Integrates with `auth.users` to manage identity.
- **Storage**: (If applicable) Used for storing vehicle photos or violation evidence.
- **Database Services**: Provides the relational engine for all CPMS logic.
- **Backend Integration**: The application (Next.js/Node.js) interacts with the database via the Supabase Client SDK, utilizing RLS to ensure users only access authorized data.

---

## 3. Database Schema Overview
The CPMS database consists of several interconnected tables, each serving a specific role:
| Table | Role |
| :--- | :--- |
| `profiles` | Stores extended user information linked to Supabase Auth. |
| `parking_logs` | Records entry and exit events for vehicles. |
| `permits` | Manages parking authorizations and specific spot assignments. |
| `tickets` | Handles support requests and user inquiries. |
| `notifications` | Stores system-generated alerts for users. |
| `violations` | Tracks parking rule infractions and payment status. |
| `cameras` | Manages metadata for hardware camera streams. |
| `camera_detections` | Logs ML-based vehicle and plate detections. |
| `activity_logs` | Audits user actions within the system. |

---

## 4. Tables Documentation

### Table: `profiles`
**Purpose**: Extends the default Supabase Auth user table with application-specific details.
| Column | Data Type | Description | Constraints |
| :--- | :--- | :--- | :--- |
| `id` | UUID | Unique identifier (FK to `auth.users`) | Primary Key |
| `full_name` | TEXT | User's complete name | - |
| `role` | TEXT | User role (student, admin, security, faculty) | Default: 'student' |
| `student_id` | TEXT | University-specific ID | - |
| `vehicle_number`| TEXT | Primary vehicle plate | - |
| `permit_status` | TEXT | Current permit standing | - |

### Table: `parking_logs`
**Purpose**: Tracks vehicle movements in and out of the facility.
| Column | Data Type | Description | Constraints |
| :--- | :--- | :--- | :--- |
| `id` | UUID | Unique log ID | Primary Key |
| `user_id` | UUID | Reference to user | FK (auth.users) |
| `entry_time` | TIMESTAMPTZ| Arrival time | Default: NOW() |
| `exit_time` | TIMESTAMPTZ| Departure time | - |
| `status` | TEXT | 'Ongoing' or 'Completed' | Default: 'Completed' |

### Table: `permits`
**Purpose**: Documentation of valid parking authorizations.
| Column | Data Type | Description | Constraints |
| :--- | :--- | :--- | :--- |
| `id` | UUID | Unique permit ID | Primary Key |
| `user_id` | UUID | Reference to owner | FK (auth.users) |
| `zone` | TEXT | Authorized parking zone | - |
| `expiry_date` | TIMESTAMPTZ| Validity end date | - |

### Table: `cameras`
**Purpose**: Configuration for hardware cameras and RTSP streams.
| Column | Data Type | Description | Constraints |
| :--- | :--- | :--- | :--- |
| `id` | UUID | Unique camera ID | Primary Key |
| `name` | TEXT | Camera identifier (e.g., "North Gate") | NOT NULL |
| `type` | TEXT | Stream type (RTSP, Webcam) | CHECK constraint |
| `status` | TEXT | Connection status | Online/Offline |

---

## 5. Table Relationships
The schema utilizes **One-to-Many (1:N)** and **One-to-One (1:1)** relationships:
- **1:1 (`auth.users` ↔ `profiles`)**: Every authenticated user has exactly one profile record.
- **1:N (`profiles` ↔ `parking_logs`)**: One user can have multiple parking entries over time.
- **1:N (`profiles` ↔ `permits`)**: A user can hold multiple permits (e.g., for different vehicles).
- **1:N (`cameras` ↔ `camera_detections`)**: One camera generates many detection events.

---

## 6. ER Diagram Explanation
The Entity Relationship (ER) structure is centered around the **User (Profiles)** entity. 
- **Core Loop**: A User applies for a **Permit**, which allows them to generate **Parking Logs**. 
- **Security Loop**: **Cameras** produce **Detections**, which may trigger **Violations** or **Notifications** for the User. 
- **Support Loop**: Users create **Tickets** for administrative help.
- **Audit Loop**: All significant actions are captured in **Activity Logs**.

---

## 7. Data Flow
1. **Authentication**: User logs in via Supabase Auth.
2. **Ingress**: ML services insert detection data into `camera_detections`.
3. **Processing**: Backend logic evaluates detections against `permits`.
4. **Logging**: System updates `parking_logs` and `activity_logs`.
5. **Notification**: If a violation is found, a record is added to `violations` and `notifications`.

---

## 8. Security and Access Control
### Row Level Security (RLS)
The database uses RLS to enforce data privacy:
- **Self-Access**: Users can only `SELECT`, `UPDATE`, or `DELETE` records where `user_id = auth.uid()`.
- **Role-Based**: Admins and Security roles have elevated privileges (defined in `profiles.role`).
- **Camera Access**: Only users with 'admin' or 'security' roles can view or manage camera configurations.

---

## 9. Performance Considerations
- **Indexing**: B-Tree indexes are applied to `user_id`, `vehicle_number`, and `timestamp` columns for fast lookups.
- **Query Optimization**: Using JSONB for ML results and camera configs allows for flexible yet performant schema-less data storage.
- **Scalability**: PostgreSQL on Supabase handles thousands of concurrent requests with connection pooling.

---

## 10. Advantages of Using Supabase
- **Open Source**: Built on standard PostgreSQL, avoiding vendor lock-in.
- **Real-time**: Leverages "Realtime" to push live parking updates to the frontend.
- **Ease of Use**: Reduces boilerplate code for Auth and CRUD operations.

---

## 11. Conclusion
The Supabase-backed PostgreSQL database provides a high-performance, secure foundation for CPMS. By leveraging RLS and real-time features, the system ensures data integrity and a responsive user experience suitable for university-scale parking management.
