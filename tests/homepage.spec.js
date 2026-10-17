import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
for (const width of [320, 390, 768, 1440]) {
  test(`usable homepage at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    const response = await page.goto("./");
    expect(response.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Better Tools.Less Busywork.All Yours.",
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    if (width < 701) {
      const toggle = page.getByRole("button", { name: "Menu" });
      await expect(page.getByRole("navigation")).toBeHidden();
      await toggle.click();
      await expect(toggle).toHaveAttribute("aria-expanded", "true");
      await page.keyboard.press("Escape");
      await expect(toggle).toBeFocused();
      await expect(toggle).toHaveAttribute("aria-expanded", "false");
      await toggle.click();
    }
    await page
      .getByRole("navigation")
      .getByRole("link", { name: "How we work" })
      .click();
    await expect(page).toHaveURL(/#how$/);
    if (width < 701) await expect(page.getByRole("navigation")).toBeHidden();
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page
      .getByRole("link", { name: "Let's Talk About Your Project" })
      .click();
    await expect(page).toHaveURL(/#contact$/);
    await expect(
      page.getByRole("heading", { name: "What would make your work easier?" }),
    ).toBeInViewport();
    await expect(
      page.getByRole("link", { name: "Email Hank about your project" }),
    ).toHaveAttribute("href", /^mailto:hank@aismallbizguru.com\?/);
    const links = await page
      .locator('a[href^="#"]')
      .evaluateAll((items) => items.map((a) => a.hash));
    for (const hash of links) expect(await page.locator(hash).count()).toBe(1);
    await expect(page.locator('a[href="/getting-started"]')).toHaveCount(0);
    const accessibility = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(accessibility.violations).toEqual([]);
    expect(errors).toEqual([]);
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(page.getByRole("heading", { level: 1 })).toBeInViewport();
    await page.screenshot({
      path: `test-results/homepage-${width}.png`,
      fullPage: true,
    });
  });
}
test("metadata, assets and published revision", async ({ page, request }) => {
  await page.goto("./");
  await expect(page).toHaveTitle(
    "AI Small Business Guru | Better Tools. Less Busywork.",
  );
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    "https://aismallbizguru.com/",
  );
  for (const name of ["og:title", "og:description", "og:type", "og:url"]) {
    await expect(page.locator(`meta[property="${name}"]`)).toHaveAttribute(
      "content",
      /.+/,
    );
  }
  for (const asset of [
    "styles.css",
    "site.js",
    "favicon.svg",
    "robots.txt",
    "sitemap.xml",
    "version.json",
  ]) {
    expect((await request.get(`./${asset}`)).status()).toBe(200);
  }
  const version = await (await request.get("./version.json")).json();
  expect(version.commit).toMatch(/^[a-f0-9]{40}$/);
  if (process.env.EXPECTED_COMMIT)
    expect(version.commit).toBe(process.env.EXPECTED_COMMIT);
  expect((await request.get("./getting-started")).status()).toBe(404);
});
test("navigation works without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();
  await page.goto(process.env.SITE_URL || "http://127.0.0.1:8176");
  await expect(page.getByRole("navigation")).toBeVisible();
  await page
    .getByRole("navigation")
    .getByRole("link", { name: "Your ownership" })
    .click();
  await expect(page).toHaveURL(/#ownership$/);
  await context.close();
});

if (!process.env.SITE_URL) {
  test("Cloudflare runtime redirects www before serving static assets", async ({ request }) => {
    const response = await request.get("/styles.css?q=a%2Fb&q=&flag", {
      headers: { Host: "www.aismallbizguru.com" },
      maxRedirects: 0,
    });
    expect(response.status()).toBe(308);
    expect(response.headers().location).toBe("https://aismallbizguru.com/styles.css?q=a%2Fb&q=&flag");
  });
}
