import { test, expect } from '@playwright/test';

test.describe('E2E-IMP-001: View Impressum', () => {
    
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
    });

    test('should display the impressum page', async ({ page }) => {
        
        await test.step('1. Klicke auf Impressum-Link', async () => {
            await page.click('footer a:has-text("Impressum")');
        });

        await test.step('2. Prüfe Inhalte', async () => {
            await expect(page.locator('h1')).toContainText('Impressum');
            await expect(page.locator('text=Angaben gemäß')).toBeVisible();
        });
    });
});
