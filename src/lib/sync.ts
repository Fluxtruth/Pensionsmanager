import { initDb, DatabaseMock } from "./db";
import { supabase } from "./supabase/client";

export interface SyncStatus {
  lastSync: string | null;
  pendingCount: number;
  isSyncing: boolean;
  error: string | null;
}

const TABLES_TO_SYNC = [
  "rooms",
  "room_configs",
  "guests",
  "booking_groups",
  "occasions",
  "bookings",
  "staff",
  "cleaning_tasks",
  "cleaning_task_suggestions",
  "breakfast_options",
  "connected_devices",
  "settings"
];

export interface Backup {
  id: string;
  pension_id: string;
  name: string;
  created_at: string;
}

export interface ConnectedDevice {
  id: string;
  device_id: string;
  device_name: string;
  device_type: string;
  status: 'active' | 'revoked';
  is_leading_db: boolean;
  last_seen_at: string;
  updated_at: string;
  synced_at: string | null;
  pension_id: string;
}

export class SyncService {
  private static instance: SyncService;
  private db: DatabaseMock | null = null;
  private autoSyncInterval: any = null;
  private currentDeviceId: string | null = null;

  private constructor() {}

  public static getInstance(): SyncService {
    if (!SyncService.instance) {
      SyncService.instance = new SyncService();
    }
    return SyncService.instance;
  }

  private async ensureDb() {
    if (!this.db) {
      this.db = await initDb();
    }
    return this.db;
  }

  /**
   * Holt die pension_id des aktuell angemeldeten Benutzers.
   */
  public async getPensionId(): Promise<string | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('pension_id')
        .eq('id', user.id)
        .single();

      if (error || !profile) {
        console.warn("No pension profile found for user:", user.id);
        return null;
      }

