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
  "settings"
];

export class SyncService {
  private static instance: SyncService;
  private db: any = null;

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
   * Identifiziert die Anzahl der lokal geänderten Datensätze, die noch nicht synchronisiert wurden.
   */
  public async getPendingCount(): Promise<number> {
    const db = await this.ensureDb();
    if (!db) return 0;

    let totalPending = 0;
    for (const table of TABLES_TO_SYNC) {
      try {
        const result = await db.select<any>(
          `SELECT COUNT(*) as count FROM ${table} WHERE synced_at IS NULL OR updated_at > synced_at`
        );
        totalPending += result[0]?.count || 0;
      } catch (error) {
        console.error(`Error counting pending rows for ${table}:`, error);
      }
    }
    return totalPending;
  }

  /**
   * Führt die Synchronisation für alle Tabellen durch.
   */
  public async performSync(onProgress?: (progress: number) => void): Promise<{ success: boolean; error?: string }> {
    const db = await this.ensureDb();
    if (!db) return { success: false, error: "Datenbank nicht initialisiert" };

    try {
      let tablesProcessed = 0;
      for (const table of TABLES_TO_SYNC) {
        // 1. Geänderte Zeilen holen
        const pendingRows = await db.select<any>(
          `SELECT * FROM ${table} WHERE synced_at IS NULL OR updated_at > synced_at`
        );

        if (pendingRows.length > 0) {
          console.log(`Syncing ${pendingRows.length} rows for table ${table}...`);
          
          // 2. Zu Supabase hochladen (Upsert)
          // Wir entfernen 'synced_at' vor dem Upload, da Supabase das nicht wissen muss
          const uploadData = pendingRows.map(row => {
            const { synced_at, ...data } = row;
            return data;
          });

          const { error: upsertError } = await supabase
            .from(table)
            .upsert(uploadData);

          if (upsertError) {
            console.error(`Supabase Upsert Error for ${table}:`, upsertError);
            return { success: false, error: `Upload-Fehler in Tabelle ${table}: ${upsertError.message}` };
          }

          // 3. Lokal als synchronisiert markieren
          const now = new Date().toISOString();
          for (const row of pendingRows) {
            const idField = table === 'settings' ? 'key' : 'id';
            const idValue = row[idField];
            
            await db.execute(
              `UPDATE ${table} SET synced_at = ? WHERE ${idField} = ?`,
              [now, idValue]
            );
          }
        }

        tablesProcessed++;
        if (onProgress) {
          onProgress(Math.round((tablesProcessed / TABLES_TO_SYNC.length) * 100));
        }
      }

      return { success: true };
    } catch (error: any) {
      console.error("Sync process failed:", error);
      return { success: false, error: error.message || "Unbekannter Fehler während der Synchronisation" };
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
}
