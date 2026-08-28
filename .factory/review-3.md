# Adversarial first-read review 3 — Practice Loop Notebook

Date: 2026-08-28
Reviewer: independent first-time mobile/desktop QA
Live URL: <https://practice-loop-notebook.sociobot.in>

## Verdict: PASS

No blocking or minor finding remains. This was a full retest, not a diff-only review. The fresh mobile and desktop first-read checks, demo sandbox, every registered claim command, historical findings, structure, metadata, routing, privacy request log, accessibility suite, and build all passed.

## Cold first screen

Tested in new Chromium contexts before scrolling at 390 × 844 and 1440 × 900.

- **What it does:** It lets a musician loop a difficult part of their own recording, choose a tempo, count clean passes, and save a note.
- **For whom:** Instrumentalists learning a few difficult seconds from their own recording.
- **What to click first:** `Try it with sample data`; the adjacent sentence says, “Opens a ready passage with practice history.”

All three answers are visible without scrolling at both sizes. The exact first-screen copy is direct: “Practice hard musical passages with a loop.” and “For instrumentalists learning a few difficult seconds from their own recording.” The primary action has a 44 px-or-larger target, and the 390 px layout has no horizontal overflow.

## Copy audit

Words are counted as letter/number groups. No landing or README sentence exceeds 22 words. No banned marketing term, unexplained metaphor, inconsistent core term, or non-result-naming landing/README button was found. Observable promises map to the registry in `.factory/claims.json` as noted.

### Landing-page sentences

| Copy | Words | Result |
| --- | ---: | --- |
| Practice hard musical passages with a loop. | 7 | Clear job headline. |
| For instrumentalists learning a few difficult seconds from their own recording. | 10 | Clear audience and situation. |
| Opens a ready passage with practice history. | 7 | `demo-no-account`. |
| Works offline after the first visit. | 6 | `offline-reload`. |
| No account needed. | 3 | `demo-no-account`. |
| Export plans and session notes. | 5 | `json-export`, `csv-export`. |
| No passages yet. | 3 | Useful empty state. |
| Create a practice loop below. | 5 | Useful next step. |
| Exports include plans and practice logs. | 7 | `json-export`. |
| They do not include the recording. | 6 | `json-export`. |
| Try “Bridge pickup run” or “Bars 17–20.” | 8 | Useful input example. |
| Choose a recording this browser can play. | 7 | `local-media`. |
| The app stores imported media in this browser. | 8 | `local-media`, `local-private`. |
| Choose a recording. | 3 | Clear first workflow step. |
| Mark the few seconds you need. | 6 | Clear workflow step. |
| Set the practice plan. | 4 | Clear workflow step. |
| Pick a tempo and clean-pass target. | 6 | Clear workflow step. |
| Save what changed. | 3 | Clear workflow step. |
| Keep a short note for the next session. | 8 | `session-evidence`. |
| The app has no analytics or cloud sync. | 8 | `local-private`. |
| A license check runs only after you add a license. | 10 | `license-contact`. |
| Notebook exports omit media. | 4 | `json-export`. |
| Reattach the original recording after importing an archive. | 8 | Direct import instruction. |
| Practice tools, exports, offline use, and accessibility stay free. | 9 | `free-license-boundary`. |
| Repeat a hard musical passage and save what worked. | 9 | Concrete footer description. |
| Built by Param Factory. | 4 | Attribution. |
| Original generated pixel artwork. | 4 | Asset provenance. |

Headings (`Passage archive`, `Create a practice loop`, `How it works`, `Your data stays in this browser`, and `Store three passages for free`) name their sections. Controls name results: `Try it with sample data`, `Use my recording`, `Create loop`, `Export archive`, `Export CSV`, `Import archive`, `Reset demo`, and `Start for real`. Terminology is consistent: **passage**, **loop**, **clean pass**, **session**, **archive**, **demo**, and **license**.

### README sentences

