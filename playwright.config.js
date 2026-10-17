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
          "python3 -m http.server 8176 --bind 127.0.0.1 --directory dist",
        url: "http://127.0.0.1:8176",
        reuseExistingServer: false,
      },
});
