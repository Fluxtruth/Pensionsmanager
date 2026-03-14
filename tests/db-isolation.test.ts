import { describe, it, expect, beforeEach, vi } from 'vitest';
import { initDb } from '../src/lib/db';

// Mock the Tauri SQL plugin since we are running in Vitest (Node)
vi.mock('@tauri-apps/plugin-sql', () => ({
  default: {
    load: vi.fn(async (path) => ({
      execute: vi.fn(),
      select: vi.fn(async () => []),
      path: path
    }))
  }
}));

describe('Database Isolation', () => {
    beforeEach(() => {
        // Clear localStorage and internal state if possible
        if (typeof window !== 'undefined') {
            localStorage.clear();
        }
        vi.resetModules();
    });

    it('should return different database instances for different pension IDs', async () => {
        const dbA = await initDb('pension-A');
        const dbB = await initDb('pension-B');
        
        // In web/mock mode, they should be different instances
        expect(dbA).not.toBe(dbB);
    });

    it('should isolate data in mock mode', async () => {
        const dbA = await initDb('A');
        const dbB = await initDb('B');

        // Insert into A
        await dbA?.execute("INSERT INTO guests (id, name) VALUES (?, ?)", ['guest-1', 'Alice']);
        
        // Check in B
        const resultsB = await dbB?.select<any[]>("SELECT * FROM guests WHERE id = ?", ['guest-1']);
        expect(resultsB?.length).toBe(0);

        // Check in A
        const resultsA = await dbA?.select<any[]>("SELECT * FROM guests WHERE id = ?", ['guest-1']);
        expect(resultsA?.length).toBeGreaterThan(0);
    });

    it('should fallback to localStorage pension ID', async () => {
        if (typeof window !== 'undefined') {
            localStorage.setItem("app_last_pension_id", "cached-id");
            const db = await initDb();
            // We can't easily check the internal pensionId but we can check the instance caching
            const dbExplicit = await initDb('cached-id');
            expect(db).toBe(dbExplicit);
        }
    });
});
