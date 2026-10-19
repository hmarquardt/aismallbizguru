# AI Small Business Guru

Static homepage for https://aismallbizguru.com. Practical websites, applications,
automation, and AI, with client ownership from the start.

## Files and local preview

- `index.html`, `styles.css`, `site.js`: content, responsive design, mobile navigation.
- `contact.html`, `contact.css`, `contact.js`: project inquiry form and its client-side states.
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

GitHub Pages deployment actions and permissions have been removed. After the
Cloudflare HTTPS deployment and live browser suite passed, the old Pages
publication and its unused `github-pages` environment were deleted. GitHub Pages
is not a fallback or a production target.

Migration validation passed in Actions run
[38985265482](https://github.com/hmarquardt/aismallbizguru/actions/runs/38985265482).
Its deploy job failed explicitly at the missing-secret preflight. The initial
Cloudflare deployment therefore used the existing local OAuth login against the
committed, CI-validated build; this bootstrap does not establish unattended CI.
The next automated deployment remains blocked until the existing account-owned
credential is supplied as the repository secret.

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

## Email routing

Inbound mail for `aismallbizguru.com` is handled by Cloudflare Email Routing,
enabled 2026-10-19. This is forwarding only: it is not a hosted mailbox, and no
outbound sending or SMTP relay is configured.

| Public address | Forwards to |
| --- | --- |
| `hank@aismallbizguru.com` | `hmarquardt+aismallbizguru@gmail.com` |
| `contact@aismallbizguru.com` | `hmarquardt+aismallbizguru@gmail.com` |

Both rules use exact-match (`literal`, field `to`) matchers and are enabled.
The destination is verified. Keep the full destination, including the
`+aismallbizguru` tag; do not substitute the bare Gmail address. Catch-all
forwarding is disabled and must stay disabled unless separately authorized.

Cloudflare owns these zone records, assigned for this zone on 2026-10-19:

- MX `route1.mx.cloudflare.net` (priority 55), `route2` (20), `route3` (81).
  Use the values Cloudflare supplies for the zone; do not copy priorities from
  another zone.
- TXT `v=spf1 include:_spf.mx.cloudflare.net ~all` — exactly one SPF record.
- TXT `cf2024-1._domainkey` — Cloudflare DKIM key.

No DMARC record exists; none existed before this migration. Do not add a second
SPF record or alter unrelated TXT records. The obsolete Namecheap forwarding MX
records (`eforward*.registrar-servers.com`) and their SPF include were removed;
do not restore them.

To change forwarding, edit the rules in the Cloudflare dashboard under
Compute > Email Service > Email Routing, or use the API:

```sh
GET/POST /client/v4/zones/{zone_tag}/email/routing/rules
```

A new destination address must be verified by its owner before rules can use it
(Cloudflare rejects unverified destinations). Rule changes require Zone Email
Routing Edit; DNS changes require Zone DNS Edit. Those permissions belong to a
local, narrowly scoped credential — do not add DNS or Email Routing scopes to
the GitHub Actions Workers deployment token, and do not commit credentials.

Operational limits: mail is delivered into the Gmail account; replies sent from
Gmail use the Gmail address. Gmail suppresses forwarded copies of messages sent
from that same Gmail account, so delivery tests must come from an external
account. On 2026-10-19, external messages to both public addresses arrived in
Gmail, and the Cloudflare activity log recorded `status: delivered`,
`action: forward`, with SPF and DKIM passing. Do not treat the existence of
rules as proof of delivery.

## Contact form

`/contact` is a static page that submits JSON to `POST /api/contact` on the
existing Worker. There is no account, database, CRM, or stored copy of an
inquiry. The browser shows success only after the `SEND_EMAIL` binding resolves;
provider rejection or timeout returns 502 and the page says the message was not
sent.

Validation limits: name 1–100 characters; email at most 254 characters and
syntactically valid; category one of `website`, `software`, `automation`, `ai`,
`unsure`; optional business name at most 120; description 20–5,000; bodies over
16 KB are rejected. A hidden honeypot is checked, and the visitor's email is
used only as `Reply-To`.

Delivery uses Cloudflare's `send_email` binding:

- Sender: `contact@aismallbizguru.com` (fixed)
- Destination: `hmarquardt+aismallbizguru@gmail.com` (fixed)
- Binding restricts both sender and destination; visitor input cannot influence
  either. Because the destination is a verified address, no Email Sending domain
  onboarding or DNS change is required.

Spam controls:

- Cloudflare Turnstile widget on the page; the token is verified server-side at
  `https://challenges.cloudflare.com/turnstile/v0/siteverify`. Tokens are
  single-use, so replays fail.
- Worker secret `TURNSTILE_SECRET` holds the widget secret. The public site key
  is in `contact.html`; neither is committed as a secret value.
- `CONTACT_RATE_LIMIT` allows 5 submissions per 60 seconds per
  `CF-Connecting-IP` in each Cloudflare location. This is Cloudflare's
  eventually-consistent rate-limit binding, not in-memory Worker state.
- Wrong methods, origins, content types, malformed JSON, oversized bodies, and
  missing bindings fail closed.

Operational notes:

- Rotate Turnstile by creating a new widget secret (dashboard or API), updating
  the site key in `contact.html`, and running
  `npx wrangler secret put TURNSTILE_SECRET`. No other application credential is
  required; the GitHub Actions deploy token is unchanged.
- Diagnose failures with `npx wrangler tail` for `contact_accepted` /
  `contact_send_failed` (request ID and provider code only, never inquiry
  content), Cloudflare Email Sending metrics/activity, and Turnstile analytics.
- Provider acceptance means Cloudflare accepted the message for delivery. It is
  not proof that Gmail placed it in the inbox; verify receipt separately.
- Tests use mocked Turnstile and `SEND_EMAIL` in `npm run check`, and stub the
  API in `npm test`; they never send production mail.

## Contact and next phase

The established contact is `hank@aismallbizguru.com`, retained from the previous
homepage and README. Prospective clients can use the `/contact` form or email
`hank@` / `contact@` directly. There is no hosted mailbox; both addresses forward
to Gmail as described in [Email routing](#email-routing). The form does not
create an account. Update both the visible address and mailto links if the owner
changes it.

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
