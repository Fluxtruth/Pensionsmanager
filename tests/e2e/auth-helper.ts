import { Page, expect } from '@playwright/test';
import { TEST_ACCOUNT } from './test-credentials';

export async function login(page: Page) {
    console.log(`Logging in with ${TEST_ACCOUNT.email}...`);
    await page.goto('/login');
    await page.fill('input[type="email"]', TEST_ACCOUNT.email);
    await page.fill('input[type="password"]', TEST_ACCOUNT.password);
    await page.click('button:has-text("Anmelden")');
    
    // Wait for the dashboard or an error message
    const dashboardLink = page.locator('nav >> text=Dashboard');
    const errorAlert = page.locator('text=Ungültige Login-Daten'); // Hypothetical error text

    await Promise.race([
        expect(dashboardLink).toBeVisible({ timeout: 20000 }),
        expect(errorAlert).toBeVisible({ timeout: 20000 }).then(() => { throw new Error('Login failed: Invalid credentials'); })
    ]);
    console.log('Login successful');
}
