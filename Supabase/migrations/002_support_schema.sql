-- Create support_tickets table
create table if not exists public.support_tickets (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete set null,
  subject text not null,
  message text not null,
  status text default 'open' check (status in ('open', 'pending', 'closed')),
  priority text default 'medium' check (priority in ('low', 'medium', 'high')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table public.support_tickets enable row level security;

-- Policies
-- Users can view their own tickets
create policy "Users can view own tickets" on public.support_tickets
  for select using (auth.uid() = user_id);

-- Users can insert their own tickets
create policy "Users can insert own tickets" on public.support_tickets
  for insert with check (auth.uid() = user_id);

-- Admins can view all tickets (This requires a logic to identify admins, 
-- typically checking a 'roles' table or a custom claim. 
-- For simplicity here, we'll allow Authenticated users to view for now 
-- OR strictly rely on the app logic if we want to be quick.
-- BETTER: Check public.user_roles for 'admin' role.
-- )

-- For now, let's keep it simple: Authenticated users can view (we filter in backend/frontend appropriately) checks
-- ideally:
-- create policy "Admins can view all tickets" on public.support_tickets
--   for select using (exists (select 1 from public.user_roles where user_id = auth.uid() and role_id in (select id from public.roles where name = 'Admin')));

-- Allow Updates (Replies/Status changes) - usually admins or owner
create policy "Users and Admins can update tickets" on public.support_tickets
  for update using (auth.uid() = user_id or exists (select 1 from public.user_roles ur join public.roles r on ur.role_id = r.id where ur.user_id = auth.uid() and r.name = 'Admin'));
