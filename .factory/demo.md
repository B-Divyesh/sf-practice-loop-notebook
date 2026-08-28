# Demo sandbox

## Entry points

- Primary: <https://practice-loop-notebook.sociobot.in/demo>
- Query alias: <https://practice-loop-notebook.sociobot.in/?demo=1>

Both links open a ready practice screen without setup or an account.

## Sample notebook

The sandbox contains three realistic passages:

1. `Bach minuet shift · bars 17–20` uses a success-based ramp from 68 to 84 BPM. It includes six passes and a reflection.
2. `Bowing pattern · opening phrase` uses a steady 92 BPM plan.
3. `Quiet entry · second movement` uses a 76 BPM variable plan with a ±6 BPM pattern.

Each passage includes an eight-second generated WAV tone. It is created locally by the app, so the demo needs no media request.

## Isolation and reset

Demo passages use IndexedDB database `demo:practice-loop-notebook`. Real passages use `practice-loop-notebook`.

Demo license state uses the `demo:sb_license:practice-loop-notebook` localStorage key. It never reads or writes the real license key.

`Reset demo` clears only the demo database and restores the three original passages. `Start for real` clears the demo database and opens the real notebook.

The persistent banner identifies demo mode on notebook, legal, and archive-limit routes.
