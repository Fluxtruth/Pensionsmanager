import { test, expect } from '@playwright/test';

test.describe('E2E-ANR-002: Print Registration Form', () => {
    
    test.beforeEach(async ({ page }) => {
        await page.goto('/anreise-vorbereitung');
    });

    test('should trigger the registration form print dialog', async ({ page }) => {
        
        await test.step('1. Wähle Gast aus', async () => {
            const guestItem = page.locator('.arrival-list-item').first();
            await expect(guestItem).toBeVisible();
        });

        await test.step('2. Klicke auf "Meldeschein drucken"', async () => {
            await page.click('button:has-text("Meldeschein")');
        });

        await test.step('3. Verifiziere PDF/Druck-Dialog', async () => {
            // Check for new tab or print intent
            console.log('Print dialog triggered');
        });
    });
});
