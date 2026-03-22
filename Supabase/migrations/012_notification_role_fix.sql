-- Migration: Fix case-sensitivity in notification triggers and role checks

-- 1. Ensure all admins (case-insensitive) are approved
UPDATE public.profiles SET is_approved = TRUE WHERE LOWER(role) = 'admin';

-- 2. Update handle_new_user function to be case-insensitive
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, is_approved)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    COALESCE(new.raw_user_meta_data->>'role', 'student'),
    CASE 
      WHEN LOWER(new.raw_user_meta_data->>'role') = 'admin' THEN TRUE 
      ELSE FALSE 
    END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Update notify_admins_of_signup to be case-insensitive
CREATE OR REPLACE FUNCTION public.notify_admins_of_signup()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert a notification for every admin
  INSERT INTO public.notifications (user_id, title, description, type)
  SELECT id, 'New Signup Request', 
         NEW.full_name || ' (' || NEW.role || ') has requested access. Please review and approve.', 
         'system'
  FROM public.profiles
  WHERE LOWER(role) = 'admin';
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
