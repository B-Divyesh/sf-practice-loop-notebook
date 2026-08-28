# Polish round 1 — finding closure

Date: 2026-08-28

Live URL: <https://practice-loop-notebook.sociobot.in>

Evidence screenshots: `.factory/evidence/live/root/screenshot-mobile.png`, `.factory/evidence/live/demo/screenshot-mobile.png`, and `.factory/evidence/live/404-mobile.png`.

| Finding | Change made | Evidence |
| --- | --- | --- |
| F-1-1 | Replaced the abstract hero with `Practice hard musical passages with a loop.` and a sentence naming instrumentalists. | `keeps the full first action and controls usable at 390 px`; live root screenshot and cold mobile check. |
| F-1-2 | Added `/demo` and `?demo=1`, three seeded passages, generated local WAV audio, persistent banner, Reset demo, Start for real, and separate demo data/license namespaces. | `@claim:demo-no-account`, `@claim:local-private`; `.factory/demo.md`; live `/demo` 200. |
| F-1-3 | Added `.factory/claims.json` with 12 observable claims and exactly one tagged test per claim. | Clean-clone run of every listed command; 12/12 local and 12/12 final live. |
| F-1-3a | Retained precise local-data copy and tested all normal-flow requests plus both IndexedDB namespaces. | `@claim:local-private`. |
| F-1-3b | Rewrote the facts as offline, account-free demo, and concrete export outcomes. | `@claim:offline-reload`, `@claim:demo-no-account`, `@claim:json-export`, `@claim:csv-export`. |
| F-1-3c | Rewrote archive help and tested JSON plan/session contents, omitted media, and local database storage. | `@claim:json-export`, `@claim:local-private`. |
| F-1-3d | Removed uncontrolled codec promises. The form now says to choose media the browser can play. A real WAV import is tested without an upload. | `@claim:local-media`. |
| F-1-3e | Replaced vague footer privacy copy with the product job. Precise privacy statements are covered elsewhere. | `@claim:local-private`; final live request audit. |
| F-1-3f | Rewrote README storage copy in plain words and tested a Blob in the isolated IndexedDB database. | `@claim:local-media`. |
| F-1-3g | Rewrote persistence copy and tested marker, speed, and plan values after reload. | `@claim:practice-persistence`. |
| F-1-3h | Rewrote plan-mode copy and seeded steady, ramp, and variable plans with observable tempos. | `@claim:plan-modes`. |
| F-1-3i | Rewrote evidence copy and tested repetition, BPM, result, confidence, and reflection in UI and IndexedDB. | `@claim:session-evidence`. |
| F-1-3j | Tested both downloads and their actual fields, rows, and omission of media bytes. | `@claim:json-export`, `@claim:csv-export`. |
| F-1-3k | Tested manifest/service-worker readiness and a forced-offline demo reload. | `@claim:installable-shell`, `@claim:offline-reload`. |
| F-1-3l | Tested the three-passage boundary and a recorded valid license response in demo-only storage. Removed the unverified `$12` and checkout claim because the live billing product returns 404. | `@claim:free-license-boundary`; live archive-limit route. |
| F-1-3m | Kept the no-tracking statement only with whole-flow request logging. | `@claim:local-private`. |
| F-1-3n | Named the only allowed external verification endpoint and tested that exact request after explicit token entry. | `@claim:license-contact`; CSP `connect-src`. |
| F-1-4 / earlier P1 | Added complete schema, date, type, length, integer, and numeric-bound validation before merge. Invalid data gets one actionable error and no write. | Unit test `rejects incomplete passages and invalid session bounds before import`; browser test `rejects a malformed archive before it reaches IndexedDB`. |
| F-1-5 | Added the tracker-styled not-found screen and Static Web Apps 404 override. Added an explicit `/404` 404 rule. | Live `/404` and `/not-a-route` both return HTTP 404; `updates route titles, heading focus, history, and unknown-route recovery`; 404 screenshot. |
| F-1-6 | Centralized route titles, focus to h1, polite announcements, scroll state, and Back/Forward restoration. | `updates route titles, heading focus, history, and unknown-route recovery`; final live focus check. |
| F-1-7 | Added canonical, OG, Twitter, 1200 × 630 original-art preview, favicon, apple-touch icon, and complete sitemap. | Metadata assertions during live inspection; all referenced assets return 200. |
| F-1-8 | Added Notebook, Demo, Privacy, and archive-limit header links. Every footer now has the one-line job, legal links, Param Factory, and build id. | Axe/crawl coverage on every route; root and demo live screenshots. |
| F-1-9 / earlier P2 | Versioned the art files and configured one-year immutable caching for all `/assets/*` output. HTML stays short-lived and the service worker is no-store. | Final live headers: JS and WebP `max-age=31536000, immutable`; matching live/local hashes. |
| F-1-10 / earlier P3 | Added CSP and Permissions-Policy response headers, strict referrer/MIME/frame policies, and explicit manifest MIME. | Final live root headers; manifest is `application/manifest+json`; no CSP console errors. |
| F-1-11 | Removed every cited metaphor, jargon label, decorative caption, and vague export phrase. Added direct headings and action copy. | `.factory/copy-audit.md`; cold first screen and live screenshot. |
| F-1-12 | Replaced the 42-word README opening with two short sentences and rewrote the behavior list in plain words. | README inspection; `.factory/copy-audit.md`. |

No earlier `.factory/polish-*.md` existed. The only earlier release findings were P1–P3 in `.factory/verification.md`; they map to F-1-4, F-1-9, and F-1-10 above.
