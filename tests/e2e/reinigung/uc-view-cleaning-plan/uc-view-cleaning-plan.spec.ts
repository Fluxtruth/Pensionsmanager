import { test, expect } from '@playwright/test';

test.describe('E2E-REI-001: View Cleaning Plan', () => {
    
    test.beforeEach(async ({ page }) => {
        await page.goto('/reinigung');
    });

    test('should display the daily cleaning plan', async ({ page }) => {
        
        await test.step('1. Prüfe Liste der zu reinigenden Zimmer', async () => {
            const cleaningList = page.locator('.cleaning-list-item');
            await expect(cleaningList.first()).toBeVisible();
        });
    });
});
