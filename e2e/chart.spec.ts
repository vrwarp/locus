import { test, expect } from '@playwright/test';

test('renders the Diagonal of Truth', async ({ page }) => {
  // Mock API
  await page.route('**/api/people/v2/people*', async route => {
    const json = {
      data: [
        {
          id: '1',
          type: 'Person',
          attributes: { name: 'Alice', birthdate: '2018-01-01', grade: 1 }
        },
        {
          id: '2',
          type: 'Person',
          attributes: { name: 'Bob', birthdate: '2010-01-01', grade: 9 }
        }
      ],
      meta: { total_count: 2, count: 2 }
    };
    await route.fulfill({ json });
  });

  await page.goto('/');

  // Login
  await page.fill('input[placeholder="Application ID"]', 'test');
  await page.fill('input[placeholder="Secret"]', 'test');

  // Navigate to Data Health
  await page.click('button:has-text("Data Health")');

  // Wait for chart
  const surface = page.locator('.recharts-surface');
  await expect(surface).toBeVisible();

  // Check for the Diagonal of Truth label
  await expect(page.locator('text=Diagonal of Truth')).toBeVisible();
});
