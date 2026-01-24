import { test, expect } from '@playwright/test';

test('Full flow with simulator: Login, View Data, Smart Fix', async ({ page }) => {
  // 1. Navigate
  await page.goto('/');

  // 2. Login
  // Fills in dummy credentials. The app debounces input and then triggers the query.
  await page.getByPlaceholder('Application ID').fill('test_app_id');
  await page.getByPlaceholder('Secret').fill('test_secret');

  // 3. Wait for data
  // The chart surface should appear once data is loaded.
  await expect(page.locator('.recharts-surface')).toBeVisible({ timeout: 15000 });

  // 4. Interact with a data point
  // We select the first available point on the scatter plot.
  const point = page.locator('.recharts-scatter-symbol').first();
  await expect(point).toBeVisible();
  // Force click to ensure we hit the SVG element even if it's small
  await point.click({ force: true });

  // 5. Verify Modal opens
  const modal = page.getByRole('dialog');
  await expect(modal).toBeVisible();
  await expect(modal.locator('h2')).toContainText('Smart Fix');

  // 6. Perform Smart Fix
  const fixButton = page.locator('.btn-fix');
  await expect(fixButton).toBeVisible();
  await fixButton.click();

  // 7. Verify Undo Toast
  const toast = page.locator('.undo-toast');
  await expect(toast).toBeVisible();
  await expect(toast).toContainText('Updated grade for');

  // Wait for a moment to ensure no crashes/errors occur immediately after
  await page.waitForTimeout(1000);
});
