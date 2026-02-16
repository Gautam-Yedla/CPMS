-- Add category to support_tickets
ALTER TABLE public.support_tickets 
ADD COLUMN IF NOT EXISTS category text;

-- Drop redundant tickets table
DROP TABLE IF EXISTS public.tickets;

-- Ensure priority check constraint allows lowercase (or just rely on app logic, but updating constraint is better)
-- First drop existing constraint if named known, or just leave it if it allows lowercase 'low' etc.
-- The user showed: constraint support_tickets_priority_check check ((priority = any (array['low'::text, 'medium'::text, 'high'::text])))
-- This means it ONLY accepts lowercase. So our backend fix to lowercase() is correct and necessary.

-- Same for status: status = any (array['open'::text, 'pending'::text, 'closed'::text])
-- Backend must ensure lowercase.
