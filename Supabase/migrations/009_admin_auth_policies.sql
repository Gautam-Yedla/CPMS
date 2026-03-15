-- Policies to allow Admins to manage Roles, Permissions, and User Roles

-- 1. Roles
create policy "Admins can insert roles" on public.roles for insert with check (
  exists (select 1 from public.user_roles ur join public.roles r on ur.role_id = r.id where ur.user_id = auth.uid() and r.name = 'Admin')
);
create policy "Admins can update roles" on public.roles for update using (
  exists (select 1 from public.user_roles ur join public.roles r on ur.role_id = r.id where ur.user_id = auth.uid() and r.name = 'Admin')
);
create policy "Admins can delete roles" on public.roles for delete using (
  exists (select 1 from public.user_roles ur join public.roles r on ur.role_id = r.id where ur.user_id = auth.uid() and r.name = 'Admin')
);

-- 2. Permissions
create policy "Admins can insert permissions" on public.permissions for insert with check (
  exists (select 1 from public.user_roles ur join public.roles r on ur.role_id = r.id where ur.user_id = auth.uid() and r.name = 'Admin')
);
create policy "Admins can update permissions" on public.permissions for update using (
  exists (select 1 from public.user_roles ur join public.roles r on ur.role_id = r.id where ur.user_id = auth.uid() and r.name = 'Admin')
);
create policy "Admins can delete permissions" on public.permissions for delete using (
  exists (select 1 from public.user_roles ur join public.roles r on ur.role_id = r.id where ur.user_id = auth.uid() and r.name = 'Admin')
);

-- 3. Role Permissions
create policy "Admins can insert role_permissions" on public.role_permissions for insert with check (
  exists (select 1 from public.user_roles ur join public.roles r on ur.role_id = r.id where ur.user_id = auth.uid() and r.name = 'Admin')
);
create policy "Admins can delete role_permissions" on public.role_permissions for delete using (
  exists (select 1 from public.user_roles ur join public.roles r on ur.role_id = r.id where ur.user_id = auth.uid() and r.name = 'Admin')
);

-- 4. User Roles
create policy "Admins can insert user_roles" on public.user_roles for insert with check (
  exists (select 1 from public.user_roles ur join public.roles r on ur.role_id = r.id where ur.user_id = auth.uid() and r.name = 'Admin')
);
create policy "Admins can update user_roles" on public.user_roles for update using (
  exists (select 1 from public.user_roles ur join public.roles r on ur.role_id = r.id where ur.user_id = auth.uid() and r.name = 'Admin')
);
create policy "Admins can delete user_roles" on public.user_roles for delete using (
  exists (select 1 from public.user_roles ur join public.roles r on ur.role_id = r.id where ur.user_id = auth.uid() and r.name = 'Admin')
);
