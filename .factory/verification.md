# Verification report — FAIL

Date: 2026-08-28
Verifier work order: `practice-loop-notebook-verify-1`
Candidate: `6f76b0ed330081bf870a25090a61441104bff9da` (`main`)
Live URL: <https://practice-loop-notebook.sociobot.in>

## Verdict

**FAIL.** The normal local-first practice flow is solid, and the live deployment is the exact candidate build, but invalid archive input is accepted, persisted, and then causes an uncaught rendering error. This fails the required invalid-input recovery and the product's stated import-validation behavior, so it is a release blocker.

## Evidence

### Clean candidate and production gates

- Started from a clean `main` checkout at the candidate SHA; `npm ci` completed with 0 audit vulnerabilities.
- `npm test`: PASS — 5/5 Vitest tests.
- `npm run build`: PASS — TypeScript no-emit check and Vite production build. Output is `dist/`; initial JS is 35,191 B (11,820 B gzip), CSS 17,153 B (4,450 B gzip), and the largest initial image is 32,880 B. All are within the stated static-PWA budgets.
- `npm run test:e2e`: PASS — 6/6 Chromium tests, desktop and 390 × 844 mobile.
- Fresh mobile Lighthouse against the production build: performance 100, accessibility 100, best practices 100, SEO 100; FCP 1.0 s, LCP 1.7 s, TBT 60 ms, CLS 0.

### Independent end-to-end and accessibility checks

- Desktop and 390 px browser smoke tests: normal WAV import, local A/B passage creation, a 99-second marker on a two-second file safely clamped to A=1.9/B=2.0, variable-tempo plan, one-pass target feedback, reflection, and IndexedDB persistence across reload all worked. Missing name/media and a `text/plain` upload produced actionable errors, then recovered successfully with a WAV file.
- Keyboard-only smoke: first Tab reaches the visible focused skip link; the desktop and mobile pages had no horizontal overflow. Reduced-motion context reduced button transition duration to 0.001 ms.
- Axe 4.10.2: no serious or critical findings on the notebook at desktop or 390 px. Normal flows emitted no console or page errors. HTML has `lang=en`, one h1, and main landmark.
- Privacy/outbound requests: an idle load made no cross-origin request. The only tested external endpoint was the explicit license verification request to `https://api.sociobot.in/api/v1/products/practice-loop-notebook/verify?...`; the buy link points to the required Sociobot checkout URL. No analytics, CDN font, or third-party runtime request was observed.

### PWA and live deployment

- Local and live service-worker-controlled offline reload: PASS. At 390 px, after installation and `context.setOffline(true)`, the live site reloaded with the notebook h1 and the “Offline · saved locally” state.
- Update path: PASS. A controlled local test server served a modified next `sw.js`; `registration.update()` produced the in-app “An update is ready. Reload when you finish this pass.” toast without page errors.
- Deployment identity: PASS. SHA-256 matched local `dist/` against the live URL for all 16 shipped non-source-map files: HTML entry points, JS, CSS, WebPs, all icons, manifest, service worker, offline page, robots, and sitemap.
- Live headers provide HTTPS/HSTS, `nosniff`, and strict-origin-when-cross-origin referrer policy. See deployment defects below for cache and policy gaps.

## Defects

### P1 — malformed product archive is accepted, persisted, and crashes when opened

**Reproduction:** On the archive page, import this product-branded v1 JSON:

```json
{"product":"practice-loop-notebook","version":1,"passages":[{"id":"malformed-passage","title":"Malformed archive record","sessions":[],"updatedAt":"2026-08-28T00:00:00.000Z"}]}
```

The importer reports it as imported and renders `undefined BPM`. Opening the new passage emits `Cannot read properties of undefined (reading 'replace')`; the requested passage does not render. The record has already been written to IndexedDB. `parseArchive` only requires `id`, `title`, and `sessions` ([src/utils.ts](/work/repo/src/utils.ts:38)); the practice view requires many more fields and calls `escapeHtml(passage.sourceNote || passage.mediaName)` ([src/main.ts](/work/repo/src/main.ts:142)).

**Impact:** A malformed, truncated, or manually edited user archive can corrupt the archive with an unusable item and trigger a client error instead of a safe rejection/recovery. This directly conflicts with the promised validated import and the acceptance contract's invalid-input recovery requirement.

**Required fix:** Validate the complete archive/passage/session schema and numeric bounds before any write, show a recoverable import error, and add an end-to-end regression test proving no invalid record reaches IndexedDB.

### P2 — production caching does not meet the immutable hashed-asset policy

The live JS, CSS, WebP, icons, manifest, and service worker all return `Cache-Control: public, must-revalidate, max-age=30`. The hashed JS/CSS assets should be long-lived immutable assets; this creates needless revalidation and does not satisfy the factory PWA performance caching policy. Configure immutable caching for fingerprinted assets while retaining a short/network-first policy for HTML and the service worker.

### P3 — response-policy/mime gaps on the live static host

The live HTML response has no `Content-Security-Policy` or `Permissions-Policy`, and `/manifest.webmanifest` is sent as `application/octet-stream` rather than a web-manifest/JSON media type. These did not block Chromium installation in this test, but should be corrected as deployment hardening.

## Retest criteria

After fixing the P1 importer, rerun `npm ci && npm test && npm run build && npm run test:e2e`, the malformed-archive reproduction above, desktop/mobile Axe, offline reload, and a fresh live hash/header comparison. The current candidate must not be promoted.
