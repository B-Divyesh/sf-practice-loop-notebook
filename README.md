# Practice Loop Notebook

Practice Loop Notebook helps instrumentalists repeat a hard part of their own recording.

Set a loop, choose a tempo, count clean passes, and save a note for tomorrow.

Live product: <https://practice-loop-notebook.sociobot.in>

Try the isolated sample: <https://practice-loop-notebook.sociobot.in/demo>

## What it does

- Stores your selected recording in this browser.
- Saves loop markers, playback speed, and the practice plan after reload.
- Offers a steady tempo, a success-based increase, or a set variation pattern.
- Saves pass count, tempo, result, confidence, and a short note.
- Exports the notebook as JSON or sessions as CSV.
- Omits recordings from exports so archive files stay small.
- Reopens the sample passage offline after the first visit.
- Stores up to three passages without a license.
- Keeps practice tools, exports, offline use, and accessibility available without a license.

The app accepts audio or video files that the current browser can play. Keep your original recording for later reattachment.

## Demo isolation

Open `/demo` or `/?demo=1` to load three sample passages. Demo changes use the separate `demo:practice-loop-notebook` IndexedDB database.

The banner can reset the samples or start an empty real notebook. See [the demo contract](.factory/demo.md).

## Local development

Use Node.js 20 or newer.

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite.

## Quality checks

```sh
npm test
npm run build
npm run test:claims
npm run test:e2e
```

The build command writes the static product to `dist/`. It includes `/demo`, `/privacy`, `/terms`, `/unlock`, and the styled 404 response.

Deploy `dist/` as the site root. The included Static Web Apps configuration supplies caching, security headers, manifest MIME, and 404 behavior.

Production license verification uses `https://api.sociobot.in`. Set `VITE_BILLING_BASE` only for an approved staging gateway.

Checkout stays hidden unless the billing product is enabled and `VITE_PURCHASES_ENABLED=true` is set during the build.

## Privacy

Normal use sends no cross-origin requests. License verification contacts only the Sociobot product verification endpoint after a token is added.

The app has no analytics, trackers, CDN scripts, or remote fonts. See [Privacy](https://practice-loop-notebook.sociobot.in/privacy) and [Terms](https://practice-loop-notebook.sociobot.in/terms).

Project records: [visual system](.factory/design.md), [claims](.factory/claims.json), [handoff](.factory/handoff.md), and [MIT license](LICENSE).
