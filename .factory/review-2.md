# Adversarial first-read review 2 — Practice Loop Notebook

Date: 2026-08-28  
Reviewer: independent first-time mobile/desktop QA  
Live URL: <https://practice-loop-notebook.sociobot.in>

## Verdict: FAIL

Two blocking findings remain. The first is a demo-sandbox data-retention defect: `Start for real` leaves the demo license token behind. The second reopens the metadata portion of earlier finding F-1-7: the styled 404 has no Open Graph or Twitter metadata. All listed claim tests pass, but a passing registry cannot override these observed defects.

## Cold first screen

Tested in fresh Chromium contexts before scrolling at 390 × 844 and 1440 × 1000.

- **What it does:** It helps a musician loop a difficult part of a recording, set a tempo, count clean passes, and save a note.
- **For whom:** Instrumentalists learning a few difficult seconds from their own recording.
- **What to click first:** `Try it with sample data`; the adjacent text says it opens a ready passage with practice history.

All three answers are present on the first screen at both sizes. The 390px page had no horizontal overflow, and the primary action was visible without scrolling. No blocking first-read ambiguity was found.

## Findings

### Blocking

#### F-2-1 — `Start for real` does not discard all demo data

**Location / quote:** Demo banner button: `Start for real`. `.factory/demo.md` says, “Start for real clears the demo database and opens the real notebook.” The demo contract requires that leaving demo mode discard demo data.

**Reproduction:** In a fresh browser context, open `/demo`, set `localStorage['demo:sb_license:practice-loop-notebook']` to `fixture-demo-token`, then click `Start for real`. The app opens `/` and `localStorage['sb_license:practice-loop-notebook']` remains `null`, but `localStorage['demo:sb_license:practice-loop-notebook']` is still `fixture-demo-token`. Re-entering demo therefore restores its license state rather than starting a discarded sample sandbox.

**Why this blocks:** The demo banner promises a temporary, non-saving sample environment. Keeping a demo entitlement after the visitor explicitly leaves the sandbox contradicts the demo-sandbox contract. It does not corrupt real storage, but it makes the sandbox state persist unexpectedly.

**Concrete fix:** In `startForReal()` in `src/main.ts`, call `clearLicense()` while `demoMode` is true, immediately after clearing demo passages and before `location.assign('/')`. Add a browser regression test that creates a demo token, clicks `Start for real`, and asserts both `demo:practice-loop-notebook` and `demo:sb_license:practice-loop-notebook` are absent while real storage is unchanged.

#### F-2-2 — 404 route has incomplete required social metadata (reopens F-1-7)

**Location / evidence:** `https://practice-loop-notebook.sociobot.in/404` returns the designed 404 with a valid title, description, canonical, favicon, and apple-touch icon. Its HTML contains no `og:title`, `og:description`, `og:image`, `twitter:card`, `twitter:title`, `twitter:description`, or `twitter:image`. The same omission is present in `404.html`.

**Why this blocks:** The required metadata contract calls for canonical, Open Graph, and Twitter metadata on every route. This is a half-fix of earlier F-1-7, which claimed complete metadata and a real 404. A shared link to the error page has no product image or social description.

**Concrete fix:** Add the same product-owned 1200 × 630 social image and route-specific Open Graph/Twitter title and description tags to `404.html`. Add a route metadata test covering `/404` and an unknown URL returning the rewritten 404.

## Copy audit

Word counts use letter/number groups. Copy was read from the live landing page and `README.md`. No listed sentence exceeds 22 words. Terminology is consistent: **passage**, **loop**, **clean pass**, **session**, **archive**, and **demo**. No landing or README button is a vague action: `Try it with sample data`, `Use my recording`, `Create loop`, `Export archive`, `Export CSV`, `Import archive`, `View the archive limit`, `Reset demo`, and `Start for real` name their result.

### Landing-page sentences

