# AI Small Business Guru

Static homepage for https://aismallbizguru.com. Practical websites, applications,
automation, and AI, with client ownership from the start.

## Files and local preview

- `index.html`, `styles.css`, `site.js`: content, responsive design, mobile navigation.
- `favicon.svg`, `robots.txt`, `sitemap.xml`, `404.html`: public supporting assets.
- `scripts/build.mjs`: copies only approved public files to `dist/`, adding a
  `version.json` containing the source commit SHA. Documentation, archived designs,
  tests, and development files are never published.
- `wrangler.json`, `site-worker.mjs`: isolated Cloudflare hosting and canonical redirect.
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
`npm run preview:cloudflare` previews the actual Worker locally on port 8177.
Browser tests use Wrangler on port 8176, not the simple Python preview.

## Production and domain routing

Cloudflare Workers Static Assets is the sole production host. Worker
`aismallbizguru-site` serves the unchanged `dist/` build through the `ASSETS`
binding. `site-worker.mjs` only redirects `www.aismallbizguru.com` to the HTTPS
apex with status 308, preserving the path and query, then delegates other requests
to static assets. Running the handler first ensures asset URLs also redirect.
There are no D1, R2, authentication, or other application bindings.

Cloudflare deployment URL: https://aismallbizguru-site.hmarquardt.workers.dev/.
The intended custom-domain URL remains https://aismallbizguru.com/.

`main` in `hmarquardt/aismallbizguru` is the source of truth.
`.github/workflows/production.yml` is the only production pipeline. It validates
HTML, routing, configuration, and the Wrangler bundle, then runs browser tests
against the local Cloudflare runtime at 320, 390, 768, and 1440 pixels. After
validation, the deployment job checks out the same commit, rebuilds the static
output, deploys only `aismallbizguru-site`, and verifies its public revision over
HTTPS. Actions and Wrangler are pinned. Pull requests do not deploy. Do not enable
a second Cloudflare Git integration or restore GitHub Pages publishing.

Unattended deployment requires repository Actions secret `CLOUDFLARE_API_TOKEN`
containing an existing account-owned Workers deployment credential for the account
in `wrangler.json`. It is never committed or printed. A missing secret fails the
job explicitly. The migration found no such secret in this repository; the local
rotating Wrangler OAuth login can bootstrap the committed, validated deployment,
but must not be copied into GitHub as an unattended credential. No new token or
broader permissions are required if the existing CFLab deploy credential is
available. GitHub cannot reveal the contents of an existing repository secret.

Custom-domain activation is pending. Both existing credentials returned 403 for
zone DNS reads, so current apex/`www` record contents could not be inspected. No
DNS records, zone rules, or custom domains were changed blindly. Public checks
previously found no usable apex A answer and `www` NXDOMAIN. Direct Cloudflare edge
requests returned HTTP 530 / error 1016.

To activate the domains, an owner with DNS access must inspect only the apex and
`www` records, identify any records that conflict, and confirm they can be
replaced without affecting another service. Then add these exact entries to
`wrangler.json` and deploy through the same pipeline:

```json
"routes": [
  { "pattern": "aismallbizguru.com", "custom_domain": true },
  { "pattern": "www.aismallbizguru.com", "custom_domain": true }
]
```

Cloudflare Custom Domains provision DNS and HTTPS for these exact hostnames. An
existing conflicting CNAME must be resolved by its owner first. Do not use a
wildcard, replace a zone configuration, or alter email/CFLab records. See
[Cloudflare Custom Domains](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/).
After activation, verify apex HTTPS, the `www` 308 redirect (including path/query),
and the deployed `/version.json`. Until then, a verified workers.dev deployment
does not imply that the branded domain is live.

GitHub Pages deployment actions and permissions have been removed. The old Pages
publication must be disabled after the Cloudflare deployment is verified; it is
not a fallback or a production target.

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
in CI. Verify `/version.json` against the Cloudflare deployment commit after release.
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
