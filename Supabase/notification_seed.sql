-- 1. Insert or update Notification Permissions
INSERT INTO permissions (name, module, description, scope)
VALUES 
    ('notifications.view.own', 'Notifications', 'View personal notifications', 'system'),
    ('notifications.view.all', 'Notifications', 'View all system notifications', 'global'),
    ('notifications.create', 'Notifications', 'Create system notifications manually', 'global')
ON CONFLICT (name) DO UPDATE 
SET module = EXCLUDED.module, description = EXCLUDED.description, scope = EXCLUDED.scope;

-- 2. Link Permissions to existing system Roles
DO $$
DECLARE
    admin_id uuid;
    student_id uuid;
    faculty_id uuid;
    security_id uuid;
    user_id uuid;
    
    perm_own_id uuid;
    perm_all_id uuid;
    perm_create_id uuid;
BEGIN
    -- Fetch Role IDs
    SELECT id INTO admin_id FROM roles WHERE name ILIKE 'Admin' LIMIT 1;
    SELECT id INTO student_id FROM roles WHERE name ILIKE 'Student' LIMIT 1;
    SELECT id INTO faculty_id FROM roles WHERE name ILIKE 'Faculty' LIMIT 1;
    SELECT id INTO security_id FROM roles WHERE name ILIKE 'Security' LIMIT 1;
    SELECT id INTO user_id FROM roles WHERE name ILIKE 'User' LIMIT 1;
    
    -- Fetch Permission IDs
    SELECT id INTO perm_own_id FROM permissions WHERE name = 'notifications.view.own';
    SELECT id INTO perm_all_id FROM permissions WHERE name = 'notifications.view.all';
    SELECT id INTO perm_create_id FROM permissions WHERE name = 'notifications.create';
    
    -- Assign to Admin
    IF admin_id IS NOT NULL THEN
        INSERT INTO role_permissions (role_id, permission_id) VALUES (admin_id, perm_own_id) ON CONFLICT DO NOTHING;
        INSERT INTO role_permissions (role_id, permission_id) VALUES (admin_id, perm_all_id) ON CONFLICT DO NOTHING;
        INSERT INTO role_permissions (role_id, permission_id) VALUES (admin_id, perm_create_id) ON CONFLICT DO NOTHING;
    END IF;

    -- Assign .own permission to all other standard roles
    IF student_id IS NOT NULL THEN
        INSERT INTO role_permissions (role_id, permission_id) VALUES (student_id, perm_own_id) ON CONFLICT DO NOTHING;
    END IF;
    
    IF faculty_id IS NOT NULL THEN
        INSERT INTO role_permissions (role_id, permission_id) VALUES (faculty_id, perm_own_id) ON CONFLICT DO NOTHING;
    END IF;
    
    IF security_id IS NOT NULL THEN
        INSERT INTO role_permissions (role_id, permission_id) VALUES (security_id, perm_own_id) ON CONFLICT DO NOTHING;
    END IF;

    IF user_id IS NOT NULL THEN
        INSERT INTO role_permissions (role_id, permission_id) VALUES (user_id, perm_own_id) ON CONFLICT DO NOTHING;
    END IF;
END $$;
