-- Initial Migration: Mirror Production Schema

-- Extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS uuid-ossp WITH SCHEMA extensions;

-- Tables
CREATE TABLE public.pensions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.rooms (
    id text PRIMARY KEY,
    name text NOT NULL,
    type text NOT NULL,
    base_price numeric DEFAULT 0,
    is_allergy_friendly boolean DEFAULT false,
    is_accessible boolean DEFAULT false,
    updated_at timestamp with time zone DEFAULT now(),
    pension_id uuid REFERENCES public.pensions(id)
);

CREATE TABLE public.room_configs (
    id text PRIMARY KEY,
    room_id text REFERENCES public.rooms(id),
    attributes text,
    base_price numeric,
    available_from text,
    available_until text,
    is_default boolean DEFAULT false,
    updated_at timestamp with time zone DEFAULT now(),
    pension_id uuid REFERENCES public.pensions(id)
);

CREATE TABLE public.guests (
    id text PRIMARY KEY,
    name text NOT NULL,
    first_name text,
    middle_name text,
    last_name text,
    email text,
    phone text,
    company text,
    notes text,
    contact_info text,
    identity_doc_info text,
    preferences text,
    relationships text,
    total_revenue numeric DEFAULT 0,
    nationality text,
    updated_at timestamp with time zone DEFAULT now(),
    pension_id uuid REFERENCES public.pensions(id)
);

CREATE TABLE public.booking_groups (
    id text PRIMARY KEY,
    name text NOT NULL,
    updated_at timestamp with time zone DEFAULT now(),
    pension_id uuid REFERENCES public.pensions(id)
);

CREATE TABLE public.occasions (
    id text PRIMARY KEY,
    title text NOT NULL,
    type text,
    status text,
    main_guest_id text REFERENCES public.guests(id),
    room_suggestions text,
    updated_at timestamp with time zone DEFAULT now(),
    pension_id uuid REFERENCES public.pensions(id)
);

CREATE TABLE public.bookings (
    id text PRIMARY KEY,
    room_id text REFERENCES public.rooms(id),
    guest_id text REFERENCES public.guests(id),
    occasion_id text REFERENCES public.occasions(id),
    start_date text,
    end_date text,
    final_price numeric,
    status text,
    payment_status text,
    actual_checkin_at text,
    actual_checkout_at text,
    occasion text,
    estimated_arrival_time text,
    group_id text REFERENCES public.booking_groups(id),
    is_family_room boolean DEFAULT false,
    has_dog boolean DEFAULT false,
    is_allergy_friendly boolean DEFAULT false,
    has_mobility_impairment boolean DEFAULT false,
    guests_per_room integer DEFAULT 1,
    stay_type text DEFAULT 'private'::text,
    dog_count integer DEFAULT 0,
    child_count integer DEFAULT 0,
    extra_bed_count integer DEFAULT 0,
    is_main_guest boolean DEFAULT false,
    updated_at timestamp with time zone DEFAULT now(),
    pension_id uuid REFERENCES public.pensions(id),
    notes text
);

CREATE TABLE public.staff (
    id text PRIMARY KEY,
    name text NOT NULL,
    role text,
    daily_capacity integer,
    updated_at timestamp with time zone DEFAULT now(),
    pension_id uuid REFERENCES public.pensions(id)
);

CREATE TABLE public.cleaning_tasks (
    id text PRIMARY KEY,
    room_id text REFERENCES public.rooms(id),
    staff_id text REFERENCES public.staff(id),
    date text,
    status text,
    is_exception boolean DEFAULT false,
    original_date text,
    title text,
    task_type text DEFAULT 'cleaning'::text,
    comments text,
    is_manual boolean DEFAULT false,
    delayed_from text,
    source text,
    updated_at timestamp with time zone DEFAULT now(),
    pension_id uuid REFERENCES public.pensions(id)
);

CREATE TABLE public.cleaning_task_suggestions (
    id text PRIMARY KEY,
    title text NOT NULL,
    weekday integer,
    frequency_weeks integer DEFAULT 1,
    updated_at timestamp with time zone DEFAULT now(),
    pension_id uuid REFERENCES public.pensions(id)
);

