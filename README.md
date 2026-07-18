# NI MBAYA

NI MBAYA is a Nairobi-based 2.5D beat-'em-up built with HTML5, WebGL, Phaser 3, TypeScript, and Vite.

Players choose Mbavu Destroyer or Mjaka Fine, then fight through four Nairobi-inspired stages: Nairobi CBD, Downtown Backstreet, Nairobi Rooftops, and Kibera. The current build includes melee combat, difficulty settings, touch controls, enemy variants, health-pickup chapatis, and English/Swahili story context.

Progress is checkpointed locally after each cleared level. Use **Continue** on the main menu to resume the next unlocked level with the selected fighter, health, and chapatis.

## Hackathon Submission Notes

### Run locally

```bash
npm install
npm run dev
```

Open the Vite URL printed in the terminal. To create a production build:

```bash
npm run build
```

### Codex and GPT-5.6 usage

Codex was used as a development collaborator during the project: reviewing the Phaser architecture, tracing gameplay defects, implementing a one-hit-per-enemy attack guard, making later-level assets available before scene transitions, and verifying production builds. GPT-5.6 Terra was used during this collaboration. All changes were reviewed against the project source and validated with `npm run build`.

This README is intentionally detailed. Future agents should read it before refactoring or adding features. Several parts of the game rely on a deliberate split between invisible physics bodies and visible generated bitmap art. Breaking that relationship will make characters fall, hang, overlap, or stop responding to controls.

## Quick Start

```bash
npm install
npm run dev
```

Open the URL printed by Vite, usually `http://localhost:5173`, `http://localhost:5174`, or another available port.

Production verification:

```bash
npm run build
```

The app uses Phaser's WebGL renderer through `Phaser.WEBGL` in `src/config/GameConfig.ts`.

## Core Tech

- Runtime: HTML5 canvas/WebGL
- Engine: Phaser 3
- Language: TypeScript
- Bundler/dev server: Vite
- Layout: fixed internal 1280x720 landscape, scaled with `Phaser.Scale.FIT`
- Physics: Phaser Arcade Physics, but used in a custom 2.5D way for the fight scene

## Game Flow

The Phaser scene order is configured in `src/config/GameConfig.ts`:

1. `BootScene`
2. `MainMenuScene`
3. `CharacterSelectScene`
4. `LevelScene`

### BootScene

File: `src/scenes/BootScene.ts`

Responsibilities:

- Preload menu, character select, shared gameplay, and all four level asset groups.
- Load the Level 3 and Level 4 asset groups through `DeferredLevelAssets.ts` during boot so level transitions remain reliable on every browser.
- Create fallback/generated placeholder textures such as `player-idle`, `goon-idle`, `hit-spark`, and `shadow`.
- Start the main menu.

Important: shared assets belong in `BootScene`; Level 3 and Level 4 asset definitions stay in `DeferredLevelAssets.ts`, which BootScene invokes during preload. This keeps the asset list organized while avoiding runtime loading handoffs that previously caused blank transitions.

### MainMenuScene

File: `src/scenes/MainMenuScene.ts`

Responsibilities:

- Draw the layered main menu from generated/extracted assets.
- Provide hover/click behavior for Story Mode, Arcade Mode, Boss Rush, Options, daily challenge, final battle, top action buttons, and avatar.
- Story Mode opens character select.
- Arcade/Boss Rush currently jump directly to the level.
- Options currently cycles difficulty using `GameSettings` and shows a toast.

Important: the main menu is not one flat image. It is a composition of background, character cutouts, logo text, footer, top actions, and independently drawn Phaser UI buttons. Keep buttons independent so hover scaling does not distort the background.

### CharacterSelectScene

File: `src/scenes/CharacterSelectScene.ts`

Responsibilities:

- Show the target-inspired character select screen.
- Allow selecting available characters.
- Require clicking SELECT or pressing Enter/Space to proceed.
- Keep locked characters non-selectable.

Important: do not make a card click immediately start the game. The current UX is select first, then click SELECT to proceed.

### LevelScene

File: `src/scenes/LevelScene.ts`

Responsibilities:

- Render the Nairobi fight background.
- Spawn Mbavu and goons.
- Keep invisible Arcade sprites synchronized with visible generated PNG character art.
- Update player, enemy AI, combat, HUD, and touch controls.
- Layer characters by Y position so lower characters appear in front.
- Show generated animation-state art for idle, run, punch, kick, jump/special, goon attack, and defeat.

