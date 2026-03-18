import { test, expect } from '@playwright/test';

test.describe('E2E-ACC-001: Update Profile', () => {
    
    test.beforeEach(async ({ page }) => {
        await page.goto('/account');
    });

    test('should update user profile information', async ({ page }) => {
        
        await test.step('1. Ändere Profil-Daten', async () => {
            await page.fill('input[name="fullName"]', 'Max Mustermann');
        });

        await test.step('2. Klicke auf "Profil aktualisieren"', async () => {
            await page.click('button:has-text("Aktualisieren")');
        });

        await test.step('3. Verifiziere Erfolg', async () => {
            await expect(page.locator('text=Profil aktualisiert')).toBeVisible();
        });
    });
});
