import { test, expect } from '@playwright/test';

test.describe('E2E-KON-002: Room Categories', () => {
    
    test.beforeEach(async ({ page }) => {
        await page.goto('/konfiguration');
    });

    test('should manage room categories', async ({ page }) => {
        
        await test.step('1. Öffne Zimmerkategorien', async () => {
            await page.click('text=Zimmerkategorien');
        });

        await test.step('2. Füge neue Kategorie hinzu', async () => {
            await page.click('button:has-text("Kategorie hinzufügen")');
            await page.fill('input[name="categoryName"]', 'Luxus-Suite');
        });

        await test.step('3. Speichere Änderungen', async () => {
            await page.click('button:has-text("Speichern")');
        });

        await test.step('4. Verifiziere neue Kategorie', async () => {
            await expect(page.locator('text=Luxus-Suite')).toBeVisible();
        });
    });
});
