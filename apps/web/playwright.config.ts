import { defineConfig } from '@playwright/test';

const WEB_PORT = 3100;
const API_PORT = 4000;
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY ?? 'local-dev-internal-key-0123456789abcdef';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  // Browsers are CPU/RAM hungry; override with PW_WORKERS on small machines (e.g. PW_WORKERS=1).
  workers: Number(process.env.PW_WORKERS) || (process.env.CI ? 2 : 3),
  reporter: [['list']],
  timeout: 60_000,
  // The dev server compiles routes on first hit, so allow generous time for assertions.
  expect: { timeout: 15_000 },
  use: {
    baseURL: `http://localhost:${WEB_PORT}`,
    // Use an installed browser locally (PW_CHANNEL=msedge|chrome); CI runs `npx playwright install chromium`.
    channel: process.env.PW_CHANNEL || undefined,
    trace: 'retain-on-failure',
  },
  webServer: [
    {
      // The API needs a migrated + seeded database (DATABASE_URL). Build it first: `npm run build -w @umrah/api`.
      command: 'node ../api/dist/main.js',
      url: `http://localhost:${API_PORT}/api/v1/health`,
      reuseExistingServer: true,
      timeout: 60_000,
      // The browser posts enquiry forms straight to the API, so the web origin must be allowed by CORS.
      env: { INTERNAL_API_KEY, CORS_ORIGINS: `http://localhost:${WEB_PORT}` },
    },
    {
      command: `npx next dev -p ${WEB_PORT}`,
      url: `http://localhost:${WEB_PORT}`,
      reuseExistingServer: true,
      timeout: 120_000,
      env: { INTERNAL_API_KEY, API_INTERNAL_URL: `http://localhost:${API_PORT}/api/v1`, NEXT_PUBLIC_API_URL: `http://localhost:${API_PORT}/api/v1` },
    },
  ],
});
