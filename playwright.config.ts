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
        ERP_STOREFRONT_API_URL: "http://127.0.0.1:4010/api/v1/storefront",
        NEXT_PUBLIC_SITE_URL: "http://127.0.0.1:3100",
        // A fake Google, served by the mock ERP.
        GOOGLE_CLIENT_ID: "e2e-google-client",
        GOOGLE_CLIENT_SECRET: "e2e-google-secret",
        GOOGLE_AUTHORIZE_URL: "http://127.0.0.1:4010/__google/authorize",
        GOOGLE_TOKEN_URL: "http://127.0.0.1:4010/__google/token",
        // Off by default. Run with CUSTOMER_REVIEWS_LIVE=true for the launched behaviour.
        CUSTOMER_REVIEWS_LIVE: process.env.CUSTOMER_REVIEWS_LIVE ?? "false",
      },
    },
  ],
});
