import { test, expect } from '@playwright/test';

test.describe('E2E-FRU-005: Als Fertig markieren', () => {
    
    test.beforeEach(async ({ page }) => {
        await page.goto('/fruehstueck');
    });

    test('should mark a guest as attended', async ({ page }) => {
        
        await test.step('1. Suche Gast in Liste', async () => {
            await expect(page.locator('.breakfast-list-item').first()).toBeVisible();
        });

        await test.step('2. Klicke auf Checkbox/Status "Erschienen"', async () => {
            await page.click('.attendance-checkbox >> nth=0');
        });

        await test.step('3. Verifiziere visuelle Markierung', async () => {
            await expect(page.locator('.breakfast-list-item.attended').first()).toBeVisible();
        });
    });
});
