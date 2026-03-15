-- 010_assign_first_admin.sql
-- Assigns the 'Admin 001' user to the 'Admin' role so they can bypass the auth RLS policies we just added

INSERT INTO public.user_roles (user_id, role_id)
SELECT 
    'b0c5f510-6c2b-4725-95dd-91f701688048'::uuid,  -- Admin 001 User ID
    'b1a3456a-3782-45b4-9f47-b03b0a6168ae'::uuid   -- System Admin Role ID
WHERE NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = 'b0c5f510-6c2b-4725-95dd-91f701688048'::uuid 
      AND role_id = 'b1a3456a-3782-45b4-9f47-b03b0a6168ae'::uuid
);
