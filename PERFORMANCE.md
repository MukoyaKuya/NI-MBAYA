# Measure loading and gameplay

Press **F8** to open the local performance report, or open the game URL with
`?perf=1`. Press F8 again to close it. The report records engine startup,
menu and level readiness, scene asset-loading durations, failed asset keys,
FPS, long tasks, and the ten slowest same-origin resource requests.

Choose **Download report** to save JSON. Nothing is uploaded automatically.
Compare reports from the affected devices and connections. Readiness times
are measured since navigation, so a level started after spending time in the
menu includes that time. Scene asset-loading duration isolates that load.
FPS is a recent engine estimate; it is not a whole-session average.

For a first-visit test, use Chrome DevTools Network with Disable cache enabled
and No throttling. Repeat with caching enabled. Compare request waiting time
with content download time. A successful HTTP response does not establish
that it arrived quickly, and asset-size budgets do not measure real latency.

## Rebuild fragment-cleanup data

Source animation sheets retain their original pixels and geometry. Runtime
applies precomputed alpha-clear spans, avoiding connected-component scans on
players' devices. After changing any cleaned source sheet, run:

```powershell
node scripts/prepare-sprite-cleanup.cjs
node scripts/prepare-sprite-cleanup.cjs --check
```

This development tool requires Python with Pillow. Its check compares all
seven generated masks against the original fragment-removal algorithm.
Normal builds and gameplay do not require Python.

## Smaller backgrounds and streamed music

`npm run optimize:startup` prepares 1280x720-or-smaller WebP backgrounds at
quality 72 and mono 48kbps music, retaining the original files for editing.
Tracks keep their complete duration. The hover effect is limited to 0.6s;
the game already stops it after 0.48s. Sprite sheets are excluded from this
profile so their geometry, alpha and precomputed cleanup masks stay intact.
The command requires Python/Pillow and ffmpeg.

Background music uses streaming HTML audio rather than waiting for Phaser
to download and decode an entire track. A click/tap/keypress may be required
by the browser's autoplay policy. Options Sound applies to streaming music
as well as combat effects. The F8 report includes music playback/error state.
