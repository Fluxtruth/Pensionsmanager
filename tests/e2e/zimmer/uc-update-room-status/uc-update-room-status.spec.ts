import { test, expect } from '@playwright/test';

test.describe('E2E-ZIM-002: Update Room Status', () => {
    
    test.beforeEach(async ({ page }) => {
        await page.goto('/zimmer');
    });

    test('should change the status of a room', async ({ page }) => {
        
        await test.step('1. Wähle Zimmer aus', async () => {
            await page.click('.room-card').first();
        });

        await test.step('2. Ändere Status', async () => {
            await page.selectOption('select[name="status"]', 'maintenance');
        });

        await test.step('3. Speichere Änderung', async () => {
            await page.click('button:has-text("Speichern")');
        });

        await test.step('4. Verifiziere neuen Status', async () => {
            await expect(page.locator('.status-badge')).toContainText('Wartung');
        });
    });
});
