# Adversarial first-read review 1 — Practice Loop Notebook

Date: 2026-08-28
Reviewer: independent first-time mobile/desktop QA
Live URL: <https://practice-loop-notebook.sociobot.in>

## Verdict: FAIL

The product is visually distinct and the normal local-file flow has passing local tests, but it is not tryable in one click, has no claims registry or claim tests, and still accepts a malformed archive that crashes the app. There are also routing, metadata, copy, and deployment findings below. `PASS` requires zero findings; this review has blocking and minor findings.

## Cold first screen

Tested in new Chromium contexts at 390 × 844 and 1440 × 1000 before scrolling.

- **What it does:** A visitor can infer that it loops a part of their own recording, counts repetitions, and keeps a practice note.
- **For whom:** **Not clear enough.** The first screen never names instrumentalists, musicians, or someone learning a difficult passage. The only audience cue is the jargon-heavy eyebrow, “A deliberate-practice loop station.”
- **What to click first:** “Set up a passage” is visible, but it immediately requires the visitor’s own audio/video file. There is no sample path.

This fails the required first-read test because a cold visitor cannot answer *for whom* from the first screen, and cannot try the product without personal media. Exact text that fails the audience test: “A deliberate-practice loop station” and “Turn a tricky few seconds into a clear next step.”

## Findings

### Blocking

#### F-1-1 — First-screen audience is unnamed

**Location / quote:** landing eyebrow and hero: “A deliberate-practice loop station”; “Turn a tricky few seconds into a clear next step.”

**Why:** Neither line says this is for instrumentalists learning a difficult musical passage. “Loop station” and “tempo plan” require prior musical-product knowledge. A first-time visitor cannot reliably identify whether this is for music, exercise, study, or audio editing.

**Fix:** Use a ≤9-word job headline and a ≤22-word audience sentence, for example:

> Practice hard musical passages with a loop.
> For instrumentalists learning a few difficult seconds from their own recording.

Place it beside the primary action and retain the product name in the header, not as the h1.

#### F-1-2 — No one-click isolated sample demo

**Location / evidence:** Landing primary action is “Set up a passage”; it requires “Your audio or video file.” Fresh visits to both `/demo` and `/?demo=1` returned the ordinary empty landing page with h1 “Turn a tricky few seconds into a clear next step.” Neither showed sample passages, a demo banner, Reset demo, or Start for real. `rg` finds no demo implementation or `.factory/demo.md`; `src/db.ts` uses only the real `practice-loop-notebook` IndexedDB name.

**Why:** A visitor without a prepared recording cannot see the product working in 30 seconds. There is no demonstration of looping, the tempo plan, repetitions, or a reflection. Because there is no separate demo storage namespace, sandbox isolation and “real data untouched” cannot be verified.

**Fix:** Add `/demo` (and `?demo=1` if retained) that immediately opens a realistic seeded passage and its completed practice history. Display the persistent banner `Demo — sample data, nothing is saved`, with `Reset demo` and `Start for real`. Store it under a separate `demo:` namespace and document the route, seed, reset behavior, and namespace in `.factory/demo.md`. Add browser tests proving demo writes never read or write the real namespace.

#### F-1-3 — Required claims inventory and claim tests are absent

**Location / evidence:** `.factory/claims.json` does not exist. Therefore there are no `@claim:<id>` tests and no listed test commands to run from a clean clone. The existing `npm test`, `npm run build`, and `npm run test:e2e` pass, but none is a claims test or uses a demo entry point.

**Why:** Visitors are asked to rely on offline, privacy, export, storage, pricing, and media-format behavior that cannot be independently verified using the required sandbox.

**Fix:** Create `.factory/claims.json`, give each claim exactly one tagged observable test, and run every listed command against the demo. At minimum, add demo-based tests for offline reload, JSON export, CSV export, no cross-origin request during normal demo use, real/demo namespace separation, and the free-tier/licensing behavior. Remove any copy whose claim cannot be tested.

The following are unlisted claim findings (each has no `claims.json` entry):

