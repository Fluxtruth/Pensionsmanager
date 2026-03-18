import Database from "@tauri-apps/plugin-sql";

// In-memory storage for mock database
// Template for initial mock database state
const mockDataTemplate: Record<string, any[]> = {
  rooms: [
    { id: "101", name: "Zimmer 101", type: "Einzelzimmer", base_price: 50 },
    { id: "102", name: "Zimmer 102", type: "Doppelzimmer", base_price: 80 },
    { id: "103", name: "Zimmer 103", type: "Doppelzimmer", base_price: 85 },
    { id: "201", name: "Appartement A", type: "Ferienwohnung", base_price: 120 },
    { id: "202", name: "Appartement B", type: "Ferienwohnung", base_price: 130 }
  ],
  room_configs: [],
  guests: [
    { id: "g1", name: "Max Mustermann", first_name: "Max", last_name: "Mustermann", email: "max@example.com", phone: "0123456789", company: "Musterfirma" },
    { id: "g2", name: "Erika Musterfrau", first_name: "Erika", last_name: "Musterfrau", email: "erika@example.com", phone: "0987654321" }
  ],
  occasions: [],
  booking_groups: [
    { id: "bg1", name: "Karneval" }
  ],
  bookings: [
    {
      id: "b1", room_id: "101", guest_id: "g1",
      start_date: "2026-01-12", end_date: "2026-01-13",
      status: "Draft", payment_status: "Offen",
      group_id: "bg1", guests_per_room: 1, is_main_guest: 1,
      notes: ""
    },
    {
      id: "b2", room_id: "102", guest_id: "g2",
      start_date: "2026-01-12", end_date: "2026-01-13",
      status: "Draft", payment_status: "Offen",
      group_id: "bg1", guests_per_room: 1, is_main_guest: 0,
      notes: "Testnotiz"
    },
    {
      id: "b3", room_id: "101", guest_id: "g1",
      start_date: "2026-03-10", end_date: "2026-03-15",
      status: "Hard-Booked", payment_status: "Bezahlt",
      group_id: "bg1", guests_per_room: 1, is_main_guest: 1,
      notes: "März Buchung 1"
    },
    {
      id: "b4", room_id: "102", guest_id: "g2",
      start_date: "2026-03-12", end_date: "2026-03-14",
      status: "Checked-In", payment_status: "Offen",
      group_id: "bg1", guests_per_room: 2, is_main_guest: 1,
      notes: "März Buchung 2"
    },
    {
      id: "b5", room_id: "103", guest_id: "g1",
      start_date: "2026-03-20", end_date: "2026-03-25",
      status: "Hard-Booked", payment_status: "Offen",
      group_id: "bg1", guests_per_room: 1, is_main_guest: 1,
      notes: "März Buchung 3"
    },
    {
      id: "b6", room_id: "201", guest_id: "g2",
      start_date: "2026-04-05", end_date: "2026-04-10",
      status: "Hard-Booked", payment_status: "Offen",
      group_id: "bg1", guests_per_room: 3, is_main_guest: 1,
      notes: "April Buchung"
    }
  ],
  staff: [],
  cleaning_tasks: [],
  cleaning_task_suggestions: [],

  breakfast_options: [],
  connected_devices: [],
  settings: [
    { key: "branding_title", value: "Pensionsmanager", updated_at: "2026-01-01T00:00:00", synced_at: null, pension_id: "00000000-0000-0000-0000-000000000001" },
    { key: "branding_logo", value: "/logo.jpg", updated_at: "2026-01-01T00:00:00", synced_at: null, pension_id: "00000000-0000-0000-0000-000000000001" }
  ]
};

// Storage for isolated mock data per pension
const isolatedMockData: Record<string, Record<string, any[]>> = {};

function getIsolatedMockData(pensionId?: string): Record<string, any[]> {
  const pId = pensionId || 'default';
  const isDemoAccount = pId === 'default' || pId === "00000000-0000-0000-0000-000000000001";
  
  if (!isolatedMockData[pId]) {
    // Only use template for the demo account. 
    // New accounts should always start empty to ensure strict separation.
    const initialData = isDemoAccount 
        ? JSON.parse(JSON.stringify(mockDataTemplate))
        : Object.keys(mockDataTemplate).reduce((acc, key) => ({ ...acc, [key]: [] }), {});

    // Ensure all rows have the correct pension_id
    Object.keys(initialData).forEach(table => {
      initialData[table] = initialData[table].map((item: any) => ({
        pension_id: isDemoAccount ? "00000000-0000-0000-0000-000000000001" : pId,
        updated_at: "2026-01-01T00:00:00",
        synced_at: null,
        ...item
      }));
    });
    isolatedMockData[pId] = initialData;
  }
  return isolatedMockData[pId];
}

