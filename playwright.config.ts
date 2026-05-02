import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  timeout: 120_000,
  fullyParallel: true,
  use: {
    baseURL: "http://127.0.0.1:3005",
    viewport: { width: 1280, height: 720 }
  },
  webServer: {
    command: "npx next start -p 3005",
    url: "http://127.0.0.1:3005",
    reuseExistingServer: false,
    timeout: 120_000,
    stdout: "pipe",
    stderr: "pipe"
  }
});
