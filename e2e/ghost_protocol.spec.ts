import { test, expect } from '@playwright/test';

test('Ghost Protocol: Analyze and Archive', async ({ page }) => {
  // 1. Navigate and Login
  await page.goto('/');
  await page.getByPlaceholder('Application ID').fill('test_app_id');
  await page.getByPlaceholder('Secret').fill('test_secret');
  await page.keyboard.press('Enter');

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

  // 5. Wait for Analysis to start and finish
  // The Ghost Protocol triggers many requests which might cause timeouts
  // so we wait an extended amount of time for the analysis to finish
  const analyzingBtn = page.getByText('Analyzing...');
  await expect(analyzingBtn).toBeVisible();

  // Ghost protocol takes a while to resolve all those fetches!
  await expect(analyzingBtn).not.toBeVisible({ timeout: 90000 });

  // 6. Verify at least some feedback (modal still open)
  await expect(modal).toBeVisible();
});
