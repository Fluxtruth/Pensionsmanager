import { describe, it, expect } from 'vitest';
import { generateMasterKey, exportKey } from './crypto';

describe('Crypto Utilities (PEN-5)', () => {
    it('should generate a valid AES-GCM 256-bit CryptoKey', async () => {
        const key = await generateMasterKey();

        expect(key).toBeDefined();
        expect(key.type).toBe('secret');
        expect(key.extractable).toBe(true);
        expect(key.algorithm.name).toBe('AES-GCM');
        // Using cast to any to assert algorithm length property which might not be strictly typed by DOM types out-of-the-box
        expect((key.algorithm as any).length).toBe(256);
        expect(key.usages).toContain('encrypt');
        expect(key.usages).toContain('decrypt');
    });

    it('should export the generated key to a raw ArrayBuffer of 32 bytes (256 bits)', async () => {
        const key = await generateMasterKey();
        const rawKey = await exportKey(key);

        expect(rawKey).toBeDefined();
        expect(rawKey instanceof ArrayBuffer).toBe(true);
        expect(rawKey.byteLength).toBe(32); // 256 bits = 32 bytes
    });

    it('should throw an error if attempting to export a non-extractable key', async () => {
        // Generate a non-extractable key for testing
        const nonExtractableKey = await window.crypto.subtle.generateKey(
            { name: 'AES-GCM', length: 256 },
            false, // non-extractable
            ['encrypt', 'decrypt']
        );

        await expect(exportKey(nonExtractableKey)).rejects.toThrow('Key is not extractable');
    });
});
