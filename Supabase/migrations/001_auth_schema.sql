-- Enable UUID extension if not already enabled
create extension if not exists "uuid-ossp";

-- 1. Create Roles Table
create table if not exists public.roles (
  id uuid default uuid_generate_v4() primary key,
  name text not null unique,
  description text,
  is_system boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. Create Permissions Table
create table if not exists public.permissions (
  id uuid default uuid_generate_v4() primary key,
  name text not null unique, -- e.g., 'users.create', 'roles.view'
  module text not null,      -- e.g., 'User Management', 'Authorization'
  description text,
  scope text default 'global', -- e.g., 'global', 'own'
  created_at timestamptz default now()
);

-- 3. Create Role Permissions Junction Table
create table if not exists public.role_permissions (
  role_id uuid references public.roles(id) on delete cascade,
  permission_id uuid references public.permissions(id) on delete cascade,
  primary key (role_id, permission_id)
);

-- 4. Create User Roles Junction Table
create table if not exists public.user_roles (
  user_id uuid references auth.users(id) on delete cascade, -- Assuming Supabase Auth
  role_id uuid references public.roles(id) on delete cascade,
  primary key (user_id, role_id)
);

-- Enable Row Level Security
alter table public.roles enable row level security;
alter table public.permissions enable row level security;
alter table public.role_permissions enable row level security;
alter table public.user_roles enable row level security;

-- Policies (Adjust strictly for production)
-- For now, allow authenticated users to view. In real app, only admins should manage.
create policy "Allow read access for authenticated users" on public.roles for select using (auth.role() = 'authenticated');
create policy "Allow read access for authenticated users" on public.permissions for select using (auth.role() = 'authenticated');
create policy "Allow read access for authenticated users" on public.role_permissions for select using (auth.role() = 'authenticated');
create policy "Allow read access for authenticated users" on public.user_roles for select using (auth.role() = 'authenticated');

-- Insert default Admin Role
insert into public.roles (name, description, is_system)
values ('Admin', 'System Administrator with full access', true)
on conflict (name) do nothing;

-- Insert default User Role
insert into public.roles (name, description, is_system)
values ('User', 'Standard User', true)
on conflict (name) do nothing;
