-- Fix RLS Policy for Permits table
-- Use this to allow users to apply for permits

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'permits' AND policyname = 'Users can insert their own permits'
    ) THEN
        CREATE POLICY "Users can insert their own permits"
        ON public.permits FOR INSERT
        WITH CHECK ( auth.uid() = user_id );
    END IF;
END $$;