| Sentence | Words | Audit result |
| --- | ---: | --- |
| Practice hard musical passages with a loop. | 7 | Clear job headline. |
| For instrumentalists learning a few difficult seconds from their own recording. | 11 | Names audience and situation. |
| Opens a ready passage with practice history. | 7 | Listed as `demo-no-account`. |
| Works offline after the first visit. | 6 | Listed as `offline-reload`. |
| No account needed. | 3 | Listed as `demo-no-account`. |
| Export plans and session notes. | 5 | Listed as `json-export` and `csv-export`. |
| No passages yet. | 3 | Useful empty state. |
| Create a practice loop below. | 5 | Useful empty-state instruction. |
| Exports include plans and practice logs. | 6 | Listed as `json-export`. |
| They do not include the recording. | 6 | Listed as `json-export`. |
| Try “Bridge pickup run” or “Bars 17–20.” | 8 | Useful input example. |
| Choose a recording this browser can play. | 7 | Clear constraint. |
| The app stores imported media in this browser. | 8 | Listed as `local-media` and `local-private`. |
| Choose a recording. | 3 | Clear step. |
| Mark the few seconds you need. | 6 | Clear step. |
| Set the practice plan. | 4 | Clear step. |
| Pick a tempo and clean-pass target. | 7 | Clear step. |
| Save what changed. | 3 | Clear step. |
| Keep a short note for the next session. | 8 | Clear step. |
| The app has no analytics or cloud sync. | 8 | Listed as `local-private`. |
| A license check runs only after you add a license. | 10 | Listed as `license-contact`. |
| Notebook exports omit media. | 4 | Listed as `json-export`. |
| Reattach the original recording after importing an archive. | 8 | Clear import instruction. |
| Practice tools, exports, offline use, and accessibility stay free. | 9 | Covered by `free-license-boundary`; test should continue to assert that only the passage limit changes. |
| Repeat a hard musical passage and save what worked. | 9 | Concrete footer description. |
| Built by Param Factory. | 4 | Attribution. |
| Original generated pixel artwork. | 4 | Asset provenance. |

### README sentences

| Sentence | Words | Audit result |
| --- | ---: | --- |
| Practice Loop Notebook helps instrumentalists repeat a hard part of their own recording. | 13 | Clear audience and job. |
| Set a loop, choose a tempo, count clean passes, and save a note for tomorrow. | 15 | Clear outcome. |
| Stores your selected recording in this browser. | 7 | Listed as `local-media`. |
| Saves loop markers, playback speed, and the practice plan after reload. | 11 | Listed as `practice-persistence`. |
| Offers a steady tempo, a success-based increase, or a set variation pattern. | 13 | Listed as `plan-modes`. |
| Saves pass count, tempo, result, confidence, and a short note. | 10 | Listed as `session-evidence`. |
| Exports the notebook as JSON or sessions as CSV. | 9 | Listed as `json-export` and `csv-export`. |
| Omits recordings from exports so archive files stay small. | 9 | Listed as `json-export`. |
| Reopens the sample passage offline after the first visit. | 9 | Listed as `offline-reload`. |
| Stores up to three passages without a license. | 8 | Listed as `free-license-boundary`. |
| Keeps practice tools, exports, offline use, and accessibility available without a license. | 12 | Listed as `free-license-boundary`. |
| The app accepts audio or video files that the current browser can play. | 13 | Scope is clear. |
| Keep your original recording for later reattachment. | 7 | Clear instruction. |
| Open `/demo` or `/?demo=1` to load three sample passages. | 10 | Demo entry instruction. |
| Demo changes use the separate `demo:practice-loop-notebook` IndexedDB database. | 11 | Accurate for passage data; see F-2-1 for retained demo license state. |
| The banner can reset the samples or start an empty real notebook. | 12 | `Start for real` needs the F-2-1 fix to meet the full sandbox contract. |
| Use Node.js 20 or newer. | 6 | Development instruction. |
| Open the local URL printed by Vite. | 7 | Development instruction. |
| The build command writes the static product to `dist/`. | 9 | Verified. |
| It includes `/demo`, `/privacy`, `/terms`, `/unlock`, and the styled 404 response. | 11 | Verified. |
| Deploy `dist/` as the site root. | 6 | Deployment instruction. |
| The included Static Web Apps configuration supplies caching, security headers, manifest MIME, and 404 behavior. | 15 | Verified on the live host. |
| Production license verification uses `https://api.sociobot.in`. | 8 | Listed as `license-contact`. |
| Set `VITE_BILLING_BASE` only for an approved staging gateway. | 10 | Development instruction. |
| Checkout stays hidden unless the billing product is enabled and `VITE_PURCHASES_ENABLED=true` is set during the build. | 19 | Development instruction. |
| Normal use sends no cross-origin requests. | 7 | Listed as `local-private`. |
| License verification contacts only the Sociobot product verification endpoint after a token is added. | 14 | Listed as `license-contact`. |
| The app has no analytics, trackers, CDN scripts, or remote fonts. | 11 | Listed as `local-private`. |

Headings including `How it works`, `Passage archive`, `Create a practice loop`, `Your data stays in this browser`, and `Store three passages for free` name their sections without relying on mood or metaphor. I found no unlisted claim-like landing or README sentence: each observable user promise maps to the claims registry above.

## Demo, claims, and privacy verification

