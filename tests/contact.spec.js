import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const validInquiry = {
  name: "Alex Rivera",
  email: "alex@example.com",
  business: "Rivera Bakery",
  category: "automation",
  description: "We retype every wholesale order into a spreadsheet and want to stop.",
};

async function prepare(page) {
  await page.addInitScript(() => {
    window.turnstile = {
      render(_element, options) {
        setTimeout(() => options.callback("XXXX.DUMMY.TOKEN.XXXX"), 0);
        return "test-widget";
      },
      getResponse() {
        return "XXXX.DUMMY.TOKEN.XXXX";
      },
      reset() {},
    };
  });
}

async function fillForm(page) {
  await page.getByLabel("Your name").fill(validInquiry.name);
  await page.getByLabel("Email address").fill(validInquiry.email);
  await page.getByLabel(/Business name/).fill(validInquiry.business);
  await page.getByLabel("What can we help with?").selectOption("automation");
  await page.getByLabel("Tell us about your project").fill(validInquiry.description);
}

test("contact page presents a complete, accessible inquiry form", async ({ page }) => {
  await prepare(page);
  const response = await page.goto("./contact");
  expect(response.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Tell us what you're trying to accomplish.",
  );
  await expect(page.getByLabel("Your name")).toBeVisible();
  await expect(page.getByLabel("Email address")).toBeVisible();
  await expect(page.getByLabel(/Business name/)).toBeVisible();
  await expect(page.getByLabel("What can we help with?")).toBeVisible();
  await expect(page.getByLabel("Tell us about your project")).toBeVisible();
  await expect(page.getByRole("button", { name: "Send inquiry" })).toBeVisible();
  await expect(
    page.getByRole("link", { name: "contact@aismallbizguru.com" }).first(),
  ).toHaveAttribute("href", "mailto:contact@aismallbizguru.com");
  await expect(page.locator('input[type="password"]')).toHaveCount(0);
  await expect(page.locator('input[type="tel"]')).toHaveCount(0);

  const accessibility = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(accessibility.violations).toEqual([]);
});

test("required fields are validated in the browser and keep entered values", async ({
  page,
}) => {
  await prepare(page);
  let requests = 0;
  await page.route("**/api/contact", async (route) => {
    requests += 1;
    await route.fulfill({ status: 200, body: '{"ok":true,"id":"test"}' });
  });
  await page.goto("./contact");
  await page.getByRole("button", { name: "Send inquiry" }).click();
  await expect(page.getByText("Please tell us your name.")).toBeVisible();
  await expect(page.getByText("Please enter an email address.")).toBeVisible();
  await expect(page.getByText("Please choose an area we can help with.")).toBeVisible();
  await expect(page.getByLabel("Your name")).toBeFocused();
  expect(requests).toBe(0);

  await page.getByLabel("Your name").fill("Alex");
  await page.getByLabel("Email address").fill("not-an-email");
  await page.getByLabel("What can we help with?").selectOption("ai");
  await page.getByLabel("Tell us about your project").fill("A short note");
  await page.getByRole("button", { name: "Send inquiry" }).click();
  await expect(page.getByText("Please enter a valid email address.")).toBeVisible();
  await expect(page.getByLabel("Your name")).toHaveValue("Alex");
  await expect(page.getByLabel("Email address")).toHaveValue("not-an-email");
  expect(requests).toBe(0);
});

