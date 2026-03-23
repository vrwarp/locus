const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('http://localhost:5173/');

  await page.getByPlaceholder('Application ID').fill('test_app_id');
  await page.getByPlaceholder('Secret').fill('test_secret');
  await page.keyboard.press('Enter');

  await page.waitForSelector('.auth-overlay', { state: 'hidden', timeout: 15000 });
  await page.getByText('Loading Data...').waitFor({ state: 'hidden', timeout: 15000 });

  await page.locator('button.nav-item', { hasText: 'Ghost Protocol' }).click();

  const analyzeBtn = page.getByRole('button', { name: 'Analyze Deeply' });
  await analyzeBtn.waitFor({ state: 'visible' });
  await analyzeBtn.click();

  const analyzingBtn = page.getByText('Analyzing...');
  await analyzingBtn.waitFor({ state: 'visible' });

  // wait to see how long it takes
  console.log('waiting for analyzing to finish...');
  await analyzingBtn.waitFor({ state: 'hidden', timeout: 30000 });
  console.log('done!');

  await browser.close();
})();
