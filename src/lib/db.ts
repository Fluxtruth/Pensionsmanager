import Database from "@tauri-apps/plugin-sql";

// In-memory storage for mock database
const mockData: Record<string, any[]> = {
  rooms: [],
  room_configs: [],
  guests: [],
  occasions: [],
  booking_groups: [],
  bookings: [],
  staff: [],
  cleaning_tasks: [],
  breakfast_options: []
};

interface DbResult {
  rowsAffected: number;
  lastInsertId?: number;
}

export interface DatabaseMock {
  execute: (query: string, params?: any[]) => Promise<DbResult>;
  select: <T>(query: string, params?: any[]) => Promise<T>;
}

export async function initDb(): Promise<DatabaseMock | null> {
  if (typeof window === "undefined") return null;

  // Check if we are running inside Tauri
  const isTauri = typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__ !== undefined;

  if (!isTauri) {
    console.warn("Tauri environment not detected. Using mock in-memory database.");
    const mock: DatabaseMock = {
      execute: async (query: string, params?: any[]) => {
        console.log("Mock Execute:", query, params);
        const upperQuery = query.toUpperCase();

        if (upperQuery.includes("INSERT INTO")) {
          const match = upperQuery.match(/INSERT INTO (\w+)/);
          if (match) {
            const table = match[1].toLowerCase();
            if (mockData[table]) {
              if (table === "guests") {
                mockData.guests.push({
                  id: params?.[0], name: params?.[1], first_name: params?.[2], middle_name: params?.[3],
                  last_name: params?.[4], email: params?.[5], phone: params?.[6], company: params?.[7],
                  notes: params?.[8], contact_info: params?.[9]
                });
              } else if (table === "rooms") {
                mockData.rooms.push({ id: params?.[0], name: params?.[1], type: params?.[2], base_price: params?.[3] || 0 });
              } else if (table === "occasions") {
                mockData.occasions.push({ id: params?.[0], title: params?.[1], type: params?.[2], status: params?.[3], main_guest_id: params?.[4] });
              } else if (table === "booking_groups") {
                mockData.booking_groups.push({ id: params?.[0], name: params?.[1] });
              } else if (table === "bookings") {
                mockData.bookings.push({
                  id: params?.[0], room_id: params?.[1], guest_id: params?.[2],
                  occasion_id: params?.[3], start_date: params?.[4], end_date: params?.[5],
                  final_price: params?.[6], status: params?.[7], payment_status: params?.[8],
                  occasion: params?.[9], estimated_arrival_time: params?.[10],
                  group_id: params?.[11],
                  is_family_room: params?.[12], has_dog: params?.[13],
                  is_allergy_friendly: params?.[14], has_mobility_impairment: params?.[15]
                });
              } else if (table === "breakfast_options") {
                mockData.breakfast_options.push({ id: params?.[0], booking_id: params?.[1], date: params?.[2], is_included: params?.[3], is_prepared: params?.[4] || 0, guest_count: params?.[5] || 1, time: params?.[6], comments: params?.[7], source: params?.[8] || 'auto', is_manual: params?.[9] || 0 });
              }
            }
          }
        } else if (upperQuery.includes("UPDATE")) {
          if (upperQuery.includes("SET STATUS = 'STORNIERT' WHERE GROUP_ID = ?")) {
            const groupId = params?.[0];
            mockData.bookings.forEach(b => {
              if (b.group_id === groupId) b.status = 'Storniert';
            });
            return { rowsAffected: 1, lastInsertId: 0 };
          }
          if (upperQuery.includes("SET OCCASION_ID = NULL")) {
            const occId = params?.[0];
            mockData.bookings.forEach(b => {
              if (b.occasion_id === occId) b.occasion_id = null;
            });
            return { rowsAffected: 1, lastInsertId: 0 };
          }

          const match = upperQuery.match(/UPDATE (\w+)/);
          if (match) {
            const table = match[1].toLowerCase();
            const id = params?.[params.length - 1];
            if (mockData[table]) {
              const index = mockData[table].findIndex(item => item.id === id);
              if (index !== -1) {
                if (table === "guests") {
                  mockData.guests[index] = {
                    ...mockData.guests[index],
                    name: params?.[0], first_name: params?.[1], middle_name: params?.[2],
                    last_name: params?.[3], email: params?.[4], phone: params?.[5],
                    company: params?.[6], notes: params?.[7], contact_info: params?.[8]
                  };
                } else if (table === "rooms") {
                  mockData.rooms[index] = { ...mockData.rooms[index], name: params?.[0], type: params?.[1], base_price: params?.[2] };
                } else if (table === "bookings") {
                  mockData.bookings[index] = {
                    ...mockData.bookings[index],
                    room_id: params?.[0], guest_id: params?.[1], occasion_id: params?.[2],
                    start_date: params?.[3], end_date: params?.[4], status: params?.[5],
                    payment_status: params?.[6], occasion: params?.[7], estimated_arrival_time: params?.[8],
                    group_id: params?.[9],
                    is_family_room: params?.[10], has_dog: params?.[11],
                    is_allergy_friendly: params?.[12], has_mobility_impairment: params?.[13]
                  };
                } else if (table === "breakfast_options") {
                  mockData.breakfast_options[index] = { ...mockData.breakfast_options[index], is_included: params?.[0], is_prepared: params?.[1], guest_count: params?.[2], time: params?.[3], comments: params?.[4], source: params?.[5], is_manual: params?.[6] };
                } else if (table === "booking_groups") {
                  mockData.booking_groups[index] = { ...mockData.booking_groups[index], name: params?.[0] };
                }
              }
            }
          }
        } else if (upperQuery.includes("DELETE FROM")) {
          const match = upperQuery.match(/DELETE FROM (\w+)/);
          if (match) {
            const table = match[1].toLowerCase();
            const id = params?.[0];
            if (mockData[table]) {
              mockData[table] = mockData[table].filter(item => item.id !== id);
              // Cascading delete for groups
              if (table === "booking_groups") {
                mockData.bookings = mockData.bookings.filter(b => b.group_id !== id);
              }
            }
          }
        }

        return { rowsAffected: 1, lastInsertId: 0 };
      },
      select: async <T>(query: string, params?: any[]) => {
        console.log("Mock Select:", query, params);
        const upperQuery = query.toUpperCase();

        for (const table of Object.keys(mockData)) {
          if (upperQuery.includes(`FROM ${table.toUpperCase()}`)) {
            if (upperQuery.includes("WHERE ID = ?")) {
              const res = (mockData[table].find(item => item.id === params?.[0]) || null);
              return (query.includes("COUNT") ? [{ count: res ? 1 : 0 }] : res) as unknown as T;
            }

            if (table === "bookings" && (upperQuery.includes("JOIN GUESTS") || upperQuery.includes("LEFT JOIN"))) {
              return mockData.bookings.map(b => {
                const guest = mockData.guests.find(g => g.id === b.guest_id);
                const room = mockData.rooms.find(r => r.id === b.room_id);
                const group = mockData.booking_groups.find(g => g.id === b.group_id);
                return {
                  ...b,
                  guest_name: guest?.name || "Unbekannt",
                  guest_id: guest?.id,
                  phone: guest?.phone,
                  email: guest?.email,
                  room_name: room?.name || `Zimmer ${b.room_id}`,
                  occasion_title: mockData.occasions.find(o => o.id === b.occasion_id)?.title || "",
                  group_name: group?.name || ""
                };
              }) as unknown as T;
            }

            if (table === "booking_groups") {
              return mockData.booking_groups as unknown as T;
            }

            if (upperQuery.includes("COUNT(*)")) {
              return [{ count: mockData[table].length }] as unknown as T;
            }

            return mockData[table] as unknown as T;
          }
        }

        return [] as unknown as T;
      }
    };
    return mock;
  }

  try {
    const db = await Database.load("sqlite:pensionsmanager.db");

    await db.execute(`
      CREATE TABLE IF NOT EXISTS rooms (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        base_price REAL DEFAULT 0
      );
    `);
    try { await db.execute("ALTER TABLE rooms ADD COLUMN base_price REAL DEFAULT 0"); } catch (e) { }

    await db.execute(`
      CREATE TABLE IF NOT EXISTS room_configs (
        id TEXT PRIMARY KEY, room_id TEXT NOT NULL, attributes TEXT, base_price REAL,
        available_from TEXT, available_until TEXT, is_default INTEGER DEFAULT 0,
        FOREIGN KEY (room_id) REFERENCES rooms(id)
      );

      CREATE TABLE IF NOT EXISTS guests (
        id TEXT PRIMARY KEY, name TEXT NOT NULL, first_name TEXT, middle_name TEXT,
        last_name TEXT, email TEXT, phone TEXT, company TEXT, notes TEXT,
        contact_info TEXT, identity_doc_info TEXT, preferences TEXT,
        relationships TEXT, total_revenue REAL DEFAULT 0
      );
    `);

    const guestColumns = ["first_name", "middle_name", "last_name", "email", "phone", "company", "notes", "total_revenue"];
    for (const col of guestColumns) {
      try { await db.execute(`ALTER TABLE guests ADD COLUMN ${col} TEXT`); } catch (e) { }
    }

    await db.execute(`
      CREATE TABLE IF NOT EXISTS booking_groups (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS occasions (
        id TEXT PRIMARY KEY, title TEXT NOT NULL, type TEXT, status TEXT,
        main_guest_id TEXT, room_suggestions TEXT,
        FOREIGN KEY (main_guest_id) REFERENCES guests(id)
      );

      CREATE TABLE IF NOT EXISTS bookings (
        id TEXT PRIMARY KEY, room_id TEXT, guest_id TEXT, occasion_id TEXT,
        start_date TEXT, end_date TEXT, final_price REAL, status TEXT,
        payment_status TEXT, actual_checkin_at TEXT, actual_checkout_at TEXT,
        occasion TEXT, estimated_arrival_time TEXT, group_id TEXT,
        is_family_room INTEGER DEFAULT 0, has_dog INTEGER DEFAULT 0,
        is_allergy_friendly INTEGER DEFAULT 0, has_mobility_impairment INTEGER DEFAULT 0,
        FOREIGN KEY (room_id) REFERENCES rooms(id),
        FOREIGN KEY (guest_id) REFERENCES guests(id),
        FOREIGN KEY (occasion_id) REFERENCES occasions(id),
        FOREIGN KEY (group_id) REFERENCES booking_groups(id)
      );
      
      CREATE TABLE IF NOT EXISTS staff (
        id TEXT PRIMARY KEY, name TEXT NOT NULL, role TEXT, daily_capacity INTEGER
      );

      CREATE TABLE IF NOT EXISTS cleaning_tasks (
        id TEXT PRIMARY KEY, room_id TEXT, staff_id TEXT, date TEXT, status TEXT,
        is_exception INTEGER DEFAULT 0, original_date TEXT,
        FOREIGN KEY (room_id) REFERENCES rooms(id),
        FOREIGN KEY (staff_id) REFERENCES staff(id)
      );

      CREATE TABLE IF NOT EXISTS breakfast_options (
        id TEXT PRIMARY KEY, booking_id TEXT, date TEXT, is_included INTEGER DEFAULT 0,
        is_prepared INTEGER DEFAULT 0, guest_count INTEGER DEFAULT 1, time TEXT,
        comments TEXT,
        FOREIGN KEY (booking_id) REFERENCES bookings(id)
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
    try { await db.execute("ALTER TABLE cleaning_tasks ADD COLUMN comments TEXT"); } catch (e) { }
    try { await db.execute("ALTER TABLE cleaning_tasks ADD COLUMN is_manual INTEGER DEFAULT 0"); } catch (e) { }
    try { await db.execute("ALTER TABLE cleaning_tasks ADD COLUMN delayed_from TEXT"); } catch (e) { }
    try { await db.execute("ALTER TABLE cleaning_tasks ADD COLUMN source TEXT"); } catch (e) { }
    try { await db.execute("ALTER TABLE breakfast_options ADD COLUMN source TEXT DEFAULT 'auto'"); } catch (e) { }
    try { await db.execute("ALTER TABLE breakfast_options ADD COLUMN is_manual INTEGER DEFAULT 0"); } catch (e) { }

    await db.execute("UPDATE rooms SET type = 'Ferienwohnung' WHERE type IN ('Wohnung', 'Apartment')");

    return db;
  } catch (error) {
    console.error("Database initialization failed:", error);
    return null;
  }
}
