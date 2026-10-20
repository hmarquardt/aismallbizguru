import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";

const html = readFileSync("index.html", "utf8");
const guide = readFileSync("getting-started.html", "utf8");
const guideJs = readFileSync("getting-started.js", "utf8");
const contact = readFileSync("contact.html", "utf8");
const contactJs = readFileSync("contact.js", "utf8");
const work = readFileSync("work.html", "utf8");
const wlu = readFileSync("work/worth-looking-up.html", "utf8");
const ff = readFileSync("work/fruiting-forecast.html", "utf8");
const worker = readFileSync("site-worker.mjs", "utf8");
const build = readFileSync("scripts/build.mjs", "utf8");

assert.equal((html.match(/<h1\b/g) || []).length, 1);
assert(html.includes('href="/getting-started"'));
assert(html.includes("hank@aismallbizguru.com"));
assert(html.includes("See How We Get Started"));
assert(
  readFileSync("robots.txt", "utf8").includes(
    "https://aismallbizguru.com/sitemap.xml",
  ),
);
const sitemap = readFileSync("sitemap.xml", "utf8");
assert(sitemap.includes("https://aismallbizguru.com/"));
assert(sitemap.includes("https://aismallbizguru.com/getting-started"));
assert(sitemap.includes("https://aismallbizguru.com/work"));
assert(sitemap.includes("https://aismallbizguru.com/work/worth-looking-up"));
assert(sitemap.includes("https://aismallbizguru.com/work/fruiting-forecast"));
assert(sitemap.includes("https://aismallbizguru.com/contact"));
assert(readFileSync("404.html", "utf8").includes('href="/getting-started"'));

// The guide is a standalone, server-rendered page with one clear heading.
assert.equal((guide.match(/<h1\b/g) || []).length, 1);
assert(guide.includes('<link rel="canonical" href="https://aismallbizguru.com/getting-started">'));
assert(guide.includes("The handoff happens before we begin"));
assert(guide.includes("Your accounts"));
assert(guide.includes("You're Never Locked In."));
assert(guide.includes("Your Domain &amp; Identity"));
assert(guide.includes("Development Accounts"));
assert(guide.includes("Additional Services"));
assert(guide.includes("Backups &amp; Continuity"));
assert(guide.includes("Ownership &amp; Changing Developers"));
assert(guide.includes("Workers Paid"));
assert(guide.includes("$5 USD a month"));
assert(guide.includes("OpenRouter"));
assert(guide.includes("hmarquardt"));

