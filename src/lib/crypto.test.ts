import { describe, it, expect } from 'vitest';
import { generateMasterKey, exportKey, generateMnemonic, mnemonicToMasterKey } from './crypto';
import * as bip39 from 'bip39';

describe('Crypto Utilities (PEN-5 & PEN-6)', () => {
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

    it('should generate a valid 12-word mnemonic', () => {
        const mnemonic = generateMnemonic();
        expect(typeof mnemonic).toBe('string');
        const words = mnemonic.split(' ');
        expect(words.length).toBe(12);
        expect(bip39.validateMnemonic(mnemonic)).toBe(true);
    });

    it('should derive an AES-GCM 256-bit key from a mnemonic', async () => {
        const mnemonic = generateMnemonic();
        const key = await mnemonicToMasterKey(mnemonic);

        expect(key).toBeDefined();
        expect(key.type).toBe('secret');
        expect(key.extractable).toBe(true);
        expect(key.algorithm.name).toBe('AES-GCM');
        expect((key.algorithm as any).length).toBe(256);
        expect(key.usages).toContain('encrypt');
        expect(key.usages).toContain('decrypt');
    });

    it('should deterministically derive the same key from the same mnemonic', async () => {
        const mnemonic = generateMnemonic();
        const key1 = await mnemonicToMasterKey(mnemonic);
        const key2 = await mnemonicToMasterKey(mnemonic);

        const raw1 = await exportKey(key1);
        const raw2 = await exportKey(key2);

        // Compare ArrayBuffers using Uint8Array
        expect(new Uint8Array(raw1)).toEqual(new Uint8Array(raw2));
    });

    it('should reject an invalid mnemonic', async () => {
        const invalidMnemonic = 'invalid word list that is definitely not bip39 compliant at all';
        await expect(mnemonicToMasterKey(invalidMnemonic)).rejects.toThrow('Invalid mnemonic phrase');
    });
});
