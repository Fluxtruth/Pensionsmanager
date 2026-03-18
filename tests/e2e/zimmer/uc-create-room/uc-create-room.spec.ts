import { test, expect } from '@playwright/test';
import { login } from '../../auth-helper';

test.describe('E2E-ZIM-001: Create Room', () => {
    const roomNumber = `Test-${Math.floor(Math.random() * 1000)}`;
    const roomName = 'E2E Test Zimmer';
    
    test.beforeEach(async ({ page }) => {
        await login(page);
        await page.goto('/zimmer');
    });

    test('should create a new room configuration', async ({ page }) => {
        
        await test.step('1. Klicke auf "Zimmer hinzufügen"', async () => {
            const addButton = page.getByRole('button', { name: /Zimmer hinzufügen/i });
            await addButton.waitFor({ state: 'visible' });
            await addButton.click();
            await expect(page.locator('role=dialog')).toBeVisible();
        });

        await test.step('2. Fülle Zimmerdaten aus', async () => {
            await page.fill('input[name="roomNumber"]', roomNumber);
            await page.fill('input[name="name"]', roomName);
            // Select room type if available, otherwise use default
            const typeSelect = page.locator('select[name="type"]');
            if (await typeSelect.isVisible()) {
                await typeSelect.selectOption('EZ');
            }
        });

        await test.step('3. Speichere Zimmer', async () => {
            await page.click('button:has-text("Speichern")');
            // Wait for modal to close
            await expect(page.locator('role=dialog')).not.toBeVisible();
        });

        await test.step('4. Verifiziere Zimmer in der Liste', async () => {
            await expect(page.locator(`text=${roomNumber}`)).toBeVisible();
            await expect(page.locator(`text=${roomName}`)).toBeVisible();
        });
    });
});
