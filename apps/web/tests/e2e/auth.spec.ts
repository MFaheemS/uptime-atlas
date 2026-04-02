import { test, expect } from '@playwright/test';

const TEST_EMAIL = `test-${Date.now()}@example.com`;
const TEST_PASSWORD = 'Password123!';

test('can register a new account', async ({ page }) => {
  await page.goto('/register');
  await page.fill('input[name="email"], input[type="email"]', TEST_EMAIL);
  await page.fill('input[name="password"], input[type="password"]', TEST_PASSWORD);
  const nameInput = page.locator('input[name="name"]');
  if (await nameInput.isVisible()) await nameInput.fill('Test User');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL('/');
});

test('can log in with correct credentials', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[name="email"], input[type="email"]', 'existing@example.com');
  await page.fill('input[name="password"], input[type="password"]', TEST_PASSWORD);
  await page.click('button[type="submit"]');
  // Redirects to dashboard
  await expect(page).toHaveURL('/');
});

test('shows error with wrong password', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[name="email"], input[type="email"]', 'existing@example.com');
  await page.fill('input[name="password"], input[type="password"]', 'wrongpassword');
  await page.click('button[type="submit"]');
  await expect(
    page.locator('text=Invalid credentials, text=incorrect, text=error').first(),
  ).toBeVisible();
});

test('redirects to dashboard after login', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[name="email"], input[type="email"]', 'existing@example.com');
  await page.fill('input[name="password"], input[type="password"]', TEST_PASSWORD);
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL('/');
  await expect(page.locator('text=Dashboard, text=UptimeAtlas').first()).toBeVisible();
});
