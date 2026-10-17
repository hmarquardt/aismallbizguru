import { mkdir, copyFile, writeFile, rm } from "node:fs/promises";
import { execFileSync } from "node:child_process";
await rm("dist", { recursive: true, force: true });
await mkdir("dist", { recursive: true });
for (const file of [
  "index.html",
  "styles.css",
  "site.js",
  "favicon.svg",
  "robots.txt",
  "sitemap.xml",
  "404.html",
]) {
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