Important: this scene is the most fragile area. Read the sections below before changing movement, attacks, defeat, or art.

## Project Structure

```text
src/
  assets/
    character-select/
      extracted/     Cropped UI elements from target character select mockup.
      reference/     Target reference screenshots.
    gameplay/
      generated/     Generated gameplay background, Mbavu poses, goons, attacks, defeat poses.
    menu/
      extracted/     Extracted/standalone menu UI elements.
      generated/     Generated main menu background and character cutouts.
      reference/     Target menu screenshots and cleanup sources.
  config/
    Controls.ts      Keyboard mapping and attack tuning.
    DeferredLevelAssets.ts  Level 3 and 4 asset definitions loaded during boot.
    GameConfig.ts    Phaser config, dimensions, scene list, physics config.
    GameSettings.ts  Difficulty settings and localStorage persistence.
  entities/
    Player.ts        Hidden Arcade body and player state machine.
    EnemyGoon.ts     Hidden Arcade body, goon AI, difficulty scaling, bat behavior.
  scenes/
    BootScene.ts
    MainMenuScene.ts
    CharacterSelectScene.ts
    LevelScene.ts
  systems/
    CombatSystem.ts  Hitboxes, overlap checks, damage, combo, hit sparks, shake.
  ui/
    HUD.ts           Fight HUD.
    TouchControls.ts Virtual joystick and action buttons.
  main.ts            Phaser game bootstrap.
  style.css          Page-level styles.
```

## Controls

Keyboard:

- Move left/right: left / right arrow keys
- Move up/down in lane: up / down arrow keys
- Jump: `Space`
- Punch: `J`
- Kick: `K`
- Special: `L`
- Escape in level: back to main menu
- Menu: click/tap buttons; Space/Enter can start from main menu/character select where wired

Touch/mobile:

- Left virtual joystick controls X movement and lane movement.
- Upward joystick movement contributes to vertical lane movement.
- `P` button: punch
- `K` button: kick
- `S` button: special
- `J` button: jump

Important: `TouchIntent` is reset every frame for one-shot actions in `TouchControls.postUpdate()`. Do not remove that reset or touch attacks will fire continuously.

## Coordinate System and Layout

The game uses an internal coordinate system of:

- Width: `1280`
- Height: `720`

These constants live in `src/config/GameConfig.ts`.

The browser canvas is scaled to fit the screen by Phaser. Most UI positions are authored in this internal coordinate system. Avoid using raw browser pixels in game logic.

## Gameplay Physics Model

The level uses Phaser Arcade Physics, but not as a traditional platformer.

### Hidden physics bodies

`Player` and `EnemyGoon` extend `Phaser.Physics.Arcade.Sprite`, but their actual sprite textures are invisible in `LevelScene`:

```ts
this.player.setVisible(false);
enemy.setVisible(false);
```

The visible characters are separate `Phaser.GameObjects.Image` instances, such as:

- `gameplay-mbavu-idle`
- `gameplay-mbavu-run`
- `gameplay-mbavu-run-2`
- `gameplay-mbavu-punch`
- `gameplay-mbavu-standing-kick`
- `gameplay-mbavu-kick`
- `gameplay-goon`
- `gameplay-goon-club`
- `gameplay-goon-hoodie`
- `gameplay-goon-bat-attack`
- `gameplay-goon-defeat`

`LevelScene.syncGeneratedArt()` keeps the visible images following the hidden Arcade bodies.

Do not delete the hidden physics sprites just because the art is image-based. Combat, AI, position, knockback, and hit detection depend on those bodies.

### Gravity is intentionally disabled

The fight scene is not a gravity platformer. The player and goons use lane movement and a separate fake jump altitude. Their Arcade bodies must not be affected by global Arcade gravity.

In `Player.ts` and `EnemyGoon.ts`, the dynamic body should have gravity disabled:

```ts
(this.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
```

If this is removed, goons and/or Mbavu will fall off the screen when the level starts.

### 2.5D lane movement

The fight scene has beat-em-up depth:

- X axis: left/right street movement.
- Y axis: lane/depth movement on the street.
- Z value: fake jump altitude, stored manually on the entity.

The `z` field is not Phaser's built-in depth. It is a gameplay altitude used for jump visuals and hit validation.

Player lane bounds are clamped in `Player.update()`.

Enemies follow toward Mbavu in both X and Y, but they attack only when close enough horizontally and within a Y-lane threshold.

### Rendering depth