CREATE TABLE public.breakfast_options (
    id text PRIMARY KEY,
    booking_id text REFERENCES public.bookings(id),
    date text,
    is_included boolean DEFAULT false,
    is_prepared boolean DEFAULT false,
    guest_count integer DEFAULT 1,
    time text,
    comments text,
    source text DEFAULT 'auto'::text,
    is_manual boolean DEFAULT false,
    updated_at timestamp with time zone DEFAULT now(),
    pension_id uuid REFERENCES public.pensions(id)
);

CREATE TABLE public.settings (
    key text PRIMARY KEY,
    value text,
    updated_at timestamp with time zone DEFAULT now(),
    pension_id uuid REFERENCES public.pensions(id)
);

CREATE TABLE public.user_profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id),
    pension_id uuid REFERENCES public.pensions(id),
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.backups (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    pension_id uuid REFERENCES public.pensions(id),
    name text NOT NULL,
    data jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    created_by uuid REFERENCES auth.users(id)
);

CREATE TABLE public.connected_devices (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    pension_id uuid REFERENCES public.pensions(id),
    device_id text NOT NULL,
    device_name text,
    device_type text,
    status text DEFAULT 'active'::text CHECK (status = ANY (ARRAY['active'::text, 'revoked'::text])),
    is_leading_db boolean DEFAULT false,
    last_seen_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    synced_at timestamp with time zone
);

-- Functions
CREATE OR REPLACE FUNCTION public.get_passkey_by_credential(cred_id text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'user_id', p.user_id,
    'public_key', encode(p.public_key, 'base64'),
    'counter', p.counter,
    'transports', p.transports
  ) INTO result
  FROM public.passkeys p
  WHERE p.credential_id = cred_id;

  RETURN result;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_passkey_counter(cred_id text, new_counter bigint)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  UPDATE public.passkeys
  SET counter = new_counter, last_used = now()
  WHERE credential_id = cred_id;
END;
$function$;

-- RLS Enablement
ALTER TABLE public.breakfast_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pensions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cleaning_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cleaning_task_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connected_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.occasions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow all for authenticated users" ON public.breakfast_options TO public USING (auth.role() = 'authenticated');
CREATE POLICY "Tenant Isolation" ON public.breakfast_options TO authenticated USING (pension_id = (SELECT pension_id FROM public.user_profiles WHERE id = auth.uid())) WITH CHECK (pension_id = (SELECT pension_id FROM public.user_profiles WHERE id = auth.uid()));

CREATE POLICY "Users can view their own pension" ON public.pensions FOR SELECT TO authenticated USING (id = (SELECT pension_id FROM public.user_profiles WHERE id = auth.uid()));

CREATE POLICY "Users can view their own profile" ON public.user_profiles FOR SELECT TO authenticated USING (id = auth.uid());

CREATE POLICY "Allow all for authenticated users" ON public.staff TO public USING (auth.role() = 'authenticated');
CREATE POLICY "Tenant Isolation" ON public.staff TO authenticated USING (pension_id = (SELECT pension_id FROM public.user_profiles WHERE id = auth.uid())) WITH CHECK (pension_id = (SELECT pension_id FROM public.user_profiles WHERE id = auth.uid()));

CREATE POLICY "Allow all for authenticated users" ON public.cleaning_tasks TO public USING (auth.role() = 'authenticated');
CREATE POLICY "Tenant Isolation" ON public.cleaning_tasks TO authenticated USING (pension_id = (SELECT pension_id FROM public.user_profiles WHERE id = auth.uid())) WITH CHECK (pension_id = (SELECT pension_id FROM public.user_profiles WHERE id = auth.uid()));

CREATE POLICY "Allow all for authenticated users" ON public.bookings TO public USING (auth.role() = 'authenticated');
CREATE POLICY "Tenant Isolation" ON public.bookings TO authenticated USING (pension_id = (SELECT pension_id FROM public.user_profiles WHERE id = auth.uid())) WITH CHECK (pension_id = (SELECT pension_id FROM public.user_profiles WHERE id = auth.uid()));

