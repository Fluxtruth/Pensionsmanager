import { test, expect } from '@playwright/test';
import { login } from '../../auth-helper';

test.describe('E2E-ZIM-002: Delete Room', () => {
    const roomNumber = `Del-${Math.floor(Math.random() * 1000)}`;
    
    test.beforeEach(async ({ page }) => {
        await login(page);
        // Prerequisite: Create a room to delete
        await page.goto('/zimmer');
        const addButton = page.getByRole('button', { name: /Zimmer hinzufügen/i });
        await addButton.waitFor({ state: 'visible' });
        await addButton.click();
        await page.fill('input[name="id"]', roomNumber);
        await page.fill('input[name="name"]', 'Delete Me');
        await page.click('button:has-text("Speichern")');
        await expect(page.locator(`text=${roomNumber}`)).toBeVisible();
    });

    test('should delete an existing room', async ({ page }) => {
        
        await test.step('1. Finde Zimmer und klicke auf Löschen', async () => {
            // Find the row with our room number and click delete
            const row = page.locator('tr', { hasText: roomNumber });
            const deleteButton = row.locator('button[title*="Löschen"], button:has-text("Löschen")');
            await deleteButton.waitFor({ state: 'visible' });
            await deleteButton.click();
        });

        await test.step('2. Bestätige Löschvorgang', async () => {
            // Confirm in dialog if it exists
            const confirmButton = page.locator('button:has-text("Löschen"), button:has-text("Bestätigen")');
            if (await confirmButton.isVisible()) {
                await confirmButton.click();
            }
        });

        await test.step('3. Verifiziere Zimmer ist weg', async () => {
            await expect(page.locator(`text=${roomNumber}`)).not.toBeVisible();
        });
    });
});
