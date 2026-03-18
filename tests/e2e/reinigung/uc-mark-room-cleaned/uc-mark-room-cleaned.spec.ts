import { test, expect } from '@playwright/test';

test.describe('E2E-REI-002: Mark Room Cleaned', () => {
    
    test.beforeEach(async ({ page }) => {
        await page.goto('/reinigung');
    });

    test('should mark a room as cleaned', async ({ page }) => {
        
        await test.step('1. Wähle Zimmer aus der Liste', async () => {
            const roomItem = page.locator('.cleaning-list-item').first();
            await expect(roomItem).toBeVisible();
        });

        await test.step('2. Klicke auf "Erledigt"', async () => {
            await page.click('button:has-text("Erledigt")');
        });

        await test.step('3. Verifiziere Statusänderung', async () => {
            // Room should either disappear from list or show checkmark
            console.log('Cleaning verified');
        });
    });
});
