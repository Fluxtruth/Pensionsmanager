import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { saveMasterKey, loadMasterKey, clearMasterKey } from './keystore';
import { generateMasterKey } from './crypto';

// Use hoisted to share mock state between tests
const { globalMemoryStore } = vi.hoisted(() => ({
    globalMemoryStore: {} as Record<string, any>
}));

// Mock Tauri LazyStore class correctly
vi.mock('@tauri-apps/plugin-store', () => {
    return {
        LazyStore: class {
            async set(key: string, value: any) { globalMemoryStore[key] = value; }
            async get(key: string) { return globalMemoryStore[key] || null; }
            async delete(key: string) { delete globalMemoryStore[key]; }
            async save() { }
        }
    };
});

describe('Keystore Utilities (PEN-9)', () => {
    // We need to trick the keystore module into thinking it runs inside Tauri for testing
    let tauriOriginal: any;

    beforeEach(() => {
        tauriOriginal = (window as any).__TAURI_INTERNALS__;
        (window as any).__TAURI_INTERNALS__ = {}; // Fake Tauri presence
    });

    afterEach(() => {
        (window as any).__TAURI_INTERNALS__ = tauriOriginal;
        vi.clearAllMocks();
        // Clear hoisted memory store
        Object.keys(globalMemoryStore).forEach(k => delete globalMemoryStore[k]);
    });

    it('should save and load a valid CryptoKey back and forth', async () => {
        const originalKey = await generateMasterKey();

        await saveMasterKey(originalKey);

        const loadedKey = await loadMasterKey();
        expect(loadedKey).not.toBeNull();
        expect(loadedKey?.type).toBe('secret');
        expect(loadedKey?.algorithm.name).toBe('AES-GCM');
    });

    it('should return null when loading a key that does not exist', async () => {
        // clear memory block
        await clearMasterKey();

        const noKey = await loadMasterKey();
        expect(noKey).toBeNull();
    });

    it('should delete an existing key correctly', async () => {
        const tempKey = await generateMasterKey();
        await saveMasterKey(tempKey);

        let loaded = await loadMasterKey();
        expect(loaded).not.toBeNull();

        await clearMasterKey();

        loaded = await loadMasterKey();
        expect(loaded).toBeNull();
    });
});
