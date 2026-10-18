import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const STORAGE_KEY = "aismallbizguru:getting-started:v1";

for (const width of [320, 390, 768, 1440]) {
  test(`usable getting-started guide at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    const response = await page.goto("./getting-started");
    expect(response.status()).toBe(200);
    const heading = page.getByRole("heading", { level: 1 });
    await expect(heading).toContainText("Your business.");
    await expect(heading).toContainText("Your accounts.");
    await expect(page.locator("[data-progress-text]")).toContainText("0 of 22");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    for (const section of ["domain", "accounts", "services", "backups", "developers"]) {
      await expect(page.locator(`#${section}`)).toHaveCount(1);
    }
    if (width <= 900) {
      const toggle = page.getByRole("button", { name: "Menu" });
      await expect(page.getByRole("navigation")).toBeHidden();
      await toggle.click();
      await expect(toggle).toHaveAttribute("aria-expanded", "true");
      await expect(page.getByRole("navigation")).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(toggle).toBeFocused();
      await expect(toggle).toHaveAttribute("aria-expanded", "false");
    } else {
      await expect(page.getByRole("navigation")).toBeVisible();
      await expect(page.getByRole("link", { name: "Getting started" })).toHaveAttribute("aria-current", "page");
    }
    const details = page.locator("details.setup-guide").first();
    await expect(details).not.toHaveAttribute("open", "");
    await details.locator("summary").click();
    await expect(details).toHaveAttribute("open", "");
    await expect(details.locator(".guide-body")).toBeVisible();
    await details.locator("summary").click();
    await expect(details).not.toHaveAttribute("open", "");
    await page.getByRole("checkbox", { name: /I own the domain/ }).check();
    await expect(page.locator("[data-progress-text]")).toContainText("1 of 22");
    const accessibility = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(accessibility.violations).toEqual([]);
    expect(errors).toEqual([]);
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(heading).toBeInViewport();
    await page.screenshot({
      path: `test-results/getting-started-${width}.png`,
      fullPage: true,
    });
  });
}

test("progress persists, optional groups can be skipped, and reset clears it", async ({ page }) => {
  await page.goto("./getting-started");
  const required = page.locator("input[data-step]:not([data-group])");
  await expect(required).toHaveCount(17);
  for (let index = 0; index < 17; index += 1) await required.nth(index).check();
  await expect(page.locator("[data-progress-text]")).toContainText("17 of 22");

  await page.getByRole("checkbox", { name: /Not applicable to this project/ }).check();
  for (const input of await page.locator('input[data-group="openrouter"]').all()) {
    await expect(input).toBeDisabled();
  }
  await expect(page.locator("[data-progress-text]")).toContainText("17 of 18");
  await expect(page.locator("[data-progress-text]")).toContainText(
    "4 optional steps marked not applicable",
  );
  await page.getByRole("checkbox", { name: /No additional services apply/ }).check();
  await expect(page.locator("[data-progress-text]")).toContainText("17 of 17");
  await expect(page.locator("[data-progress-text]")).toContainText(
    "5 optional steps marked not applicable",
  );
  await expect(page.locator('[data-checklist-status="domain"]')).toHaveText("Complete");
  await expect(page.locator('[data-checklist-status="openrouter"]')).toHaveText("Skipped");
  await expect(page.locator('[data-checklist-status="services"]')).toHaveText("Skipped");

  await page.reload();
  await expect(page.locator("[data-progress-text]")).toContainText("17 of 17");
  await expect(page.locator("[data-progress-text]")).toContainText(
    "5 optional steps marked not applicable",
  );
  await expect(page.locator('input[data-step="domain-owned"]')).toBeChecked();
  await expect(page.getByRole("checkbox", { name: /Not applicable to this project/ })).toBeChecked();
  await expect(page.locator('input[data-group="openrouter"]').first()).toBeDisabled();

  const stored = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)), STORAGE_KEY);
  expect(Object.keys(stored).sort()).toEqual(["checks", "skipped", "version"]);
  expect(stored.version).toBe(1);
  expect(JSON.stringify(stored)).not.toMatch(/@|password|token/i);

  page.once("dialog", async (dialog) => {
    expect(dialog.message()).toContain("Reset");
    await dialog.accept();
  });
  await page.getByRole("button", { name: "Reset progress" }).click();
  await expect(page.locator("[data-progress-text]")).toContainText("0 of 22");
  await expect(page.locator('input[data-step="domain-owned"]')).not.toBeChecked();
  await expect(page.getByRole("checkbox", { name: /Not applicable to this project/ })).not.toBeChecked();
  await page.reload();
  await expect(page.locator("[data-progress-text]")).toContainText("0 of 22");
});