CREATE POLICY "Allow all for authenticated users" ON public.cleaning_task_suggestions TO public USING (auth.role() = 'authenticated');
CREATE POLICY "Tenant Isolation" ON public.cleaning_task_suggestions TO authenticated USING (pension_id = (SELECT pension_id FROM public.user_profiles WHERE id = auth.uid())) WITH CHECK (pension_id = (SELECT pension_id FROM public.user_profiles WHERE id = auth.uid()));

CREATE POLICY "Allow all for authenticated users" ON public.settings TO public USING (auth.role() = 'authenticated');
CREATE POLICY "Tenant Isolation" ON public.settings TO authenticated USING (pension_id = (SELECT pension_id FROM public.user_profiles WHERE id = auth.uid())) WITH CHECK (pension_id = (SELECT pension_id FROM public.user_profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert devices for their pension" ON public.connected_devices FOR INSERT TO public WITH CHECK (pension_id IN (SELECT pension_id FROM public.user_profiles WHERE id = auth.uid()));
CREATE POLICY "Users can update devices for their pension" ON public.connected_devices FOR UPDATE TO public USING (pension_id IN (SELECT pension_id FROM public.user_profiles WHERE id = auth.uid()));
CREATE POLICY "Users can view devices for their pension" ON public.connected_devices FOR SELECT TO public USING (pension_id IN (SELECT pension_id FROM public.user_profiles WHERE id = auth.uid()));

CREATE POLICY "Users can delete backups of their pension" ON public.backups FOR DELETE TO public USING (EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND pension_id = public.backups.pension_id));
CREATE POLICY "Users can insert backups for their pension" ON public.backups FOR INSERT TO public WITH CHECK (EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND pension_id = public.backups.pension_id));
CREATE POLICY "Users can view backups of their pension" ON public.backups FOR SELECT TO public USING (EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND pension_id = public.backups.pension_id));

CREATE POLICY "Allow all for authenticated users" ON public.rooms TO public USING (auth.role() = 'authenticated');
CREATE POLICY "Tenant Isolation" ON public.rooms TO authenticated USING (pension_id = (SELECT pension_id FROM public.user_profiles WHERE id = auth.uid())) WITH CHECK (pension_id = (SELECT pension_id FROM public.user_profiles WHERE id = auth.uid()));

CREATE POLICY "Allow all for authenticated users" ON public.room_configs TO public USING (auth.role() = 'authenticated');
CREATE POLICY "Tenant Isolation" ON public.room_configs TO authenticated USING (pension_id = (SELECT pension_id FROM public.user_profiles WHERE id = auth.uid())) WITH CHECK (pension_id = (SELECT pension_id FROM public.user_profiles WHERE id = auth.uid()));

CREATE POLICY "Allow all for authenticated users" ON public.guests TO public USING (auth.role() = 'authenticated');
CREATE POLICY "Tenant Isolation" ON public.guests TO authenticated USING (pension_id = (SELECT pension_id FROM public.user_profiles WHERE id = auth.uid())) WITH CHECK (pension_id = (SELECT pension_id FROM public.user_profiles WHERE id = auth.uid()));

CREATE POLICY "Allow all for authenticated users" ON public.booking_groups TO public USING (auth.role() = 'authenticated');
CREATE POLICY "Tenant Isolation" ON public.booking_groups TO authenticated USING (pension_id = (SELECT pension_id FROM public.user_profiles WHERE id = auth.uid())) WITH CHECK (pension_id = (SELECT pension_id FROM public.user_profiles WHERE id = auth.uid()));

CREATE POLICY "Allow all for authenticated users" ON public.occasions TO public USING (auth.role() = 'authenticated');
CREATE POLICY "Tenant Isolation" ON public.occasions TO authenticated USING (pension_id = (SELECT pension_id FROM public.user_profiles WHERE id = auth.uid())) WITH CHECK (pension_id = (SELECT pension_id FROM public.user_profiles WHERE id = auth.uid()));
