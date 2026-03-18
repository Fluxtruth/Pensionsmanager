import { test, expect } from '@playwright/test';

test.describe('E2E-FRU-001: Plan generieren', () => {
    
    test.beforeEach(async ({ page }) => {
        await page.goto('/fruehstueck');
    });

    test('should generate the breakfast plan', async ({ page }) => {
        
        await test.step('1. Prüfe auf Button "Plan generieren"', async () => {
            await expect(page.locator('button:has-text("Plan generieren")')).toBeVisible();
        });

        await test.step('2. Klicke auf "Plan generieren"', async () => {
            await page.click('button:has-text("Plan generieren")');
        });

        await test.step('3. Verifiziere Erscheinen der Gästeliste', async () => {
            // Wait for some list items to appear
            await expect(page.locator('.breakfast-list-item')).toBeVisible();
        });
    });
});
