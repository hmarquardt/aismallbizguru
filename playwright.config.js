import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests",
  use: {
    baseURL: process.env.SITE_URL || "http://127.0.0.1:8176",
    browserName: "chromium",
  },
  webServer: process.env.SITE_URL
    ? undefined
    : {
        command:
          "npx wrangler dev --config wrangler.json --local --ip 127.0.0.1 --port 8176",
        url: "http://127.0.0.1:8176",
        env: { WRANGLER_SEND_METRICS: "false" },
        reuseExistingServer: false,
      },
});
