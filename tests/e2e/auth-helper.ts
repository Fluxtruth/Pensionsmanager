import { Page } from '@playwright/test';
import { TEST_ACCOUNT } from './test-credentials';

export async function login(page: Page) {
  await page.goto('/login');
  await page.fill('input[type="email"]', TEST_ACCOUNT.email);
  await page.fill('input[type="password"]', TEST_ACCOUNT.password);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard**');
}
