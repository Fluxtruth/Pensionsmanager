import { test, expect } from '@playwright/test';

test.describe('E2E-BUC-002: Cancel Booking', () => {
    
    test.beforeEach(async ({ page }) => {
        await page.goto('/buchungen');
    });

    test('should cancel an existing booking', async ({ page }) => {
        
        await test.step('1. Öffne Buchungsdetails', async () => {
            await page.click('.booking-row').first();
        });

        await test.step('2. Klicke auf "Stornieren"', async () => {
            await page.click('button:has-text("Stornieren")');
        });

        await test.step('3. Bestätige Stornierung', async () => {
            await page.click('role=dialog button:has-text("Ja, stornieren")');
        });

        await test.step('4. Verifiziere Statusänderung', async () => {
            await expect(page.locator('.status-badge')).toContainText('Storniert');
        });
    });
});
