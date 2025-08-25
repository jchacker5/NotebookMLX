import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  retries: 0,
  reporter: [['html', { open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:4173',
    headless: true,
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npx serve dist -s -p 4173',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: true,
    stdout: 'ignore',
    stderr: 'pipe',
    timeout: 120000,
  },
})
