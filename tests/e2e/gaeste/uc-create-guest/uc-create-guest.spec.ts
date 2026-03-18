import { test, expect } from '@playwright/test';
import { login } from '../../auth-helper';

test.describe('E2E-GAS-001: Gast manuell anlegen', () => {
    const firstName = 'E2E';
    const lastName = `Guest-${Math.floor(Math.random() * 1000)}`;
    
    test.beforeEach(async ({ page }) => {
        await login(page);
        await page.goto('/gaeste');
    });

    test('should create a new guest record', async ({ page }) => {
        
        await test.step('1. Klicke auf "Gast hinzufügen"', async () => {
            const addButton = page.getByRole('button', { name: /Gast hinzufügen/i });
            await addButton.waitFor({ state: 'visible' });
            await addButton.click();
            await expect(page.locator('role=dialog')).toBeVisible();
        });

        await test.step('2. Fülle Stammdaten aus', async () => {
            await page.fill('input[placeholder="Vorname"]', firstName);
            await page.fill('input[placeholder="Nachname"]', lastName);
            await page.fill('input[placeholder="E-Mail"]', `e2e-${lastName}@example.com`);
        });

        await test.step('3. Speichere Gast', async () => {
            await page.click('button:has-text("Speichern")');
            await expect(page.locator('role=dialog')).not.toBeVisible();
        });

        await test.step('4. Verifiziere Gast in der Liste', async () => {
            await page.fill('input[placeholder="Gäste suchen..."]', lastName);
            await expect(page.locator(`text=${lastName}`)).toBeVisible();
            await expect(page.locator(`text=${firstName}`)).toBeVisible();
        });
    });
});
