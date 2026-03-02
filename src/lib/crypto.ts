/**
 * Utility functions for local cryptographic operations.
 * This is the foundation of the Sovereign Onboarding and Zero-Knowledge Architecture.
 */

/**
 * Generates a new AES-GCM 256-bit Master Key.
 * The key is extractable so it can be exported (e.g., to create a mnemonic phrase).
 * 
 * @returns {Promise<CryptoKey>} The generated AES-GCM CryptoKey
 */
export async function generateMasterKey(): Promise<CryptoKey> {
    if (typeof window === "undefined" || !window.crypto || !window.crypto.subtle) {
        throw new Error("Crytography API is not available in this environment");
    }

    return await window.crypto.subtle.generateKey(
        {
            name: "AES-GCM",
            length: 256,
        },
        true, // extractable (needed for export to bytes later)
        ["encrypt", "decrypt"] // key usages
    );
}

/**
 * Exports a given CryptoKey into raw format (ArrayBuffer).
 * Useful for transforming the key into a BIP-39 mnemonic phrase.
 * 
 * @param {CryptoKey} key - The AES-GCM CryptoKey
 * @returns {Promise<ArrayBuffer>} The raw representation of the key
 */
export async function exportKey(key: CryptoKey): Promise<ArrayBuffer> {
    if (typeof window === "undefined" || !window.crypto || !window.crypto.subtle) {
        throw new Error("Crytography API is not available in this environment");
    }

    if (!key.extractable) {
        throw new Error("Key is not extractable");
    }

    return await window.crypto.subtle.exportKey("raw", key);
}
