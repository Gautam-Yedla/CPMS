-- Database policies fix for Admin Authorization Deletions
-- Run this in your Supabase SQL Editor if you cannot delete permissions from roles or roles themselves in the UI.

-- Ensure Admin roles can delete from authorization tables
DO $$
BEGIN
    -- Fix for role_permissions
    DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.role_permissions;
    CREATE POLICY "Enable delete for authenticated users" 
    ON public.role_permissions FOR DELETE 
    USING (auth.uid() IS NOT NULL);

    -- Fix for roles table
    DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.roles;
    CREATE POLICY "Enable delete for authenticated users" 
    ON public.roles FOR DELETE 
    USING (auth.uid() IS NOT NULL);

    -- Fix for user_roles
    DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.user_roles;
    CREATE POLICY "Enable delete for authenticated users" 
    ON public.user_roles FOR DELETE 
    USING (auth.uid() IS NOT NULL);
EXCEPTION
    WHEN undefined_table THEN
        RAISE NOTICE 'Skipping policy creation - tables might not have RLS enabled or do not exist.';
END
$$;
