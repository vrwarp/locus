import { test, expect } from '@playwright/test';

test('App loads and requests API Token if missing', async ({ page }) => {
  await page.goto('/');
  // Expect a prompt or input for the PAT since it's not in localStorage yet
  await expect(page.getByPlaceholder('Enter PCO Personal Access Token')).toBeVisible();
});
