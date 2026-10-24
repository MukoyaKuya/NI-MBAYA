import { defineConfig } from '@playwright/test';
export default defineConfig({
  timeout: 90_000,
  testDir: './tests/browser',
  workers: 1,
  use: { channel: 'chromium', baseURL: 'http://127.0.0.1:5174', viewport: { width: 1280, height: 720 }, launchOptions: { args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl'] } },
  webServer: { command: 'npm run dev -- --port 5174 --strictPort', url: 'http://127.0.0.1:5174', env: { VITE_E2E: 'true', GITHUB_ACTIONS: '' }, reuseExistingServer: false },
});
