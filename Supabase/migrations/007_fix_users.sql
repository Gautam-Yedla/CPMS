-- 1. Allow Admins to see ALL profiles
-- (Currently, users can only see their own)

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (
    exists (
      select 1 from public.user_roles ur
      join public.roles r on ur.role_id = r.id
      where ur.user_id = auth.uid() and r.name = 'Admin'
    )
  );

-- 2. Backfill Email for existing users
-- Syncs email from auth.users to public.profiles where it is missing
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id
AND p.email IS NULL;

-- 3. Ensure User Roles are viewable by Admin
-- (Assuming user_roles table exists and needs RLS)
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all user_roles" ON public.user_roles
  FOR SELECT USING (
    exists (
      select 1 from public.user_roles ur
      join public.roles r on ur.role_id = r.id
      where ur.user_id = auth.uid() and r.name = 'Admin'
    )
  );

CREATE POLICY "Users can view own user_roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);
