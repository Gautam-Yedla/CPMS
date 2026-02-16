-- Drop the existing foreign key constraint (referencing auth.users)
-- We need to know the constraint name. Supabase/Postgres usually names it 'table_column_fkey'.
-- support_tickets_user_id_fkey

ALTER TABLE public.support_tickets 
DROP CONSTRAINT IF EXISTS support_tickets_user_id_fkey;

-- Add new foreign key referencing public.profiles
ALTER TABLE public.support_tickets
ADD CONSTRAINT support_tickets_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES public.profiles(id)
ON DELETE SET NULL;

-- Explanation:
-- PostgREST (Supabase API) can only detect relationships for joins if the Foreign Key
-- points directly to the exposed table (public.profiles) rather than the hidden system table (auth.users).
-- Since profiles.id is guaranteed to be the same as auth.users.id, this is safe and correct.
