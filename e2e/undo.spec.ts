import { test, expect } from '@playwright/test';

test('undo flow works as expected', async ({ page }) => {
  // Mock API
  await page.route('**/api/people/v2/people*', async route => {
    if (route.request().method() === 'GET') {
        const json = {
          data: [
            {
              id: '1',
              type: 'Person',
              attributes: { name: 'Undo Alice', birthdate: '2015-01-01', grade: 3 }
              // Age ~9. Expected Grade 4. Delta -1.
            }
          ],
          meta: { total_count: 1, count: 1 }
        };
        await route.fulfill({ json });
    } else {
        await route.continue();
    }
  });

  // Mock PATCH
  let patchCalled = false;
  await page.route('**/api/people/v2/people/1', async route => {
      if (route.request().method() === 'PATCH') {
          patchCalled = true;
          // Verify body
          const postData = route.request().postDataJSON();
          if (postData.data.attributes.grade === 4) {
             await route.fulfill({ json: { data: { id: '1', attributes: { grade: 4 } } } });
          } else {
             await route.abort();
          }
      } else {
          await route.continue();
      }
  });

  await page.goto('/');

  // Login
  await page.fill('input[placeholder="Application ID"]', 'test');
  await page.fill('input[placeholder="Secret"]', 'test');

  // Wait for chart point (Recharts makes this tricky, but we can look for the dot)
  // The points are rendered as circles.
  await page.waitForSelector('.recharts-scatter-symbol');
  await page.locator('.recharts-scatter-symbol').first().click();

  // Modal should open
  await expect(page.locator('text=Smart Fix')).toBeVisible();
  await expect(page.locator('text=Undo Alice')).toBeVisible();

  // Click Fix
  await page.click('button:has-text("Fix Grade")');

  // Modal closes
  await expect(page.locator('text=Smart Fix')).not.toBeVisible();

  // Toast appears
  await expect(page.locator('.undo-toast')).toBeVisible();
  await expect(page.locator('text=Updated grade for Undo Alice')).toBeVisible();

  // Click Undo
  await page.click('button:has-text("Undo")');

  // Toast disappears
  await expect(page.locator('.undo-toast')).not.toBeVisible();

  // Verify PATCH was not called
  expect(patchCalled).toBe(false);

  // --- Test Commit ---

  // Open modal again
  await page.locator('.recharts-scatter-symbol').first().click();
  await page.click('button:has-text("Fix Grade")');

  // Wait for toast
  await expect(page.locator('.undo-toast')).toBeVisible();

  // Wait for timeout (5s + buffer)
  await page.waitForTimeout(6000);

  // Verify PATCH called
  expect(patchCalled).toBe(true);

  // Toast should be gone
  await expect(page.locator('.undo-toast')).not.toBeVisible();
});
