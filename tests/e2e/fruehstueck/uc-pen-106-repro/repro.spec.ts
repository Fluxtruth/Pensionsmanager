import { test, expect } from '@playwright/test';
import { login } from '../../auth-helper';

test.describe('PEN-106: Breakfast Planner Fix', () => {
  test('should show breakfast for check-in day and display themed dialog', async ({ page }) => {
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    try {
        // 1. Login using helper
        console.log("Starting login...");
        await login(page);
        console.log("Login finished.");

        // 2. Create a booking for TODAY
        console.log("Navigating to Buchungen...");
        await page.click('nav >> text=Buchungen');
        await page.waitForURL('**/buchungen', { timeout: 10000 });
        console.log("Arrived at Buchungen.");
        
        // Open New Booking Dialog
        await page.click('button:has-text("Neue Buchung")');
        console.log("Opened New Booking Dialog.");
        
        // Search/Select Guest
        await page.fill('input[placeholder*="Gast suchen"]', 'Test');
        await page.waitForTimeout(1000); 
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('Enter');
        console.log("Selected Guest.");
        
        // Set dates
        const today = new Date().toISOString().split('T')[0];
        const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
        const dateInputs = page.locator('input[type="date"]');
        await dateInputs.nth(0).fill(today);
        await dateInputs.nth(1).fill(tomorrow);
        console.log("Set dates.");
        
        // Select Room
        await page.click('button:has-text("Zimmer wählen")');
        await page.waitForTimeout(1000);
        const roomOption = page.locator('[role="option"], [role="menuitem"], button[role="option"]').first();
        await roomOption.click();
        console.log("Selected Room.");
        
        // Save Booking
        await page.click('button:has-text("Speichern")');
        console.log("Clicked Speichern.");
        
        await page.waitForTimeout(3000); 
        
        // 3. Go to Breakfast page
        console.log("Navigating to Frühstück...");
        await page.click('nav >> text=Frühstück');
        await page.waitForURL('**/fruehstueck', { timeout: 10000 });
        console.log("Arrived at Frühstück.");
        
        // 4. Verify visibility
        await expect(page.locator('table')).toContainText('Test', { timeout: 15000 });
        console.log("Verified guest in table.");
        
        // 5. Check "Plan generieren" message logic
        const genBtn = page.locator('button:has-text("Plan generieren"), button:has-text("Plan aktualisieren")');
        
        // Click once to clear any missing (auto-gen)
        await genBtn.click();
        await page.waitForTimeout(2000);
        
        // Click again - now it should show the themed dialog (since everything is up to date)
        await genBtn.click();
        
        // Check for Dialog title "Alles aktuell"
        await expect(page.locator('h2:has-text("Alles aktuell")')).toBeVisible();
        await expect(page.locator('p:has-text("Alle aktiven Buchungen haben bereits einen Frühstückseintrag.")')).toBeVisible();
        
        // Close it
        await page.click('button:has-text("OK")');
        await expect(page.locator('h2:has-text("Alles aktuell")')).not.toBeVisible();

    } catch (e: any) {
        await page.screenshot({ path: 'test-failure.png' });
        console.error("TEST FAILURE AT URL:", page.url());
        console.error("ERROR MESSAGE:", e.message);
        console.error("ERROR STACK:", e.stack);
        throw e;
    }
  });
});
