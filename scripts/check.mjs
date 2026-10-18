import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";

const html = readFileSync("index.html", "utf8");
const guide = readFileSync("getting-started.html", "utf8");
const guideJs = readFileSync("getting-started.js", "utf8");
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
]) {
  assert(build.includes(file), `Build is missing ${file}`);
}

// The site keeps one deploy version across its two HTML pages.
const versionPattern = /AISBG_DEPLOY_FOOTER version="(\d{4}\.\d{2}\.\d{2}\.\d+)"/;
const homeVersion = html.match(versionPattern);
const guideVersion = guide.match(versionPattern);
assert(homeVersion, "Homepage deploy version is missing");
assert(guideVersion, "Guide deploy version is missing");
assert.equal(homeVersion[1], guideVersion[1], "Deploy versions must match");

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
const allowed = new Set(["$schema", "name", "account_id", "main", "compatibility_date", "workers_dev", "preview_urls", "assets", "routes"]);
for (const key of Object.keys(config)) assert(allowed.has(key), `Unexpected resource configuration: ${key}`);
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
  "Homepage, guide structure, local-only progress, provider links, metadata, route publication, deployment gating and secret-pattern checks passed.",
);
