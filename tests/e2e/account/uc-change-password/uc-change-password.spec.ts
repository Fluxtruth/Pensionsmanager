import { test, expect } from '@playwright/test';

test.describe('E2E-ACC-002: Change Password', () => {
    
    test.beforeEach(async ({ page }) => {
        await page.goto('/account');
    });

    test('should change user password', async ({ page }) => {
        
        await test.step('1. Wähle "Passwort ändern"', async () => {
            await page.click('text=Passwort ändern');
        });

        await test.step('2. Gib altes und neues Passwort ein', async () => {
            await page.fill('input[name="oldPassword"]', 'oldPass123');
            await page.fill('input[name="newPassword"]', 'newPass123');
        });

        await test.step('3. Speichere Passwort', async () => {
            await page.click('button:has-text("Passwort speichern")');
        });

        await test.step('4. Verifiziere Erfolg', async () => {
            await expect(page.locator('text=Passwort erfolgreich geändert')).toBeVisible();
        });
    });
});
