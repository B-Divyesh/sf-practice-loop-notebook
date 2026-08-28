# Practice Loop Notebook — build handoff

Date: 2026-08-28

Work order: `practice-loop-notebook-build-1`

Deploy class: static PWA; publish `dist/`

## What shipped

- A complete local-media A/B player for browser-supported audio and video, with exact numeric markers, timeline seek, 50–125% playback speed, keyboard shortcuts, automatic loop counting, and a manual clean-pass control.
- Per-passage practice plans: steady tempo, success-based ramp, or deterministic BPM variability; target repetitions; exit criterion; and adjustable Web Audio click volume.
- IndexedDB persistence for media, markers, plans, and session evidence. A finished session records repetitions, BPM, criterion outcome, confidence, and reflection.
- Local JSON archive export/import with last-write-wins merge, CSV evidence export, reattachment flow for imported media-less records, and a copyable latest-session card.
- Installable offline PWA with versioned shell cache, runtime asset cache, static offline fallback, and update-ready notice. Saved media continues to come from IndexedDB.
- Three-passage free tier and $12 one-time unlimited archive license using the Sociobot hosted checkout/verify contract. Returned and pasted tokens are stored locally, verification is cached for one day, and offline first paint uses the cached verdict. No product IDs or payment provider scripts are embedded.
- Real static entry points for `/privacy`, `/terms`, and `/unlock`; plain-language local data, licensing, refund, and media-rights terms.
- Original pixel/demoscene visual system and generated rehearsal-desk artwork. Source, prompt, review, and provenance are in `assets/src/` and `.factory/design.md`; responsive shipping WebPs are 16 KB and 33 KB.

## How to run and verify

```sh
npm ci
npm test
npm run build
npm run test:e2e
```

`npm run build` is the deployment command. It places `index.html`, legal/unlock entry points, the manifest, service worker, icons, and hashed assets under `dist/`.

Verification completed locally:

- `npm test`: 5/5 unit tests passed.
- `npm run test:e2e`: 6/6 Playwright tests passed across desktop Chromium and a 390 × 844 mobile viewport. This covers media import, passage creation, pass/reflection logging, persistence, static/legal views, Axe scanning, and a browser-forced offline reload.
- Axe: zero serious or critical violations on notebook, privacy, terms, and unlock pages at both viewports.
- Factory `verify-url.sh`: HTTP 200, title present, `lang="en"`, exactly one h1, main landmark present, zero images missing alt, zero unlabeled buttons, and zero console/page errors.
- Lighthouse 12.5.1 mobile: Performance 100, Accessibility 100, Best Practices 100, SEO 100. FCP 0.9 s, LCP 1.7 s, TBT 0 ms, CLS 0, Speed Index 0.9 s.
- Production bundle: 35.1 KB JS (11.8 KB gzip), 17.2 KB CSS (4.5 KB gzip), 33 KB largest hero WebP. No runtime fonts or third-party CDN assets.
- `npm audit`: zero vulnerabilities.

## Privacy and operational notes

Recordings and notebook data never leave IndexedDB. Export files deliberately omit original media bytes and explain that the user must keep/reattach the source recording. The app has no analytics, tracking, ad code, or cloud sync. Only checkout navigation and license verification contact an external service.

The production billing base defaults to `https://api.sociobot.in`. Staging can set `VITE_BILLING_BASE=https://pilot-api.sociobot.in` before the factory registers/tests the product. Accessibility, core practice features, offline use, and exports are never gated.

## Known gaps / next steps

- Media codec support and practical IndexedDB quota vary by browser/device. The UI reports unreadable formats and storage failures; users should keep original media and regular notebook exports.
- Media is intentionally excluded from JSON archives to avoid huge, fragile exports. Reattachment uses the retained passage timing and plan.
- The factory must register the billing product and confirm its final displayed price matches the $12 copy before production promotion.
- Android is served as an installable PWA; no Capacitor wrapper was needed for the web-first v1.