| Copy | Words | Result |
| --- | ---: | --- |
| Practice Loop Notebook helps instrumentalists repeat a hard part of their own recording. | 13 | Clear job and audience. |
| Set a loop, choose a tempo, count clean passes, and save a note for tomorrow. | 15 | Clear outcome. |
| Stores your selected recording in this browser. | 7 | `local-media`. |
| Saves loop markers, playback speed, and the practice plan after reload. | 11 | `practice-persistence`. |
| Offers a steady tempo, a success-based increase, or a set variation pattern. | 13 | `plan-modes`. |
| Saves pass count, tempo, result, confidence, and a short note. | 10 | `session-evidence`. |
| Exports the notebook as JSON or sessions as CSV. | 9 | `json-export`, `csv-export`. |
| Omits recordings from exports so archive files stay small. | 9 | `json-export`. |
| Reopens the sample passage offline after the first visit. | 9 | `offline-reload`. |
| Stores up to three passages without a license. | 8 | `free-license-boundary`. |
| Keeps practice tools, exports, offline use, and accessibility available without a license. | 12 | `free-license-boundary`. |
| The app accepts audio or video files that the current browser can play. | 13 | Scoped browser capability; `local-media` imports a playable WAV without a request. |
| Keep your original recording for later reattachment. | 7 | Direct import instruction. |
| Open `/demo` or `/?demo=1` to load three sample passages. | 10 | Demo entry; the demo and plan-mode checks inspect all three samples. |
| Demo changes use the separate `demo:practice-loop-notebook` IndexedDB database. | 11 | `local-private`. |
| The banner can reset the samples or start an empty real notebook. | 12 | Confirmed manually and by the demo-exit suite. |
| See the demo contract. | 4 | Useful documentation link. |
| Use Node.js 20 or newer. | 6 | Development instruction. |
| Open the local URL printed by Vite. | 7 | Development instruction. |
| The build command writes the static product to `dist/`. | 9 | Confirmed. |
| It includes `/demo`, `/privacy`, `/terms`, `/unlock`, and the styled 404 response. | 11 | Confirmed. |
| Deploy `dist/` as the site root. | 6 | Deployment instruction. |
| The included Static Web Apps configuration supplies caching, security headers, manifest MIME, and 404 behavior. | 15 | Confirmed live. |
| Production license verification uses `https://api.sociobot.in`. | 8 | `license-contact`. |
| Set `VITE_BILLING_BASE` only for an approved staging gateway. | 10 | Development instruction. |
| Checkout stays hidden unless the billing product is enabled and `VITE_PURCHASES_ENABLED=true` is set during the build. | 19 | Development instruction. |
| Normal use sends no cross-origin requests. | 7 | `local-private`. |
| License verification contacts only the Sociobot product verification endpoint after a token is added. | 14 | `license-contact`. |
| The app has no analytics, trackers, CDN scripts, or remote fonts. | 11 | `local-private`. |

## Demo, claims, and sandbox behaviour

`/demo`, `/?demo=1`, and the hero action each open `Bach minuet shift · bars 17–20` immediately. The first screen is already a working practice view with local generated audio, A/B loop controls, a 72 BPM-to-84 BPM plan, a clean-pass target, and a realistic completed reflection.

The persistent banner says, “Demo — sample data, nothing is saved,” names the separate temporary notebook, and provides `Reset demo` and `Start for real`. In a new live context, I saved a new demo reflection, reset the demo, and confirmed that the added reflection disappeared while the original Bach reflection returned. The request log for that entire flow contained only same-origin requests. The registered isolation test independently confirms a real-database sentinel is unchanged by demo writes; the demo-exit test confirms that both demo IndexedDB and demo license storage are discarded while real license storage is retained.

From a clean clone at `/tmp/practice-loop-review-3-hEOz5q`, all commands listed in `.factory/claims.json` passed individually:

| Claim id | Result |
| --- | --- |
| `offline-reload` | PASS |
| `demo-no-account` | PASS |
| `local-private` | PASS |
| `local-media` | PASS |
| `json-export` | PASS |
| `csv-export` | PASS |
| `practice-persistence` | PASS |
| `plan-modes` | PASS |
| `session-evidence` | PASS |
| `free-license-boundary` | PASS |
| `installable-shell` | PASS |
| `license-contact` | PASS |

The clean-clone local gates also passed: `npm test` (6 tests) and `npm run build`. The build creates `dist/`; initial JavaScript is 43.91 kB (14.56 kB gzip). The complete live suite was then run with `PLAYWRIGHT_BASE_URL=https://practice-loop-notebook.sociobot.in npm run test:e2e`: 40/40 passed (`test-results/.last-run.json` reports `passed`).

## History retest

Every earlier review, polish record, verification report, and handoff was read. The following records fresh code and live checks, not a prior status label.

