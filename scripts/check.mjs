import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
const html = readFileSync("index.html", "utf8");
assert.equal((html.match(/<h1\b/g) || []).length, 1);
assert(!html.includes('href="/getting-started"'));
assert(html.includes("hank@aismallbizguru.com"));
assert(
  readFileSync("robots.txt", "utf8").includes(
    "https://aismallbizguru.com/sitemap.xml",
  ),
);
assert(!readFileSync("sitemap.xml", "utf8").includes("/getting-started"));
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
  "Structure, metadata, route reservation, deployment gating and secret-pattern checks passed.",
);
