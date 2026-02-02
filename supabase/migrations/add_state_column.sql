-- Add state column to profiles if it doesn't exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS state TEXT;

-- Seed some random state data for existing profiles for testing
-- We use a CTE to generate random states for users who don't have one
WITH states AS (
    SELECT unnest(ARRAY[
        'Maharashtra', 'Delhi', 'Kerala', 'Karnataka', 'Tamil Nadu', 
        'Uttar Pradesh', 'Gujarat', 'West Bengal', 'Rajasthan', 'Telangana'
    ]) AS state_name
)
UPDATE public.profiles
SET state = (SELECT state_name FROM states ORDER BY random() LIMIT 1)
WHERE state IS NULL;

-- Verify the column exists and has data
SELECT id, email, state FROM public.profiles LIMIT 5;
