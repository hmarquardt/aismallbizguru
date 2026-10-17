# AI Small Business Guru

Static homepage for https://aismallbizguru.com. Practical websites, applications,
automation, and AI, with client ownership from the start.

## Files and local preview

- `index.html`, `styles.css`, `site.js`: content, responsive design, mobile navigation.
- `favicon.svg`, `robots.txt`, `sitemap.xml`, `404.html`: public supporting assets.
- `scripts/build.mjs`: copies only approved public files to `dist/`, adding a
  `version.json` containing the source commit SHA. Documentation, archived designs,
  tests, and development files are never published.
- `tests/`, `scripts/check.mjs`: browser, accessibility, HTML, links, metadata,
  deployment configuration, and common secret-pattern checks.

```sh
npm ci
npx playwright install chromium
npm run check
npm run build
npm test
npm run preview
```

Open http://localhost:8000. Node 24 and Python 3 are needed for development;
production has no runtime npm dependencies, backend, tracking, database, or auth.

## Production and domain routing

The existing repository is `hmarquardt/aismallbizguru`; `main` is production.
`.github/workflows/production.yml` is the sole deployment path: validate HTML and
configuration, build an explicit static artifact, pass Chromium tests at 320,
390, 768, and 1440 pixels (including axe accessibility checks), then deploy to the
existing GitHub Pages site using GitHub's short-lived deployment identity. Actions
are pinned to commit SHAs. Pull requests validate without deploying. Never publish
manually or enable an additional Cloudflare/Git auto-deploy for the same site.

GitHub Pages previously published the repository root through its legacy build.
Its build source is now GitHub Actions; the legacy automatic build is disabled. There is
no existing Cloudflare Pages project for this site; reusing the established static
host avoids a new project, Worker, credential, or competing deployment system.
Cloudflare remains the authoritative DNS provider and existing edge proxy.

Canonical policy: HTTPS apex `https://aismallbizguru.com/`, with `www` redirecting
to apex through GitHub Pages once both DNS records and its custom domain are
configured. Public DNS-over-HTTPS checks found no usable apex A answer and
`www` NXDOMAIN. Requests sent directly to the zone’s Cloudflare edge with the
apex or `www` hostname returned HTTP 530 / error 1016 (origin DNS failure).
Existing authorized Cloudflare
credentials returned 403 for zone DNS records and rulesets, so record contents
could not be inspected or safely repaired. Do not change records blindly.

An owner with zone DNS access must first configure `aismallbizguru.com` as the
custom domain in this repository’s Pages settings, then inspect existing apex and
`www` records and point only those website records at the existing Pages host according to
[GitHub's custom-domain instructions](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site), then verify the apex TLS certificate
and `www` redirect. The existing Pages fallback is
https://hmarquardt.github.io/aismallbizguru/ until custom-domain activation.
No production availability at the branded domain should be claimed before these
checks pass. The source canonical URL intentionally describes the final domain.

CFLab is independent: `cflab.aismallbizguru.com` is a custom domain of Worker
`cflab`, `lab.aismallbizguru.com/*` routes there, and
`analytics.aismallbizguru.com` is a custom domain of `cflab-analytics`, which also
owns the more-specific analytics collection routes on `cflab` and `lab`.
Do not change these Workers, routes, DNS entries, D1 databases, R2 storage, auth,
or analytics as part of homepage deployment. Baseline health endpoints on all
three hosts returned 200 with their expected service identities.

## Updating content

Edit the source files, run checks and browser tests, commit and push to `main`.
Update the `AISBG_DEPLOY_FOOTER` version in `index.html` whenever it changes:
`YYYY.MM.DD.N`, incrementing N per same-day commit. `dist/` is ignored and rebuilt
in CI. Verify `/version.json` against the GitHub deployment commit after release.
Use `SITE_URL=https://aismallbizguru.com EXPECTED_COMMIT=<sha> npm test` for live
root-hosted browser verification once DNS is repaired.

## Contact and next phase

The established contact is `hank@aismallbizguru.com`, retained from the previous
homepage and README. Contact links open the visitor's mail application. There is
no form, and mailbox delivery has not been independently tested. Update both the
visible address and mailto link if the owner changes it.

`/getting-started` is reserved, has no live link, and currently returns 404. The
homepage marks the guide as forthcoming. Add `getting-started/index.html` and
explicitly include it in the build when the next phase is ready; then update
links, sitemap, and the route test. Account ownership does not replace an IP
agreement, backups, or technical transition planning.

The original `BRANDING.md` and archived `light_artifact.html` remain as references.
This release follows the current ownership-led brief and dark-green palette where
it supersedes older package/pricing copy and gold accents. Neither reference is
published. Automated secret checks cover common patterns, not every possible
credential; review diffs before committing.