Visible sprites are depth-sorted by Y position in `LevelScene.syncGeneratedArt()`:

```ts
shadow.setDepth(entity.y - 2);
art.setDepth(entity.y - 1);
```

This makes characters lower on the screen render in front of characters higher on the screen. Keep this pattern if adding more fighters, pickups, or bosses.

## Player Mechanics

File: `src/entities/Player.ts`

State values:

- `idle`
- `walk`
- `jump`
- `punch`
- `kick`
- `special`
- `hit`
- `defeat`

Important fields:

- `health`: player health, currently 0-100.
- `chapatis`: reward value shown in the HUD after clearing a level.
- `facing`: `1` for right, `-1` for left.
- `z`: fake jump altitude.
- `vz`: fake jump vertical velocity.
- `lockedUntil`: prevents movement during short hit/attack locks.
- `canAttackAt`: attack cooldown gate.

Player control flow:

1. `LevelScene.update()` passes current `TouchControls.intent` into `Player.setTouchIntent()`.
2. `Player.update(time, delta)` reads keyboard and touch movement.
3. `CombatSystem.update(time)` calls `player.consumeAttack(time)`.
4. If an attack is available, `CombatSystem` spawns a temporary hitbox.

Do not move attack input entirely into `Player.update()` without updating `CombatSystem`. The current architecture intentionally keeps hitbox creation in `CombatSystem`.

### Player defeat

When player health reaches zero:

- `Player` enters `defeat` state.
- Movement stops.
- `LevelScene.syncGeneratedArt()` rotates/resizes the visible player image into a fall pose.

If you change defeat visuals, ensure the logic still transitions from state `defeat`, not from raw health checks in multiple places.

## Enemy Mechanics

File: `src/entities/EnemyGoon.ts`

State values:

- `idle`
- `walk`
- `attack`
- `hit`
- `defeat`

Enemy variants:

- `gameplay-goon`: base goon.
- `gameplay-goon-hoodie`: brawler-style goon.
- `gameplay-goon-club`: bat/club goon.
- `gameplay-goon-chain`: chain-wielding goon.
- `gameplay-goon-heavy`: high-health heavy goon.
- `gameplay-attack-dog`: fast melee enemy.
- `gameplay-kibera-stone-goon`: ranged stone thrower.
- `gameplay-kibera-shield-goon`: high-health enemy that reduces incoming damage.

Important fields:

- `maxHealth` and `health`
- `attackDamage`
- `attackRange`
- `orbitOffset`
- `moveSpeed`
- `visualVariant`
- `defeatedAt`
- `attackCooldown`

### Enemy AI

Enemy AI is intentionally simple for the prototype:

1. Choose a side of the player based on current position.
2. Move toward an attack gap around Mbavu.
3. Follow Mbavu's Y lane.
4. If close enough in X and Y, enter `attack`.
5. If cooldown is ready, damage the player and shake the camera.

Do not return to old behavior where every enemy targets exactly the player's X coordinate. That causes enemies to overlap and visually stack.

### Bat goon behavior

Bat/club goons use `visualVariant === 'gameplay-goon-club'` and have:

- Longer attack range.
- Higher damage.
- Stronger knockback.
- A different attack texture: `gameplay-goon-bat-attack`.

If adding more weapon enemies, follow this pattern: configure range/damage/cooldown in `EnemyGoon.configure()` and select the attack art in `LevelScene.syncEnemyVisual()`.

### Enemy defeat and disappearance

When health reaches zero:

- `EnemyGoon` enters `defeat`.
- Its Arcade body is disabled with `disableBody(false, false)`.
- `LevelScene.syncEnemyVisual()` swaps to `gameplay-goon-defeat`, starts a fall/rotation, then fades art and shadow.

Important: defeated enemies remain in `enemyList` so the HUD can count defeated enemies. Do not splice them out unless HUD/objective logic is updated too.

## Combat System

File: `src/systems/CombatSystem.ts`

Responsibilities:

- Read player attack intent via `player.consumeAttack(time)`.
- Spawn temporary Arcade overlap zones as hitboxes.
- Apply damage and knockback to enemies.
- Track combo count and combo expiration.
- Spawn hit sparks.
- Trigger screen shake.
- Ensure each attack can damage each enemy only once during its active hitbox window.

Attack data lives in `src/config/Controls.ts`:

```ts
punch: damage, range, knockback, cooldown
kick: damage, range, knockback, cooldown
special: damage, range, knockback, cooldown
```

Hit validation includes 2.5D checks:

