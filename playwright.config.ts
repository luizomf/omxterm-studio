import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "tests/browser",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  workers: 2,
  use: {
    baseURL:
      process.env.STUDIO_BASE_URL || "http://127.0.0.1:4175/omxterm-studio/",
    browserName: "chromium",
    channel: process.env.CI ? undefined : "chrome",
    viewport: { width: 1440, height: 960 },
    trace: "retain-on-failure",
  },
  webServer: process.env.CI
    ? {
        command: "npm run preview -- --port 4175 --strictPort",
        url: "http://127.0.0.1:4175/omxterm-studio/",
        reuseExistingServer: false,
      }
    : undefined,
});
