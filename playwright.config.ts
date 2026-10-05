import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/browser",
  fullyParallel: false,
  workers: 1,
  timeout: 30000,
  use: {
    baseURL: process.env.TEST_BASE_URL ?? "http://127.0.0.1:3016",
    channel: "msedge",
    trace: "retain-on-failure",
  },
  reporter: [["list"], ["json", { outputFile: "test-results/smoke.json" }]],
  projects: [
    {
      name: "desktop",
      use: {
        ...devices["Desktop Edge"],
        viewport: { width: 1440, height: 1050 },
      },
    },
  ],
});
