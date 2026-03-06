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

    const pensionId = await this.getPensionId();
    if (!pensionId) {
      return { 
        success: false, 
        error: "Keine zugeordnete Pension gefunden. Bitte kontaktieren Sie den Support oder vervollständigen Sie Ihr Profil." 
      };
    }

    try {
      let tablesProcessed = 0;
      for (const table of TABLES_TO_SYNC) {
        // 1. Geänderte Zeilen holen
        const pendingRows = await db.select<any>(
          `SELECT * FROM ${table} WHERE synced_at IS NULL OR updated_at > synced_at`
        );

        if (pendingRows.length > 0) {
          console.log(`Syncing ${pendingRows.length} rows for table ${table} with pension_id ${pensionId}...`);
          
          // 2. Zu Supabase hochladen (Upsert)
          // Wir stellen sicher, dass pension_id gesetzt ist
          const uploadData = pendingRows.map(row => {
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
            console.error(`Supabase Upsert Error for ${table}:`, upsertError);
            return { success: false, error: `Upload-Fehler in Tabelle ${table}: ${upsertError.message}` };
          }

          // 3. Lokal als synchronisiert markieren und pension_id persistent speichern
          const now = new Date().toISOString();
          for (const row of pendingRows) {
            const idField = table === 'settings' ? 'key' : 'id';
            const idValue = row[idField];
            
            await db.execute(
              `UPDATE ${table} SET synced_at = ?, pension_id = ? WHERE ${idField} = ?`,
              [now, pensionId, idValue]
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
