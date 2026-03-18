import { test, expect } from '@playwright/test';
import { TEST_ACCOUNT } from '../../test-credentials';

test.describe('E2E-AUT-001: Login Success', () => {
    
    test.beforeEach(async ({ page }) => {
        await page.goto('/login');
    });

    test('should login successfully with valid credentials', async ({ page }) => {
        
        await test.step('1. E-Mail eingeben', async () => {
            await page.fill('input[type="email"]', TEST_ACCOUNT.email);
        });

        await test.step('2. Passwort eingeben', async () => {
            await page.fill('input[type="password"]', TEST_ACCOUNT.password);
        });

        await test.step('3. Klicke auf "Anmelden"', async () => {
            await page.click('button:has-text("Anmelden")');
        });

        await test.step('4. Verifiziere Weiterleitung zum Dashboard', async () => {
            await expect(page).toHaveURL('/');
        });
    });
});
