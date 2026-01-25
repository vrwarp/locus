import { test, expect } from '@playwright/test';

test('Ghost Protocol integration with Giving and Groups API', async ({ page }) => {
  // 1. Navigate
  await page.goto('/');

  // 2. Login
  await page.getByPlaceholder('Application ID').fill('test_app_id');
  await page.getByPlaceholder('Secret').fill('test_secret');

  // 3. Wait for data
  await expect(page.locator('.recharts-surface')).toBeVisible({ timeout: 15000 });

  // 4. Open Ghost Protocol
  await page.click('text=👻 Ghost Protocol');
  await expect(page.locator('h2:has-text("Ghost Protocol")')).toBeVisible();

  // 5. Verify Analyze button exists
  const analyzeBtn = page.locator('button:has-text("Analyze Candidates")');
  await expect(analyzeBtn).toBeVisible();

  // 6. Setup request watchers to verify backend integration
  // We check for RESPONSE to ensure the server actually handled it successfully (200 OK)
  const donationResponsePromise = page.waitForResponse(response =>
    response.url().includes('/api/giving/v2/donations') && response.status() === 200
  );
  const groupResponsePromise = page.waitForResponse(response =>
    response.url().includes('/api/groups/v2/group_memberships') && response.status() === 200
  );

  // 7. Click Analyze
  await analyzeBtn.click();

  // 8. Wait for responses
  await Promise.all([
    donationResponsePromise,
    groupResponsePromise
  ]);

  // 9. Wait for UI to settle (button re-enables)
  await expect(analyzeBtn).toBeEnabled();

  // 10. Optional: Check if we can see any tags.
  // Since data is random, we just log if we found any, but won't fail if not.
  const donorTags = await page.locator('.tag-donor').count();
  const groupTags = await page.locator('.tag-group').count();
  console.log(`Found ${donorTags} donor tags and ${groupTags} group tags in the list.`);
});