test("copy and print summaries reflect checklist state", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.addInitScript(() => {
    window.__printCalls = 0;
    window.print = () => {
      window.__printCalls += 1;
    };
  });
  await page.goto("./getting-started");
  await page.getByRole("checkbox", { name: /I own the domain/ }).check();
  await page.getByRole("checkbox", { name: /business email I control/ }).check();
  await page.getByRole("checkbox", { name: /Not applicable to this project/ }).check();

  await page.getByRole("button", { name: "Copy summary" }).click();
  await expect(page.locator("[data-status]")).toContainText("copied");
  const clipboard = await page.evaluate(() => navigator.clipboard.readText());
  expect(clipboard).toContain("AI Small Business Guru — Getting started");
  expect(clipboard).toContain("[x] I own the domain");
  expect(clipboard).toContain("[ ] The renewal date");
  expect(clipboard).toContain("OpenRouter checklist");
  expect(clipboard).toContain("[not applicable]");
  expect(clipboard).toContain("checklist status only");

  await page.getByRole("button", { name: "Print summary" }).click();
  await expect.poll(() => page.evaluate(() => window.__printCalls)).toBe(1);
  await expect(page.locator("[data-summary-text]")).toContainText(
    "OpenRouter checklist",
  );

  await page.emulateMedia({ media: "print" });
  await expect(page.locator(".print-summary")).toBeVisible();
  await expect(page.locator(".site-header")).toBeHidden();
  await expect(page.locator(".progress-actions")).toBeHidden();
  await page.emulateMedia({ media: "screen" });
});

test("checklist and optional controls work from the keyboard", async ({ page }) => {
  await page.goto("./getting-started");
  const first = page.getByRole("checkbox", { name: /I own the domain/ });
  await first.focus();
  await page.keyboard.press("Space");
  await expect(first).toBeChecked();
  await expect(page.locator("[data-progress-text]")).toContainText("1 of 22");

  const details = page.locator("details.setup-guide").first();
  await details.locator("summary").focus();
  await page.keyboard.press("Enter");
  await expect(details).toHaveAttribute("open", "");

  const skip = page.getByRole("checkbox", { name: /Not applicable to this project/ });
  await skip.focus();
  await page.keyboard.press("Space");
  await expect(skip).toBeChecked();
  await expect(page.locator('input[data-group="openrouter"]').first()).toBeDisabled();
  await page.keyboard.press("Space");
  await expect(skip).not.toBeChecked();
  await expect(page.locator('input[data-group="openrouter"]').first()).toBeEnabled();
});

test("the guide remains informative and usable without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();
  const response = await page.goto(process.env.SITE_URL || "http://127.0.0.1:8176/getting-started");
  expect(response.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Your accounts.");
  await expect(page.getByRole("navigation")).toBeVisible();
  await expect(page.locator(".progress-actions")).toBeHidden();
  await expect(page.locator("noscript")).toHaveCount(1);
  const details = page.locator("details.setup-guide").first();
  await details.locator("summary").click();
  await expect(details).toHaveAttribute("open", "");
  const checkbox = page.getByRole("checkbox", { name: /I own the domain/ });
  await checkbox.check();
  await expect(checkbox).toBeChecked();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await context.close();
});

