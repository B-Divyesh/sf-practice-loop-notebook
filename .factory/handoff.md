# Practice Loop Notebook — review 2 handoff

Date: 2026-08-28

Work order: `practice-loop-notebook-review-2`

Live product: <https://practice-loop-notebook.sociobot.in>

Demo: <https://practice-loop-notebook.sociobot.in/demo>

Deployed product commit: `92da9b2205f2a859c3ad17646fbb079e4d1f2aae`

## Outcome

Review only; no product code was changed. The review is **FAIL** with two blockers recorded in `.factory/review-2.md`:

1. `Start for real` leaves `demo:sb_license:practice-loop-notebook` in localStorage instead of discarding all demo data.
2. The designed `/404` route lacks Open Graph and Twitter metadata, reopening the metadata portion of F-1-7.

The cold first screen, sample demo, claim registry, normal demo isolation, archive validation, routing, headers, and visual identity otherwise passed this fresh review.

## Verification evidence

### Clean clone

A fresh clone at `/tmp/practice-loop-review-2-EOUOKo` ran `npm ci`. `PLAYWRIGHT_BASE_URL=https://practice-loop-notebook.sociobot.in npm run test:claims` passed all 12 registered claim tests. The review checkout also ran each individual command listed by `.factory/claims.json`; all passed.

### Review verification

- Clean-clone `npm test`: 6/6 passed.
- Clean-clone `npm run build`: passed and produced `dist/` (43.62 KB JavaScript; 19.86 KB CSS before gzip).
- Fresh mobile (390 × 844) and desktop cold visits: clear first-screen job/audience/action, no horizontal overflow, no console errors.
- Live claim tests: all 12 passed.
- Live route/back/focus test: passed.
- Live headers: CSP, Permissions-Policy, proper manifest MIME, and immutable hashed asset caching observed.
- Live `/404`: HTTP 404 and usable recovery UI, but missing OG/Twitter tags.
- Direct sandbox test: real storage remains separate, but demo license token survives `Start for real`.

## Run and deploy

```sh
npm ci
npm test
npm run test:claims
npm run test:e2e
npm run build
/opt/fleet/lib/deploy-static.sh practice-loop-notebook dist
```

## Known gaps

Resolve F-2-1 and F-2-2 before acceptance. No deployment action was taken by this reviewer.