test("a successful submission shows confirmation without storing inquiry data", async ({
  page,
}) => {
  await prepare(page);
  // Keep this test hermetic; analytics delivery is covered by analytics.spec.js.
  await page.route("https://analytics.aismallbizguru.com/**", (route) =>
    route.fulfill({ status: 204, body: "" }),
  );
  let payload;
  await page.route("**/api/contact", async (route) => {
    payload = route.request().postDataJSON();
    await new Promise((resolve) => setTimeout(resolve, 250));
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: '{"ok":true,"id":"test-id"}',
    });
  });
  await page.goto("./contact");
  await fillForm(page);
  await page.getByRole("button", { name: "Send inquiry" }).click();
  await expect(page.getByRole("button", { name: /Sending/ })).toBeDisabled();
  await expect(
    page.getByRole("heading", { name: "Thanks! Your message has been received." }),
  ).toBeVisible();
  await expect(page.locator("#contact-form")).toBeHidden();
  expect(payload).toMatchObject({
    name: validInquiry.name,
    email: validInquiry.email,
    category: "automation",
    turnstileToken: "XXXX.DUMMY.TOKEN.XXXX",
  });
  expect(payload.website).toBeUndefined();
  const stored = await page.evaluate(() => ({
    local: localStorage.length,
    sessionKeys: Object.keys(sessionStorage),
    session: sessionStorage.getItem("aismallbizguru.analytics.session"),
  }));
  expect(stored.local).toBe(0);
  // Only the anonymous analytics session may be stored; never inquiry content.
  expect(stored.sessionKeys).toEqual(["aismallbizguru.analytics.session"]);
  expect(stored.session).toMatch(/^\{"id":"s_[a-f0-9]{32}","at":\d+\}$/);
  for (const value of [
    validInquiry.name,
    validInquiry.email,
    validInquiry.business,
    validInquiry.description,
  ])
    expect(stored.session).not.toContain(value);
});

test("a provider failure is shown honestly with a direct-email fallback", async ({
  page,
}) => {
  await prepare(page);
  await page.route("**/api/contact", (route) =>
    route.fulfill({
      status: 502,
      contentType: "application/json",
      body: JSON.stringify({
        ok: false,
        error:
          "We couldn't send your message right now. Please try again, or email us directly at contact@aismallbizguru.com.",
      }),
    }),
  );
  await page.goto("./contact");
  await fillForm(page);
  await page.getByRole("button", { name: "Send inquiry" }).click();
  const alert = page.getByRole("alert");
  await expect(alert).toContainText("couldn't send your message");
  await expect(alert).toContainText("contact@aismallbizguru.com");
  await expect(page.getByLabel("Your name")).toHaveValue(validInquiry.name);
  await expect(page.getByRole("button", { name: "Send inquiry" })).toBeEnabled();
  await expect(
    page.getByRole("heading", { name: "Thanks! Your message has been received." }),
  ).toBeHidden();
});

test("server-side field errors are displayed inline", async ({ page }) => {
  await prepare(page);
  await page.route("**/api/contact", (route) =>
    route.fulfill({
      status: 400,
      contentType: "application/json",
      body: JSON.stringify({
        ok: false,
        error: "Please check the highlighted fields.",
        fields: { email: "Please enter a valid email address." },
      }),
    }),
  );
  await page.goto("./contact");
  await fillForm(page);
  await page.getByRole("button", { name: "Send inquiry" }).click();
  await expect(page.getByText("Please check the highlighted fields.")).toBeVisible();
  await expect(page.locator("#email-error")).toHaveText(
    "Please enter a valid email address.",
  );
  await expect(page.getByLabel("Email address")).toHaveAttribute(
    "aria-invalid",
    "true",
  );
});

test("the form supports keyboard navigation", async ({ page }) => {
  await prepare(page);
  await page.goto("./contact");
  await page.getByLabel("Your name").focus();
  await page.keyboard.press("Tab");
  await expect(page.getByLabel("Email address")).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByLabel(/Business name/)).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByLabel("What can we help with?")).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByLabel("Tell us about your project")).toBeFocused();
  const positiveTabIndexes = await page
    .locator("[tabindex]")
    .evaluateAll((elements) =>
      elements
        .map((element) => Number(element.getAttribute("tabindex")))
        .filter((value) => value > 0),
    );
  expect(positiveTabIndexes).toEqual([]);
});

for (const width of [320, 390, 768, 1440]) {
  test(`contact page is usable at ${width}px`, async ({ page }) => {
    await prepare(page);
    await page.setViewportSize({ width, height: 900 });
    const response = await page.goto("./contact");
    expect(response.status()).toBe(200);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await expect(page.getByLabel("Your name")).toBeVisible();
    await expect(page.getByRole("button", { name: "Send inquiry" })).toBeVisible();
    await page.screenshot({
      path: `test-results/contact-${width}.png`,
      fullPage: true,
    });
  });
}

test("the homepage project CTA opens the contact page", async ({ page }) => {
  await page.goto("./");
  await page.getByRole("link", { name: "Let's Talk About Your Project" }).click();
  await expect(page).toHaveURL(/\/contact$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Tell us what you're trying to accomplish.",
  );
});

