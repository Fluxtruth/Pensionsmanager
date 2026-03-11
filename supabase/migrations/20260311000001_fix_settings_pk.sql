-- Fix settings primary key for multi-tenancy
BEGIN;

-- 1. Check if we need to set a default pension_id for existing rows (safety)
UPDATE public.settings 
SET pension_id = (SELECT id FROM public.pensions LIMIT 1) 
WHERE pension_id IS NULL;

-- 2. Drop existing PK
ALTER TABLE public.settings DROP CONSTRAINT IF EXISTS settings_pkey;

-- 3. Add composite PK (key, pension_id)
ALTER TABLE public.settings ADD PRIMARY KEY (key, pension_id);

COMMIT;
