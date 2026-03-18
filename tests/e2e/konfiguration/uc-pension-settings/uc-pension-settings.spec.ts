import { test, expect } from '@playwright/test';

test.describe('E2E-KON-001: Pension Settings', () => {
    
    test.beforeEach(async ({ page }) => {
        await page.goto('/konfiguration');
    });

    test('should update pension general settings', async ({ page }) => {
        
        await test.step('1. Ändere Pensionsnamen oder Adresse', async () => {
            await page.fill('input[name="pensionName"]', 'Updated Pension Name');
        });

        await test.step('2. Speichere Einstellungen', async () => {
            await page.click('button:has-text("Speichern")');
        });

        await test.step('3. Verifiziere Aktualisierung', async () => {
            await expect(page.locator('input[name="pensionName"]')).toHaveValue('Updated Pension Name');
        });
    });
});
