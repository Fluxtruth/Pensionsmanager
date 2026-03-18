import { test, expect } from '@playwright/test';

test.describe('E2E-FRU-003: Liste herunterladen', () => {
    
    test.beforeEach(async ({ page }) => {
        await page.goto('/fruehstueck');
    });

    test('should download the breakfast list PDF', async ({ page }) => {
        
        await test.step('1. Klicke auf Export/Drucken Icon', async () => {
            await page.click('button[aria-label="Export"]');
        });

        await test.step('2. Wähle Format "PDF"', async () => {
            const downloadPromise = page.waitForEvent('download');
            await page.click('text=Download PDF');
            const download = await downloadPromise;
            expect(download.suggestedFilename()).toContain('.pdf');
        });
    });
});
