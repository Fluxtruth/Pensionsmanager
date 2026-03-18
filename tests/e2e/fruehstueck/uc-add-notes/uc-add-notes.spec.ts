import { test, expect } from '@playwright/test';

test.describe('E2E-FRU-002: Hinweise hinzufügen', () => {
    
    test.beforeEach(async ({ page }) => {
        await page.goto('/fruehstueck');
    });

    test('should add a note to a breakfast guest', async ({ page }) => {
        
        await test.step('1. Wähle Gast aus Liste', async () => {
            await page.click('.breakfast-list-itemFirst');
        });

        await test.step('2. Öffne Bearbeitungs-Modus/Hinweis-Feld', async () => {
            await page.click('button[aria-label="Add Note"]');
        });

        await test.step('3. Gib Hinweis ein "Glutenfrei"', async () => {
            await page.fill('textarea[name="note"]', 'Glutenfrei');
        });

        await test.step('4. Speichere Hinweis', async () => {
            await page.click('button:has-text("Speichern")');
        });

        await test.step('5. Verifiziere Anzeige des Hinweises', async () => {
            await expect(page.locator('text=Glutenfrei')).toBeVisible();
        });
    });
});
