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

    // Verify URL changed to /resources
    await expect(page).toHaveURL(/\/resources$/);

    // Take screenshot of resources page
    await page.screenshot({ path: 'tests/screenshots/before-click-card.png' });

    // Click on the first resource card
    const firstCard = page.locator('.grid > div').first();
    await firstCard.click();
    await page.waitForTimeout(1000);

    // Verify URL changed to /resources/:id pattern
    await expect(page).toHaveURL(/\/resources\/\d+/);

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
    await expect(page).toHaveURL(/\/resources\/\d+/);

    // Click Resources nav link to go back
    await page.click('text=Resources');
    await page.waitForTimeout(1000);

    // Verify we're back on resources page
    await expect(page.locator('text=Infrastructure Registry')).toBeVisible({ timeout: 10000 });
    await expect(page).toHaveURL(/\/resources$/);

    // Take screenshot
    await page.screenshot({ path: 'tests/screenshots/back-to-resources.png' });
  });

  test('should support browser back/forward navigation', async ({ page }) => {
    // Navigate to resources
    await page.click('text=Resources');
    await page.waitForTimeout(500);
    await expect(page).toHaveURL(/\/resources$/);

    // Click on the first resource card
    const firstCard = page.locator('.grid > div').first();
    await firstCard.click();
    await page.waitForTimeout(1000);
    await expect(page).toHaveURL(/\/resources\/\d+/);

    // Use browser back button
    await page.goBack();
    await page.waitForTimeout(500);

    // Verify we're back on resources list
    await expect(page).toHaveURL(/\/resources$/);
    await expect(page.locator('text=Infrastructure Registry')).toBeVisible({ timeout: 10000 });

    // Use browser forward button
    await page.goForward();
    await page.waitForTimeout(500);

    // Verify we're back on detail page
    await expect(page).toHaveURL(/\/resources\/\d+/);
    await expect(page.getByRole('heading', { name: 'Quick Actions' })).toBeVisible({ timeout: 10000 });
  });

  test('should support direct URL access (deep linking)', async ({ page }) => {
    // First navigate normally to get a valid resource ID
    await page.click('text=Resources');
    await page.waitForTimeout(500);

    const firstCard = page.locator('.grid > div').first();
    await firstCard.click();
    await page.waitForTimeout(1000);

    // Get the current URL
    const detailUrl = page.url();

    // Navigate away
    await page.click('text=Dashboard');
    await page.waitForTimeout(500);
    await expect(page).toHaveURL(/\/$/);

    // Navigate directly to the detail URL
    await page.goto(detailUrl);
    await page.waitForTimeout(1000);

    // Verify direct access works
    await expect(page.getByRole('heading', { name: 'Quick Actions' })).toBeVisible({ timeout: 10000 });
  });
});
