import { defineConfig } from '@playwright/test'

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000'

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
  webServer: {
    command: process.env.CI ? 'npm run start' : 'npm run dev',
    url: baseURL,
    timeout: 120_000,
    reuseExistingServer: !process.env.CI,
  },
})
