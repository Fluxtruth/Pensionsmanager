import { test, expect } from '@playwright/test';

test.describe('E2E-FRU-004: Timetravel auf anderes Datum', () => {
    
    test.beforeEach(async ({ page }) => {
        await page.goto('/fruehstueck');
    });

    test('should change the breakfast list date', async ({ page }) => {
        
        await test.step('1. Klicke auf Datumswähler', async () => {
            await page.click('.date-picker-trigger');
        });

        await test.step('2. Wähle Datum in der Zukunft', async () => {
            await page.click('button[aria-label="Next Month"]');
            await page.click('text="15"'); // specific day
        });

        await test.step('3. Verifiziere Aktualisierung der Liste', async () => {
            const dateDisplay = page.locator('.current-date-display');
            await expect(dateDisplay).not.toContainText('Heute');
        });
    });
});
