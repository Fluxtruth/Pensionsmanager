import { test, expect } from '@playwright/test';

test.describe('E2E-AUT-002: Registration Flow', () => {
    
    test.beforeEach(async ({ page }) => {
        await page.goto('/register');
    });

    test('should complete the registration process', async ({ page }) => {
        
        await test.step('1. Fülle Registrierungsdaten aus', async () => {
            await page.fill('input[name="pensionName"]', 'Test Pension');
            await page.fill('input[name="email"]', 'newuser@example.com');
            await page.fill('input[name="password"]', 'securePassword123');
        });

        await test.step('2. Absenden des Formulars', async () => {
            await page.click('button:has-text("Registrieren")');
        });

        await test.step('3. Bestätigungsmeldung prüfen', async () => {
            await expect(page.locator('text=Registrierung erfolgreich')).toBeVisible();
        });
    });
});
