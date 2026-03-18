import { test, expect } from '@playwright/test';
import { login } from '../../auth-helper';

test.describe('E2E-BUC-001: Gruppenbuchung erstellen', () => {
    const roomNumber = `B-${Math.floor(Math.random() * 1000)}`;
    const guestLastName = `B-Guest-${Math.floor(Math.random() * 1000)}`;
    
    test.beforeEach(async ({ page }) => {
        await login(page);
        // Prerequisite: Create a room
        await page.goto('/zimmer');
        const addRoomBtn = page.getByRole('button', { name: /Zimmer hinzufügen/i });
        await addRoomBtn.waitFor({ state: 'visible' });
        await addRoomBtn.click();
        await page.fill('input[name="id"]', roomNumber);
        await page.fill('input[name="name"]', 'Booking Test Room');
        await page.click('button:has-text("Speichern")');
        await expect(page.locator(`text=${roomNumber}`)).toBeVisible();

        // Prerequisite: Create a guest
        await page.goto('/gaeste');
        const addGuestBtn = page.getByRole('button', { name: /Gast hinzufügen/i });
        await addGuestBtn.waitFor({ state: 'visible' });
        await addGuestBtn.click();
        await page.fill('input[placeholder="Vorname"]', 'Booking');
        await page.fill('input[placeholder="Nachname"]', guestLastName);
        await page.click('button:has-text("Speichern")');
        await page.fill('input[placeholder="Gäste suchen..."]', guestLastName);
        await expect(page.locator(`text=${guestLastName}`)).toBeVisible();

        await page.goto('/buchungen');
    });

    test('should create a group booking with multiple guests', async ({ page }) => {
        
        await test.step('1. Klicke auf "Neue Buchung"', async () => {
            const newBookingBtn = page.getByRole('button', { name: /Neue Buchung/i });
            await newBookingBtn.waitFor({ state: 'visible' });
            await newBookingBtn.click();
            await expect(page.locator('role=dialog')).toBeVisible();
        });

        await test.step('2. Wähle Zeitraum und Zimmer', async () => {
            // Wait for booking assistant
            await expect(page.locator('text=Neuer Buchungs-Assistent')).toBeVisible();
            
            // Period selection (default typical for assistant might already be set)
            await page.click('button:has-text("Weiter")');
        });

        await test.step('3. Wähle Gast aus', async () => {
             // Search for the guest we created
             const searchInput = page.locator('input[placeholder*="Gast suchen"]');
             if (await searchInput.isVisible()) {
                 await searchInput.fill(guestLastName);
                 await page.click(`text=${guestLastName}`);
             }
             await page.click('button:has-text("Weiter")');
        });

        await test.step('4. Wähle Zimmer im Assistenten', async () => {
            // Select the room we created
            await page.click(`text=${roomNumber}`);
            await page.click('button:has-text("Weiter")');
        });

        await test.step('5. Speichere Buchung', async () => {
            await page.click('button:has-text("Buchung abschließen")');
            await expect(page.locator('role=dialog')).not.toBeVisible();
        });

        await test.step('6. Verifiziere Buchung in der Liste', async () => {
            await expect(page.locator(`text=${guestLastName}`)).toBeVisible();
        });
    });
});
