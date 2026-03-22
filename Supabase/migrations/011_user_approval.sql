-- Migration to add user approval workflow

-- 1. Add is_approved column to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT FALSE;

-- 2. Update existing users (if any) to be approved (optional, but good for current admins)
UPDATE public.profiles SET is_approved = TRUE WHERE role = 'admin';

-- 3. Update the handle_new_user trigger function to set is_approved
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, is_approved)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    COALESCE(new.raw_user_meta_data->>'role', 'student'),
    CASE 
      WHEN (new.raw_user_meta_data->>'role') = 'admin' THEN TRUE 
      ELSE FALSE 
    END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Notification Trigger: Notify Admins of new signups
CREATE OR REPLACE FUNCTION public.notify_admins_of_signup()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert a notification for every admin
  INSERT INTO public.notifications (user_id, title, description, type)
  SELECT id, 'New Signup Request', 
         NEW.full_name || ' (' || NEW.role || ') has requested access. Please review and approve.', 
         'system'
  FROM public.profiles
  WHERE role = 'admin';
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_profile_created_notify_admin ON public.profiles;
CREATE TRIGGER on_profile_created_notify_admin
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  WHEN (NEW.is_approved = FALSE)
  EXECUTE PROCEDURE public.notify_admins_of_signup();

-- 5. Notification Trigger: Notify User of approval
CREATE OR REPLACE FUNCTION public.notify_user_of_approval()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notifications (user_id, title, description, type)
  VALUES (NEW.id, 'Account Approved', 'Your membership has been approved! You can now access all features.', 'system');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_profile_approved_notify_user ON public.profiles;
CREATE TRIGGER on_profile_approved_notify_user
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  WHEN (OLD.is_approved = FALSE AND NEW.is_approved = TRUE)
  EXECUTE PROCEDURE public.notify_user_of_approval();
