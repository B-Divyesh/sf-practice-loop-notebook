# Practice Loop Notebook — polish round 1 handoff

Date: 2026-08-28

Work order: `practice-loop-notebook-polish-1`

Live product: <https://practice-loop-notebook.sociobot.in>

Demo: <https://practice-loop-notebook.sociobot.in/demo>

Deployed product commit: `92da9b2205f2a859c3ad17646fbb079e4d1f2aae`

## Outcome

All findings in `.factory/review-1.md` and the earlier P1–P3 verification findings are resolved.

The first screen now names instrumentalists and offers a one-click sample. The demo immediately opens a seeded passage with audio, a tempo plan, pass target, and completed reflection.

Demo passages and licenses use separate namespaces. Resetting or leaving the demo never reads or changes the real notebook.

Archive import now validates every passage and session field before any write. Unknown URLs and `/404` return the styled error page with HTTP 404.

Routes update titles, metadata, focus, announcements, scroll state, and browser history. Header and footer links remain available on every route and at 390 px.

## Verification evidence

### Clean clone

A fresh clone at `/tmp/practice-loop-clean-pvZ50s/repo` ran `npm ci`. Every command in `.factory/claims.json` then ran separately.

All 12 claim commands passed with one matching test each.

### Local gates

- `npm test`: 6/6 unit tests passed.
- `npm run test:claims`: 12/12 claim tests passed.
- `npm run test:e2e`: 36/36 tests passed across desktop Chromium and a 390 × 844 touch viewport.
- Axe ran on root, demo, privacy, terms, archive-limit, and 404 views in both projects. It found zero serious or critical violations.
- `npm run build`: produced `dist/` with 43.62 KB JavaScript and 19.86 KB CSS before gzip.
- Initial JavaScript is 14.47 KB gzip. CSS is 5.01 KB gzip. The largest first-screen image is 31.25 KB.
- `npm audit --audit-level=high`: zero vulnerabilities.
- Static Web Apps emulator: 200 for `/demo`, `/privacy`, `/terms`, and `/unlock`; 404 for `/404` and unknown routes.
- Local factory URL verifier: no console or page errors; one h1; `lang`, main, image alt, and button-name checks passed.
- Lighthouse 12.5.1 mobile: Performance 100, Accessibility 100, Best Practices 100, SEO 100.
- Lighthouse metrics: FCP 1.1 s, LCP 1.8 s, TBT 0 ms, CLS 0, Speed Index 1.1 s.

Lighthouse JSON: `.factory/evidence/local/lighthouse.json`.

Local screenshots: `.factory/evidence/local/home-mobile.png`, `.factory/evidence/local/demo-mobile.png`, and desktop equivalents beside them.

### Final live checks

- Factory verifier on `/`: HTTP 200, correct title, `lang="en"`, one h1, main present, no missing alt text, no unnamed buttons, and no errors.
- Factory verifier on `/demo`: HTTP 200 with title `Demo — Practice Loop Notebook` and the same clean result.
- `PLAYWRIGHT_BASE_URL=https://practice-loop-notebook.sociobot.in npm run test:claims`: 12/12 passed after the final deployment.
- Cold 390 px check: correct job headline and audience sentence, visible sample action, and no horizontal overflow.
- In-app archive-limit navigation and Back both focused the new h1 and set the correct title.
- `/404` and `/not-a-route`: HTTP 404 with `Page not found` and a notebook return link.
- `/manifest.webmanifest`: `application/manifest+json` with a one-hour revalidation policy.
- Versioned JS and WebP assets: `public, max-age=31536000, immutable`.
- Root response: CSP, Permissions-Policy, Referrer-Policy, X-Content-Type-Options, and X-Frame-Options present.
- Live JS, CSS, and hero WebP SHA-256 values match the final local `dist/` files exactly.

Live screenshots and verifier JSON: `.factory/evidence/live/root/`, `.factory/evidence/live/demo/`, and `.factory/evidence/live/404-mobile.png`.

## Run and deploy

```sh
npm ci
npm test
npm run test:claims
npm run test:e2e
npm run build
/opt/fleet/lib/deploy-static.sh practice-loop-notebook dist
```

## Billing note

The production billing API reports that this factory product is not enabled. The unverified `$12` claim and dead checkout action were removed.

The three-passage boundary and license verification contract remain fully tested with a recorded response. Existing licenses can be restored.

New purchase controls appear only when the factory enables the product and builds with `VITE_PURCHASES_ENABLED=true`. This avoids publishing a price or checkout claim that cannot currently be fulfilled.

## Known gaps

None against the cumulative review or product acceptance criteria. Billing enablement is an external factory operation and is represented honestly in the interface.