- `/demo`, `/?demo=1`, and the first-screen sample action all load a ready `Bach minuet shift · bars 17–20` practice view. It shows an eight-second local sample, A/B controls, 72 BPM toward 84, clean-pass target, and a completed reflection on the first screen after entry.
- The persistent banner reads `Demo — sample data, nothing is saved`, includes `Reset demo` and `Start for real`, and identifies the separate temporary notebook. Reset restores the three seeded passages. F-2-1 is the remaining leaving-demo defect.
- A fresh demo request log contained only same-origin HTML, JavaScript, CSS, and a local `blob:` media URL. No normal-demo cross-origin request occurred. The isolated claim test also writes a real-db sentinel and confirms demo changes do not alter it.
- From a clean clone at `/tmp/practice-loop-review-2-EOUOKo`, `npm ci` completed with zero vulnerabilities and all 12 commands represented in `.factory/claims.json` passed against the live demo entry point. The individual listed commands were also run from this review checkout: 12/12 passed.

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

## History retest

Every earlier review, polish, verification, and handoff record was read. The following records the fresh live/code retest rather than accepting a prior closure label.

| Earlier finding | Fresh result |
| --- | --- |
| F-1-1 | Fixed: first screen names instrumentalists and the musical-passage job. |
| F-1-2 | **Half-fixed / reopened as F-2-1:** one-click demo, sample passage, banner, reset, and separate passage database work, but leaving demo retains its license state. |
| F-1-3 | Fixed: registry exists with exactly 12 tagged observable tests; all passed from the clean clone. |
| F-1-3a | Fixed: `local-private` records normal flow requests and database isolation. |
| F-1-3b | Fixed: offline, no-account, and export facts have matching tests. |
| F-1-3c | Fixed: JSON export test asserts plans/logs and omitted media. |
| F-1-3d | Fixed: controlled WAV import and local request log are tested. |
| F-1-3e | Fixed: precise local-data statement is request-log tested. |
| F-1-3f | Fixed: selected media Blob storage is tested. |
| F-1-3g | Fixed: markers, speed, and plan persist through reload in the demo test. |
| F-1-3h | Fixed: seeded steady, ramp, and variable modes are asserted. |
| F-1-3i | Fixed: saved session fields are asserted in UI and IndexedDB. |
| F-1-3j | Fixed: JSON and CSV downloads are content-tested. |
| F-1-3k | Fixed: service-worker shell and forced-offline demo reload are tested. |
| F-1-3l | Fixed: three-passage boundary and fixture license isolation are tested. |
| F-1-3m | Fixed: normal demo request log sees no analytics/tracker/CDN/font contact. |
| F-1-3n | Fixed: the test permits only the explicit Sociobot verification endpoint after token entry. |
| F-1-4 / verification P1 | Fixed: malformed archive is rejected before IndexedDB in the current browser and unit suites. |
| F-1-5 | Fixed: `/404` and an unknown path return HTTP 404 with a styled recovery page. |
| F-1-6 | Fixed: live route/back test confirms title update and h1 focus. |
| F-1-7 | **Half-fixed / reopened as F-2-2:** primary routes have complete metadata, but 404 lacks OG/Twitter tags. |
| F-1-8 | Fixed: shared header, skip link, four-link navigation, and footer legal/product/build details are present. |
| F-1-9 / verification P2 | Fixed: hashed JavaScript/CSS return `Cache-Control: public, max-age=31536000, immutable`. |
| F-1-10 / verification P3 | Fixed: CSP, Permissions-Policy, MIME, and other response headers are present without page console errors. |
| F-1-11 | Fixed: landing headings and instructions are direct and product-specific. |
| F-1-12 | Fixed: README opening is two short plain sentences. |

## Structure and accessibility checks

- Root, demo, privacy, terms, and archive-limit routes return 200. `/404` and an unknown route return 404. `robots.txt`, sitemap, favicon, apple-touch icon, and manifest return 200.
- Root, demo, privacy, terms, and archive-limit have route titles, one h1, language, description, canonical, OG/Twitter metadata, and the original 1200 × 630 art. The 404 exception is F-2-2.
- The sitemap lists `/`, `/demo`, `/privacy`, `/terms`, and `/unlock`. Header/footer are consistent. The product-specific tracker desk, pixel art, and instrument-control layout are distinct rather than a generic SaaS template.
- Internal landing links crawled to 200 or intentional 404 only. The accessibility route/history test passed live: navigating to archive limit and Back focuses the new h1 and changes the title. No live load console errors were observed at mobile or desktop.

## Missed leverage

No additional AI feature is expected. The brief is deliberately local and offline; a remote drafting or analysis feature would not improve the primary job enough to justify its privacy and connectivity cost. The clearly implied export feature already exists as JSON and CSV. Cloud sync would conflict with the local-first promise rather than be an obvious omission.

## What would make this perfect

Discard the demo license when leaving demo mode, complete 404 social metadata, add the two targeted regression tests, then rerun every claim command and the 404 metadata check. With those two findings closed, the site would have no remaining first-read, sandbox, claim, routing, metadata, or product-scope findings from this review.
