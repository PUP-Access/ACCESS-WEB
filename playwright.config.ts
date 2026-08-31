import dotenv from "dotenv";
import { defineConfig, devices } from "@playwright/test";

dotenv.config({ path: ".env.local" });

export default defineConfig({
  testDir: "./tests/e2e",
  globalSetup: "./tests/setup/global-setup.ts",
  fullyParallel: false,
  workers: 1,
  // A small retry allowance smooths over next-dev's on-demand route
  // compilation occasionally pushing a first navigation past a tight
  // timeout — not masking real failures, since state changes are asserted
  // against the DB directly, not just the UI.
  retries: 1,
  reporter: "list",
  timeout: 60000,
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 60000,
  },
});
