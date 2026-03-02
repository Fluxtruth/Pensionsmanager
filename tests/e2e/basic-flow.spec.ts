import { test, expect } from '@playwright/test';

test('basic navigation and landing page flow', async ({ page }) => {
    // Go to the dashboard
    await page.goto('/');

    // Check that the Sidebar renders with the branding title
    await expect(page.locator('text=Pensionsmanager')).toBeVisible({ timeout: 10000 });

    // Navigate to Zimmer (Rooms)
    await page.click('text=Zimmer');
    await expect(page).toHaveURL(/.*zimmer/);

    // The page should eventually show Zimmer details or header
    await expect(page.locator('h2').filter({ hasText: /Zimmer|Zimmerverwaltung/i })).toBeVisible();
});
