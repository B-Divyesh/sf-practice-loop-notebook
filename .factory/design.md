# Practice Loop Notebook — visual system

## Thesis: the loop station in your pocket

The interface borrows the exact, tactile language of late-1980s tracker software and demoscene pixel art without becoming nostalgic costume. A difficult passage is a tiny editable pattern: two loop points, a tempo lane, a pass counter, then a saved note. Chunky one-pixel borders and stepped progress marks make that constrained unit visible. The player remains calm and instrument-like; decoration appears only in the empty-state scene and small timing motifs.

## Palette

The product is deliberately single-mode: a dark rehearsal-room treatment keeps bright controls legible beside music hardware and avoids a theme flash when installed.

| Token | Value | Role |
| --- | --- | --- |
| Ink | `#10141f` | Page background, the unlit room |
| Panel | `#1b2232` | Work surfaces |
| Raised | `#252f43` | Active modules |
| Chalk | `#f4f0dc` | Primary text |
| Tape | `#b8c0c9` | Secondary text (7.4:1 on ink) |
| Signal | `#ffd166` | Main action, loop markers |
| Signal ink | `#17130a` | Text on signal |
| Wave | `#64e8c4` | Playback position, success |
| Lilac | `#b8a1ff` | Plan and reflection accents |
| Warning | `#ff9d5c` | Recoverable attention |
| Fault | `#ff758f` | Errors and destructive actions |

All body text combinations target WCAG AA at minimum. Statuses pair color with a word or symbol.

## Type

- Display and labels: `"Courier New", "Liberation Mono", monospace`, bold and uppercase only for short tracker-like labels. It is available locally as a system font, so there is no font request or privacy leak.
- Reading and forms: `Inter`, `ui-sans-serif`, system stacks. Numbers use `font-variant-numeric: tabular-nums`.
- Scale: 14px utility, 16px body, 20px subsection, 28px section, `clamp(32px, 7vw, 64px)` h1. Body leading is 1.55 and long copy is capped at 68 characters.

## Layout and spacing

An 8px base rhythm, with 4px allowed for micro-spacing. Content maxes at 1180px. The main practice desk uses a 5/3 split on wide screens and becomes one deliberate vertical sequence at 760px: media → transport → plan → log. Controls are at least 44px. One-pixel outlines and offset 4px shadows make independent controls feel like hardware keys; proximity carries most grouping.

## Interaction grammar

- The yellow action is the next meaningful practice decision; only one dominant action per region.
- A/B markers look like punched tape tabs and can be set with keyboard shortcuts `A` and `B` when focus is not in a field. Space toggles play/pause. Left/right arrows seek one second.
- Practice passes fill discrete tracker cells. Completing a pass advances evidence, never silently changes the target tempo.
- Saving a reflection closes a session and returns a concise proof card: repetitions, tempo, criterion result, and note.
- Destructive archive actions name their target and require confirmation. Import previews and validates before replacing nothing; duplicate records are merged by id and latest edit.

## Motion

State changes use 160–220ms opacity/transform transitions: a pressed control moves by 2px; drawers enter from their source edge; the playhead travels linearly. There are no decorative infinite animations. Under `prefers-reduced-motion: reduce`, transitions and smooth scrolling become instant and the playhead updates discretely.

## Original asset plan and prompt sheet

The empty/new-passage panel uses one original generated pixel-art scene that explains the product: an instrument cable becomes an A–B loop around a few glowing tracker cells, beside a metronome and notebook. It is not evidence of playback or analysis capability.

Prompt: “Editorial 16-bit pixel art, wide landscape. A quiet midnight rehearsal desk seen at a slight isometric angle: a compact cassette player with an instrument cable forming a clear loop between two small brass marker pegs, a mechanical metronome, an open blank grid notebook with a few abstract check marks, and tiny mint waveform blocks. Deep navy and charcoal room, warm cream paper, golden yellow markers, mint signal lights, restrained lilac accents, crisp deliberate pixels, sparse composition with generous dark negative space on the left, no people. Authentic hand-placed pixel clusters, limited 12-color palette, no gradients, no text, no letters, no numbers, no watermark, no logos, no brands, no UI screenshot.”

Negative list: photorealism, glossy 3D, neon cyberpunk gradient, real people, hands, brands, existing characters, legible writing, logos, watermarks, streaming-service imagery.

Generated with the factory `factory-image` deployment on 2026-08-28. The selected output and prompt sidecars live in `assets/src/`; optimized 576 px and 1152 px shipping WebPs live in `public/assets/`. Generated imagery is original to this product under the repository license. Icons and waveform decorations are authored in CSS/SVG and use no third-party asset set.

The 1200 × 630 social preview is a center crop of that same original scene. Versioned WebP filenames let the static host cache the artwork immutably.

Demo mode adds a narrow lilac-edged tracker strip above the work surface. It reads as a temporary channel on the same loop station, not a separate SaaS interface.

## Why it fits

Trackers teach through small patterns, counters, and repeatable edits—the same mental model as deliberate passage practice. The visual system makes time ranges and evidence feel concrete while staying quieter than a DAW and more purposeful than a streaming player.
