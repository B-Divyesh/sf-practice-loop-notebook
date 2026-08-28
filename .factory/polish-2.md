# Polish round 2 — complete finding closure

Date: 2026-08-28
Repair commit: `69f516a247121954e7a53571ec5f578e1046515c`
Live URL: <https://practice-loop-notebook.sociobot.in>

This round reread `review-1.md`, `polish-1.md`, `review-2.md`, and the prior verification/handoff records. The two remaining review-2 blockers were repaired; every earlier finding was also retested against the deployed site.

| Finding id | Change made / retained fix | Evidence |
| --- | --- | --- |
| F-1-1 | Kept the direct seven-word musical-passage headline and named instrumentalists beside the first action. | `keeps the full first action and controls usable at 390 px`; live root screenshot `evidence/polish-2/root/screenshot-mobile.png`. |
| F-1-2 | Kept `/demo` and `?demo=1`, ready sample passage, banner, reset, real/demo namespaces; leaving now deletes the full demo namespace. | `@claim:demo-no-account`, `discards every demo namespace when starting for real`; live `/demo` and `/?demo=1` checks; demo screenshot. |
| F-1-3 | Kept the 12-entry `claims.json` registry, each with one tagged observable demo test. | Fresh-clone run: all 12 listed commands passed individually; live `npm run test:claims` 12/12. |
| F-1-3a | Retained whole-flow request audit and real/demo IndexedDB isolation. | `@claim:local-private` passed locally from clean clone and live. |
| F-1-3b | Retained precise offline, account-free, and export facts. | `@claim:offline-reload`, `@claim:demo-no-account`, `@claim:json-export`, `@claim:csv-export` passed locally and live. |
| F-1-3c | Retained JSON archive scope: plans/logs included, recording bytes omitted. | `@claim:json-export` passed locally and live. |
| F-1-3d | Retained browser-playable-media wording and Blob storage behavior. | `@claim:local-media` passed locally and live. |
| F-1-3e | Retained concrete local-storage footer/privacy wording. | `@claim:local-private` passed locally and live. |
| F-1-3f | Retained README local-media statement and actual Blob inspection. | `@claim:local-media` passed locally and live. |
| F-1-3g | Retained reload persistence for markers, speed, and plan. | `@claim:practice-persistence` passed locally and live. |
| F-1-3h | Retained seeded steady, ramp, and variable plans. | `@claim:plan-modes` passed locally and live. |
| F-1-3i | Retained completed-session fields in UI and IndexedDB. | `@claim:session-evidence` passed locally and live. |
| F-1-3j | Retained actual JSON/CSV download assertions. | `@claim:json-export` and `@claim:csv-export` passed locally and live. |
| F-1-3k | Retained manifest, service worker, and forced-offline demo behavior. | `@claim:installable-shell` and `@claim:offline-reload` passed locally and live. |
| F-1-3l | Retained the three-passage limit with fixture-verified, demo-only unlock. | `@claim:free-license-boundary` passed locally and live. |
| F-1-3m | Retained no-analytics/no-third-party normal flow and verified it by request log. | `@claim:local-private` passed locally and live. |
| F-1-3n | Retained explicit Sociobot-only verification contact after manual token entry. | `@claim:license-contact` passed locally and live. |
| F-1-4 / P1 | Retained reject-before-write archive validation. | `rejects a malformed archive before it reaches IndexedDB` passed locally and live. |
| F-1-5 | Retained designed 404 and explicit Static Web Apps response override. | Live `/not-a-route` is HTTP 404 in `evidence/polish-2/routes.txt`; 404 screenshot `evidence/polish-2/404-mobile.png`. |
| F-1-6 | Retained route titles, heading focus, polite announcement, and history restoration. | `updates route titles, heading focus, history, and unknown-route recovery` passed locally and live. |
| F-1-7 | Completed the earlier metadata repair for the 404 static document. | `serves complete social metadata for the designed 404 and unknown paths` passed locally and live; live response `evidence/polish-2/404.html`. |
| F-1-8 | Retained the shared header/skip link, legal navigation, product footer, attribution, and build id. | Live root/demo cold checks; `has no serious accessibility violations on core, demo, legal, and error views` passed locally and live. |
| F-1-9 / P2 | Retained immutable caching for hashed assets. | Live asset headers in `evidence/polish-2/asset.headers`: `max-age=31536000, immutable`. |
| F-1-10 / P3 | Retained CSP, Permissions-Policy, manifest MIME, and safe response headers. | Live root/manifest headers in `evidence/polish-2/root.headers` and `manifest.headers`; cold checks report no console errors. |
| F-1-11 | Retained direct, plain-language landing copy and action names. | Cold root check and `evidence/polish-2/root/screenshot-mobile.png`; copy audit remains in `copy-audit.md`. |
| F-1-12 | Retained the short, plain README introduction and consistent terminology. | README and `copy-audit.md` reread during this round; clean-clone test/build completion. |
| F-2-1 | `Start for real` now calls `discardActiveDatabase()` and `clearLicense()` while demo mode is active, so it deletes both `demo:practice-loop-notebook` and `demo:sb_license:practice-loop-notebook` without changing real storage. Demo documentation now states that behavior. | New `discards every demo namespace when starting for real` passed locally and live as part of the 40-test suite. |
| F-2-2 | Added route-specific OG title/description/image and Twitter card/title/description/image to `404.html`, using the existing product-owned 1200×630 preview. | New `serves complete social metadata for the designed 404 and unknown paths` passed locally and live; direct live 404 response is saved at `evidence/polish-2/404.html`. |

No finding remains open.
