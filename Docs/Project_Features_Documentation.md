# CPMS Overall Project Features Documentation

## 1. Project Introduction

The **Car Parking Management System (CPMS)** is an integrated university-scale solution designed to automate parking operations, enhance security oversight, and provide real-time occupancy data. By combining modern web technologies (React/Express) with advanced Artificial Intelligence, CPMS transforms traditional manual parking logs into a data-driven security ecosystem.

---

## 2. Implemented Features

### AI Security & Monitoring

- **Hybrid Vehicle Detection**: Real-time Computer Vision system that identifies various vehicle types (cars, motorcycles, buses, trucks) and monitors their movements through facility access points.
- **Cognitive Spatial Reasoning**: Advanced AI logic capable of identifying vacancies and parking infractions even in outdoor areas without physical parking markings or faded lines.
- **Virtual Gate Counters**: Automated entry and exit tracking using digital tripwires to maintain accurate real-time counts.

### Permit & Compliance

- **Digital Permit Management**: Implemented system for automated permit application submission and administrative review.
- **Dynamic Spot Allocation**: Logic for assigning specific parking zones based on user roles and permit classifications.
- **Automated Violation Logging**: System for automatically detecting and recording parking rule infractions with integrated support for administrative verification.

### Real-time Dashboard

- **Live Occupancy Tracking**: Dashboard interface providing visual representation of filled vs. available parking spots per zone.
- **Integrated Camera Streams**: Centralized interface for viewing live hardware camera feeds and monitoring connection status.
- **Security Notifications**: Instant system-generated alerts for security events, permit status changes, and notifications.

### Enterprise-Grade Security

- **Role-Based Access Control (RBAC)**: Secure, distinct interfaces and feature sets tailored for Administrators, Security personnel, Faculty, and Students.
- **Row-Level Security (RLS)**: Deep database integration ensuring strict data isolation so users can only access their authorized records.

---

## 3. Technical Integration & Data Flow

The CPMS project utilizes a multi-layered synchronization approach:

- **ML Integration**: The AI pipeline continuously monitors video streams and synchronizes detection states with a centralized data bridge.
- **Backend API**: An Express-based gateway that orchestrates data flow between the AI services, the database, and the frontend.
- **Real-time Updates**: Integration with Supabase "Realtime" to ensure the dashboard reflects physical changes in the parking lot instantly without manual refreshes.

---

## 4. Conclusion

The Car Parking Management System represents a robust implementation integrating backend services with advanced AI logic and a modern user interface. The current feature set provides high-fidelity security data and efficient parking management suitable for university environments.
