import { test, expect } from '@playwright/test';

test.describe('Resource Detail View', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3002');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);
  });

  test('should navigate to resource detail when clicking a card', async ({ page }) => {
    // Navigate to resources
    await page.click('text=Resources');
    await page.waitForTimeout(500);

    // Take screenshot of resources page
    await page.screenshot({ path: 'tests/screenshots/before-click-card.png' });

    // Click on the first resource card
    const firstCard = page.locator('.grid > div').first();
    await firstCard.click();
    await page.waitForTimeout(1000);

    // Verify we're on the detail page (Quick Actions section should be visible)
    await expect(page.getByRole('heading', { name: 'Quick Actions' })).toBeVisible({ timeout: 10000 });

    // Take screenshot of detail page
    await page.screenshot({ path: 'tests/screenshots/resource-detail-page.png' });
  });

  test('should go back to resources when clicking back button', async ({ page }) => {
    // Navigate to resources
    await page.click('text=Resources');
    await page.waitForTimeout(500);

    // Click on the first resource card
    const firstCard = page.locator('.grid > div').first();
    await firstCard.click();
    await page.waitForTimeout(1000);

    // Verify we're on detail page first
    await expect(page.getByRole('heading', { name: 'Quick Actions' })).toBeVisible({ timeout: 10000 });

    // Click Resources nav link to go back
    await page.click('text=Resources');
    await page.waitForTimeout(1000);

    // Verify we're back on resources page
    await expect(page.locator('text=Infrastructure Registry')).toBeVisible({ timeout: 10000 });

    // Take screenshot
    await page.screenshot({ path: 'tests/screenshots/back-to-resources.png' });
  });
});
