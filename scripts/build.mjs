import { mkdir, copyFile, writeFile, rm } from "node:fs/promises";
import { dirname } from "node:path";
import { execFileSync } from "node:child_process";
await rm("dist", { recursive: true, force: true });
await mkdir("dist", { recursive: true });
for (const file of [
  "index.html",
  "getting-started.html",
  "contact.html",
  "work.html",
  "work/worth-looking-up.html",
  "work/fruiting-forecast.html",
  "styles.css",
  "getting-started.css",
  "contact.css",
  "work.css",
  "site.js",
  "getting-started.js",
  "analytics.js",
  "contact.js",
  "images/work/worth-looking-up-desktop.jpg",
  "images/work/worth-looking-up-mobile.jpg",
  "images/work/fruiting-forecast-desktop.jpg",
  "images/work/fruiting-forecast-results.jpg",
  "images/work/fruiting-forecast-mobile.jpg",
  "favicon.svg",
  "robots.txt",
  "sitemap.xml",
  "404.html",
]) {
  await mkdir(dirname(`dist/${file}`), { recursive: true });
  await copyFile(file, `dist/${file}`);
}
await writeFile(
  "dist/version.json",
  JSON.stringify({
    commit: execFileSync("git", ["rev-parse", "HEAD"], {
      encoding: "utf8",
    }).trim(),
  }) + "\n",
);