- Player and enemy must be close enough in Y lane.
- Player and enemy must be close enough in fake Z altitude.

Do not remove these checks unless converting the whole game to a flat 2D plane. Without them, attacks will hit enemies on different street lanes.

## Difficulty System

File: `src/config/GameSettings.ts`

Difficulties:

- `easy`
- `normal`
- `hard`

Difficulty settings affect:

- Enemy health multiplier
- Enemy damage multiplier
- Enemy speed multiplier
- Enemy attack cooldown multiplier

Difficulty is persisted in `localStorage` under the NI MBAYA difficulty key. The Options button on the main menu currently cycles difficulty and shows a toast. A future proper Options screen should use the same `GameSettings` API instead of introducing a second settings source.

## HUD

File: `src/ui/HUD.ts`

The HUD draws:

- Player panel and health bar
- Objective panel: defeat all goons
- Coins and gems panels
- Enemy health indicator
- Combo text
- Mjaka Fine dialogue panel
- Special meter
- Skill slots

HUD depths are high so UI stays above gameplay. Be careful when adding scene objects with large depth values; avoid rendering gameplay above the HUD unless intentionally adding full-screen effects.

## Touch Controls

File: `src/ui/TouchControls.ts`

The virtual controls are Phaser display objects, not DOM controls.

Important implementation details:

- `axisX` and `axisY` are continuous joystick axes.
- `jump`, `punch`, `kick`, and `special` are one-frame intent flags.
- `postUpdate()` clears one-shot intents every frame.
- Buttons are large and intentionally overlap the target UI style.

If controls stop working, check these first:

1. `TouchIntent` fields match what `Player.ts` expects.
2. `Player.update()` does not reference keys that are not in `CONTROL_KEYS`.
3. `postUpdate()` is called after `Player` and `CombatSystem` consume intent.
4. UI objects have high enough depth and remain interactive.

## Assets

Most current artwork is generated placeholder art. Keep source and final assets organized.

### Gameplay generated assets

Path: `src/assets/gameplay/generated`

Important current files:

- `gameplay-background.png`
- `mbavu-idle.png`
- `mbavu-run.png`
- `mbavu-run-2.png`
- `mbavu-punch.png`
- `mbavu-kick.png`
- `mbavu-flying-kick.png`
- `goon-club.png`
- `goon-hoodie.png`
- `nairobi-goon.png`
- `goon-bat-attack.png`
- `goon-defeat.png`

Files ending in `-green.png` are chroma-key source files. They are not meant to be displayed in the game. The non-green PNGs are alpha-cutout assets used by Phaser.

### Menu assets

Path: `src/assets/menu`

The main menu has reference screenshots, generated backgrounds/character cutouts, and extracted standalone UI elements.

Do not bake interactive buttons into the menu background. Hover effects require independent Phaser objects.

### Character select assets

Path: `src/assets/character-select`

The character select screen uses target-reference and extracted assets. Preserve the select-then-confirm interaction.

## Replacing Generated Art With Production Sprites

The current generated PNGs are useful for visual direction but are not final animation assets. A future production pass should replace them with consistent sprite sheets.

Recommended approach:

1. Add sprite sheets under `src/assets/sprites/player` and `src/assets/sprites/enemies`.
2. Put shared or early-level assets in `BootScene.preload()`; keep Level 3 and 4 definitions in `DeferredLevelAssets.ts`, which BootScene invokes during preload.
3. Create Phaser animations in `BootScene.create()`.
4. Keep `Player` and `EnemyGoon` state names stable.
5. Replace `LevelScene.syncGeneratedArt()` image swapping with animation playback.
6. Preserve the hidden physics body and 2.5D lane system unless rewriting the entire combat model.

Do not replace the generated cutout system halfway. Mixing sprite-sheet animation for some states and large cutout images for others can work, but it needs explicit sizing/depth rules.

## Common Bugs and Causes

### Goons fall off the screen when the level starts

Likely cause: Arcade gravity is affecting enemy physics bodies.

Check `EnemyGoon` constructor:

```ts
(this.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
```

Also confirm no code is accidentally setting gravity back on.

### Controls stop working

Likely causes:

- `Player.ts` references keys not registered in `CONTROL_KEYS`.
- `TouchIntent` shape changed but `Player.ts` was not updated.
- `TouchControls.postUpdate()` is called too early.
- A UI overlay is intercepting pointer input.

### Hero hangs upright after defeat

