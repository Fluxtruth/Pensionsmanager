import { test, expect } from '@playwright/test';

test.describe('E2E-IMP-002: View Privacy Policy', () => {
    
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
    });

    test('should display the privacy policy page', async ({ page }) => {
        
        await test.step('1. Klicke auf Datenschutz-Link', async () => {
            await page.click('footer a:has-text("Datenschutz")');
        });

        await test.step('2. Prüfe Inhalte', async () => {
            await expect(page.locator('h1')).toContainText('Datenschutzerklärung');
        });
    });
});
