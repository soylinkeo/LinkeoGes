import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests', testMatch: '**/*.spec.js', workers: 1, timeout: 60000,
  use: { headless: true, channel: process.platform === 'win32' ? 'msedge' : undefined, screenshot: 'only-on-failure' },
  webServer: { command: 'node node_modules/vite/bin/vite.js --port 5174 --strictPort', url: 'http://localhost:5174', reuseExistingServer: false,
    env: { VITE_SUPABASE_URL: 'https://linkeoges-test.supabase.co', VITE_SUPABASE_ANON_KEY: 'public-test-key' } },
});
