-- Policies for Admin access to violations table
-- Admins need full access to all violations to display them on the dashboard

-- Drop policies if they exist to prevent errors on multiple runs
DROP POLICY IF EXISTS "Admins can view all violations" ON public.violations;
DROP POLICY IF EXISTS "Admins can insert all violations" ON public.violations;
DROP POLICY IF EXISTS "Admins can update all violations" ON public.violations;
DROP POLICY IF EXISTS "Admins can delete all violations" ON public.violations;

-- Admins can view all violations
CREATE POLICY "Admins can view all violations"
ON public.violations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid() AND r.name = 'Admin'
  )
);

-- Admins can update all violations
CREATE POLICY "Admins can update all violations"
ON public.violations
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid() AND r.name = 'Admin'
  )
);

-- Admins can insert all violations
CREATE POLICY "Admins can insert all violations"
ON public.violations
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid() AND r.name = 'Admin'
  )
);

-- Admins can delete all violations
CREATE POLICY "Admins can delete all violations"
ON public.violations
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid() AND r.name = 'Admin'
  )
);
