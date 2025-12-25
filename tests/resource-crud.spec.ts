import { test, expect } from '@playwright/test';

test.describe('Resource Management CRUD', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto('http://localhost:3002');

    // Login with any email/password
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Wait for login to complete and navigate to resources
    await page.waitForTimeout(1000);
  });

  test('should display resource list (Read)', async ({ page }) => {
    // Click on Resources in navigation
    await page.click('text=Resources');
    await page.waitForTimeout(500);

    // Verify the Infrastructure Registry heading is visible
    await expect(page.locator('text=Infrastructure Registry')).toBeVisible();

    // Take screenshot
    await page.screenshot({ path: 'tests/screenshots/resource-list.png' });
  });

  test('should open create resource modal (Create)', async ({ page }) => {
    // Navigate to resources
    await page.click('text=Resources');
    await page.waitForTimeout(500);

    // Click Add resource button
    await page.click('text=Add resource');
    await page.waitForTimeout(300);

    // Verify modal is open (use heading specifically)
    await expect(page.getByRole('heading', { name: 'Add Resource' })).toBeVisible();

    // Fill the form
    await page.fill('input[placeholder="e.g. Core API Gateway"]', 'Test Resource');

    // Take screenshot
    await page.screenshot({ path: 'tests/screenshots/create-modal.png' });

    // Click Cancel to close
    await page.click('button:has-text("Cancel")');
  });

  test('should create a new resource', async ({ page }) => {
    // Navigate to resources
    await page.click('text=Resources');
    await page.waitForTimeout(500);

    // Click Add resource button
    await page.click('text=Add resource');
    await page.waitForTimeout(300);

    // Fill the form
    await page.fill('input[placeholder="e.g. Core API Gateway"]', 'Playwright Test Resource');
    await page.fill('textarea[placeholder="Resource description (optional)"]', 'Created by Playwright test');

    // Click Save
    await page.click('button:has-text("Save")');
    await page.waitForTimeout(1000);

    // Take screenshot
    await page.screenshot({ path: 'tests/screenshots/after-create.png' });
  });

  test('should search resources', async ({ page }) => {
    // Navigate to resources
    await page.click('text=Resources');
    await page.waitForTimeout(500);

    // Search for a resource
    await page.fill('input[placeholder="Search resources..."]', 'Test');
    await page.waitForTimeout(500);

    // Take screenshot
    await page.screenshot({ path: 'tests/screenshots/search-results.png' });
  });

  test('should open edit resource modal (Update)', async ({ page }) => {
    // Navigate to resources
    await page.click('text=Resources');
    await page.waitForTimeout(500);

    // Hover over first resource card to show action buttons
    const firstCard = page.locator('.grid > div').first();
    await firstCard.hover();
    await page.waitForTimeout(200);

    // Click the settings/edit button (second button in action group)
    const editButton = firstCard.locator('button').nth(1);
    await editButton.click();
    await page.waitForTimeout(300);

    // Verify edit modal is open
    await expect(page.getByRole('heading', { name: 'Edit Resource' })).toBeVisible();

    // Take screenshot
    await page.screenshot({ path: 'tests/screenshots/edit-modal.png' });

    // Click Cancel to close
    await page.click('button:has-text("Cancel")');
  });

  test('should open delete confirmation modal (Delete)', async ({ page }) => {
    // Navigate to resources
    await page.click('text=Resources');
    await page.waitForTimeout(500);

    // Hover over first resource card to show action buttons
    const firstCard = page.locator('.grid > div').first();
    await firstCard.hover();
    await page.waitForTimeout(200);

    // Click the delete button (third button in action group)
    const deleteButton = firstCard.locator('button').nth(2);
    await deleteButton.click();
    await page.waitForTimeout(300);

    // Verify delete confirmation modal is open
    await expect(page.getByRole('heading', { name: 'Confirm Delete' })).toBeVisible();

    // Take screenshot
    await page.screenshot({ path: 'tests/screenshots/delete-modal.png' });

    // Click Cancel to close
    await page.click('button:has-text("Cancel")');
  });

  test('should switch between list and card view', async ({ page }) => {
    // Navigate to resources
    await page.click('text=Resources');
    await page.waitForTimeout(500);

    // Take screenshot of card view (default)
    await page.screenshot({ path: 'tests/screenshots/card-view.png' });

    // Click list view button (first button in the view toggle group)
    const viewToggle = page.locator('.flex.bg-slate-950\\/80.rounded-lg.p-1');
    await viewToggle.locator('button').first().click();
    await page.waitForTimeout(300);

    // Verify list view is shown (table should be visible)
    await expect(page.locator('table')).toBeVisible();

    // Take screenshot of list view
    await page.screenshot({ path: 'tests/screenshots/list-view.png' });
  });

  test('should filter resources by type', async ({ page }) => {
    // Navigate to resources
    await page.click('text=Resources');
    await page.waitForTimeout(500);

    // Click on type filter dropdown
    await page.locator('.w-32').click();
    await page.waitForTimeout(200);

    // Take screenshot showing dropdown options
    await page.screenshot({ path: 'tests/screenshots/type-filter.png' });
  });

  test('should filter resources by status', async ({ page }) => {
    // Navigate to resources
    await page.click('text=Resources');
    await page.waitForTimeout(500);

    // Click on status filter dropdown
    await page.locator('.w-28').click();
    await page.waitForTimeout(200);

    // Take screenshot showing dropdown options
    await page.screenshot({ path: 'tests/screenshots/status-filter.png' });
  });
});
