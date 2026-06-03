# AI Small Business Guru

Static landing page for `aismallbizguru.com`.

## View Locally

Open `index.html` in a browser, or run a small local server from this directory:

```sh
python3 -m http.server 8000
```

Then visit:

```text
http://localhost:8000/
```

## Notes

- The page is intentionally dependency-free: semantic HTML and embedded CSS only.
- Contact CTAs currently use `mailto:hank@aismallbizguru.com`.
- A real intake form backend should replace the `mailto:` fallback before launch if form-based booking is preferred.

## Version Footer

The footer includes a visible, agent-managed deploy version using the `AISBG_DEPLOY_FOOTER` marker in `index.html`. When committing a change to `index.html`, update the footer version using `YYYY.MM.DD.N`, incrementing `N` for each commit on the same day and resetting to `.1` on a new day.