Likely cause: `LevelScene.syncGeneratedArt()` is not handling `player.state === 'defeat'` specially.

The visible art must rotate/resize into a fall pose because the hidden Arcade sprite is invisible and static.

### Enemies stack on top of Mbavu

Likely cause: AI targets the player's exact X/Y instead of using side/gap logic.

Keep `orbitOffset`, `desiredGap`, and lane-following behavior in `EnemyGoon.update()`.

### Attacks hit enemies on the wrong lane

Likely cause: `CombatSystem` 2.5D validation was removed or relaxed too much.

Keep Y-lane and Z-altitude checks when applying hitbox overlap.

### Menu hover distorts background

Likely cause: a menu button is baked into a larger background image and being scaled with it.

Keep buttons independent Phaser objects or standalone cropped assets.

## Agent Refactoring Rules

Future agents should follow these rules:

1. Build after code changes: `npm run build`.
2. Test the browser path after gameplay changes: Main Menu -> Story Mode -> Select -> Level.
3. Do not remove hidden Arcade sprites just because generated images are visible.
4. Do not re-enable gravity for fight scene entities.
5. Do not change `TouchIntent` without updating `Player.ts` and `TouchControls.ts` together.
6. Do not remove `CombatSystem` lane/Z hit validation casually.
7. Preserve the one-hit-per-enemy guard for each player attack hitbox.
8. Do not delete generated `-green.png` source files unless the user asks for cleanup.
9. Do not bake interactive UI into background images.
10. Keep scene responsibilities separate: Boot loads shared and later-level asset groups, scenes compose, entities move, systems resolve combat, UI draws HUD/controls.
11. When in doubt, make a small focused change and verify in the browser before continuing.

## Current Known Limitations

- Character animation uses large generated cutouts, not real sprite sheets.
- Enemy AI is serviceable but simple.
- Options is currently a difficulty cycle, not a full settings screen.
- HUD values are partly prototype/static, such as gems and some health text.
- No save-game/profile system yet.
- Level 3 and Level 4 art is preloaded during boot to avoid blank scene transitions. This favors reliable level handoffs over a smaller initial download.
- Boss Rush and Arcade currently route to the same level scene.

## Development Roadmap

Short term:

1. Stabilize player/enemy movement and attack timing.
2. Add a proper Options screen with difficulty, audio, controls, and display settings.
3. Add health pickups, coin pickups, and special meter charging.
4. Add better goon defeat timing and reward drops.
5. Add pause/resume behavior.

Medium term:

1. Replace generated cutouts with sprite sheets.
2. Add more goon archetypes: fast goon, heavy goon, bottle thrower, shield goon.
3. Add level wave spawning and gates.
4. Add audio: menu music, Nairobi ambience, punches, kicks, bat hits, defeat sounds.
5. Add camera shake tuning and hit-stop.
6. Add dialogue beats with Mjaka Fine.

Long term:

1. Add minibosses and Majembe boss fight.
2. Add full story progression across Nairobi locations.
3. Add unlockable Mjaka Fine gameplay.
4. Add achievements and daily challenge systems.
5. Add persistent profile data and currency economy.
6. Optimize asset size and loading with atlases/sprite sheets.

## Verification Checklist Before Handing Work Back

For any gameplay change:

```bash
npm run build
```

Then test manually in browser:

1. Main menu loads.
2. Story Mode opens Character Select.
3. Character Select requires choosing a character and pressing SELECT.
4. Level starts with all goons visible on the street.
5. Mbavu responds to keyboard movement.
6. Punch, kick, and special trigger visible state changes.
7. Goons move toward Mbavu and attack.
8. Bat goons use the bat attack visual.
9. Defeated goons fall/fade/disappear after defeat, not at spawn.
10. If Mbavu is defeated, he falls instead of hanging upright.
11. No browser console errors.

For any UI/menu change:

1. Hover effects scale only the intended object.
2. Buttons do not overlap or distort background art.
3. Click zones match visible buttons.
4. Text remains readable at 16:9 scale.

## Design Direction

NI MBAYA should feel like a dramatic Nairobi street brawler:

- Sunset/night Nairobi skyline.
- M-PESA kiosks, smokie vendors, matatus, streetlights, wet pavement, dense market energy.
- Chunky arcade UI with yellow/black/red contrast.
- Strong comic-book fighting poses.
- Mobile-friendly controls with large hit targets.

Maintain this identity when adding features. Avoid generic fantasy, sci-fi, or medieval art directions unless the user explicitly asks for a special mode.