| Id | Exact quote and location | Concrete test/fix |
| --- | --- | --- |
| F-1-3a | Landing hero: “Everything stays on this device.” | Record all requests throughout demo use; assert only same-origin requests. |
| F-1-3b | Landing facts: “Offline”; “No account”; “Own your export”. | Test offline reload, account-free demo path, and each stated export outcome; rewrite “Own your export” as “Export your plans and session notes” if that is the actual scope. |
| F-1-3c | Landing archive: “Saved locally”; “Archive exports include plans and practice logs, not the original media file.” | Assert the storage destination and a JSON export containing plans/logs but no media bytes. |
| F-1-3d | Landing importer: “MP3, WAV, M4A, MP4, or another format your browser plays”; “Imported media never leaves this browser.” | Test supported bundled sample(s) and privacy request logging; do not promise codec support that cannot be controlled. |
| F-1-3e | Landing footer: “Your recordings and notes stay on this device.” | Cover it with the same full-flow outgoing-request test. |
| F-1-3f | README: “Imports user-controlled audio/video into IndexedDB; nothing is uploaded.” | Demonstrate an import in demo and inspect requests/storage. |
| F-1-3g | README: “Repeats exact A/B markers and keeps marker, speed, and plan changes across reloads.” | Assert A/B playback positions and persistence after reload. |
| F-1-3h | README: “Supports steady, success-based tempo ramp, and deterministic variable-tempo practice.” | Seed each plan and assert the displayed, computed tempos. |
| F-1-3i | README: “Logs session repetitions, tempo, criterion result, confidence, and reflection.” | Complete a demo session and assert every exported/displayed field. |
| F-1-3j | README: “Exports the full notebook as JSON or session evidence as CSV.” | Download each format and assert their headers/content. |
| F-1-3k | README: “Installs as a PWA and opens saved passages offline.” | Use a controlled service worker, demo seed, then forced-offline reload. |
| F-1-3l | README: “Includes three saved passages free. A $12 one-time Sociobot license unlocks an unlimited archive; practice tools, export, offline use, and accessibility remain free.” | Test the three-passage boundary and an isolated recorded license fixture; verify the displayed price with the billing product before publication. |
| F-1-3m | README: “There are no analytics, trackers, CDN scripts, or remote fonts.” | Record every request and assert no third-party resource/contact occurs in the whole demo flow. |
| F-1-3n | README: “The only runtime network contact is an explicit checkout or background verification of an installed license.” | Request-log normal and licensed flows; list the allowed Sociobot endpoint explicitly. |

#### F-1-4 — Earlier P1 malformed-archive finding remains unfixed

**History checked:** `.factory/handoff.md` and `.factory/verification.md`, both dated 2026-08-28, report the malformed-import crash. No earlier `review-*.md` or `polish-*.md` files exist.

**Live reproduction:** In a fresh context, importing

```json
{"product":"practice-loop-notebook","version":1,"passages":[{"id":"malformed-passage","title":"Malformed archive record","sessions":[],"updatedAt":"2026-08-28T00:00:00.000Z"}]}
```

adds a row showing `undefined BPM`. Opening it changes the URL to `/?passage=malformed-passage`, renders the landing page instead of the passage, and emits `Cannot read properties of undefined (reading 'replace')`. The live source matches the incomplete checks in `src/utils.ts:38` and app rendering in `src/main.ts:142` described by the prior verifier.

**Why:** A truncated or edited archive is written to real storage and can leave an unusable record. This is both a regression/retest failure and a first-time recovery failure.

**Fix:** Validate every passage and session field plus numeric bounds before any write; reject invalid data with one actionable error; add a regression test asserting neither IndexedDB nor the UI contains an invalid record after import.

#### F-1-5 — There is no designed 404; unknown URLs silently become the home page

**Location / evidence:** Fresh direct visits to `/404` and `/not-a-route` both returned HTTP 200 and the normal landing h1. The repository has no `404.html` or `staticwebapp.config.json`.

**Why:** A bad/deep link claims success but silently sends a user to the wrong place. This is broken route behavior, not a recoverable 404.

**Fix:** Ship a styled 404 route/page with a clear “Page not found” h1 and a return-to-notebook link. Configure the static host’s 404 rewrite/response as required, while retaining the navigation fallback only for valid SPA routes.

### Minor / release-quality findings

#### F-1-6 — In-app navigation does not update title or move focus to the new h1

