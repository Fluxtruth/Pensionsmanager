/**
 * Utility functions for local cryptographic operations.
 * This is the foundation of the Sovereign Onboarding and Zero-Knowledge Architecture.
 */

import * as bip39 from 'bip39';


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

/**
 * Generates a 12-word BIP-39 mnemonic phrase.
 * This represents 128 bits of entropy.
 * 
 * @returns {string} The 12-word mnemonic phrase.
 */
export function generateMnemonic(): string {
    // 128 bits of entropy -> 12 words
    return bip39.generateMnemonic(128);
}

/**
 * Derives the AES-GCM 256-bit Master Key from a 12-word mnemonic phrase.
 * It uses the BIP-39 seed generation (PBKDF2 with HMAC-SHA512) and takes the first 32 bytes.
 * 
 * @param {string} mnemonic - The 12-word BIP-39 mnemonic phrase.
 * @returns {Promise<CryptoKey>} The derived AES-GCM 256-bit CryptoKey.
 */
export async function mnemonicToMasterKey(mnemonic: string): Promise<CryptoKey> {
    if (typeof window === "undefined" || !window.crypto || !window.crypto.subtle) {
        throw new Error("Crytography API is not available in this environment");
    }

    // Validate mnemonic
    if (!bip39.validateMnemonic(mnemonic)) {
        throw new Error("Invalid mnemonic phrase");
    }

    // Generate a 512-bit seed from the mnemonic
    const seed = await bip39.mnemonicToSeed(mnemonic);

    // We only need 256 bits (32 bytes) for AES-256
    const keyMaterial = new Uint8Array(seed.slice(0, 32));

    // Import it as an AES-GCM extractable key
    return await window.crypto.subtle.importKey(
        "raw",
        keyMaterial,
        { name: "AES-GCM" },
        true, // extractable
        ["encrypt", "decrypt"]
    );
}
