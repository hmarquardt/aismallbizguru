import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const projects = [
  {
    slug: "work-index",
    path: "/work",
    heading: "Real products.",
    canonical: "https://aismallbizguru.com/work",
  },
  {
    slug: "worth-looking-up",
    path: "/work/worth-looking-up",
    heading: "A sky guide that",
    canonical: "https://aismallbizguru.com/work/worth-looking-up",
  },
  {
    slug: "fruiting-forecast",
    path: "/work/fruiting-forecast",
    heading: "A field planner for",
    canonical: "https://aismallbizguru.com/work/fruiting-forecast",
  },
];

for (const width of [320, 390, 768, 1440]) {
  test(`portfolio pages are usable at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    for (const project of projects) {
      const response = await page.goto(`.${project.path}`);
      expect(response.status()).toBe(200);
      await expect(page.getByRole("heading", { level: 1 })).toContainText(
        project.heading,
      );
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
        "href",
        project.canonical,
      );
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      const pendingImages = () =>
        page
          .locator("main img")
          .evaluateAll((images) =>
            images
              .filter((image) => !image.complete || image.naturalWidth === 0)
              .map((image) => image.getAttribute("src")),
          );
      let brokenImages = await pendingImages();
      if (brokenImages.length) {
        // Lazy images below the fold have not been requested yet.
        await page.evaluate(() =>
          window.scrollTo(0, document.body.scrollHeight),
        );
        await page.waitForFunction(() =>
          [...document.images].every(
            (image) => image.complete && image.naturalWidth > 0,
          ),
        );
        brokenImages = await pendingImages();
      }
      expect(brokenImages).toEqual([]);
      const accessibility = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze();
      expect(accessibility.violations).toEqual([]);
      await page.screenshot({
        path: `test-results/${project.slug}-${width}.png`,
        fullPage: true,
      });
    }
    expect(errors).toEqual([]);
  });
}

test("the portfolio links the homepage to both case studies", async ({
  page,
  request,
}) => {
  await page.goto("./");
  await page
    .getByRole("navigation")
    .getByRole("link", { name: "Our work" })
    .click();
  await expect(page).toHaveURL(/\/work$/);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    "https://aismallbizguru.com/work",
  );
  await page.getByRole("link", { name: "Worth Looking Up", exact: true }).click();
  await expect(page).toHaveURL(/\/work\/worth-looking-up$/);
  await page
    .getByRole("link", { name: /Fruiting Forecast/ })
    .last()
    .click();
  await expect(page).toHaveURL(/\/work\/fruiting-forecast$/);
  await page.getByRole("link", { name: /All our work/ }).click();
  await expect(page).toHaveURL(/\/work$/);
  for (const asset of [
    "images/work/worth-looking-up-desktop.jpg",
    "images/work/worth-looking-up-mobile.jpg",
    "images/work/fruiting-forecast-desktop.jpg",
    "images/work/fruiting-forecast-results.jpg",
    "images/work/fruiting-forecast-mobile.jpg",
  ]) {
    expect((await request.get(`./${asset}`)).status()).toBe(200);
  }
});

test("case studies link out to the live products", async ({ page }) => {
  await page.goto("./work/worth-looking-up");
  await expect(
    page.getByRole("link", { name: /Visit worthlookingup\.com/ }),
  ).toHaveAttribute("href", "https://worthlookingup.com/");
  await page.goto("./work/fruiting-forecast");
  await expect(
    page.getByRole("link", { name: /Visit fruitingforecast\.com/ }),
  ).toHaveAttribute("href", "https://fruitingforecast.com/");
});

for (const project of projects.slice(1)) {
  test(`${project.slug} leads readers to the existing project inquiry`, async ({ page }) => {
    await page.goto(`.${project.path}`);
    await page.getByRole("link", { name: "Start a project inquiry" }).click();
    await expect(page).toHaveURL(/\/contact$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Tell us what you're trying to accomplish.",
    );
    await expect(page.locator("#contact-form")).toBeVisible();
  });
}