**Location / evidence:** Clicking “Get full archive” changes the URL to `/unlock` but leaves the title `Practice Loop Notebook — deliberate passage practice`; focus remains on `BODY`. Going Back also leaves focus on `BODY`. `src/main.ts` calls `history.pushState` and `render()` without title, focus, announcement, or scroll-restoration handling.

**Why:** Browser history and screen-reader users receive no route change context. Direct `/unlock` has a correct static title, so the inconsistency is observable only during normal SPA navigation.

**Fix:** On every client-side route change, set the route title, restore/save scroll for history entries, focus the new h1 (with a temporary `tabindex="-1"`), and announce its title via an exposed polite live region. Test click, Back, and direct deep links.

#### F-1-7 — Required metadata and route discoverability are incomplete

**Location / evidence:** Live root has no canonical link and no Open Graph or Twitter metadata. It has an icon link to `/icon-192.png`, but `/favicon.ico` is 404 and there is no apple-touch icon. `public/sitemap.xml` lists only `/`, `/privacy`, and `/terms`; it omits `/unlock` and the required future `/demo`.

**Why:** This fails the required site metadata contract and makes shared links/install identity weaker.

**Fix:** Add a canonical URL, OG/Twitter title/description and a 1200 × 630 product-art image, valid favicon and 180px apple-touch icon, then list every public route in the sitemap.

#### F-1-8 — Header/footer do not meet the required shared skeleton

**Location / quote:** Every page header contains only “Notebook” and “Get full archive”; Privacy is footer-only. The footer says “Original pixel artwork generated for this product.” but has neither the required product one-line explanation nor “Built by Param Factory” and a version/build id.

**Why:** Legal/privacy navigation is not consistently available in the primary navigation, and the standard site identity/handoff information is incomplete.

**Fix:** Add a visible Privacy link to the header (keeping no more than four links). Add a concrete product one-liner, Privacy, Terms, `Built by Param Factory`, and a version/build id to every footer.

#### F-1-9 — Prior deployment P2 cache finding remains unfixed

**History / live evidence:** The verification handoff identifies this as P2. Live fingerprinted JS, CSS, and WebP assets each return `Cache-Control: public, must-revalidate, max-age=30`.

**Why:** Hashed assets are repeatedly revalidated instead of benefiting from long-lived immutable caching.

**Fix:** Configure immutable long-lived caching for fingerprinted assets; retain a short/network-first policy for HTML and the service worker. Recheck headers after deployment.

#### F-1-10 — Prior deployment P3 response-policy and manifest-MIME finding remains unfixed

**History / live evidence:** The verification handoff identifies this as P3. Live HTML has no `Content-Security-Policy` or `Permissions-Policy`; `/manifest.webmanifest` is `application/octet-stream`.

**Why:** These are avoidable PWA/security hardening gaps and do not meet the required response policy contract.

**Fix:** Configure a CSP matching only product resources and a suitable Permissions-Policy as response headers, then serve the manifest as `application/manifest+json` (or valid JSON manifest MIME). Do not place `frame-ancestors` in a meta tag.

#### F-1-11 — Landing copy contains jargon, metaphors, and unverifiable marketing rather than plain instructions

**Location / quotes:** “A deliberate-practice loop station”; “A passage, a constraint, a trace of progress.”; “Your first difficult few seconds belong here.”; “Set the passage on the stand”; “Private by design.”; “Own your export”.

**Why:** These either require domain knowledge, describe a mood rather than a product section, or make a claim without explaining the user result. “Set the passage on the stand” is especially unclear as a section heading when heard alone.

**Fix:** Replace them respectively with `Practice a difficult musical passage`, delete the figcaption, `No passages yet. Create one below.`, `Create a practice loop`, `Your data stays in this browser` (only after its claim test), and `Export your plans and session notes` (only after its claim test).

#### F-1-12 — README opening sentence is 42 words and uses product jargon

**Location / quote:** README first paragraph: “Practice Loop Notebook is a private, offline-first passage looper for instrumentalists learning a difficult few seconds from their own recording. It combines A/B playback, adjustable speed, a metronome ramp or controlled-variability plan, automatic/manual repetition counts, exit criteria, and a durable reflection history.”

**Why:** It exceeds the 22-word hard cap, joins two ideas, and uses `offline-first`, `passage looper`, `A/B`, `controlled-variability`, and `exit criteria` before explaining their value.

