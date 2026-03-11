import Database from 'better-sqlite3';
import { join } from 'path';
import { homedir } from 'os';
import { existsSync, mkdirSync } from 'fs';

/**
 * CLI SEEDING SCRIPT FOR LOCAL SQLITE DATABASE
 * Run with: npm run seed:local
 */

const IDENTIFIER = 'com.pensionsmanager.pensionsmanager';
const DB_NAME = 'pensionsmanager.db';

// Resolve the database path for Windows
const dbPath = join(homedir(), 'AppData', 'Roaming', IDENTIFIER, DB_NAME);

if (!existsSync(dbPath)) {
    console.error(`Database not found at: ${dbPath}`);
    console.log("Please start the Tauri app at least once to initialize the database.");
    process.exit(1);
}

console.log(`Connecting to local database: ${dbPath}`);
const db = new Database(dbPath);

const pensionId = "77777777-7777-7777-7777-777777777777";
const now = new Date().toISOString();
const today = "2026-03-11";

try {
    // 1. Transaction to maintain integrity
    const run = db.transaction(() => {
        console.log("Wiping existing data...");
        
        db.prepare("PRAGMA foreign_keys = OFF").run();

        const tables = [
            "breakfast_options",
            "cleaning_tasks",
            "bookings",
            "room_configs",
            "occasions",
            "cleaning_task_suggestions",
            "staff",
            "booking_groups",
            "guests",
            "rooms",
            "settings",
            "pensions"
        ];

        for (const table of tables) {
            try {
                db.prepare(`DELETE FROM ${table}`).run();
            } catch (e) {
                console.warn(`Could not clear table ${table}: ${e.message}`);
                // Pension table might not exist yet if app hasn't run with the latest update
                if (table === 'pensions' && e.message.includes('no such table')) {
                    console.log("Creating pensions table...");
                    db.prepare(`
                        CREATE TABLE IF NOT EXISTS pensions (
                            id TEXT PRIMARY KEY,
                            name TEXT NOT NULL,
                            created_at TEXT,
                            updated_at TEXT,
                            synced_at TEXT
                        )
                    `).run();
                }
            }
        }

        console.log("Seeding fresh data...");

        // Pension
        db.prepare("INSERT INTO pensions (id, name, created_at, updated_at) VALUES (?, ?, ?, ?)")
          .run(pensionId, "Sonnenhof Pension", now, now);

        // Rooms
        const rooms = [
            ['R101', 'Zimmer 101', 'Doppelzimmer', 85.00, 1, 0, now, pensionId],
            ['R102', 'Zimmer 102', 'Doppelzimmer', 85.00, 0, 0, now, pensionId],
            ['R201', 'Zimmer 201', 'Einzelzimmer', 55.00, 1, 0, now, pensionId],
            ['R202', 'Zimmer 202', 'Einzelzimmer', 55.00, 0, 1, now, pensionId],
            ['S001', 'Ferienwohnung 1', 'Ferienwohnung', 150.00, 1, 1, now, pensionId]
        ];
        const insertRoom = db.prepare("INSERT INTO rooms (id, name, type, base_price, is_allergy_friendly, is_accessible, updated_at, pension_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
        rooms.forEach(row => insertRoom.run(...row));

        // Configs
        db.prepare("INSERT INTO room_configs (id, room_id, is_default, updated_at, pension_id) VALUES (?, ?, ?, ?, ?)")
          .run('CONF_R101', 'R101', 1, now, pensionId);
        db.prepare("INSERT INTO room_configs (id, room_id, is_default, updated_at, pension_id) VALUES (?, ?, ?, ?, ?)")
          .run('CONF_S001', 'S001', 1, now, pensionId);

        // Guests
        const guests = [
            ['G001', 'Max Mustermann', 'Max', 'Mustermann', 'max@example.com', '+49 123 456789', now, pensionId],
            ['G002', 'Erika Schmidt', 'Erika', 'Schmidt', 'erika.s@web.de', '+49 987 654321', now, pensionId],
            ['G003', 'John Doe', 'John', 'Doe', 'john.doe@gmail.com', '+1 555 0199', now, pensionId],
            ['G004', 'Lukas Anreise', 'Lukas', 'Anreise', 'lukas@today.com', '+49 111 222333', now, pensionId],
            ['G005', 'Sara Abreise', 'Sara', 'Abreise', 'sara@today.com', '+49 444 555666', now, pensionId]
        ];
        const insertGuest = db.prepare("INSERT INTO guests (id, name, first_name, last_name, email, phone, updated_at, pension_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
        guests.forEach(row => insertGuest.run(...row));

        // Groups & Occasions
        db.prepare("INSERT INTO booking_groups (id, name, updated_at, pension_id) VALUES (?, ?, ?, ?)")
          .run('BG001', 'Wandergruppe Alpen', now, pensionId);
        db.prepare("INSERT INTO occasions (id, title, status, updated_at, pension_id) VALUES (?, ?, ?, ?, ?)")
          .run('OCC001', 'Jahrestreffen 2026', 'Hard-Booked', now, pensionId);

        // Bookings
        const bookings = [
            ['B1001', 'R101', 'G001', '2026-05-10', '2026-05-15', 415.00, 'Hard-Booked', 'pending', now, pensionId],
            ['B1002', 'S001', 'G002', '2026-03-05', '2026-03-15', 1500.00, 'Checked-In', 'paid', now, pensionId],
            ['B1004', 'R102', 'G004', today, '2026-03-14', 255.00, 'Hard-Booked', 'pending', now, pensionId],
            ['B1005', 'R202', 'G005', '2026-03-08', today, 165.00, 'Checked-In', 'paid', now, pensionId],
            ['B1003', 'R201', 'G003', '2026-02-10', '2026-02-12', 110.00, 'Checked-Out', 'paid', now, pensionId]
        ];
        const insertBooking = db.prepare("INSERT INTO bookings (id, room_id, guest_id, start_date, end_date, final_price, status, payment_status, updated_at, pension_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        bookings.forEach(row => insertBooking.run(...row));

        // Staff
        db.prepare("INSERT INTO staff (id, name, role, updated_at, pension_id) VALUES (?, ?, ?, ?, ?)")
          .run('S01', 'Anna Reiniger', 'Cleaning', now, pensionId);
        db.prepare("INSERT INTO staff (id, name, role, updated_at, pension_id) VALUES (?, ?, ?, ?, ?)")
          .run('S02', 'Bernd Besen', 'Cleaning', now, pensionId);

        // Cleaning Tasks
        db.prepare("INSERT INTO cleaning_tasks (id, room_id, staff_id, date, status, updated_at, pension_id) VALUES (?, ?, ?, ?, ?, ?, ?)")
          .run('CT001', 'R102', 'S01', '2026-03-12', 'pending', now, pensionId);
        db.prepare("INSERT INTO cleaning_tasks (id, room_id, staff_id, date, status, updated_at, pension_id) VALUES (?, ?, ?, ?, ?, ?, ?)")
          .run('CT002', 'R202', 'S02', '2026-03-12', 'pending', now, pensionId);

        // Settings
        const settings = [
            ['checkin_time', '14:00', now, pensionId],
            ['checkout_time', '11:00', now, pensionId],
            ['branding_title', 'Sonnenhof Pension', now, pensionId]
        ];
        const insertSetting = db.prepare("INSERT INTO settings (key, value, updated_at, pension_id) VALUES (?, ?, ?, ?)");
        settings.forEach(row => insertSetting.run(...row));

        db.prepare("PRAGMA foreign_keys = ON").run();
    });

    run();
    console.log("✅ Local database successfully seeded!");
} catch (error) {
    console.error("❌ Seeding failed:", error.message);
} finally {
    db.close();
}
