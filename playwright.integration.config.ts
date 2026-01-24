import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  testMatch: '*.integration.spec.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5174',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      command: 'node mock-api/server.js',
      port: 3000,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'VITE_API_TARGET=http://localhost:3000 npm run dev -- --port 5174',
      port: 5174,
      reuseExistingServer: !process.env.CI,
    }
  ],
});