// No credential collection, form submission, or third-party runtime assets.
assert(!/<form\b/i.test(guide), "The guide must not contain a form");
assert(!/type="(?:password|email|tel|number)"/i.test(guide), "The guide must not collect credentials or personal data");
assert(!/name="(?:password|token|secret|card)/i.test(guide));
const inputTypes = [...guide.matchAll(/<input\b[^>]*type="([^"]+)"/g)].map((match) => match[1]);
assert(inputTypes.length > 0, "The guide should include checklist controls");
assert(inputTypes.every((type) => type === "checkbox"), "Every guide input must be a checkbox");
assert(!/<script[^>]+src="https?:/i.test(guide), "Scripts must be self-hosted");
assert(!/<link[^>]+rel="stylesheet"[^>]+href="https?:/i.test(guide), "Styles must be self-hosted");

const stepIds = [...guide.matchAll(/data-step="([^"]+)"/g)].map((match) => match[1]);
assert.equal(stepIds.length, 22, "Expected 22 checklist steps");
assert.equal(new Set(stepIds).size, stepIds.length, "Checklist step IDs must be unique");
assert.equal([...guide.matchAll(/data-skip-group="([^"]+)"/g)].length, 2, "Two optional groups must be skippable");
assert(guide.includes('data-checklist-status="domain"'));
assert(guide.includes('data-checklist-status="github"'));
assert(guide.includes('data-checklist-status="cloudflare"'));
assert(guide.includes('data-checklist-status="openrouter"'));
assert(guide.includes('data-checklist-status="backups"'));
assert(guide.includes('data-checklist-status="transition"'));

// Checklist persistence is local and contains no network or credential handling.
assert(guideJs.includes('const STORAGE_KEY = "aismallbizguru:getting-started:v1";'));
assert(!/\bfetch\s*\(|XMLHttpRequest|sendBeacon|document\.cookie|navigator\.credentials/.test(guideJs), "Checklist code must not make network requests, use cookies, or read browser credentials");
assert(!/type=\\?["'](?:password|email|tel)/.test(guideJs), "Checklist code must not create credential or contact fields");
assert(guideJs.includes('localStorage.setItem'));
assert(guideJs.includes('JSON.stringify({ version: 1, checks: state.checks, skipped: state.skipped })'));

// Every external link points at an official provider or documentation domain.
const externalLinks = [...guide.matchAll(/href="(https:\/\/[^"]+)"/g)].map((match) => match[1]);
assert(externalLinks.length >= 20, "Expected direct links to provider documentation");
const allowedHosts = new Set([
  "aismallbizguru.com",
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
  assert(allowedHosts.has(new URL(link).hostname), `Unexpected external host: ${link}`);
}
for (const required of [
  "https://github.com/signup",
  "https://docs.github.com/en/authentication/securing-your-account-with-two-factor-authentication-2fa/configuring-two-factor-authentication",
  "https://docs.github.com/en/organizations/managing-membership-in-your-organization/inviting-users-to-join-your-organization",
  "https://dash.cloudflare.com/sign-up",
  "https://developers.cloudflare.com/fundamentals/manage-domains/add-site/",
  "https://developers.cloudflare.com/fundamentals/manage-members/manage/",
  "https://developers.cloudflare.com/workers/platform/pricing/",
  "https://developers.cloudflare.com/email-service/",
  "https://openrouter.ai/sign-up",
  "https://openrouter.ai/docs/cookbook/administration/organization-management",
  "https://openrouter.ai/docs/guides/best-practices/spend-controls",
  "https://openrouter.ai/docs/guides/features/notifications",
]) {
  assert(guide.includes(required), `Missing required provider link: ${required}`);
}

// The build publishes the new route and its supporting assets explicitly.
for (const file of [
  '"getting-started.html"',
  '"getting-started.css"',
  '"getting-started.js"',
  '"contact.html"',
  '"contact.css"',
  '"contact.js"',
  '"work.html"',
  '"work.css"',
  '"work/worth-looking-up.html"',
  '"work/fruiting-forecast.html"',
  '"images/work/worth-looking-up-desktop.jpg"',
  '"images/work/worth-looking-up-mobile.jpg"',
  '"images/work/fruiting-forecast-desktop.jpg"',
  '"images/work/fruiting-forecast-results.jpg"',
  '"images/work/fruiting-forecast-mobile.jpg"',
]) {
  assert(build.includes(file), `Build is missing ${file}`);
}

// The site keeps one deploy version across all public HTML pages.
const versionPattern = /AISBG_DEPLOY_FOOTER version="(\d{4}\.\d{2}\.\d{2}\.\d+)"/;
const homeVersion = html.match(versionPattern);
const guideVersion = guide.match(versionPattern);
const contactVersion = contact.match(versionPattern);
const workVersion = work.match(versionPattern);
const wluVersion = wlu.match(versionPattern);
const ffVersion = ff.match(versionPattern);
assert(homeVersion, "Homepage deploy version is missing");
assert(guideVersion, "Guide deploy version is missing");
assert(contactVersion, "Contact deploy version is missing");
assert(workVersion, "Work index deploy version is missing");
assert(wluVersion, "Worth Looking Up deploy version is missing");
assert(ffVersion, "Fruiting Forecast deploy version is missing");
assert.equal(homeVersion[1], guideVersion[1], "Deploy versions must match");
assert.equal(homeVersion[1], contactVersion[1], "Deploy versions must match");
assert.equal(homeVersion[1], workVersion[1], "Deploy versions must match");
assert.equal(homeVersion[1], wluVersion[1], "Deploy versions must match");
assert.equal(homeVersion[1], ffVersion[1], "Deploy versions must match");

// The portfolio publishes two live products with self-hosted assets.
for (const [file, page] of Object.entries({
  "work.html": work,
  "work/worth-looking-up.html": wlu,
  "work/fruiting-forecast.html": ff,
})) {
  assert.equal((page.match(/<h1\b/g) || []).length, 1, `${file} must have exactly one h1`);
  assert(!/<script[^>]+src="https?:/i.test(page), `${file} scripts must be self-hosted`);
  assert(!/<link[^>]+rel="stylesheet"[^>]+href="https?:/i.test(page), `${file} styles must be self-hosted`);
  assert(!/<form\b/i.test(page), `${file} must not contain a form`);
  assert(!/google-analytics|googletagmanager|facebook\.net|doubleclick/i.test(page), `${file} must not include trackers`);
}
assert(html.includes('href="/work"'), "Homepage navigation must link to the portfolio");
assert(work.includes('<link rel="canonical" href="https://aismallbizguru.com/work">'));
assert(wlu.includes('<link rel="canonical" href="https://aismallbizguru.com/work/worth-looking-up">'));
assert(
  /rel="canonical"[\s\S]{0,60}?href="https:\/\/aismallbizguru\.com\/work\/fruiting-forecast"/.test(
    ff,
  ),
  "Fruiting Forecast canonical URL is missing",
);
assert(work.includes('href="/work/worth-looking-up"'));
assert(work.includes('href="/work/fruiting-forecast"'));
assert(wlu.includes("https://worthlookingup.com/"));
assert(ff.includes("https://fruitingforecast.com/"));
for (const image of [
  "worth-looking-up-desktop.jpg",
  "worth-looking-up-mobile.jpg",
  "fruiting-forecast-desktop.jpg",
  "fruiting-forecast-results.jpg",
  "fruiting-forecast-mobile.jpg",
]) {
  assert(statSync(`images/work/${image}`).size > 0, `Missing portfolio image ${image}`);
  assert(
    [work, wlu, ff].some((page) => page.includes(`/images/work/${image}`)),
    `${image} is not referenced by a portfolio page`,
  );
}

// Contact page: one clear heading, a real form, privacy, and direct email.
assert.equal((contact.match(/<h1\b/g) || []).length, 1);
assert(contact.includes('<link rel="canonical" href="https://aismallbizguru.com/contact">'));
assert(contact.includes('id="contact-form"'));
for (const id of ["name", "email", "category", "description"]) {
  assert(contact.includes(`for="${id}"`), `Contact form is missing a label for ${id}`);
  assert(contact.includes(`id="${id}"`), `Contact form is missing ${id}`);
}
assert(contact.includes('name="website"'), "Contact form is missing its honeypot");
assert(contact.includes("cf-turnstile"));
assert(contact.includes("form does not create an account"));
assert(contact.includes("no analytics or advertising trackers"));
assert(contact.includes("mailto:contact@aismallbizguru.com"));
assert(contact.includes("contact@aismallbizguru.com"));
assert(!/type="(?:password|tel|number)"/i.test(contact), "Contact form must not collect credentials, phone, or payment data");
assert(!/localStorage|sessionStorage|sendBeacon|document\.cookie/.test(contactJs), "Contact code must not persist inquiry content");
assert(!/google-analytics|googletagmanager|facebook\.net|doubleclick/i.test(contact), "Contact page must not include trackers");
assert(contactJs.includes('fetch("/api/contact"'));
assert(contactJs.includes("form.hidden = true"));
assert(contactJs.includes("turnstileToken"));
assert(worker.includes("/api/contact"));
assert(worker.includes('"hmarquardt+aismallbizguru@gmail.com"'));
assert(worker.includes('"contact@aismallbizguru.com"'));
assert(worker.includes("CONTACT_RATE_LIMIT"));
assert(worker.includes("TURNSTILE_SECRET"));
assert(worker.includes("cf-connecting-ip"));
assert(!/input\.(?:to|from|recipient)/.test(worker), "Delivery recipients must not come from visitor input");

const workflow = readFileSync(".github/workflows/production.yml", "utf8");
assert(workflow.includes("branches: [main]"));
assert(workflow.includes("needs: validate"));
assert(workflow.includes("npm run check"));
assert(workflow.includes("npm test"));
assert(workflow.includes("npm run deploy"));
assert(!/actions\/(?:deploy-pages|upload-pages-artifact)|pages: write|github-pages/.test(workflow));
const config = JSON.parse(readFileSync("wrangler.json", "utf8"));
assert.equal(config.name, "aismallbizguru-site");
assert.equal(config.account_id, "b1aa310aa0a1638d72b8b086a21e557c");
assert.equal(config.main, "site-worker.mjs");
assert.equal(config.assets.directory, "./dist");
assert.equal(config.assets.binding, "ASSETS");
assert.equal(config.assets.run_worker_first, true);
assert.equal(config.assets.not_found_handling, "404-page");
assert.equal(config.workers_dev, true);
const allowed = new Set([
  "$schema",
  "name",
  "account_id",
  "main",
  "compatibility_date",
  "workers_dev",
  "preview_urls",
  "assets",
  "routes",
  "send_email",
  "ratelimits",
]);
for (const key of Object.keys(config)) assert(allowed.has(key), `Unexpected resource configuration: ${key}`);
assert.deepEqual(config.send_email, [
  {
    name: "SEND_EMAIL",
    destination_address: "hmarquardt+aismallbizguru@gmail.com",
    allowed_sender_addresses: ["contact@aismallbizguru.com"],
  },
]);
assert.deepEqual(config.ratelimits, [
  {
    name: "CONTACT_RATE_LIMIT",
    namespace_id: "4301",
    simple: { limit: 5, period: 60 },
  },
]);
if (config.routes) assert.deepEqual(config.routes, [
  { pattern: "aismallbizguru.com", custom_domain: true },
  { pattern: "www.aismallbizguru.com", custom_domain: true },
]);
function scan(dir) {
  for (const name of readdirSync(dir)) {
    if (
      [
        ".git",
        "node_modules",
        "dist",
        "test-results",
        "playwright-report",
        ".opencode",
      ].includes(name)
    )
      continue;
    const path = `${dir}/${name}`;
    if (statSync(path).isDirectory()) scan(path);
    else {
      const text = readFileSync(path, "utf8");
      assert(
        !/(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|(?:oauth_token|api_token)\s*=\s*["'][A-Za-z0-9_-]{20,})/.test(
          text,
        ),
        `Possible secret in ${path}`,
      );
    }
  }
}
scan(".");
console.log(
  "Homepage, guide, contact form, provider links, metadata, route publication, deployment gating and secret-pattern checks passed.",
);
