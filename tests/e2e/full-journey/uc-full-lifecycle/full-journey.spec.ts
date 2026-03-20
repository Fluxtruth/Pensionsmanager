import { test, expect } from '@playwright/test';
import { login } from '../../auth-helper';

test.describe('True E2E: Full User Journey', () => {
    // Unique identifiers for this test run to avoid collisions
    const roomNumber = `E2E-${Math.floor(Math.random() * 1000)}`;
    const guestFirstName = 'Max';
    const guestLastName = `Mustermann-${Math.floor(Math.random() * 1000)}`;
    const groupName = `E2E-Group-${Math.floor(Math.random() * 1000)}`;

    test('should complete the full lifecycle from creation to cancellation', async ({ page }) => {
        // Collect page console logs
        page.on('console', msg => {
            const text = msg.text();
            if (text.includes('[Sync]') || text.includes('[Mock DB]') || text.includes('[Buchungen]') || text.includes('[Zimmer]')) {
                console.log('PAGE LOG:', text);
            }
        });
        
        await test.step('1. Login', async () => {
            console.log('Step 1: Login starting...');
            await login(page);
            console.log('Step 1: Login completed');
        });

        await test.step('2. Create Room', async () => {
            console.log('Step 2: Create Room starting...');
            await page.goto('/zimmer');
            console.log('Navigated to /zimmer');
            const addButton = page.getByRole('button', { name: /Zimmer hinzufügen/i });
            await addButton.waitFor({ state: 'visible' });
            await addButton.click();
            
            await page.fill('input[name="id"]', roomNumber);
            await page.fill('input[name="name"]', `Room ${roomNumber}`);
            await page.click('button:has-text("Speichern")');
            console.log('Clicked Speichern in Step 2');
            
            // Verify room is in list
            await expect(page.locator(`text=${roomNumber}`).first()).toBeVisible();
            console.log('Step 2: Create Room completed');
        });

        await test.step('3. Create Guest', async () => {
            console.log('Step 3: Create Guest starting...');
            await page.goto('/gaeste');
            const addButton = page.getByRole('button', { name: /Gast hinzufügen/i }).first();
            await addButton.waitFor({ state: 'visible' });
            await addButton.click();
            console.log('Clicked Gast hinzufügen');
            
            // Wait for dialog to be stable
            await page.waitForSelector('h2:has-text("Neuen Gast anlegen")');
            await page.waitForTimeout(500); 

            await page.fill('#first_name', guestFirstName);
            console.log('Filled Vorname');
            await page.fill('#last_name', guestLastName);
            console.log('Filled Nachname');
            
            const emailInput = page.locator('input[name="email"]');
            await emailInput.waitFor({ state: 'visible' });
            await page.waitForTimeout(500); // Settle time
            await emailInput.fill(`max.${guestLastName}@example.com`.toLowerCase());
            console.log('Filled E-Mail');
            
            await page.click('button:has-text("Gast speichern"), button:has-text("Speichern")');
            console.log('Clicked Speichern');
            
            // Wait for modal to close
            await page.waitForSelector('text=Neuen Gast anlegen', { state: 'hidden' });
            console.log('Dialog closed');
            
            // Verify guest is in list (use search if needed)
            const searchInput = page.getByPlaceholder(/Gäste suchen/i);
            await searchInput.fill(guestLastName);
            await page.keyboard.press('Enter');
            
            await expect(page.locator(`text=${guestLastName}`).first()).toBeVisible();
            console.log('Verified guest in list');
            
            // Wait for sync to complete before navigating away
            await page.waitForTimeout(4000);
            
            console.log('Step 3: Create Guest completed');
        });

        await test.step('4. Create Booking', async () => {
            console.log('Step 4: Create Booking starting...');
            await page.goto('/buchungen');
            await page.waitForTimeout(2000);
            await page.reload(); 
            await page.waitForTimeout(2000);
            
            const newBookingButton = page.getByRole('button', { name: /Neue Buchung/i });
            await newBookingButton.waitFor({ state: 'visible' });
            await newBookingButton.click();
            console.log('Clicked Neue Buchung button');
            
            // Search Guest - Fixed selector to match "Gast suchen oder erstellen..."
            const guestSearch = page.getByPlaceholder(/Gast suchen oder erstellen/i);
            await guestSearch.waitFor({ state: 'visible' });
            await guestSearch.click();
            await page.waitForTimeout(1000); // Wait for focus/dropdown
            await guestSearch.pressSequentially(guestLastName, { delay: 150 });
            console.log(`Typed guest search for ${guestLastName}`);
            
            // Wait for search results and click the correct one
            // Higher timeout and more flexible selector
            const guestButton = page.locator('button').filter({ hasText: guestLastName }).first();
            await guestButton.waitFor({ state: 'visible', timeout: 30000 });
            await guestButton.click();
            console.log('Selected guest from search results');
            
            // Set Dates (Tomorrow to Today + 4)
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const departure = new Date();
            departure.setDate(departure.getDate() + 4);
            
            const formatDate = (d: Date) => d.toISOString().split('T')[0];
            
            const dateInputs = page.locator('input[type="date"]');
            await dateInputs.nth(0).fill(formatDate(tomorrow));
            await dateInputs.nth(1).fill(formatDate(departure));
            console.log('Filled date inputs');
            
            // Select Room
            const roomButton = page.getByRole('button', { name: `Room ${roomNumber}`, exact: false });
            await roomButton.waitFor({ state: 'visible' });
            await roomButton.click();
            console.log(`Selected Room ${roomNumber}`);
            
            // Add Breakfast
            await page.click('button:has-text("Frühstück")');
            const addPersonButton = page.getByRole('button', { name: /Person hinzufügen/i }).first();
            await addPersonButton.click();
            console.log('Added breakfast person');
            
            // Add Notes
            await page.click('button:has-text("Notizen")');
            await page.fill('textarea[placeholder*="Notizen"]', 'E2E Test Note: High priority guest.');
            console.log('Added notes');
            
            // Complete Booking
            await page.click('button:has-text("Buchung abschließen")');
            console.log('Clicked Buchung abschließen');
            
            // Success Modal
            const finishButton = page.locator('button:has-text("Fertig"), button:has-text("OK")');
            await finishButton.waitFor({ state: 'visible', timeout: 30000 });
            await finishButton.click();
            console.log('Finished booking wizard');
        });

        await test.step('5. Convert to Group Booking', async () => {
            await page.goto('/buchungen');
            // Find the guest/booking and click to edit
            const bookingRow = page.locator('tr', { hasText: guestLastName }).first();
            await bookingRow.click();
            
            // Wait for Edit Dialog
            await page.waitForSelector('text=Buchung verwalten');
            
            // Convert to group
            const groupInput = page.locator('input[placeholder*="Gruppe"]');
            await groupInput.fill(groupName);
            // Wait for "neu erstellen" option and click it
            const createGroupOption = page.locator(`text="${groupName}" neu erstellen`);
            await createGroupOption.waitFor({ state: 'visible' });
            await createGroupOption.click();
            
            await page.click('button:has-text("Speichern")');
            // Wait for modal to close
            await page.waitForSelector('text=Buchung verwalten', { state: 'hidden' });
        });

        await test.step('6. Verify Visibility in Kalender', async () => {
            await page.goto('/kalender');
            // Wait for calendar to load
            await expect(page.locator(`text=${guestLastName}`).first()).toBeVisible({ timeout: 15000 });
        });

        await test.step('7. Verify in Frühstücksplan', async () => {
            await page.goto('/fruehstueck');
            // Check if we need to generate or just wait
            const generateButton = page.locator('button:has-text("Plan generieren")');
            if (await generateButton.isVisible()) {
                await generateButton.click();
            }
            await expect(page.locator(`text=${guestLastName}`).first()).toBeVisible();
        });

        await test.step('8. Verify in Putzplan', async () => {
            await page.goto('/reinigung');
            const updateButton = page.locator('button:has-text("Plan aktualisieren")');
            const generateButton = page.locator('button:has-text("Plan generieren")');
            
            if (await updateButton.isVisible()) {
                await updateButton.click();
            } else if (await generateButton.isVisible()) {
                await generateButton.click();
            }
            
            await expect(page.locator(`text=${roomNumber}`).first()).toBeVisible();
        });

        await test.step('9. Cancel Booking via Buchungsverwaltung', async () => {
            await page.goto('/buchungen');
            const bookingRow = page.locator('tr', { hasText: guestLastName }).first();
            
            // Locate the cancel button in that row
            const cancelButton = bookingRow.locator('button:has-text("Stornieren"), button[title*="Stornieren"]');
            await cancelButton.waitFor({ state: 'visible' });
            await cancelButton.click();
            
            // Confirm cancellation dialog
            const confirmButton = page.locator('button:has-text("Bestätigen"), button:has-text("Ja, stornieren"), button:has-text("OK")');
            await confirmButton.waitFor({ state: 'visible' });
            await confirmButton.click();
            
            // Wait for status update
            await expect(bookingRow.locator('text=Storniert')).toBeVisible({ timeout: 10000 });
        });

        await test.step('10. Verify Plans Updated (Removed/Status Change)', async () => {
            // Check Breakfast Plan - Should be gone or marked cancelled
            await page.goto('/fruehstueck');
            await expect(page.locator(`text=${guestLastName}`).first()).not.toBeVisible();
            
            // Check Cleaning Plan - Room should no longer have an arrival cleaning for this booking
            await page.goto('/reinigung');
            await expect(page.locator(`text=${roomNumber}`).first()).not.toBeVisible();
        });
    });
});
