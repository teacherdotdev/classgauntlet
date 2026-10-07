import { defineConfig } from '@playwright/test';

// The end-to-end test plays a real game between separate browser profiles,
// through the real teacher.dev matchmaking server.
export default defineConfig({
  testDir: 'tests',
  timeout: 120_000,
  use: { baseURL: 'http://localhost:8137' },
  webServer: { command: 'bunx vite dev --port 8137', url: 'http://localhost:8137', reuseExistingServer: true },
});
