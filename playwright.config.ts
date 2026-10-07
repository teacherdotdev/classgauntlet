import { defineConfig } from '@playwright/test';

// The end-to-end test plays a real game between separate browser profiles,
// through the real teacher.dev matchmaking server. Set BASE_URL to test a
// deployed copy, e.g. BASE_URL=https://one-vs-100.teacher.dev bun run test:e2e
const deployed = process.env.BASE_URL;

export default defineConfig({
  testDir: 'tests',
  timeout: 120_000,
  use: { baseURL: deployed ?? 'http://localhost:8137' },
  webServer: deployed
    ? undefined
    : { command: 'bunx vite dev --port 8137', url: 'http://localhost:8137', reuseExistingServer: true },
});
