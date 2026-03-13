import { test, expect } from '@playwright/test';

test.describe('Group Booking E2E', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/buchungen');
    });

    test('should create a group booking and enforce group field locking', async ({ page }) => {
        const timestamp = new Date().getTime();
        const groupName = `Group_${timestamp}`;
        const mainGuestName = "John Doe";

        // 1. Open Booking Wizard
        await page.click('button:has-text("Neue Buchung")');
        
        // 2. Verify that guest addition "+" button is hidden/disabled in wizard
        // According to our changes, the button is commented out or hidden.
        // We can check if any button with Plus icon exists in the wizard header area
        const plusButtonInWizard = page.locator('div[role="dialog"] header .lucide-plus').first();
        await expect(plusButtonInWizard).not.toBeVisible();

        // 3. Search or Create Guest "John Doe"
        const guestInput = page.locator('input[placeholder="Gast suchen..."]');
        await guestInput.fill(mainGuestName);
        
        // Check if "John Doe" exists, if not, create him
        const createGuestButton = page.locator(`button:has-text("${mainGuestName}") neu erstellen`);
        const existingGuestLink = page.locator(`button:has-text("${mainGuestName}")`).first();
        
        // Add a small wait for the dropdown to appear
        await page.waitForTimeout(500);

        if (await createGuestButton.isVisible()) {
            await createGuestButton.click();
        } else if (await existingGuestLink.isVisible()) {
            await existingGuestLink.click();
        } else {
            // Alternatively, used the "Neuen Gast anlegen" button if searching doesn't show result
            await page.click('button:has-text("Neuen Gast anlegen")');
            await page.fill('input[name="first_name"]', "John");
            await page.fill('input[name="last_name"]', "Doe");
            await page.click('button:has-text("Gast speichern")');
        }

        // 4. Set Dates (Today and Tomorrow)
        const today = new Date().toISOString().split('T')[0];
        const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
        
        const dateInputs = page.locator('input[type="date"]');
        await dateInputs.nth(0).fill(today);
        await dateInputs.nth(1).fill(tomorrow);

        // 5. Assign Group Name
        const groupInput = page.locator('input[placeholder="Gruppe suchen oder erstellen..."]');
        await groupInput.fill(groupName);
        await page.waitForTimeout(300); // Wait for dropdown
        await page.click(`button:has-text("${groupName}") neu erstellen`);

        // 6. Select Room
        // Select first available room
        const roomButtons = page.locator('button:has-text("Zimmer")'); // This might be too generic
        // Let's use the room name or just click the first enabled room button in the grid
        const availableRoom = page.locator('div.grid-cols-2 button:not([disabled])').first();
        await availableRoom.click();

        // 7. Complete Booking
        await page.click('button:has-text("Fest buchen")');
        await page.click('button:has-text("Buchung abschließen")');

        // 8. Verify Success Modal and Close it
        await expect(page.locator('text=Buchung erfolgreich')).toBeVisible();
        await page.click('button:has-text("Schließen")');

        // 9. Open Edit Dialog for the created booking
        // Find "John Doe" in the list
        const bookingRow = page.locator('tr', { hasText: mainGuestName }).first();
        await bookingRow.locator('button:has(svg.lucide-pencil)').click();

        // 10. Verify that "+" tab for adding guest IS visible in edit mode
        const plusButtonInEdit = page.locator('div[role="dialog"] .lucide-plus').last();
        await expect(plusButtonInEdit).toBeVisible();
        await plusButtonInEdit.click();

        // 11. Verify Group Field Lockdown for secondary guest
        // Switch to the new "Neuer Gast" tab (it should be active after clicking plus)
        const newGuestTab = page.locator('div:has-text("Neuer Gast")').last();
        await expect(newGuestTab).toBeVisible();

        const editGroupInput = page.locator('input[placeholder="Gruppe fest durch Hauptgast vorgegeben"]');
        await expect(editGroupInput).toBeDisabled();
        await expect(editGroupInput).toHaveValue(groupName);
    });
});
