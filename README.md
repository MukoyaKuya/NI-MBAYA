# NI MBAYA

**NI MBAYA is a Nairobi street-fighting adventure for the browser.** It is a quick game for the moments between everyday life: a break after work, a commute, or a few minutes with friends. Instead of treating Nairobi as scenery, it puts its energy, language, neighbourhoods, matatus, street vendors, and humour at the centre of the experience.

Built for the **Apps for Your Life** track of OpenAI Build Week.

**[Play the live game](https://mukoyakuya.github.io/NI-MBAYA/)** · **[View the source](https://github.com/MukoyaKuya/NI-MBAYA)**

## Why this game

I wanted to make a game that feels familiar to people who know Nairobi and inviting to people discovering it. NI MBAYA turns a city that is usually seen from the outside into a playable place with its own pace, visual language, and story.

The goal is simple: open a link, choose a fighter, and play. No account, install, or payment is required.

## What you can play today

- A story-led fighting game with Majembe as the playable fighter.
- Four Nairobi-inspired stages: Nairobi CBD, Downtown Backstreet, Nairobi Rooftops, and Kibera.
- Melee combat, enemy variants, difficulty options, health chapatis, and local checkpoint progress.
- English and Swahili story context.
- Original Nairobi-inspired visual direction, including street scenes and matatu traffic.
- Desktop browser play is the recommended experience. Touch controls are included for mobile browsers.

## Built during the hackathon

NI MBAYA was created and meaningfully expanded during the OpenAI Build Week submission period. The dated Git history records the work from 17–21 July 2026, including:

- The playable Phaser/TypeScript game, combat loop, character selection, and Nairobi-inspired visual direction.
- Story cutscenes, a how-to-play flow, four locations, local progress and Continue support.
- Difficulty settings, enemy behaviours, health pickups, English/Swahili story content, and browser controls.
- Production hardening: reliable level assets, combat animations, desktop-first presentation, live demo deployment, matatu rendering, and background fight music.

## How I used Codex and GPT-5.6

I used Codex and GPT-5.6 throughout the hackathon as hands-on development partners. They helped me turn gameplay ideas into Phaser and TypeScript implementation, investigate asset-loading and combat bugs, improve the game flow, and verify production builds.

The creative and product decisions were mine: building a game around Nairobi rather than a generic fighting setting; choosing the locations, story direction, language support, and desktop-first play experience; and deciding which unfinished modes should be clearly marked as coming soon. Codex made iteration faster, while I directed the game’s identity and reviewed each change in the project itself.

## Try or judge the project

The live build is available at **[mukoyakuya.github.io/NI-MBAYA](https://mukoyakuya.github.io/NI-MBAYA/)**. It is free to play and does not need an account. For the best experience, use a current desktop browser in landscape orientation and turn sound on after the game begins.

## Run locally

```bash
npm install
npm run dev
```

Run regression checks with `npm test`. If browser storage is blocked, settings and progress remain available for the current page session.

To make a production build:

```bash
npm run build
```

## Built with

- Phaser 3
- TypeScript
- Vite
- HTML5 Canvas / WebGL

## License

MIT © 2026 Mukoya Kuya. See [LICENSE](LICENSE).


## Performance

The browser loads delivery copies from `src/assets/optimized`; original artwork and audio remain in place for editing. WebP images preserve sprite dimensions and lossless alpha, with quality 88 for colour. Music uses 96 kbps MP3 and effects use 64 kbps. Later-stage textures and motion sheets remain deferred; pickup artwork loads with gameplay rather than the menu.

After `npm run build`, run `npm run check:performance`. CI limits startup assets to 1.2 MB and the complete build to 20 MB. The initial baseline was 5.23 MB of boot assets and 63.17 MB for the complete build. These are payload sizes, not measured production load times.

To regenerate changed delivery assets, install Python 3.10+, Pillow and FFmpeg, then run `npm run optimize:assets`. Outputs are checked in, so normal development and CI do not need those tools. The generator preserves originals and validates dimensions and alpha before replacing each image. Update the explicit asset URLs when introducing a new source asset. `scripts/asset-sizes.json` records per-file savings.


## Daily Challenge

Defeat 20 enemies across any levels or replays to claim 250 chapatis. Each enemy counts once, even if its defeat callback runs again, and progress survives failed rounds and page reloads. The day changes at midnight in Africa/Nairobi, based on the browser clock. A claim updates its flag and the permanent reward bank together, preventing duplicate claims within the saved state. The bank is added to displayed chapatis in gameplay and character selection; story checkpoint amounts remain separate so continuing a journey cannot add the reward twice. Progress and rewards are local to the browser, using the same storage fallback as other game progress.


## Development checks

This directory is the authoritative full application checkout. The sibling `NI-MBAYA-push` is a preserved legacy sparse checkout.

Run `npm test`, `npm run build`, and `npm run check:performance`.
For real Chromium integration checks, first run `npx playwright install chromium`, then `npm run test:browser`. CI installs Chromium and runs these checks before deployment. Browser tests cover canvas startup, keyboard movement, timer pause/resume, stage completion and persisted progress, and touch attacks. Stage completion is accelerated through the real enemy damage path; this is not an automated full combat playthrough.

Level definitions live in `src/config/Levels.ts`; animation registration lives in `src/systems/LevelAnimations.ts`, player art specifications in `src/config/PlayerArt.ts`, and stone projectiles in `src/systems/EnemyProjectiles.ts`. Gameplay deadlines use `GameplayClock`, which excludes pauses; scene timers and tweens pause with the HUD. Grounded enemy attacks and stones respect the same 40px altitude tolerance as player attacks.
