import { test, expect } from '@playwright/test';

test.describe('E2E-DAS-001: View Statistics', () => {
    
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
    });

    test('should display dashboard statistics', async ({ page }) => {
        
        await test.step('1. Prüfe Belegungskarte', async () => {
            const occupancyCard = page.locator('text=Aktuelle Belegung');
            await expect(occupancyCard).toBeVisible();
        });

        await test.step('2. Prüfe Umsatz-Chart', async () => {
            const revenueChart = page.locator('.recharts-responsive-container');
            await expect(revenueChart).toBeVisible();
        });
    });
});
