import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/pwa',
  outputDir: './test-results/pwa',
  use: {
    browserName: 'chromium',
    baseURL: 'http://127.0.0.1:4175',
    timezoneId: 'Europe/Madrid',
    serviceWorkers: 'allow',
  },
  webServer: {
    command: 'npm run preview -- --host 127.0.0.1 --port 4175 --strictPort',
    url: 'http://127.0.0.1:4175',
    reuseExistingServer: false,
  },
});
