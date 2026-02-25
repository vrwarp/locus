import { test, expect } from '@playwright/test';

test('Ghost Protocol: Analyze and Archive', async ({ page }) => {
  // 1. Navigate and Login
  await page.goto('/');
  await page.getByPlaceholder('Application ID').fill('test_app_id');
  await page.getByPlaceholder('Secret').fill('test_secret');

  // 2. Wait for data loading
  await expect(page.getByText('Loading Data...')).not.toBeVisible({ timeout: 15000 });

  // 3. Open Ghost Protocol
  await page.locator('button.nav-item', { hasText: 'Ghost Protocol' }).click();
  const modal = page.locator('.modal-content');
  await expect(modal).toBeVisible();
  await expect(modal.locator('h2')).toHaveText('Ghost Protocol');

  // 4. Analyze
  const analyzeBtn = page.getByRole('button', { name: 'Analyze Deeply' });
  await expect(analyzeBtn).toBeVisible();
  await analyzeBtn.click();

  // 5. Wait for Analysis
  await expect(page.getByText('Analyzing...')).not.toBeVisible({ timeout: 10000 });

  // 6. Verify at least some feedback (modal still open)
  await expect(modal).toBeVisible();
});
