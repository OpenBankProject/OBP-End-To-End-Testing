import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config();

const slowMo = Number(process.env.PW_SLOW_MO) || 0;

const rateLimitBypassToken = process.env.RATE_LIMIT_BYPASS_TOKEN;
const extraHTTPHeaders = rateLimitBypassToken
  ? { 'rate-limit-bypass-token': rateLimitBypassToken }
  : undefined;

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [
    ['html'],
    ['list'],
  ],
  timeout: 120_000,
  use: {
    navigationTimeout: 5_000,
    actionTimeout: 5_000,
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
    trace: 'on-first-retry',
    launchOptions: { slowMo },
    extraHTTPHeaders,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
