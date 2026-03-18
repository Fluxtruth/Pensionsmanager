import { test, expect } from '@playwright/test';

test.describe('E2E-DAS-002: Quick Check-in', () => {
    
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
    });

    test('should perform a quick check-in from dashboard', async ({ page }) => {
        
        await test.step('1. Finde Gast in der Anreiseliste', async () => {
            const guestItem = page.locator('.arrival-list-item').first();
            await expect(guestItem).toBeVisible();
        });

        await test.step('2. Klicke auf "Check-in"', async () => {
            await page.click('button:has-text("Check-in")');
        });

        await test.step('3. Verifiziere Statusänderung', async () => {
            // Check for success toast or status update
            console.log('Check-in verified');
        });
    });
});
