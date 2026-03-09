import { test, expect } from '@playwright/test';

test.describe('Hauptgast Logic', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/buchungen');
    });

    test('should mark only the first guest as Hauptgast in a new group', async ({ page }) => {
        // 1. Open Booking Wizard
        await page.click('button:has-text("Neue Buchung")');
        
        // 2. Add a second guest
        await page.click('button[title="Weiteren Gast hinzufügen"]');
        
        // 3. Fill first guest details (Hauptgast)
        await page.click('button:has-text("Hauptgast")');
        // ... Fill Name, Room, etc. ...
        // Note: We might need to mock or select existing data
        
        // 4. Check if crown is visible on the first tab
        const firstTab = page.locator('button[role="tab"]').first();
        await expect(firstTab.locator('svg.text-amber-500')).toBeVisible();
        
        // 5. Check if crown is NOT visible on the second tab
        const secondTab = page.locator('button[role="tab"]').nth(1);
        await expect(secondTab.locator('svg.text-amber-500')).not.toBeVisible();
    });

    test('should show crown in edit mask tabs for Hauptgast', async ({ page }) => {
        // 1. Find a group booking in the list
        // 2. Click to edit
        // 3. Verify crown in edit mask tabs
    });
});