test("metadata, internal links, provider links, and privacy boundaries", async ({
  page,
  request,
}) => {
  const externalRequests = [];
  page.on("request", (entry) => externalRequests.push(entry.url()));
  const response = await page.goto("./getting-started");
  expect(response.status()).toBe(200);
  await expect(page).toHaveTitle("Getting Started | AI Small Business Guru");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    "https://aismallbizguru.com/getting-started",
  );
  await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
  for (const name of ["og:title", "og:description", "og:type", "og:url"]) {
    await expect(page.locator(`meta[property="${name}"]`)).toHaveAttribute(
      "content",
      /.+/,
    );
  }
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
    "content",
    "https://aismallbizguru.com/getting-started",
  );

  const pageOrigin = new URL(page.url()).origin;
  expect(externalRequests.every((url) => new URL(url).origin === pageOrigin)).toBe(true);
  expect(await page.locator("form").count()).toBe(0);
  const inputs = await page.locator("input").evaluateAll((items) =>
    items.map((input) => ({ type: input.type, name: input.name, autocomplete: input.autocomplete })),
  );
  expect(inputs.every((input) => input.type === "checkbox")).toBe(true);
  expect(inputs.every((input) => !/password|email|tel|cc-/.test(`${input.name} ${input.autocomplete}`))).toBe(true);
  expect(await page.evaluate(() => document.cookie)).toBe("");
  expect(
    await page.evaluate(() => {
      const ids = [...document.querySelectorAll("[id]")].map((node) => node.id);
      return ids.length === new Set(ids).size;
    }),
  ).toBe(true);

  const hashLinks = await page
    .locator('a[href^="#"]')
    .evaluateAll((items) => items.map((link) => link.getAttribute("href")));
  for (const hash of new Set(hashLinks)) {
    expect(await page.locator(hash).count()).toBe(1);
  }
  const internalPaths = await page
    .locator('a[href^="/"]')
    .evaluateAll((items) =>
      items.map((link) => new URL(link.href).pathname),
    );
  for (const path of new Set(internalPaths)) {
    expect((await request.get(path)).status()).toBe(200);
  }

  const externalLinks = await page
    .locator('a[href^="https://"]')
    .evaluateAll((items) => items.map((link) => link.href));
  expect(externalLinks.length).toBeGreaterThanOrEqual(20);
  const allowedHosts = new Set([
    "github.com",
    "docs.github.com",
    "dash.cloudflare.com",
    "developers.cloudflare.com",
    "www.cloudflare.com",
    "openrouter.ai",
    "dashboard.stripe.com",
    "squareup.com",
    "workspace.google.com",
    "www.microsoft.com",
    "calendly.com",
    "www.hubspot.com",
    "www.twilio.com",
  ]);
  for (const link of externalLinks) {
    expect(allowedHosts.has(new URL(link).hostname)).toBe(true);
  }
  for (const required of [
    "https://github.com/signup",
    "https://dash.cloudflare.com/sign-up",
    "https://developers.cloudflare.com/workers/platform/pricing/",
    "https://openrouter.ai/docs/guides/best-practices/spend-controls",
  ]) {
    expect(externalLinks).toContain(required);
  }

  const sitemap = await (await request.get("./sitemap.xml")).text();
  expect(sitemap).toContain("https://aismallbizguru.com/getting-started");
});

if (!process.env.SITE_URL) {
  test("www redirect keeps the guide path and query", async ({ request }) => {
    const response = await request.get("/getting-started?from=www&x=a%2Fb", {
      headers: { Host: "www.aismallbizguru.com" },
      maxRedirects: 0,
    });
    expect(response.status()).toBe(308);
    expect(response.headers().location).toBe(
      "https://aismallbizguru.com/getting-started?from=www&x=a%2Fb",
    );
  });
}
