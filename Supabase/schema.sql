-- Initial Schema for CPMS

-- Users Profiles (Extending Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'student',
  student_id TEXT,
  department TEXT,
  vehicle_number TEXT,
  vehicle_type TEXT,
  vehicle_make_model TEXT,
  vehicle_color TEXT,
  permit_status TEXT,
  permit_expiry TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone."
ON public.profiles;

CREATE POLICY "Users read own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile."
  ON public.profiles FOR INSERT
  WITH CHECK ( auth.uid() = id );

CREATE POLICY "Users can update own profile."
  ON public.profiles FOR UPDATE
  USING ( auth.uid() = id );
-- Trigger to automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    'student'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if present
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Re-create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Parking Logs Table
CREATE TABLE IF NOT EXISTS public.parking_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  vehicle_number TEXT NOT NULL,
  entry_time TIMESTAMPTZ DEFAULT NOW(),
  exit_time TIMESTAMPTZ,
  zone TEXT,
  spot TEXT,
  status TEXT DEFAULT 'Completed',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Permits Table
CREATE TABLE IF NOT EXISTS public.permits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  vehicle_number TEXT NOT NULL,
  permit_type TEXT DEFAULT 'Standard',
  zone TEXT,
  spot TEXT,
  issue_date TIMESTAMPTZ DEFAULT NOW(),
  expiry_date TIMESTAMPTZ,
  status TEXT DEFAULT 'Active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tickets (Support) Table
CREATE TABLE IF NOT EXISTS public.tickets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  category TEXT,
  priority TEXT DEFAULT 'Low',
  subject TEXT,
  description TEXT,
  status TEXT DEFAULT 'Open',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for all new tables
ALTER TABLE public.parking_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

-- Policies for parking_logs
CREATE POLICY "Users can view their own parking logs."
  ON public.parking_logs FOR SELECT
  USING ( auth.uid() = user_id );

-- Policies for permits
CREATE POLICY "Users can view their own permits."
  ON public.permits FOR SELECT
  USING ( auth.uid() = user_id );

-- Policies for tickets
CREATE POLICY "Users can view their own tickets."
  ON public.tickets FOR SELECT
  USING ( auth.uid() = user_id );

CREATE POLICY "Users can insert their own tickets."
  ON public.tickets FOR INSERT
  WITH CHECK ( auth.uid() = user_id );

-- Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT CHECK (type IN ('permit', 'security', 'system', 'general')) DEFAULT 'general',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policies for notifications
CREATE POLICY "Users can view their own notifications."
  ON public.notifications FOR SELECT
  USING ( auth.uid() = user_id );

CREATE POLICY "Users can update their own notifications (read status)."
  ON public.notifications FOR UPDATE
  USING ( auth.uid() = user_id );

-- Violations Table
CREATE TABLE IF NOT EXISTS public.violations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  vehicle_number TEXT NOT NULL,
  violation_type TEXT,
  description TEXT,
  amount DECIMAL(10, 2),
  status TEXT DEFAULT 'Unpaid',
  violation_date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for violations
ALTER TABLE public.violations ENABLE ROW LEVEL SECURITY;

-- Policies for violations
CREATE POLICY "Users can view their own violations."
  ON public.violations FOR SELECT
  USING ( auth.uid() = user_id );

