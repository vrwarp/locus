import { test, expect } from '@playwright/test';

test('App loads and requests API Token if missing', async ({ page }) => {
  await page.goto('/');
  // Expect prompts for Application ID and Secret
  await expect(page.getByPlaceholder('Application ID')).toBeVisible();
  await expect(page.getByPlaceholder('Secret')).toBeVisible();
});
