import { test, expect } from '@playwright/test';

test.describe('E2E-TOU-002: Data Export', () => {
    
    test.beforeEach(async ({ page }) => {
        await page.goto('/tourismusmeldung');
    });

    test('should export tourism data', async ({ page }) => {
        
        await test.step('1. Wähle Export-Format', async () => {
            await page.click('button:has-text("Export")');
            await page.click('text=CSV');
        });

        await test.step('2. Klicke auf "Exportieren"', async () => {
            const downloadPromise = page.waitForEvent('download');
            await page.click('button:has-text("Download starten")');
            const download = await downloadPromise;
            expect(download.suggestedFilename()).toContain('.csv');
        });
    });
});