export const tableNames = Object.keys(mockDataTemplate);

interface DbResult {
  rowsAffected: number;
  lastInsertId?: number;
}

export interface DatabaseMock {
  execute: (query: string, params?: any[]) => Promise<DbResult>;
  select: <T>(query: string, params?: any[]) => Promise<T>;
}

let initPromises: Record<string, Promise<DatabaseMock | null> | undefined> = {};

export function initDb(pensionId?: string): Promise<DatabaseMock | null> {
  // Use provided pensionId or fallback to the last known one from localStorage
  const effectiveId = pensionId || (typeof window !== 'undefined' ? localStorage.getItem("app_last_pension_id") : null);
  
  if (!effectiveId) {
    console.warn("[DB] No pension_id provided and none found in localStorage.");
    return Promise.resolve(null);
  }

  const key = effectiveId;
  if (initPromises[key]) return initPromises[key];
  
  initPromises[key] = _initDb(effectiveId);
  return initPromises[key];
}

async function _initDb(pensionId?: string): Promise<DatabaseMock | null> {
  if (typeof window === "undefined") return null;

  // Check if we are running inside Tauri
  const isTauri = typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__ !== undefined;

  if (!isTauri) {
    const mockData = getIsolatedMockData(pensionId);
    console.warn(`Tauri environment not detected. Using mock in-memory database (Isolated: ${pensionId || 'default'}).`);
    const mock: DatabaseMock = {
      execute: async <T>(query: string, params?: any[]) => {
        const uq = query.toUpperCase();
        console.log("[Mock DB] Execute:", query, params);

        if (uq.startsWith("INSERT")) {
          const table = Object.keys(mockData).find(t => uq.includes(`INTO ${t.toUpperCase()}`)) as keyof typeof mockData;
          if (table) {
            const colsMatch = query.match(/\((.*?)\)/);
            if (colsMatch) {
              const columns = colsMatch[1].split(",").map(c => c.trim().toLowerCase());
              const newRow: any = {};
              columns.forEach((col, i) => {
                newRow[col] = params?.[i];
              });
              const existingIndex = mockData[table].findIndex(item => item.id === newRow.id);
              if (existingIndex !== -1 && uq.includes("REPLACE")) {
                  mockData[table][existingIndex] = { ...mockData[table][existingIndex], ...newRow };
              } else {
                  mockData[table].push(newRow);
              }
            }
          }
        } else if (uq.startsWith("UPDATE")) {
            const table = Object.keys(mockData).find(t => uq.startsWith(`UPDATE ${t.toUpperCase()}`)) as keyof typeof mockData;
            if (table) {
                const idField = table === 'settings' ? 'key' : 'id';
                const idMatch = query.match(/WHERE\s+(\w+)\s*=\s*\?/i);
                if (idMatch) {
                    // Find which parameter index corresponds to the ID field
                    // This is a simplified mock - we assume the first ? after WHERE is the ID
                    const wherePart = query.split(/WHERE/i)[1] || "";
                    const whereConditions = wherePart.split(/AND/i).map(c => c.trim().toLowerCase());
                    const idParamIdxInWhere = whereConditions.findIndex(c => c.includes(`${idField.toLowerCase()} = ?`) || c.includes(`${idField.toLowerCase()}=?`));
                    
                    if (idParamIdxInWhere !== -1) {
                        const setPart = query.match(/SET\s+(.+?)\s+WHERE/i)?.[1] || "";
                        const setParamsCount = (setPart.match(/\?/g) || []).length;
                        const idValue = params?.[setParamsCount + idParamIdxInWhere];
                        
                        const targetIdx = mockData[table].findIndex(item => String(item[idField]) === String(idValue));
                        if (targetIdx !== -1) {
                            const assignments = setPart.split(",").map(a => a.trim().toLowerCase());
                            let paramIdx = 0;
                            assignments.forEach((a) => {
                                if (a.includes("=?") || a.includes("= ?")) {
                                    const col = a.split("=")[0].trim();
                                    mockData[table][targetIdx][col] = params?.[paramIdx++];
                                }
                            });
                            return { rowsAffected: 1, lastInsertId: 0 } as unknown as T;
                        }
                    }
                }
            }
        } else if (uq.startsWith("DELETE FROM")) {
            const table = Object.keys(mockData).find(t => uq.includes(`FROM ${t.toUpperCase()}`)) as keyof typeof mockData;
            if (table) {
                if (!query.includes("WHERE")) {
                    mockData[table] = [];
                } else {
                    const idValue = params?.[0];
                    const idField = table === 'settings' ? 'key' : 'id';
                    mockData[table] = mockData[table].filter(item => String(item[idField]) !== String(idValue));
                }
            }
        }
        return { rowsAffected: 1, lastInsertId: 0 } as unknown as T;
      },
      select: async <T>(query: string, params?: any[]) => {
        const uq = query.toUpperCase();
        console.log("[Mock DB] Select:", query, params);

        const table = Object.keys(mockData).find(t => uq.includes(`FROM ${t.toUpperCase()}`)) as keyof typeof mockData;
        if (!table) {
          if (uq.includes("COUNT(*)")) return [{ count: 0 }] as unknown as T;
          return [] as unknown as T;
        }

        let res = [...(mockData[table] || [])];

        if (table === "bookings" || uq.includes("BOOKINGS")) {
            res = [...mockData.bookings];
            if (uq.includes("STATUS IN")) {
                const statusStr = (query.match(/IN\s*\((.*?)\)/i)?.[1] || "").toLowerCase();
                res = res.filter(b => {
                    const s = b.status?.toLowerCase() || "";
                    if (statusStr.includes("hard-booked") && (s.includes("hard-booked") || s.includes("fest gebucht"))) return true;
                    if (statusStr.includes("checked-in") && (s.includes("checked-in") || s.includes("eingecheckt"))) return true;
                    if (statusStr.includes("checked-out") && (s.includes("checked-out") || s.includes("ausgecheckt"))) return true;
                    if (statusStr.includes("draft") && (s.includes("draft") || s.includes("entwurf"))) return true;
                    if (statusStr.includes("storniert") || statusStr.includes("canceled")) {
                        if (s.includes("storniert") || s.includes("canceled")) return true;
                    }
                    return false;
                });
            }
            if (params && params.length > 0) {
                if (params.length >= 6) {
                    const s = params[0], e = params[1];
                    res = res.filter(b => b.start_date <= e && b.end_date >= s);
                } else if (uq.includes(">=") && (uq.includes("END_DATE") || uq.includes("B.END_DATE"))) {
                    res = res.filter(b => b.end_date >= params[0]);
                } else if (uq.includes("<") && (uq.includes("START_DATE") || uq.includes("B.START_DATE"))) {
                    res = res.filter(b => b.start_date < params[0]);
                }
            }
            return res.map(b => {
                const guest = mockData.guests.find(g => g.id === b.guest_id);
                const room = mockData.rooms.find(r => r.id === b.room_id);
                const group = mockData.booking_groups.find(g => g.id === b.group_id);
                const occasion = mockData.occasions.find(o => o.id === b.occasion_id);
                return {
                    ...b,
                    guest_name: guest?.name || "Unbekannt",
                    guest_phone: guest?.phone,
                    guest_email: guest?.email,
                    guest_company: guest?.company,
                    nationality: guest?.nationality || "DE",
                    room_name: room?.name || `Zimmer ${b.room_id}`,
                    room_type: room?.type || "Zimmer",
                    group_name: group?.name || "",
                    occasion_title: occasion?.title || ""
                };
            }) as unknown as T;
        }

        if (uq.includes("WHERE")) {
            const matches = query.match(/(\w+)\s*=\s*(\?|'[^']*'|"[^"]*")/gi);
            if (matches) {
                let pIdx = 0;
                const filters: Record<string, any> = {};
                matches.forEach(m => {
                    const [f, v] = m.split("=").map(s => s.trim());
                    if (v === "?") filters[f.toLowerCase()] = params?.[pIdx++];
                    else filters[f.toLowerCase()] = v.replace(/['"]/g, "");
                });
                res = res.filter(item => Object.entries(filters).every(([f, v]) => {
                    // Honor the pension_id filter to ensure strict data separation in the mock DB
                    return String(item[f]) === String(v);
                }));
            }
        }
        if (uq.includes("COUNT(*)")) return [{ count: res.length }] as unknown as T;
        if (uq.includes("MAX(SYNCED_AT)")) return [{ max_sync: "2026-03-01T00:00:00Z" }] as unknown as T;
        return res as unknown as T;
      }
    };
    return mock;
  }
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const projectRef = supabaseUrl.match(/https:\/\/(.*?)\.supabase\.co/)?.[1] || "default";
    // If we have a pensionId, we use a specific database file for that pension.
    // This ensures physical data isolation and prevents leakage between accounts.
    const dbName = `pensionsmanager_${projectRef}${pensionId ? `_${pensionId}` : ''}.db`;
    
    console.log(`[DB] Loading isolated database: ${dbName} (Pension: ${pensionId || 'None'})`);
    const db = await Database.load(`sqlite:${dbName}`);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS pensions (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%f', 'now')),
        updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%f', 'now') || 'Z'),
        synced_at TEXT
      );

      CREATE TABLE IF NOT EXISTS rooms (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        base_price REAL DEFAULT 0,
        is_allergy_friendly INTEGER DEFAULT 0,
        is_accessible INTEGER DEFAULT 0,
        updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%f', 'now') || 'Z'),
        synced_at TEXT,
        pension_id TEXT
      );
    `);
    try { await db.execute("ALTER TABLE rooms ADD COLUMN base_price REAL DEFAULT 0"); } catch (e) { }
    try { await db.execute("ALTER TABLE rooms ADD COLUMN is_allergy_friendly INTEGER DEFAULT 0"); } catch (e) { }
    try { await db.execute("ALTER TABLE rooms ADD COLUMN is_accessible INTEGER DEFAULT 0"); } catch (e) { }
    try { await db.execute("ALTER TABLE rooms ADD COLUMN updated_at TEXT"); } catch (e) { }
    try { await db.execute("ALTER TABLE rooms ADD COLUMN synced_at TEXT"); } catch (e) { }

    await db.execute(`
       CREATE TABLE IF NOT EXISTS room_configs (
        id TEXT PRIMARY KEY, room_id TEXT NOT NULL, attributes TEXT, base_price REAL,
        available_from TEXT, available_until TEXT, is_default INTEGER DEFAULT 0,
        updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%f', 'now') || 'Z'),
        synced_at TEXT,
        FOREIGN KEY (room_id) REFERENCES rooms(id)
      );

      CREATE TABLE IF NOT EXISTS guests (
        id TEXT PRIMARY KEY, name TEXT NOT NULL, first_name TEXT, middle_name TEXT,
        last_name TEXT, email TEXT, phone TEXT, company TEXT, notes TEXT,
        contact_info TEXT, identity_doc_info TEXT, preferences TEXT,
        relationships TEXT, total_revenue REAL DEFAULT 0,
        updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%f', 'now') || 'Z'),
        synced_at TEXT,
        pension_id TEXT
      );
    `);

    const guestColumns = ["first_name", "middle_name", "last_name", "email", "phone", "company", "notes", "total_revenue", "nationality"];
    for (const col of guestColumns) {
      try { await db.execute(`ALTER TABLE guests ADD COLUMN ${col} TEXT`); } catch (e) { }
    }

    await db.execute(`
       CREATE TABLE IF NOT EXISTS booking_groups (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%f', 'now') || 'Z'),
        synced_at TEXT
      );

      CREATE TABLE IF NOT EXISTS occasions (
        id TEXT PRIMARY KEY, title TEXT NOT NULL, type TEXT, status TEXT,
        main_guest_id TEXT, room_suggestions TEXT,
        updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%f', 'now') || 'Z'),
        synced_at TEXT,
        FOREIGN KEY (main_guest_id) REFERENCES guests(id)
      );

      CREATE TABLE IF NOT EXISTS bookings (
        id TEXT PRIMARY KEY, room_id TEXT, guest_id TEXT, occasion_id TEXT,
        start_date TEXT, end_date TEXT, final_price REAL, status TEXT,
        payment_status TEXT, actual_checkin_at TEXT, actual_checkout_at TEXT,
        occasion TEXT, estimated_arrival_time TEXT, group_id TEXT,
        is_family_room INTEGER DEFAULT 0, has_dog INTEGER DEFAULT 0,
        is_allergy_friendly INTEGER DEFAULT 0, has_mobility_impairment INTEGER DEFAULT 0,
        guests_per_room INTEGER DEFAULT 1, stay_type TEXT DEFAULT 'private',
        dog_count INTEGER DEFAULT 0, child_count INTEGER DEFAULT 0, extra_bed_count INTEGER DEFAULT 0,
        is_main_guest INTEGER DEFAULT 0, notes TEXT,
        updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%f', 'now') || 'Z'),
        synced_at TEXT,
        FOREIGN KEY (room_id) REFERENCES rooms(id),
        FOREIGN KEY (guest_id) REFERENCES guests(id),
        FOREIGN KEY (occasion_id) REFERENCES occasions(id),
        FOREIGN KEY (group_id) REFERENCES booking_groups(id)
      );
      
      CREATE TABLE IF NOT EXISTS staff (
        id TEXT PRIMARY KEY, name TEXT NOT NULL, role TEXT, daily_capacity INTEGER,
        updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%f', 'now') || 'Z'),
        synced_at TEXT
      );

      CREATE TABLE IF NOT EXISTS cleaning_tasks (
        id TEXT PRIMARY KEY, room_id TEXT, staff_id TEXT, date TEXT, status TEXT,
        is_exception INTEGER DEFAULT 0, original_date TEXT, title TEXT,
        task_type TEXT DEFAULT 'cleaning',
        updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%f', 'now') || 'Z'),
        synced_at TEXT,
        FOREIGN KEY (room_id) REFERENCES rooms(id),
        FOREIGN KEY (staff_id) REFERENCES staff(id)
      );

      CREATE TABLE IF NOT EXISTS cleaning_task_suggestions (
        id TEXT PRIMARY KEY, title TEXT NOT NULL, weekday INTEGER, frequency_weeks INTEGER DEFAULT 1,
        updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%f', 'now') || 'Z'),
        synced_at TEXT
      );

      CREATE TABLE IF NOT EXISTS breakfast_options (
        id TEXT PRIMARY KEY, booking_id TEXT, date TEXT, is_included INTEGER DEFAULT 0,
        is_prepared INTEGER DEFAULT 0, guest_count INTEGER DEFAULT 1, time TEXT,
        comments TEXT,
        updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%f', 'now') || 'Z'),
        synced_at TEXT,
        FOREIGN KEY (booking_id) REFERENCES bookings(id)
      );

      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT,
        updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%f', 'now') || 'Z'),
        synced_at TEXT,
        pension_id TEXT
      );

      CREATE TABLE IF NOT EXISTS connected_devices (
        id TEXT PRIMARY KEY,
        device_id TEXT NOT NULL,
        device_name TEXT,
        device_type TEXT,
        status TEXT DEFAULT 'active',
        is_leading_db INTEGER DEFAULT 0,
        last_seen_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%f', 'now')),
        updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%f', 'now') || 'Z'),
        synced_at TEXT,
        pension_id TEXT,
        UNIQUE(device_id)
      );
    `);

    try { await db.execute("ALTER TABLE breakfast_options ADD COLUMN is_prepared INTEGER DEFAULT 0"); } catch (e) { }
    try { await db.execute("ALTER TABLE breakfast_options ADD COLUMN guest_count INTEGER DEFAULT 1"); } catch (e) { }
    try { await db.execute("ALTER TABLE bookings ADD COLUMN occasion TEXT"); } catch (e) { }
    try { await db.execute("ALTER TABLE bookings ADD COLUMN estimated_arrival_time TEXT"); } catch (e) { }
    try { await db.execute("ALTER TABLE bookings ADD COLUMN group_id TEXT"); } catch (e) { }
    try { await db.execute("ALTER TABLE bookings ADD COLUMN is_family_room INTEGER DEFAULT 0"); } catch (e) { }
    try { await db.execute("ALTER TABLE bookings ADD COLUMN has_dog INTEGER DEFAULT 0"); } catch (e) { }
    try { await db.execute("ALTER TABLE bookings ADD COLUMN is_allergy_friendly INTEGER DEFAULT 0"); } catch (e) { }
    try { await db.execute("ALTER TABLE bookings ADD COLUMN has_mobility_impairment INTEGER DEFAULT 0"); } catch (e) { }
    try { await db.execute("ALTER TABLE bookings ADD COLUMN guests_per_room INTEGER DEFAULT 1"); } catch (e) { }
    try { await db.execute("ALTER TABLE bookings ADD COLUMN stay_type TEXT DEFAULT 'private'"); } catch (e) { }
    try { await db.execute("ALTER TABLE bookings ADD COLUMN dog_count INTEGER DEFAULT 0"); } catch (e) { }
    try { await db.execute("ALTER TABLE bookings ADD COLUMN child_count INTEGER DEFAULT 0"); } catch (e) { }
    try { await db.execute("ALTER TABLE bookings ADD COLUMN extra_bed_count INTEGER DEFAULT 0"); } catch (e) { }
    try { await db.execute("ALTER TABLE bookings ADD COLUMN is_main_guest INTEGER DEFAULT 0"); } catch (e) { }
    try { await db.execute("ALTER TABLE bookings ADD COLUMN notes TEXT"); } catch (e) { }
    try { await db.execute("ALTER TABLE cleaning_tasks ADD COLUMN comments TEXT"); } catch (e) { }
    try { await db.execute("ALTER TABLE cleaning_tasks ADD COLUMN is_manual INTEGER DEFAULT 0"); } catch (e) { }
    try { await db.execute("ALTER TABLE cleaning_tasks ADD COLUMN delayed_from TEXT"); } catch (e) { }
    try { await db.execute("ALTER TABLE cleaning_tasks ADD COLUMN source TEXT"); } catch (e) { }
    try { await db.execute("ALTER TABLE cleaning_tasks ADD COLUMN title TEXT"); } catch (e) { }
    try { await db.execute("ALTER TABLE cleaning_tasks ADD COLUMN task_type TEXT DEFAULT 'cleaning'"); } catch (e) { }
    try { await db.execute("ALTER TABLE breakfast_options ADD COLUMN source TEXT DEFAULT 'auto'"); } catch (e) { }
    try { await db.execute("ALTER TABLE breakfast_options ADD COLUMN is_manual INTEGER DEFAULT 0"); } catch (e) { }

    // Add updated_at and synced_at to all tables (ALTER for existing DBs)
    const tables = ["rooms", "room_configs", "guests", "booking_groups", "occasions", "bookings", "staff", "cleaning_tasks", "cleaning_task_suggestions", "breakfast_options", "connected_devices", "settings"];
    for (const table of tables) {
      try { await db.execute(`ALTER TABLE ${table} ADD COLUMN updated_at TEXT`); } catch (e) { }
      try { await db.execute(`ALTER TABLE ${table} ADD COLUMN synced_at TEXT`); } catch (e) { }
      try { await db.execute(`ALTER TABLE ${table} ADD COLUMN pension_id TEXT`); } catch (e) { }
      try { await db.execute(`ALTER TABLE ${table} ADD COLUMN is_deleted INTEGER DEFAULT 0`); } catch (e) { }
      
      // Add update triggers
      try {
        // We drop existing trigger to ensure update to the new logic
        await db.execute(`DROP TRIGGER IF EXISTS trg_update_at_${table}`);
        
        await db.execute(`
          CREATE TRIGGER IF NOT EXISTS trg_update_at_${table}
          AFTER UPDATE ON ${table}
          FOR EACH ROW
          WHEN (
            NEW.synced_at IS OLD.synced_at AND 
            (NEW.pension_id IS OLD.pension_id OR (NEW.pension_id IS NOT NULL AND OLD.pension_id IS NULL))
          )
          BEGIN
            UPDATE ${table} SET updated_at = strftime('%Y-%m-%dT%H:%M:%f', 'now') || 'Z'
            WHERE ${table === 'settings' ? 'key = OLD.key' : 'id = OLD.id'};
          END;
        `);
      } catch (e) { }
    }

    await db.execute("UPDATE rooms SET type = 'Ferienwohnung' WHERE type IN ('Wohnung', 'Apartment')");

    return db;
  } catch (error) {
    console.error("Database initialization failed:", error);
    return null;
  }
}
