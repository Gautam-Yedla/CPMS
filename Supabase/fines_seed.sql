-- Seed script for Fines and Payments Permissions
-- Run this in the Supabase SQL Editor to populate the database with the required Fines permissions.

-- 1. Insert Fines Permissions
INSERT INTO public.permissions (name, module, description, scope)
VALUES 
  ('fines.view.own', 'Fines', 'View own fines', 'system'),
  ('fines.pay.own', 'Fines', 'Pay own fines', 'system'),
  ('fines.view.all', 'Fines', 'View all fines in the system', 'global'),
  ('fines.manage.all', 'Fines', 'Manage all fines', 'global')
ON CONFLICT (name) DO NOTHING;

-- 2. Link Admin to the new Fines Permissions
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM public.roles r, public.permissions p
WHERE r.name = 'Admin'
AND p.name IN ('fines.view.own', 'fines.pay.own', 'fines.view.all', 'fines.manage.all')
ON CONFLICT DO NOTHING;

-- 3. Link Student and Faculty to own Fines Permissions
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM public.roles r, public.permissions p
WHERE r.name IN ('Student', 'Faculty')
AND p.name IN ('fines.view.own', 'fines.pay.own')
ON CONFLICT DO NOTHING;
