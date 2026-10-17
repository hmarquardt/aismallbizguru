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
assert(!workflow.includes("wrangler"));
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
