-- 1. Create Pensions Table
CREATE TABLE IF NOT EXISTS public.pensions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create User Profiles to link Auth Users to Pensions
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    pension_id UUID REFERENCES public.pensions(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Enable RLS on core tables
ALTER TABLE public.pensions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- 4. Add pension_id to all operational tables
DO $$
DECLARE
    t text;
    operational_tables text[] := ARRAY['rooms', 'room_configs', 'guests', 'booking_groups', 'occasions', 'bookings', 'staff', 'cleaning_tasks', 'cleaning_task_suggestions', 'breakfast_options', 'settings'];
BEGIN
    FOR t IN SELECT unnest(operational_tables) LOOP
        -- Add column if it doesn't exist
        EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS pension_id UUID REFERENCES public.pensions(id)', t);
        
        -- Enable RLS
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
        
        -- Drop existing isolation policy if exists (for re-runnability)
        EXECUTE format('DROP POLICY IF EXISTS "Tenant Isolation" ON public.%I', t);
        
        -- Create RLS Policy
        EXECUTE format('
            CREATE POLICY "Tenant Isolation" ON public.%I
            FOR ALL
            TO authenticated
            USING (pension_id = (SELECT pension_id FROM public.user_profiles WHERE id = auth.uid()))
            WITH CHECK (pension_id = (SELECT pension_id FROM public.user_profiles WHERE id = auth.uid()))
        ', t);
    END LOOP;
END $$;

-- 5. Policies for user_profiles and pensions
CREATE POLICY "Users can view their own profile" ON public.user_profiles FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "Users can view their own pension" ON public.pensions FOR SELECT TO authenticated USING (id = (SELECT pension_id FROM public.user_profiles WHERE id = auth.uid()));
