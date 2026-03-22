-- Emergency Seed for CPMS Roles & Permissions
-- Run this in the Supabase SQL Editor if your roles/permissions tables are empty.

-- 1. Insert Core Roles
INSERT INTO public.roles (name, description, is_system)
VALUES 
  ('Admin', 'System Administrator with full access to all modules and configurations.', true),
  ('Student', 'Campus student with access to personal vehicle management and parking status.', true),
  ('Faculty', 'Staff and faculty members with access to reserved zones and zone monitoring.', true),
  ('Security', 'Security personnel with access to live streams, violations, and campus monitoring.', true)
ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description;

-- 2. Insert Essential Permissions
INSERT INTO public.permissions (name, module, description)
VALUES 
  -- Vehicles
  ('vehicles.manage', 'Vehicles', 'Register and manage personal vehicles'),
  ('vehicles.admin.view', 'Vehicles', 'View all campus vehicles'),
  
  -- Monitoring
  ('cameras.view', 'Monitoring', 'Access live camera streams'),
  ('cameras.manage', 'Monitoring', 'Configure camera hardware and streams'),
  
  -- Parking
  ('permits.apply', 'Parking', 'Apply for parking permits'),
  ('permits.review', 'Parking', 'Review and approve permit applications'),
  ('zones.faculty.view', 'Parking', 'View faculty-specific zone details'),
  
  -- System
  ('system.health.view', 'System', 'Monitor system health and ML pipeline status'),
  ('auth.roles.manage', 'Authorization', 'Create and modify system roles'),
  ('auth.permissions.manage', 'Authorization', 'Manage system permissions'),
  ('auth.users.manage', 'Authorization', 'Assign roles to users'),
  
  -- Reports
  ('reports.view', 'Analytics', 'View and generate parking reports'),
  ('violations.manage', 'Security', 'Record and manage parking violations')
ON CONFLICT (name) DO NOTHING;

-- 3. Link Admin to ALL Permissions
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM public.roles r, public.permissions p
WHERE r.name = 'Admin'
ON CONFLICT DO NOTHING;

-- 4. Link Student Permissions
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM public.roles r, public.permissions p
WHERE r.name = 'Student' 
AND p.name IN ('vehicles.manage', 'permits.apply')
ON CONFLICT DO NOTHING;

-- 5. Link Faculty Permissions
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM public.roles r, public.permissions p
WHERE r.name = 'Faculty' 
AND p.name IN ('vehicles.manage', 'permits.apply', 'zones.faculty.view')
ON CONFLICT DO NOTHING;
