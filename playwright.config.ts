import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:3100",
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"], browserName: "chromium" } },
  ],
  webServer: [
    {
      command: "node e2e/mock-erp.mjs",
      port: 4010,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: "npm run dev -- --hostname 127.0.0.1 --port 3100",
      port: 3100,
      reuseExistingServer: !process.env.CI,
      env: {
        ERP_CATALOG_API_URL: "http://127.0.0.1:4010/api/v1/catalog",
        ERP_CATALOG_API_TOKEN: "e2e-token",
        NEXT_PUBLIC_SITE_URL: "http://127.0.0.1:3100",
      },
    },
  ],
});
