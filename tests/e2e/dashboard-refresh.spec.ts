import { test, expect } from '@playwright/test';

test.describe('Dashboard Refresh', () => {
    test.beforeEach(async ({ page }) => {
        // Login logic using credentials from tests/credentials.md
        await page.goto('/login');
        await page.fill('input[name="email"]', 'test@pensionsmanager.de');
        await page.fill('input[name="password"]', 'Pensionsmanager2024!');
        await page.click('button[type="submit"]');

        // Enter PIN if needed
        const pinInput = page.locator('input[type="password"]');
        if (await pinInput.isVisible()) {
            await pinInput.fill('1234');
            await page.keyboard.press('Enter');
        }

        // Wait for dashboard to load
        await expect(page.locator('h2:has-text("Heutige Anreisen")')).toBeVisible();
    });

    test('should show new booking immediately on dashboard', async ({ page }) => {
        // 1. Go to Bookings page
        await page.click('a[href="/buchungen"]');
        await expect(page.locator('h2:has-text("Buchungsverwaltung")')).toBeVisible();

        // 2. Open Booking Wizard
        await page.click('button:has-text("Neue Buchung")');
        await expect(page.locator('text=Buchungs-Assistent')).toBeVisible();

        // 3. Create a Guest if needed (or select an existing one)
        // For simplicity, we assume "Max Mustermann" exists or we create a new one
        const guestSearch = page.locator('input[placeholder="Gast suchen..."]');
        await guestSearch.fill('Max Refresh Test');
        
        // Click "Neu erstellen" if it appears
        const createBtn = page.locator('button:has-text("Neu erstellen")');
        if (await createBtn.isVisible()) {
            await createBtn.click();
            await page.fill('input[name="first_name"]', 'Max');
            await page.fill('input[name="last_name"]', 'Refresh Test');
            await page.click('button:has-text("Gast anlegen")');
        } else {
            // Select first suggestion
            await page.click('button.w-full.text-left:has-text("Max Refresh Test")');
        }

        // 4. Fill dates
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dayAfterTomorrow = new Date();
        dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);

        const startDateStr = tomorrow.toISOString().split('T')[0];
        const endDateStr = dayAfterTomorrow.toISOString().split('T')[0];

        // Today for "Heutige Anreisen" test
        const todayStr = new Date().toISOString().split('T')[0];
        const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];

        await page.fill('input[type="date"] >> nth=0', todayStr);
        await page.fill('input[type="date"] >> nth=1', tomorrowStr);

        // 5. Select Room
        await page.click('button:has-text("Zimmer wählen")');
        // Select the first available room
        await page.click('button.p-2.rounded-xl.border.text-left >> nth=0');

        // 6. Save Booking
        await page.click('button:has-text("Abschließen")');

        // 7. Navigate back to Dashboard immediately
        await page.click('a[href="/"]');

        // 8. Verify the booking appears in "Heutige Anreisen" without delay
        // Note: The 'local-data-updated' event should have triggered loadData()
        await expect(page.locator('text=Max Refresh Test')).toBeVisible({ timeout: 5000 });
    });
});
