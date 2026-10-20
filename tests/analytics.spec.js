import { test, expect } from "@playwright/test";

const SITE = "as_4YsDnNOcpAQq4l1ARNY2pl";
const validInquiry = {
  name: "Alex Rivera",
  email: "alex@example.com",
  business: "Rivera Bakery",
  category: "automation",
  description:
    "We retype every wholesale order into a spreadsheet and want to stop.",
};

async function stubCollector(page, { doNotTrack = false } = {}) {
  const posts = [];
  await page.route("https://analytics.aismallbizguru.com/**", async (route) => {
    const request = route.request();
    if (request.method() === "OPTIONS")
      return route.fulfill({ status: 204, body: "" });
    try {
      posts.push(JSON.parse(request.postData() || "{}"));
    } catch {
      posts.push({ unparsed: request.postData() });
    }
    await route.fulfill({ status: 204, body: "" });
  });
  if (doNotTrack)
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "doNotTrack", { get: () => "1" });
    });
  return posts;
}

const named = (posts, name) =>
  posts.filter((post) => post.kind === "event" && post.name === name);
const pageviews = (posts, path) =>
  posts.filter((post) => post.kind === "pageview" && post.path === path);

async function prepareContact(page) {
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

test("each public page sends exactly one page view for the registered site", async ({
  page,
}) => {
  const posts = await stubCollector(page);
  const paths = [
    "/",
    "/getting-started",
    "/contact",
    "/work",
    "/work/worth-looking-up",
    "/work/fruiting-forecast",
  ];
  for (const path of paths) {
    const response = await page.goto(`.${path}`);
    expect(response.status()).toBe(200);
    await expect.poll(() => pageviews(posts, path).length).toBe(1);
    // A duplicate would arrive in the same load, so give it a chance to appear.
    await page.waitForTimeout(150);
    expect(pageviews(posts, path)).toHaveLength(1);
  }
  expect(posts.filter((post) => post.kind === "pageview")).toHaveLength(
    paths.length,
  );
  for (const post of posts) {
    expect(post.site).toBe(SITE);
    expect(post.session).toMatch(/^s_[a-f0-9]{32}$/);
    expect(post.event_uid).toMatch(/^e_[a-f0-9]{32}$/);
    expect(post.path.startsWith("/")).toBe(true);
    expect(post.path).not.toContain("?");
  }
});

test("acquisition context keeps UTM values without the query string", async ({
  page,
}) => {
  const posts = await stubCollector(page);
  await page.goto(
    "./?utm_source=newsletter&utm_medium=email&utm_campaign=fall&secret=ignore",
  );
  await expect.poll(() => pageviews(posts, "/").length).toBe(1);
  const [post] = pageviews(posts, "/");
  expect(post.utm).toEqual({
    source: "newsletter",
    medium: "email",
    campaign: "fall",
  });
  expect(JSON.stringify(post)).not.toContain("secret");
});

test("contact calls to action and live-product links are tracked", async ({
  page,
}) => {
  const posts = await stubCollector(page);
  await page.route("https://worthlookingup.com/**", (route) =>
    route.fulfill({ status: 200, contentType: "text/html", body: "ok" }),
  );

  await page.goto("./");
  await page.getByRole("link", { name: "Let's Talk About Your Project" }).click();
  await expect(page).toHaveURL(/\/contact$/);
  await expect.poll(() => named(posts, "contact_cta_click").length).toBe(1);
  expect(named(posts, "contact_cta_click")[0].props).toEqual({
    method: "form",
    placement: "top",
  });

  await page.goto("./work");
  await page.getByRole("link", { name: /Visit the live site/ }).first().click();
  await expect.poll(() => named(posts, "live_app_click").length).toBe(1);
  expect(named(posts, "live_app_click")[0].props).toEqual({
    project: "worth-looking-up",
    placement: "portfolio",
  });

  await page.goto("./work/worth-looking-up");
  await page.getByRole("link", { name: /Visit worthlookingup\.com/ }).click();
  await expect.poll(() => named(posts, "live_app_click").length).toBe(2);
  expect(named(posts, "live_app_click")[1].props).toEqual({
    project: "worth-looking-up",
    placement: "case-study",
  });

  await page.goto("./contact");
  await page.evaluate(() => {
    document.querySelector('a[href^="mailto:contact@"]').click();
  });
  await expect.poll(() => named(posts, "contact_cta_click").length).toBe(2);
  expect(named(posts, "contact_cta_click")[1].props.method).toBe("email");
});

test("a confirmed submission is counted once and carries no inquiry data", async ({
  page,
}) => {
  const posts = await stubCollector(page);
  await prepareContact(page);
  await page.route("**/api/contact", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true, id: "test" }),
    }),
  );
  await page.goto("./contact");
  await fillForm(page);
  await page.getByRole("button", { name: "Send inquiry" }).click();
  await expect(
    page.getByRole("heading", { name: "Thanks! Your message has been received." }),
  ).toBeVisible();
  await expect.poll(() => named(posts, "contact_submit").length).toBe(1);
  expect(named(posts, "contact_submit")[0].props).toEqual({
    category: "automation",
  });
  await page.waitForTimeout(250);
  expect(named(posts, "contact_submit")).toHaveLength(1);

  const sent = JSON.stringify(posts);
  for (const value of [
    validInquiry.name,
    validInquiry.email,
    validInquiry.business,
    validInquiry.description,
  ])
    expect(sent).not.toContain(value);
});

for (const status of [502, 403]) {
  test(`a ${status} submission is never counted as a conversion`, async ({
    page,
  }) => {
    const posts = await stubCollector(page);
    await prepareContact(page);
    await page.route("**/api/contact", (route) =>
      route.fulfill({
        status,
        contentType: "application/json",
        body: JSON.stringify({ ok: false, error: "Not accepted." }),
      }),
    );
    await page.goto("./contact");
    await fillForm(page);
    await page.getByRole("button", { name: "Send inquiry" }).click();
    await expect(page.getByRole("alert")).toBeVisible();
    await page.waitForTimeout(250);
    expect(named(posts, "contact_submit")).toHaveLength(0);
  });
}

test("Do Not Track suppresses every request", async ({ page }) => {
  const posts = await stubCollector(page, { doNotTrack: true });
  await page.goto("./");
  await page.getByRole("link", { name: "Let's Talk About Your Project" }).click();
  await expect(page).toHaveURL(/\/contact$/);
  await page.waitForTimeout(400);
  expect(posts).toHaveLength(0);
});

