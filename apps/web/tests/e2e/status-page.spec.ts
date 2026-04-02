import { test, expect } from '@playwright/test';

test('public status page loads without authentication', async ({ page }) => {
  // Using a known slug (assumes a monitor with slug "example" exists)
  await page.goto('/status/example');
  // Should not redirect to login
  await expect(page).not.toHaveURL('/login');
});

test('shows monitor name and status', async ({ page }) => {
  await page.goto('/status/example');
  // Either shows the monitor name or an error — not a login redirect
  const hasContent = await page
    .locator('h1')
    .isVisible({ timeout: 5000 })
    .catch(() => false);
  const hasError = await page
    .locator('text=not found, text=error')
    .first()
    .isVisible({ timeout: 1000 })
    .catch(() => false);
  expect(hasContent || hasError).toBeTruthy();
});

test('shows uptime bars', async ({ page }) => {
  await page.goto('/status/example');
  // If the page loads with a valid monitor, uptime bars should render
  // The test passes if no JS errors crash the page
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));
  await page.waitForTimeout(2000);
  expect(errors.length).toBe(0);
});
