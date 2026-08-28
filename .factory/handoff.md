# Practice Loop Notebook — polish 2 handoff

Date: 2026-08-28
Work order: `practice-loop-notebook-polish-2`
Repair commit: `69f516a247121954e7a53571ec5f578e1046515c` (pushed to `origin/main`)
Deployed URL: <https://practice-loop-notebook.sociobot.in>
Demo URL: <https://practice-loop-notebook.sociobot.in/demo>

## Outcome

All review findings are closed. `Start for real` now removes the entire demo IndexedDB database and its demo-only license key before returning to the real notebook; real data and real license storage remain unchanged. The designed static 404 now includes complete route-specific Open Graph and Twitter metadata with the product-owned social preview. The catalog description is now a verb-first, 106-character sentence.

`polish-2.md` maps every current and historical finding to its repair and evidence. There are no known product gaps from the cumulative reviews.

## Verification

Fresh-clone verification was run from `/tmp/practice-loop-polish-2-YWuCRh` at the repair commit:

- `npm ci` completed with zero vulnerabilities.
- Every command listed in `.factory/claims.json` was run separately: 12/12 passed (`offline-reload`, `demo-no-account`, `local-private`, `local-media`, `json-export`, `csv-export`, `practice-persistence`, `plan-modes`, `session-evidence`, `free-license-boundary`, `installable-shell`, `license-contact`).
- `npm test`: 6/6 passed.
- `npm run test:e2e`: 40/40 passed, including accessibility, mobile, offline, routing, malformed archive, demo-exit, and 404 metadata regressions.
- `npm run build`: passed and created `dist/`. Production assets are 43.91 KB JavaScript (14.56 KB gzip) and 19.86 KB CSS (5.01 KB gzip).

After deployment, a cold live check was repeated:

- `verify-url.sh` passed for `/` and `/demo`: title, language, one h1, main landmark, image alt text, labelled buttons, and zero console errors. Reports and mobile/desktop screenshots are under `.factory/evidence/polish-2/root/` and `.factory/evidence/polish-2/demo/`.
- Live `npm run test:claims`: 12/12 passed. Live `npm run test:e2e`: 40/40 passed.
- `/`, `/demo`, `/privacy`, `/terms`, `/unlock`, manifest, robots, sitemap, favicon, apple touch icon, and hashed JS returned HTTP 200; an unknown route returned HTTP 404 (`.factory/evidence/polish-2/routes.txt`).
- The live 404 response contains every required OG/Twitter tag (`.factory/evidence/polish-2/404.html`) and has a mobile screenshot at `.factory/evidence/polish-2/404-mobile.png`.
- Live headers confirm the immutable asset policy, CSP, Permissions-Policy, referrer policy, MIME hardening, and `application/manifest+json` manifest MIME (`asset.headers`, `root.headers`, and `manifest.headers`).
- Axe is exercised by the Playwright accessibility test across root, demo, legal, archive-limit, and error routes; it found no serious or critical violations locally or live.
- A Lighthouse mobile report was saved at `.factory/evidence/polish-2/lighthouse-mobile.json`: performance 100, accessibility 100, FCP 0.8 s, LCP 0.8 s, CLS 0. The browser emitted a post-audit screenshot-process crash after writing the complete report; the saved audit results are intact and the independent live browser suites passed.

## Run / deploy

```sh
npm ci
npm test
npm run test:claims
npm run test:e2e
npm run build
/opt/fleet/lib/deploy-static.sh practice-loop-notebook dist
```

## Known gaps

None.
