import { test, expect } from '@playwright/test';

// Helper: log in before each test
async function login(page: any) {
  await page.goto('/login');
  await page.fill('input[type="email"]', 'test@example.com');
  await page.fill('input[type="password"]', 'Password123!');
  await page.click('button[type="submit"]');
  await page.waitForURL('/');
}

test('can add a new monitor from the dashboard', async ({ page }) => {
  await login(page);
  const addBtn = page.locator('button', { hasText: /add monitor/i }).first();
  await addBtn.click();
  await page.fill('input[placeholder*="name"], input[name="name"]', 'E2E Test Site');
  await page.fill('input[type="url"], input[placeholder*="https"]', 'https://example.com');
  await page.click('button[type="submit"]');
  await expect(page.locator('text=E2E Test Site')).toBeVisible({ timeout: 10_000 });
});

test('monitor appears in the list after creation', async ({ page }) => {
  await login(page);
  await expect(page.locator('text=E2E Test Site')).toBeVisible({ timeout: 10_000 });
});

test('can navigate to monitor detail page', async ({ page }) => {
  await login(page);
  await page.locator('text=E2E Test Site').first().click();
  await expect(page).toHaveURL(/\/monitors\/.+/);
  await expect(page.locator('text=E2E Test Site')).toBeVisible();
});

test('can delete a monitor after confirming dialog', async ({ page }) => {
  await login(page);
  await page.locator('text=E2E Test Site').first().click();
  await page.waitForURL(/\/monitors\/.+/);
  await page.click('button', { hasText: /delete/i });
  // Confirm dialog
  const confirmBtn = page.locator('button', { hasText: /confirm/i });
  await confirmBtn.click();
  await page.waitForURL('/');
  await expect(page.locator('text=E2E Test Site')).not.toBeVisible();
});
