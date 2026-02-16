-- Policy to allow Admins to view ALL tickets
-- Assumes 'Admin' role exists in public.roles and user is assigned in public.user_roles

create policy "Admins can view all tickets" on public.support_tickets
  for select using (
    exists (
      select 1 from public.user_roles ur
      join public.roles r on ur.role_id = r.id
      where ur.user_id = auth.uid() and r.name = 'Admin'
    )
  );

-- Also ensure Admins can update any ticket (already partially covered but good to enforce)
drop policy if exists "Users and Admins can update tickets" on public.support_tickets;

create policy "Users can update own tickets" on public.support_tickets
  for update using (auth.uid() = user_id);

create policy "Admins can update all tickets" on public.support_tickets
  for update using (
    exists (
      select 1 from public.user_roles ur
      join public.roles r on ur.role_id = r.id
      where ur.user_id = auth.uid() and r.name = 'Admin'
    )
  );
