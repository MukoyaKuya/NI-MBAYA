# NI MBAYA

**NI MBAYA is a Nairobi street-fighting adventure for the browser.** It is a quick game for the moments between everyday life: a break after work, a commute, or a few minutes with friends. Instead of treating Nairobi as scenery, it puts its energy, language, neighbourhoods, matatus, street vendors, and humour at the centre of the experience. 

Built for the **Apps for Your Life** track of OpenAI Build Week.

**[Play the live game](https://mukoyakuya.github.io/NI-MBAYA/)** · **[View the source](https://github.com/MukoyaKuya/NI-MBAYA)**

## Why this game

I wanted to make a game that feels familiar to people who know Nairobi and inviting to people discovering it. NI MBAYA turns a city that is usually seen from the outside into a playable place with its own pace, visual language, and story.

The goal is simple: open a link, choose a fighter, and play. No account, install, or payment is required.

## What you can play today

- A story-led fighting game with two playable fighters.
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
