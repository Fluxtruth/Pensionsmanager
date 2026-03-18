import { test, expect } from '@playwright/test';

test.describe('E2E-TOU-001: Monthly Report', () => {
    
    test.beforeEach(async ({ page }) => {
        await page.goto('/tourismusmeldung');
    });

    test('should generate a monthly tourism report', async ({ page }) => {
        
        await test.step('1. Wähle Monat und Jahr', async () => {
            await page.selectOption('select[name="month"]', '3');
            await page.selectOption('select[name="year"]', '2026');
        });

        await test.step('2. Klicke auf "Bericht generieren"', async () => {
            await page.click('button:has-text("Bericht generieren")');
        });

        await test.step('3. Prüfe Berichtsvorschau', async () => {
            await expect(page.locator('.report-preview')).toBeVisible();
        });
    });
});
