# Practice Loop Notebook

Practice Loop Notebook is a private, offline-first passage looper for instrumentalists learning a difficult few seconds from their own recording. It combines A/B playback, adjustable speed, a metronome ramp or controlled-variability plan, automatic/manual repetition counts, exit criteria, and a durable reflection history.

Live product: <https://practice-loop-notebook.sociobot.in>

## Product behavior

- Imports user-controlled audio/video into IndexedDB; nothing is uploaded.
- Repeats exact A/B markers and keeps marker, speed, and plan changes across reloads.
- Supports steady, success-based tempo ramp, and deterministic variable-tempo practice.
- Logs session repetitions, tempo, criterion result, confidence, and reflection.
- Exports the full notebook as JSON or session evidence as CSV. Media is intentionally omitted from portable exports and can be reattached after import.
- Installs as a PWA and opens saved passages offline.
- Includes three saved passages free. A $12 one-time Sociobot license unlocks an unlimited archive; practice tools, export, offline use, and accessibility remain free.

## Local development

Requires Node.js 20 or newer.

```sh
npm ci
npm run dev
```

Open the URL Vite prints. Browsers decide which local media codecs they can play; MP3, WAV, M4A, and MP4 are the most portable choices.

## Quality checks

```sh
npm test          # unit tests
npm run build     # reproducible static output in dist/
npm run test:e2e # Chromium desktop + 390 px, Axe, and forced-offline reload
```

The exact deployment build command is `npm run build`. Deploy the resulting `dist/` directory as a static site with `index.html` at its root. `/privacy`, `/terms`, and `/unlock` also have static HTML entry points.

Set `VITE_BILLING_BASE` at build time only when staging against the pilot billing API. Production defaults to `https://api.sociobot.in`; no product ID or payment-provider client code is embedded.

## Privacy and project notes

There are no analytics, trackers, CDN scripts, or remote fonts. The only runtime network contact is an explicit checkout or background verification of an installed license. See [the visual system](.factory/design.md), [the delivery handoff](.factory/handoff.md), and the [MIT license](LICENSE).
