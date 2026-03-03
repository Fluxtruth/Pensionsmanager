import { LazyStore } from '@tauri-apps/plugin-store';
import { exportKey } from './crypto';

const STORE_NAME = 'masterkey_store.bin';
const KEY_NAME = 'master_key_raw';

// Initialize a lazy store
// This will create the file in the AppData directory or load it if it exists.
const store = new LazyStore(STORE_NAME);

/**
 * Saves the AES-GCM 256-bit CryptoKey into the secure device store.
 * The key is kept as a raw ArrayBuffer mapped to an array of bytes for JSON serialization.
 * 
 * @param {CryptoKey} key - The AES-GCM 256-bit CryptoKey.
 */
export async function saveMasterKey(key: CryptoKey): Promise<void> {
    if (typeof window === "undefined" || !window.crypto || !window.crypto.subtle) {
        throw new Error("Crytography API is not available in this environment");
    }

    if (!document || !window.__TAURI_INTERNALS__) {
        console.warn("Not running in a Tauri environment. Mocking storage.");
        // Fallback or skip if not in Tauri
        return;
    }

    const rawBuffer = await exportKey(key);
    const byteArray = Array.from(new Uint8Array(rawBuffer));

    await store.set(KEY_NAME, byteArray);
    await store.save(); // ensure it writes to disk
}

/**
 * Loads the raw key from the secure device store and imports it as a CryptoKey.
 * 
 * @returns {Promise<CryptoKey | null>} The imported AES-GCM CryptoKey, or null if not found.
 */
export async function loadMasterKey(): Promise<CryptoKey | null> {
    if (typeof window === "undefined" || !window.crypto || !window.crypto.subtle) {
        throw new Error("Crytography API is not available in this environment");
    }

    if (!document || !window.__TAURI_INTERNALS__) {
        console.warn("Not running in a Tauri environment. Returning null.");
        return null; // fallback for non-Tauri
    }

    const byteArray = await store.get<number[]>(KEY_NAME);

    if (!byteArray || !Array.isArray(byteArray) || byteArray.length !== 32) {
        return null; // Key is missing or invalid length
    }

    const rawBuffer = new Uint8Array(byteArray).buffer;

    return await window.crypto.subtle.importKey(
        "raw",
        rawBuffer,
        { name: "AES-GCM" },
        true, // extractable
        ["encrypt", "decrypt"]
    );
}

/**
 * Irreversibly deletes the Master Key from the secure device store.
 */
export async function clearMasterKey(): Promise<void> {
    if (!document || !window.__TAURI_INTERNALS__) {
        return;
    }

    await store.delete(KEY_NAME);
    await store.save();
}
