import { describe, it, expect, vi, afterEach } from 'vitest';
import { exportSecurityCertificate } from './certificate';
import * as pdfExport from './pdf-export';

// Mock the pdf-export module to prevent native Tauri dialogs from blocking the CI/CD or test runner
vi.mock('./pdf-export', () => ({
    savePdfNative: vi.fn().mockResolvedValue(true)
}));

describe('Security Certificate Export (PEN-7)', () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    it('should throw an error if an invalid mnemonic is provided (empty)', async () => {
        await expect(exportSecurityCertificate("")).rejects.toThrow("Invalid mnemonic provided for certificate export.");
    });

    it('should throw an error if an invalid mnemonic is provided (not 12 words)', async () => {
        const invalidMnemonic = "only three words";
        await expect(exportSecurityCertificate(invalidMnemonic)).rejects.toThrow("Invalid mnemonic provided for certificate export.");
    });

    it('should successfully generate and call savePdfNative for a valid 12-word mnemonic', async () => {
        // We use a valid 12-word length string. Doesn't strictly need to be BIP-39 compliant for the UI rendering test
        const validMnemonic = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";

        const result = await exportSecurityCertificate(validMnemonic);

        expect(result).toBe(true);
        expect(pdfExport.savePdfNative).toHaveBeenCalledTimes(1);

        // Assert the mock was called correctly
        const callArgs = vi.mocked(pdfExport.savePdfNative).mock.calls[0];
        expect(callArgs[0]).toBeDefined(); // The jsPDF document instance
        expect(callArgs[1]).toBe("Sicherheits-Zertifikat.pdf"); // Expected filename
    });
});
