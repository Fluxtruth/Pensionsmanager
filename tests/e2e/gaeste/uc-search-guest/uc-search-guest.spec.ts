import { test, expect } from '@playwright/test';

test.describe('E2E-GAS-002: Search Guest', () => {
    
    test.beforeEach(async ({ page }) => {
        await page.goto('/gaeste');
    });

    test('should filter guest list by search term', async ({ page }) => {
        
        await test.step('1. Gib Suchbegriff ein', async () => {
            await page.fill('input[placeholder*="Suchen"]', 'Mustermann');
        });

        await test.step('2. Prüfe Ergebnisliste', async () => {
            const results = page.locator('.guest-row');
            // Check if at least one row matches or specific text is visible
            await expect(results.first()).toContainText('Mustermann');
        });
    });
});