      return profile.pension_id;
    } catch (error) {
      console.error("Error fetching pension_id:", error);
      return null;
    }
  }

  /**
   * Generiert einen kurzen, lesbaren Alias aus der langen Pension-ID.
   */
  public async getShortPensionId(): Promise<string | null> {
    const id = await this.getPensionId();
    if (!id) return null;
    
    // Wir nehmen die ersten 8 Zeichen des UUIDs und machen sie groß
    // (Z.B. PM-F47AC10B)
    const short = id.split('-')[0].toUpperCase();
    return `PM-${short}`;
  }

  /**
   * Identifiziert die Anzahl der lokal geänderten Datensätze, die noch nicht synchronisiert wurden.
   */
  public async getPendingCount(): Promise<number> {
    const details = await this.getPendingDetails();
    return details.reduce((sum, item) => sum + item.count, 0);
  }

  /**
   * Gibt detaillierte Informationen über ausstehende Änderungen pro Tabelle zurück.
   */
  public async getPendingDetails(): Promise<{table: string, count: number}[]> {
    const db = await this.ensureDb();
    if (!db) return [];

    const details: {table: string, count: number}[] = [];
    for (const table of TABLES_TO_SYNC) {
      try {
        const result = await db.select<any>(
          `SELECT COUNT(*) as count FROM ${table} WHERE synced_at IS NULL OR updated_at > synced_at`
        );
        const count = result[0]?.count || 0;
        if (count > 0) {
          details.push({ table, count });
        }
      } catch (error) {
        console.error(`Error counting pending rows for ${table}:`, error);
      }
    }
    return details;
  }

  /**
   * Registriert das aktuelle Gerät in der connected_devices Tabelle (nur in Supabase während dem Sync).
   */
  public async registerCurrentDevice(): Promise<void> {
    try {
      const pensionId = await this.getPensionId();
      if (!pensionId) return;

      if (!this.currentDeviceId) {
        // Retrieve or generate a persistent device ID for this browser/app instance
        const storedId = localStorage.getItem("app_device_id");
        if (storedId) {
          this.currentDeviceId = storedId;
        } else {
          // Fallback simple UUID generator if uuid package isn't loaded everywhere
          const newId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
          localStorage.setItem("app_device_id", newId);
          this.currentDeviceId = newId;
        }
      }

      // Determine device type and name
      const isTauri = typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__ !== undefined;
      const deviceType = isTauri ? 'Desktop App' : 'Web Browser';
      const userAgent = navigator.userAgent;
      
      let deviceName = deviceType;
      if (!isTauri) {
        if (userAgent.includes('Chrome')) deviceName = 'Chrome Browser';
        else if (userAgent.includes('Firefox')) deviceName = 'Firefox Browser';
        else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) deviceName = 'Safari Browser';
        else if (userAgent.includes('Edge')) deviceName = 'Edge Browser';
      }

      const now = new Date().toISOString();

      // We directly upsert it into Supabase to ensure cloud truth is updated even if local DB is flaky
      // Also we need to check if we have been revoked before we update anything else
      
      const { data: existingDevice } = await supabase
        .from('connected_devices')
        .select('id, status, is_leading_db')
        .eq('device_id', this.currentDeviceId)
        .single();
        
      if (existingDevice && existingDevice.status === 'revoked') {
        console.warn("This device has been revoked from another session. Logging out.");
        await supabase.auth.signOut();
        // Force reload to kick to login screen
        if (typeof window !== 'undefined') window.location.href = '/login';
        throw new Error("Device revoked");
      }

      const payload = {
        device_id: this.currentDeviceId,
        pension_id: pensionId,
        device_name: deviceName,
        device_type: deviceType,
        last_seen_at: now,
        updated_at: now,
        status: 'active'
      };

      // 1. Update Supabase immediately
      try {
        await supabase.from('connected_devices').upsert(payload, { onConflict: 'device_id' });
      } catch (e) {
        console.error("Failed to upsert device to Supabase:", e);
      }

      // 2. Ensure local db has this info
      const db = await this.ensureDb();
      if (db) {
         try {
           const localDevs = await db.select<any[]>("SELECT id FROM connected_devices WHERE device_id = ?", [this.currentDeviceId]);
           if (localDevs.length > 0) {
              await db.execute("UPDATE connected_devices SET last_seen_at = ?, updated_at = ?, synced_at = ?, device_name = ?, device_type = ?, status = 'active' WHERE device_id = ?", 
                [now, now, now, deviceName, deviceType, this.currentDeviceId]);
           } else {
              // Gen random uuid for primary key
              const pk = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
              await db.execute("INSERT INTO connected_devices (id, device_id, pension_id, device_name, device_type, last_seen_at, updated_at, synced_at, is_leading_db) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                [pk, this.currentDeviceId, pensionId, deviceName, deviceType, now, now, now, 0]);
           }
         } catch(e) {
           console.error("Failed to update local connected_devices:", e);
         }
      }

    } catch (e: any) {
      if (e.message === "Device revoked") throw e;
      console.error("Failed to register device:", e);
    }
  }

  /**
   * Führt die Synchronisation für alle Tabellen durch.
   */
  public async performSync(onProgress?: (progress: number) => void): Promise<{ success: boolean; error?: string }> {
    const db = await this.ensureDb();
    if (!db) return { success: false, error: "Datenbank nicht initialisiert" };

    const pensionId = await this.getPensionId();
    if (!pensionId) {
      return { 
        success: false, 
        error: "Keine zugeordnete Pension gefunden. Bitte kontaktieren Sie den Support oder vervollständigen Sie Ihr Profil." 
      };
    }

    try {
      // First, update our own device's heartbeat and check if we are revoked
      await this.registerCurrentDevice();

      let tablesProcessed = 0;
      let totalUpdated = 0;

      // 1. PULL PHASE (Cloud -> Local)
      // Pull all tables to ensure local DB matches remote state (especially for seed data)
      const pullTables = TABLES_TO_SYNC.filter(t => t !== 'connected_devices'); // connected_devices is special, we handle it separately
      for (const table of pullTables) {
         try {
           await this.pullTable(table);
         } catch (e) {
           console.error(`[Sync] Pull failed for table ${table}:`, e);
         }
      }

      // 2. PUSH PHASE (Local -> Cloud)
      for (const table of TABLES_TO_SYNC) {
        // Fetch pending rows. We compare timestamps if synced_at exists.
        const pendingRows = await db.select<any>(
          `SELECT * FROM ${table} WHERE synced_at IS NULL OR updated_at > synced_at`
        );

        if (pendingRows.length > 0) {
          console.log(`[Sync] Found ${pendingRows.length} changes in table ${table}`);
          
          // 2. Zu Supabase hochladen (Upsert)
          // Wir stellen sicher, dass pension_id gesetzt ist
          const uploadData = pendingRows.map((row: any) => {
            const { synced_at, ...data } = row;
            return {
              ...data,
              pension_id: data.pension_id || pensionId
            };
          });

          const { error: upsertError } = await supabase
            .from(table)
            .upsert(uploadData);

          if (upsertError) {
            console.error(`[Sync] Supabase Upsert Error for ${table}:`, JSON.stringify(upsertError, null, 2));
            return { 
              success: false, 
              error: `Upload-Fehler in Tabelle ${table}: ${upsertError.message || 'FK-Verletzung oder RLS-Block'}. Details: ${JSON.stringify(upsertError)}` 
            };
          }

          // 3. Lokal als synchronisiert markieren
          const now = new Date().toISOString();
          let rowCount = 0;
          for (const row of pendingRows) {
            const idField = table === 'settings' ? 'key' : 'id';
            const idValue = row[idField];
            
            try {
              const updateResult = await db.execute(
                `UPDATE ${table} SET synced_at = ?, pension_id = ? WHERE ${idField} = ?`,
                [now, pensionId, idValue]
              );
              rowCount++;
            } catch (updateErr) {
              console.error(`[Sync] Failed to mark ${table} row ${idValue} as synced:`, updateErr);
            }
          }
          console.log(`[Sync] Successfully updated ${rowCount}/${pendingRows.length} rows in local table ${table}`);
          totalUpdated += rowCount;
        }

        tablesProcessed++;
        if (onProgress) {
          onProgress(Math.round((tablesProcessed / TABLES_TO_SYNC.length) * 100));
        }
      }

      console.log(`[Sync] Process complete. Total rows updated: ${totalUpdated}`);
      return { success: true };
    } catch (error: any) {
      console.error("[Sync] process failed:", error);
      return { success: false, error: error.message || "Unbekannter Fehler während der Synchronisation" };
    }
  }

  /**
   * Lädt Daten für eine Tabelle aus Supabase und spiegelt sie in der lokalen Datenbank wider.
   */
  public async pullTable(tableName: string): Promise<void> {
    const db = await this.ensureDb();
    if (!db) return;

    const pensionId = await this.getPensionId();
    if (!pensionId) return;

    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('pension_id', pensionId);

      if (error) throw error;
      if (!data || data.length === 0) return;

      const now = new Date().toISOString();
      const idField = tableName === 'settings' ? 'key' : 'id';

      for (const row of data) {
        // Find existing local row
        const result = await db.select<any[]>(`SELECT updated_at, synced_at FROM ${tableName} WHERE ${idField} = ?`, [row[idField]]);
        const existing = Array.isArray(result) ? result : [];
        
        if (existing.length > 0) {
          const localRow = existing[0];
          const localTime = new Date(localRow.updated_at || 0).getTime();
          const remoteTime = new Date(row.updated_at || 0).getTime();

          if (remoteTime > localTime && (localRow.synced_at !== null || remoteTime > localTime)) {
            const columns = Object.keys(row).filter(col => col !== idField && col !== 'synced_at');
            const setStatement = columns.map(col => `${col} = ?`).join(", ");
            const values = columns.map(col => row[col]);
            
            await db.execute(
              `UPDATE ${tableName} SET ${setStatement}, synced_at = ? WHERE ${idField} = ?`,
              [...values, now, row[idField]]
            );
          }
        } else {
          // New row localy
          const columns = Object.keys(row).filter(c => c !== 'synced_at');
          const placeholders = columns.map(() => "?").join(", ");
          const values = columns.map(col => row[col]);
          
          await db.execute(
            `INSERT INTO ${tableName} (${columns.join(", ")}, synced_at) VALUES (${placeholders}, ?)`,
            [...values, now]
          );
        }
      }
      console.log(`[Sync] Pulled ${data.length} rows for table ${tableName}`);
    } catch (e) {
      console.error(`[Sync] Failed to pull table ${tableName}:`, e);
      throw e;
    }
  }

  /**
   * Liest den letzten Synchronisationszeitpunkt (basierend auf der jüngsten synced_at Markierung).
   */
  public async getLastSyncTime(): Promise<string | null> {
    const db = await this.ensureDb();
    if (!db) return null;

    let latestSync: string | null = null;
    for (const table of TABLES_TO_SYNC) {
      try {
        const result = await db.select<any>(
          `SELECT MAX(synced_at) as max_sync FROM ${table}`
        );
        const tableMax = result[0]?.max_sync;
        if (tableMax && (!latestSync || tableMax > latestSync)) {
          latestSync = tableMax;
        }
      } catch (e) {}
    }
    return latestSync;
  }

  /**
   * Überprüft, ob Supabase erreichbar ist.
   */
  public async getCloudStatus(): Promise<boolean> {
    try {
      const { error } = await supabase.from('user_profiles').select('count', { count: 'exact', head: true }).limit(1);
      return !error;
    } catch (error) {
      return false;
    }
  }

  /**
   * Erstellt ein Backup der gesamten lokalen Datenbank.
   */
  public async createBackup(name: string): Promise<{ success: boolean; error?: string }> {
    const db = await this.ensureDb();
    if (!db) return { success: false, error: "Datenbank nicht initialisiert" };

    const pensionId = await this.getPensionId();
    if (!pensionId) return { success: false, error: "Keine zugeordnete Pension gefunden" };

    try {
      const fullData: any = {};
      for (const table of TABLES_TO_SYNC) {
        const rows = await db.select<any>(`SELECT * FROM ${table}`);
        fullData[table] = rows;
      }

      const { error } = await supabase
        .from('backups')
        .insert({
          pension_id: pensionId,
          name: name,
          data: fullData
        });

      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      console.error("[Backup] creation failed:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Listet alle verfügbaren Backups auf.
   */
  public async listBackups(): Promise<Backup[]> {
    const pensionId = await this.getPensionId();
    if (!pensionId) return [];

    const { data, error } = await supabase
      .from('backups')
      .select('id, pension_id, name, created_at')
      .eq('pension_id', pensionId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("[Backup] listing failed:", error);
      return [];
    }

    return data || [];
  }

  /**
   * Löscht ein Backup.
   */
  public async deleteBackup(backupId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('backups')
        .delete()
        .eq('id', backupId);

      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      console.error("[Backup] deletion failed:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Stellt ein Backup wieder her.
   */
  public async restoreBackup(backupId: string): Promise<{ success: boolean; error?: string }> {
    const db = await this.ensureDb();
    if (!db) return { success: false, error: "Datenbank nicht initialisiert" };

    try {
      const { data: backup, error } = await supabase
        .from('backups')
        .select('name, data')
        .eq('id', backupId)
        .single();

      if (error || !backup) throw new Error(error?.message || "Backup nicht gefunden");

      const backupData = backup.data as Record<string, any[]>;

      // Wir schalten Fremdschlüssel-Prüfungen temporär aus.
      // Hinweis: In manchen SQLite-Umgebungen muss dies pro Verbindung gesetzt werden.
      await db.execute("PRAGMA foreign_keys = OFF;");

      // 1. Tabellen in Umgekehrter Abhängigkeits-Reihenfolge leeren
      const DELETE_ORDER = [
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
        "settings"
      ];

      for (const table of DELETE_ORDER) {
        await db.execute(`DELETE FROM ${table}`);
      }

      // 2. Tabellen in Abhängigkeits-Reihenfolge füllen
      const RESTORE_ORDER = [
        "rooms",
        "guests",
        "booking_groups",
        "staff",
        "settings",
        "cleaning_task_suggestions",
        "room_configs",
        "occasions",
        "bookings",
        "cleaning_tasks",
        "breakfast_options"
      ];

      for (const table of RESTORE_ORDER) {
        const rows = backupData[table];
        if (rows && rows.length > 0) {
          for (const row of rows) {
            const columns = Object.keys(row);
            const placeholders = columns.map(() => "?").join(", ");
            const values = Object.values(row);
            await db.execute(
              `INSERT INTO ${table} (${columns.join(", ")}) VALUES (${placeholders})`,
              values
            );
          }
        }
      }

      // Prüfungen wieder einschalten
      await db.execute("PRAGMA foreign_keys = ON;");

      // Information über die letzte Wiederherstellung speichern
      const now = new Date().toISOString();
      const backupName = backup.name || "Backup";
      
      await db.execute(
        "INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, ?)",
        ["last_restored_backup_info", JSON.stringify({ id: backupId, name: backupName, date: now }), now]
      );

      return { success: true };
    } catch (error: any) {
      // Im Fehlerfall trotzdem versuchen wieder einzuschalten
      try { await db.execute("PRAGMA foreign_keys = ON;"); } catch(e) {}
      console.error("[Backup] restore failed:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Startet die automatische Synchronisation.
   */
  public startAutoSync(callback?: (result: { success: boolean, error?: string }) => void) {
    if (this.autoSyncInterval) return;

    // Alle 5 Minuten synchronisieren
    this.autoSyncInterval = setInterval(async () => {
      const result = await this.performSync();
      if (callback) callback(result);
    }, 5 * 60 * 1000);

    // Sofort einmal ausführen
    this.performSync().then(result => {
      if (callback) callback(result);
    });
  }

  /**
   * Stoppt die automatische Synchronisation.
   */
  public stopAutoSync() {
    if (this.autoSyncInterval) {
      clearInterval(this.autoSyncInterval);
      this.autoSyncInterval = null;
    }
  }

  public isAutoSyncActive(): boolean {
    return !!this.autoSyncInterval;
  }

  /**
   * Holt die Information über das zuletzt wiederhergestellte Backup.
   */
  public async getLastRestoredBackup(): Promise<{ id: string, name: string, date: string } | null> {
    const db = await this.ensureDb();
    if (!db) return null;

    try {
      const result = await db.select<{ value: string }[]>(
        "SELECT value FROM settings WHERE key = ?",
        ["last_restored_backup_info"]
      );
      if (result.length > 0) {
        return JSON.parse(result[0].value);
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  /**
   * Gibt die ID des aktuellen Geräts zurück (device_id, ungleich lokaler row ID)
   */
  public getCurrentDeviceId(): string | null {
    if (this.currentDeviceId) return this.currentDeviceId;
    if (typeof window !== 'undefined') {
      return localStorage.getItem("app_device_id");
    }
    return null;
  }

  /**
   * Holt die Liste aller verbundenen Geräte aus der lokalen DB.
   * Wenn wir auf dem Web sind, forcieren wir einen Cloud-Fetch.
   */
  public async getConnectedDevices(): Promise<ConnectedDevice[]> {
    const db = await this.ensureDb();
    if (!db) return [];

    const isTauri = typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__ !== undefined;
    
    // On Web, the DB is mock and often empty. We pull first to be sure.
    if (!isTauri) {
      try {
        await this.pullTable('connected_devices');
      } catch (e) {
        console.warn("Pulling connected devices failed, showing local state only.");
      }
    }

    try {
      return await db.select<ConnectedDevice[]>("SELECT * FROM connected_devices ORDER BY last_seen_at DESC");
    } catch (e) {
      console.error("Failed to load connected devices", e);
      return [];
    }
  }

  /**
   * Entzieht einem Gerät den Zugriff (setzt status auf 'revoked').
   */
  public async revokeDevice(deviceId: string): Promise<{ success: boolean; error?: string }> {
     const db = await this.ensureDb();
     if (!db) return { success: false, error: "Datenbank nicht initialisiert" };
     try {
       const now = new Date().toISOString();
       await db.execute("UPDATE connected_devices SET status = 'revoked', updated_at = ? WHERE device_id = ?", [now, deviceId]);
       // Sync immediately to push the revoke status
       await this.performSync();
       return { success: true };
     } catch (e: any) {
        return { success: false, error: e.message };
     }
  }

  /**
   * Setzt das aktuelle Tauri Gerät als die "Führende Lokale DB Engine".
   * Wirft einen Fehler, wenn das aktuelle Gerät kein Desktop (Tauri) Client ist.
   */
  public async setAsLeadingDatabase(): Promise<{ success: boolean; error?: string }> {
    const isTauri = typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__ !== undefined;
    if (!isTauri) {
      return { success: false, error: "Nur die Desktop-App kann als führende Datenbank fungieren." };
    }

    // Ensure this device is registered first (generates device ID if missing)
    await this.registerCurrentDevice();

    const deviceId = this.getCurrentDeviceId();
    if (!deviceId) return { success: false, error: "Geräte-ID unbekannt" };

    const db = await this.ensureDb();
    if (!db) return { success: false, error: "Datenbank nicht initialisiert" };

    try {
       const now = new Date().toISOString();
       // 1. Alle anderen auf false setzen
       await db.execute("UPDATE connected_devices SET is_leading_db = 0, updated_at = ?", [now]);
       // 2. Dieses Gerät auf true setzen
       await db.execute("UPDATE connected_devices SET is_leading_db = 1, updated_at = ? WHERE device_id = ?", [now, deviceId]);
       
       await this.performSync();
       return { success: true };
    } catch (e: any) {
       return { success: false, error: e.message };
    }
  }

  /**
   * Initialisiert den Web-Kontext, indem kritische Einstellungen (wie PIN) abgerufen werden.
   */
  public async initializeWebContext(): Promise<void> {
    const isTauri = typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__ !== undefined;
    if (isTauri) return;

    try {
      console.log("[Sync] Initializing web context, pulling critical settings...");
      await this.pullTable('settings');
    } catch (e) {
      console.error("[Sync] Failed to initialize web context:", e);
    }
  }

  /**
   * Löscht alle lokalen Daten in der SQLite Datenbank (außer critical settings).
   * Nützlich bei einem Umgebungswechsel.
   */
  public async resetLocalDb(): Promise<{ success: boolean; error?: string }> {
    const db = await this.ensureDb();
    if (!db) return { success: false, error: "Datenbank nicht initialisiert" };

    try {
      await db.execute("PRAGMA foreign_keys = OFF;");
      
      const TABLES_TO_CLEAR = [
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
        "connected_devices"
      ];

      for (const table of TABLES_TO_CLEAR) {
        await db.execute(`DELETE FROM ${table}`);
      }

      // Wir behalten die settings, löschen aber evtl. gecachte pension_id oder branding
      // außer wir wollen wirklich ALLES platt machen.
      // Hier löschen wir alle settings außer kritische (falls es welche gäbe)
      await db.execute("DELETE FROM settings");

      await db.execute("PRAGMA foreign_keys = ON;");
      
      console.log("[Sync] Local database has been reset.");
      return { success: true };
    } catch (error: any) {
      try { await db.execute("PRAGMA foreign_keys = ON;"); } catch(e) {}
      console.error("[Sync] Local DB reset failed:", error);
      return { success: false, error: error.message };
    }
  }

}
