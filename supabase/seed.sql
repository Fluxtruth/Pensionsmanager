-- Seed data for Pensionsmanager

-- 1. Create a Pension
INSERT INTO public.pensions (id, name)
VALUES ('77777777-7777-7777-7777-777777777777', 'Sonnenhof Pension')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- 2. Create User Profiles
-- Using actual UUID for philipp.tschakert@gmail.com
INSERT INTO public.user_profiles (id, pension_id)
VALUES ('09668e43-3215-451a-9c28-00298629fcb4', '77777777-7777-7777-7777-777777777777')
ON CONFLICT (id) DO UPDATE SET pension_id = EXCLUDED.pension_id;

-- 3. Create Rooms
INSERT INTO public.rooms (id, name, type, base_price, is_allergy_friendly, is_accessible, pension_id)
VALUES 
('R101', 'Zimmer 101', 'Doppelzimmer', 85.00, true, false, '77777777-7777-7777-7777-777777777777'),
('R102', 'Zimmer 102', 'Doppelzimmer', 85.00, false, false, '77777777-7777-7777-7777-777777777777'),
('R201', 'Zimmer 201', 'Einzelzimmer', 55.00, true, false, '77777777-7777-7777-7777-777777777777'),
('R202', 'Zimmer 202', 'Einzelzimmer', 55.00, false, true, '77777777-7777-7777-7777-777777777777'),
('S001', 'Ferienwohnung 1', 'Ferienwohnung', 150.00, true, true, '77777777-7777-7777-7777-777777777777')
ON CONFLICT (id) DO UPDATE SET 
    name = EXCLUDED.name, 
    type = EXCLUDED.type, 
    base_price = EXCLUDED.base_price, 
    is_allergy_friendly = EXCLUDED.is_allergy_friendly, 
    is_accessible = EXCLUDED.is_accessible;

-- 4. Create Room Configs
INSERT INTO public.room_configs (id, room_id, is_default, pension_id)
VALUES 
('CONF_R101', 'R101', true, '77777777-7777-7777-7777-777777777777'),
('CONF_S001', 'S001', true, '77777777-7777-7777-7777-777777777777')
ON CONFLICT (id) DO UPDATE SET is_default = EXCLUDED.is_default;

-- 5. Create Guests
INSERT INTO public.guests (id, name, first_name, last_name, email, phone, pension_id)
VALUES 
('G001', 'Max Mustermann', 'Max', 'Mustermann', 'max@example.com', '+49 123 456789', '77777777-7777-7777-7777-777777777777'),
('G002', 'Erika Schmidt', 'Erika', 'Schmidt', 'erika.s@web.de', '+49 987 654321', '77777777-7777-7777-7777-777777777777'),
('G003', 'John Doe', 'John', 'Doe', 'john.doe@gmail.com', '+1 555 0199', '77777777-7777-7777-7777-777777777777'),
('G004', 'Lukas Anreise', 'Lukas', 'Anreise', 'lukas@today.com', '+49 111 222333', '77777777-7777-7777-7777-777777777777'),
('G005', 'Sara Abreise', 'Sara', 'Abreise', 'sara@today.com', '+49 444 555666', '77777777-7777-7777-7777-777777777777')
ON CONFLICT (id) DO UPDATE SET 
    name = EXCLUDED.name, 
    first_name = EXCLUDED.first_name, 
    last_name = EXCLUDED.last_name, 
    email = EXCLUDED.email, 
    phone = EXCLUDED.phone;

-- 6. Booking Groups & Occasions
INSERT INTO public.booking_groups (id, name, pension_id)
VALUES ('BG001', 'Wandergruppe Alpen', '77777777-7777-7777-7777-777777777777')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

INSERT INTO public.occasions (id, title, status, pension_id)
VALUES ('OCC001', 'Jahrestreffen 2026', 'Hard-Booked', '77777777-7777-7777-7777-777777777777')
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, status = EXCLUDED.status;

-- 7. Bookings
-- Today is 2026-03-11

-- Future Booking
INSERT INTO public.bookings (id, room_id, guest_id, start_date, end_date, final_price, status, payment_status, pension_id)
VALUES ('B1001', 'R101', 'G001', '2026-05-10', '2026-05-15', 415.00, 'Hard-Booked', 'pending', '77777777-7777-7777-7777-777777777777')
ON CONFLICT (id) DO UPDATE SET 
    status = EXCLUDED.status, 
    start_date = EXCLUDED.start_date, 
    end_date = EXCLUDED.end_date,
    final_price = EXCLUDED.final_price;

-- Active Booking (Checked-In)
INSERT INTO public.bookings (id, room_id, guest_id, start_date, end_date, final_price, status, payment_status, actual_checkin_at, pension_id)
VALUES ('B1002', 'S001', 'G002', '2026-03-05', '2026-03-15', 1500.00, 'Checked-In', 'paid', '2026-03-05T14:30:00Z', '77777777-7777-7777-7777-777777777777')
ON CONFLICT (id) DO UPDATE SET 
    status = EXCLUDED.status, 
    actual_checkin_at = EXCLUDED.actual_checkin_at;

-- Today Arrival
INSERT INTO public.bookings (id, room_id, guest_id, start_date, end_date, final_price, status, payment_status, pension_id)
VALUES ('B1004', 'R102', 'G004', '2026-03-11', '2026-03-14', 255.00, 'Hard-Booked', 'pending', '77777777-7777-7777-7777-777777777777')
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, start_date = EXCLUDED.start_date;

-- Today Departure
INSERT INTO public.bookings (id, room_id, guest_id, start_date, end_date, final_price, status, payment_status, actual_checkin_at, pension_id)
VALUES ('B1005', 'R202', 'G005', '2026-03-08', '2026-03-11', 165.00, 'Checked-In', 'paid', '2026-03-08T15:00:00Z', '77777777-7777-7777-7777-777777777777')
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, end_date = EXCLUDED.end_date;

-- Past Booking
INSERT INTO public.bookings (id, room_id, guest_id, start_date, end_date, final_price, status, payment_status, actual_checkin_at, actual_checkout_at, pension_id)
VALUES ('B1003', 'R201', 'G003', '2026-02-10', '2026-02-12', 110.00, 'Checked-Out', 'paid', '2026-02-10T15:00:00Z', '2026-02-12T10:00:00Z', '77777777-7777-7777-7777-777777777777')
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status;

-- 8. Staff & Cleaning
INSERT INTO public.staff (id, name, role, pension_id)
VALUES 
('S01', 'Anna Reiniger', 'Cleaning', '77777777-7777-7777-7777-777777777777'),
('S02', 'Bernd Besen', 'Cleaning', '77777777-7777-7777-7777-777777777777')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

INSERT INTO public.cleaning_tasks (id, room_id, staff_id, date, status, pension_id)
VALUES 
('CT001', 'R102', 'S01', '2026-03-12', 'pending', '77777777-7777-7777-7777-777777777777'),
('CT002', 'R202', 'S02', '2026-03-12', 'pending', '77777777-7777-7777-7777-777777777777')
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status;

-- 9. Settings
INSERT INTO public.settings (key, value, pension_id)
VALUES 
('checkin_time', '14:00', '77777777-7777-7777-7777-777777777777'),
('checkout_time', '11:00', '77777777-7777-7777-7777-777777777777'),
('branding_title', 'Sonnenhof Pension', '77777777-7777-7777-7777-777777777777')
ON CONFLICT (key, pension_id) DO UPDATE SET value = EXCLUDED.value;
