import { test, expect } from '@playwright/test';

test.describe('E2E-ANR-001: View Arrival List', () => {
    
    test.beforeEach(async ({ page }) => {
        await page.goto('/anreise-vorbereitung');
    });

    test('should display the arrival list', async ({ page }) => {
        
        await test.step('1. Prüfe Liste der erwarteten Anreisen', async () => {
            const arrivalList = page.locator('.arrival-list-item');
            await expect(arrivalList.first()).toBeVisible();
        });
    });
});