| Earlier finding | Fresh result |
| --- | --- |
| F-1-1 | Fixed: the hero names both the musical job and instrumentalist audience. |
| F-1-2 | Fixed: isolated one-click demo, ready sample, persistent banner, reset, and real-data exit all work. |
| F-1-3 | Fixed: `claims.json` has 12 claims with tagged observable tests; every listed command passed. |
| F-1-3a | Fixed: normal-flow request log and real/demo IndexedDB isolation pass. |
| F-1-3b | Fixed: offline, account-free demo, and export facts have passing tests. |
| F-1-3c | Fixed: JSON export includes plans/logs and excludes recording bytes. |
| F-1-3d | Fixed: a playable local WAV is stored as a Blob without an upload. |
| F-1-3e | Fixed: local-data wording is covered by request-log and namespace checks. |
| F-1-3f | Fixed: README media storage is verified by Blob inspection. |
| F-1-3g | Fixed: markers, speed, and plan survive reload. |
| F-1-3h | Fixed: steady, ramp, and variable plans are seeded and asserted. |
| F-1-3i | Fixed: every saved session field is asserted in the UI and IndexedDB. |
| F-1-3j | Fixed: JSON and CSV download contents are asserted. |
| F-1-3k | Fixed: manifest, service worker, and forced-offline demo reload pass. |
| F-1-3l | Fixed: three-passage boundary and demo-only fixture unlock pass. |
| F-1-3m | Fixed: normal demo flow makes no analytics/tracker/CDN/font contact. |
| F-1-3n | Fixed: only the explicit Sociobot verification endpoint is allowed after token entry. |
| F-1-4 / verification P1 | Fixed: malformed archive is rejected before it reaches IndexedDB. |
| F-1-5 | Fixed: `/404` and an unknown URL return a designed HTTP 404 with recovery. |
| F-1-6 | Fixed: in-app navigation and Back update title and focus the new h1. |
| F-1-7 | Fixed: root, demo, legal, archive-limit, and 404 routes have canonical, description, OG/Twitter image metadata, favicon, and apple-touch icon. |
| F-1-8 | Fixed: consistent header, skip link, legal links, descriptive footer, Param Factory attribution, and build id are present. |
| F-1-9 / verification P2 | Fixed: fingerprinted art is served with `max-age=31536000, immutable`. |
| F-1-10 / verification P3 | Fixed: CSP, Permissions-Policy, referrer and MIME hardening are present without application console errors. |
| F-1-11 | Fixed: landing copy is direct and product-specific. |
| F-1-12 | Fixed: the README starts with short, plain sentences. |
| F-2-1 | Fixed: `Start for real` removes both demo namespaces and preserves real storage. |
| F-2-2 | Fixed: the static 404 has route-specific Open Graph and Twitter metadata. |

## Structure, accessibility, and visual identity

- `/`, `/demo`, `/privacy`, `/terms`, and `/unlock` return 200. `/404` and an unknown route return 404 with the designed recovery view.
- All inspected routes have `lang=en`, one h1, one main landmark, a title, meta description, canonical, OG/Twitter card metadata, favicon, and apple-touch icon. Root uses `Practice Loop Notebook — Loop Musical Passages`; legal and demo routes use their route-specific titles.
- The sitemap lists every public 200 route. The crawl found no dead HTTP links; the two email links are intentional `mailto:` links.
- The root response has a matching CSP, `frame-ancestors 'none'` response header, Permissions-Policy, `nosniff`, and strict-origin referrer policy. The manifest is `application/manifest+json`.
- The live 40-test suite covers keyboard/focus routing, 390 px layout, reduced motion, serious/critical Axe checks on core, demo, legal, archive-limit, and error views, malformed imports, offline reload, and demo exit. No application console errors occurred on the normal root/demo/legal routes. Browser reporting of the expected HTTP 404 response is not treated as an application error.
- The dark tracker-desk layout, pixel instrument art, monospaced metadata, striped practice lane, and warm/lilac control palette are distinct from a generic SaaS template and match the recorded design direction.

## Missed leverage

No missing AI feature was found. The brief is intentionally offline and local-first; an AI step or cloud sync would add connectivity and privacy cost without improving the core loop-and-reflection job. The implied portability feature is present as JSON and CSV export.

## What would make this perfect

Keep the current exact claim, demo-isolation, route-metadata, and mobile-accessibility checks in continuous verification as the product changes. No additional visitor-facing feature, copy, routing, privacy, or visual change is required by this review.