**Fix:** Replace it with short, direct sentences, for example: `Practice Loop Notebook helps instrumentalists repeat a hard part of their own recording. Set a loop, choose a tempo, count clean passes, and save a note for tomorrow.` Put detailed controls in a later “What it does” list.

## Copy audit

Word counts use tokens made of letters/numbers (hyphenated/slashed terms count as one). “Flag” identifies a finding above or an unlisted claim in F-1-3. Headings and controls without sentence punctuation are listed separately because they are still first-read copy.

### Landing sentences

| # | Sentence | Words | Flag / proposed rewrite |
| --- | --- | ---: | --- |
| L1 | Turn a tricky few seconds into a clear next step. | 10 | F-1-1: `Practice hard musical passages with a loop.` |
| L2 | Loop your own recording, count focused passes, follow a tempo plan, and leave evidence for tomorrow. | 16 | F-1-1/F-1-3a: name instrumentalists; split and test any privacy claim. |
| L3 | Everything stays on this device. | 5 | F-1-3a: retain only with a request-log test. |
| L4 | A passage, a constraint, a trace of progress. | 8 | F-1-11: delete; it carries no usable information. |
| L5 | No passages yet. | 3 | No flag. |
| L6 | Your first difficult few seconds belong here. | 7 | F-1-11: `Create a practice loop below.` |
| L7 | Archive exports include plans and practice logs, not the original media file. | 12 | F-1-3c: retain only with an export-content test. |
| L8 | Try “Bridge pickup run” or “Bars 17–20.” | 8 | No flag. |
| L9 | MP3, WAV, M4A, MP4, or another format your browser plays. | 10 | F-1-3d: scope to tested formats or say `Choose a recording your browser can play.` |
| L10 | Imported media never leaves this browser. | 6 | F-1-3d: retain only with a full request-log test. |
| L11 | Private by design. | 3 | F-1-11: delete or replace with a precise, tested fact. |
| L12 | Your recordings and notes stay on this device. | 8 | F-1-3e: retain only with a privacy test. |
| L13 | Original pixel artwork generated for this product. | 7 | No visitor-facing benefit; remove from footer or move provenance to credits. |

### Landing headings, facts, and controls

| Copy | Words | Flag / proposed rewrite |
| --- | ---: | --- |
| A deliberate-practice loop station | 4 | F-1-11 jargon: `Practice a difficult musical passage`. |
| Set up a passage | 4 | F-1-2: replace primary CTA with `Try it with sample data`; state the result beside it. |
| Offline | 1 | F-1-3b unlisted claim; use `Works offline after first visit` only with its test. |
| No account | 2 | F-1-3b unlisted claim; test the full demo flow. |
| Own your export | 3 | F-1-11/F-1-3b: `Export your plans and session notes`. |
| Saved locally | 2 | F-1-3c unlisted claim; `Stored in this browser` after test. |
| Passage archive | 2 | No flag. |
| New loop | 2 | Replace with `New practice loop` for context. |
| Set the passage on the stand | 6 | F-1-11 metaphor: `Create a practice loop`. |
| Choose a local recording | 4 | No flag. |
| Create loop | 2 | No flag. |

### README sentences

| # | Sentence | Words | Flag / proposed rewrite |
| --- | --- | ---: | --- |
| R1 | Practice Loop Notebook is a private, offline-first passage looper for instrumentalists learning a difficult few seconds from their own recording. It combines A/B playback, adjustable speed, a metronome ramp or controlled-variability plan, automatic/manual repetition counts, exit criteria, and a durable reflection history. | 42 | F-1-12: replace with the two proposed plain sentences. |
| R2 | Imports user-controlled audio/video into IndexedDB; nothing is uploaded. | 8 | F-1-3f: `Stores your selected recording in this browser.` Explain IndexedDB later if needed. |
| R3 | Repeats exact A/B markers and keeps marker, speed, and plan changes across reloads. | 13 | F-1-3g: `Set a start and end point. Your loop and plan are saved after reload.` |
| R4 | Supports steady, success-based tempo ramp, and deterministic variable-tempo practice. | 9 | F-1-3h: `Choose a steady tempo, raise it after success, or vary it by a set pattern.` |
| R5 | Logs session repetitions, tempo, criterion result, confidence, and reflection. | 9 | F-1-3i: `Save your pass count, tempo, confidence, and a short note.` |
| R6 | Exports the full notebook as JSON or session evidence as CSV. | 11 | F-1-3j: `Export your notebook as JSON or sessions as CSV.` |
| R7 | Media is intentionally omitted from portable exports and can be reattached after import. | 13 | F-1-3j: `Exports do not include recordings. Attach the original recording after import.` |
| R8 | Installs as a PWA and opens saved passages offline. | 9 | F-1-3k: `Install the app and reopen saved passages offline.` |
| R9 | Includes three saved passages free. | 5 | F-1-3l: `The free notebook stores up to three passages.` |
| R10 | A $12 one-time Sociobot license unlocks an unlimited archive; practice tools, export, offline use, and accessibility remain free. | 18 | F-1-3l: split pricing from what remains free and test both. |
| R11 | Requires Node.js 20 or newer. | 6 | No flag (developer setup). |
| R12 | Open the URL Vite prints. | 5 | No flag (developer setup). |
| R13 | Browsers decide which local media codecs they can play; MP3, WAV, M4A, and MP4 are the most portable choices. | 19 | F-1-3d: define codec or use `file format`; retain tested formats only. |
| R14 | The exact deployment build command is npm run build. | 9 | No flag. |
| R15 | Deploy the resulting dist/ directory as a static site with index.html at its root. | 15 | No flag. |
| R16 | /privacy, /terms, and /unlock also have static HTML entry points. | 10 | No flag, but add `/demo` when built. |
| R17 | Set VITE_BILLING_BASE at build time only when staging against the pilot billing API. | 15 | No flag (developer setup). |
| R18 | Production defaults to https://api.sociobot.in; no product ID or payment-provider client code is embedded. | 16 | No flag (developer integration note). |
| R19 | There are no analytics, trackers, CDN scripts, or remote fonts. | 10 | F-1-3m: retain only with whole-flow request logging. |
| R20 | The only runtime network contact is an explicit checkout or background verification of an installed license. | 16 | F-1-3n: retain only with logged normal/licensed flows. |
| R21 | See the visual system, the delivery handoff, and the MIT license. | 11 | No flag. |

## Demo, privacy, and claims verification

- The normal fresh landing load made four same-origin requests: HTML, hashed JS, hashed CSS, and the product WebP. It produced no console errors. This is not a proof of the page’s privacy claims because there is no demo flow and no claim test.
- `/demo` and `?demo=1` are not demo routes in practice; both show the empty normal notebook and no sandbox notice.
- Demo data cannot be checked offline or against real storage because no sample seed, banner, reset action, demo storage prefix, or demo documentation exists.
- Claim commands run: **none**. `.factory/claims.json` is missing, so the required list of commands is absent. Baseline commands run from this clean dependency install: `npm test` PASS (5 tests), `npm run build` PASS (`dist/` produced), `npm run test:e2e` PASS (6 tests). These passing checks do not negate F-1-2 through F-1-4.

## Site and accessibility checks

- Root title and description are present; `lang="en"`, one h1, `<main>`, responsive image alt text, and no load console errors were observed.
- The mobile visual treatment is original and product-specific: dark tracker-style panels, pixel rehearsal-desk art, and instrument-like controls. It does **not** present as a generic SaaS template.
- Local landing links to `/`, `/unlock`, `/privacy`, and `/terms` returned 200. The favicon URL check at `/favicon.ico` returned 404; see F-1-7. The billing checkout link was not followed because a review must not start a purchase.
- The current visual system’s source/provenance in `.factory/design.md` is present and consistent with the live presentation.

## Missed leverage

No additional AI feature is required: the brief is a local, offline practice tool and the existing product scope already includes the plainly implied export. Adding an AI feature would be decorative rather than necessary. The clearly implied missing capability is the sample demo in F-1-2, not AI or cloud sync.

## What would make this perfect

Provide a one-click, genuinely isolated sample passage that visibly loops, shows a tempo plan and completed reflection, then reset it without touching real data. Name instrumentalists directly in the first screen. Back every behavior/privacy/pricing statement with a demo-based claim test. Reject malformed archives before storage. Complete real 404, navigation focus/title behavior, metadata, and host headers. Then re-run the whole checklist from a fresh browser and clean clone with no remaining findings.
