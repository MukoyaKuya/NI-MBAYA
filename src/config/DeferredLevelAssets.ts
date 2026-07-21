import Phaser from 'phaser';

/** Loads the combat package only after the player chooses to enter a level. */
export function loadCoreGameplayAssets(scene: Phaser.Scene) {
  scene.load.audio('fight-music', new URL('../assets/audio/fight-music.mp3', import.meta.url).href);
  scene.load.audio('special-attack', new URL('../assets/audio/special-attack.mp3', import.meta.url).href);
  scene.load.audio('punch-hit', new URL('../assets/audio/punch-hit-sora.mp3', import.meta.url).href);
  scene.load.audio('heavy-hit', new URL('../assets/audio/heavy-hit.mp3', import.meta.url).href);
  scene.load.audio('dog-growl', new URL('../assets/audio/dog-growl.mp3', import.meta.url).href);
  scene.load.audio('challenge-win', new URL('../assets/audio/challenge.mp3', import.meta.url).href);
  scene.load.audio('hero-defeat', new URL('../assets/audio/hero-defeat.mp3', import.meta.url).href);
  scene.load.image('gameplay-background', new URL('../assets/gameplay/generated/gameplay-background.png', import.meta.url).href);
  scene.load.image('nairobi-matatu-conductor', new URL('../assets/gameplay/generated/nairobi-matatu-conductor.png', import.meta.url).href);
  scene.load.image('gameplay-mbavu-kick', new URL('../assets/gameplay/generated/mbavu-flying-kick-canonical.png', import.meta.url).href);
  scene.load.image('gameplay-goon', new URL('../assets/gameplay/generated/nairobi-goon.png', import.meta.url).href);
  scene.load.spritesheet('gameplay-goon-red-attack-sheet', new URL('../assets/gameplay/generated/goon-red-attack-sheet.png', import.meta.url).href, { frameWidth: 384, frameHeight: 384 });
  scene.load.spritesheet('gameplay-goon-hoodie-attack-sheet', new URL('../assets/gameplay/generated/goon-hoodie-attack-sheet.png', import.meta.url).href, { frameWidth: 384, frameHeight: 384 });
  scene.load.spritesheet('gameplay-goon-club-attack-sheet', new URL('../assets/gameplay/generated/goon-club-attack-sheet.png', import.meta.url).href, { frameWidth: 384, frameHeight: 384 });
  scene.load.spritesheet('gameplay-goon-red-walk-sheet', new URL('../assets/gameplay/generated/goon-red-walk-sheet.png', import.meta.url).href, { frameWidth: 384, frameHeight: 384 });
  scene.load.spritesheet('gameplay-goon-hoodie-walk-sheet', new URL('../assets/gameplay/generated/goon-hoodie-walk-sheet.png', import.meta.url).href, { frameWidth: 384, frameHeight: 384 });
  scene.load.spritesheet('gameplay-goon-club-walk-sheet', new URL('../assets/gameplay/generated/goon-club-walk-sheet.png', import.meta.url).href, { frameWidth: 384, frameHeight: 384 });
  scene.load.spritesheet('gameplay-goon-red-run-sheet', new URL('../assets/gameplay/generated/goon-red-run-sheet.png', import.meta.url).href, { frameWidth: 384, frameHeight: 384 });
  scene.load.spritesheet('gameplay-goon-hoodie-run-sheet', new URL('../assets/gameplay/generated/goon-hoodie-run-sheet.png', import.meta.url).href, { frameWidth: 384, frameHeight: 384 });
  scene.load.spritesheet('gameplay-goon-club-run-sheet', new URL('../assets/gameplay/generated/goon-club-run-sheet.png', import.meta.url).href, { frameWidth: 384, frameHeight: 384 });
  scene.load.image('gameplay-mbavu-idle', new URL('../assets/gameplay/generated/mbavu-idle.png', import.meta.url).href);
  scene.load.image('gameplay-mbavu-feint-1', new URL('../assets/gameplay/generated/mbavu-feint-1.png', import.meta.url).href);
  scene.load.image('gameplay-mbavu-feint-2', new URL('../assets/gameplay/generated/mbavu-feint-2.png', import.meta.url).href);
  scene.load.image('gameplay-mbavu-feint-3', new URL('../assets/gameplay/generated/mbavu-feint-3.png', import.meta.url).href);
  scene.load.image('gameplay-mbavu-feint-4', new URL('../assets/gameplay/generated/mbavu-feint-4.png', import.meta.url).href);
  scene.load.spritesheet('gameplay-mbavu-run-sheet', new URL('../assets/gameplay/generated/mbavu-run-sheet.png', import.meta.url).href, { frameWidth: 256, frameHeight: 384 });
  scene.load.image('gameplay-mbavu-punch', new URL('../assets/gameplay/generated/mbavu-punch.png', import.meta.url).href);
  scene.load.image('gameplay-goon-club', new URL('../assets/gameplay/generated/goon-club.png', import.meta.url).href);
  scene.load.image('gameplay-goon-hoodie', new URL('../assets/gameplay/generated/goon-hoodie.png', import.meta.url).href);
  scene.load.image('gameplay-mbavu-defeat', new URL('../assets/gameplay/generated/mbavu-defeat.png', import.meta.url).href);
  scene.load.spritesheet('gameplay-mbavu-defeat-fall-sheet', new URL('../assets/gameplay/generated/mbavu-defeat-fall-fullboots-sheet.png', import.meta.url).href, { frameWidth: 512, frameHeight: 384 });
  scene.load.image('gameplay-mbavu-standing-kick', new URL('../assets/gameplay/generated/mbavu-kick.png', import.meta.url).href);
  scene.load.image('gameplay-mjaka-palm-strike', new URL('../assets/gameplay/generated/mjaka-palm-strike.png', import.meta.url).href);
  scene.load.image('gameplay-mjaka-high-kick', new URL('../assets/gameplay/generated/mjaka-high-kick.png', import.meta.url).href);
  scene.load.image('gameplay-mjaka-rush-kick', new URL('../assets/gameplay/generated/mjaka-rush-kick.png', import.meta.url).href);
  scene.load.image('gameplay-goon-bat-attack', new URL('../assets/gameplay/generated/goon-bat-attack.png', import.meta.url).href);
  scene.load.image('gameplay-goon-bat-attack-2', new URL('../assets/gameplay/generated/goon-bat-attack-2.png', import.meta.url).href);
  scene.load.image('gameplay-goon-bat-attack-3', new URL('../assets/gameplay/generated/goon-bat-attack-3.png', import.meta.url).href);
  scene.load.image('gameplay-goon-defeat', new URL('../assets/gameplay/generated/goon-defeat.png', import.meta.url).href);
}

/** Loads art that is only needed after the player reaches the later chapters. */
export function loadDeferredLevelAssets(scene: Phaser.Scene, levelId: number) {
  if (levelId === 3) {
    scene.load.image('level3-nairobi-rooftop-background', new URL('../assets/gameplay/generated/level3-nairobi-rooftop-background.png', import.meta.url).href);
    scene.load.spritesheet('gameplay-attack-dog', new URL('../assets/gameplay/generated/attack-dog-attack-sheet.png', import.meta.url).href, { frameWidth: 384, frameHeight: 384 });
    scene.load.spritesheet('gameplay-attack-dog-run-sheet', new URL('../assets/gameplay/generated/attack-dog-run-sheet.png', import.meta.url).href, { frameWidth: 384, frameHeight: 384 });
    scene.load.spritesheet('gameplay-attack-dog-defeat-sheet', new URL('../assets/gameplay/generated/attack-dog-defeat-sheet.png', import.meta.url).href, { frameWidth: 384, frameHeight: 384 });
    scene.load.spritesheet('gameplay-goon-chain', new URL('../assets/gameplay/generated/goon-chain-idle-sheet.png', import.meta.url).href, { frameWidth: 384, frameHeight: 384 });
    scene.load.spritesheet('gameplay-goon-chain-walk-sheet', new URL('../assets/gameplay/generated/goon-chain-walk-sheet.png', import.meta.url).href, { frameWidth: 384, frameHeight: 384 });
    scene.load.spritesheet('gameplay-goon-chain-attack-sheet', new URL('../assets/gameplay/generated/goon-chain-attack-sheet.png', import.meta.url).href, { frameWidth: 384, frameHeight: 384 });
    scene.load.spritesheet('gameplay-goon-chain-defeat-sheet', new URL('../assets/gameplay/generated/goon-chain-defeat-sheet.png', import.meta.url).href, { frameWidth: 384, frameHeight: 384 });
    scene.load.spritesheet('gameplay-goon-heavy', new URL('../assets/gameplay/generated/goon-heavy-idle-sheet.png', import.meta.url).href, { frameWidth: 384, frameHeight: 384 });
    scene.load.spritesheet('gameplay-goon-heavy-walk-sheet', new URL('../assets/gameplay/generated/goon-heavy-walk-sheet.png', import.meta.url).href, { frameWidth: 384, frameHeight: 384 });
    scene.load.spritesheet('gameplay-goon-heavy-attack-sheet', new URL('../assets/gameplay/generated/goon-heavy-attack-sheet.png', import.meta.url).href, { frameWidth: 384, frameHeight: 384 });
    scene.load.spritesheet('gameplay-goon-heavy-defeat-sheet', new URL('../assets/gameplay/generated/goon-heavy-defeat-sheet.png', import.meta.url).href, { frameWidth: 384, frameHeight: 384 });
  }

  if (levelId === 4) {
    scene.load.image('level4-kibera-background', new URL('../assets/gameplay/generated/level4-kibera-background.png', import.meta.url).href);
    scene.load.image('gameplay-kibera-stone-goon', new URL('../assets/gameplay/generated/kibera-stone-goon-idle.png', import.meta.url).href);
    scene.load.spritesheet('gameplay-kibera-stone-goon-walk-sheet', new URL('../assets/gameplay/generated/kibera-stone-goon-walk-sheet.png', import.meta.url).href, { frameWidth: 384, frameHeight: 384 });
    scene.load.spritesheet('gameplay-kibera-stone-goon-sprint-sheet', new URL('../assets/gameplay/generated/kibera-stone-goon-sprint-sheet.png', import.meta.url).href, { frameWidth: 384, frameHeight: 384 });
    scene.load.spritesheet('gameplay-kibera-stone-goon-throw-sheet', new URL('../assets/gameplay/generated/kibera-stone-goon-throw-sheet.png', import.meta.url).href, { frameWidth: 384, frameHeight: 384 });
    scene.load.image('gameplay-kibera-shield-goon', new URL('../assets/gameplay/generated/kibera-shield-goon-idle.png', import.meta.url).href);
    scene.load.spritesheet('gameplay-kibera-shield-goon-walk-sheet', new URL('../assets/gameplay/generated/kibera-shield-goon-walk-sheet.png', import.meta.url).href, { frameWidth: 384, frameHeight: 384 });
    scene.load.spritesheet('gameplay-kibera-shield-goon-sprint-sheet', new URL('../assets/gameplay/generated/kibera-shield-goon-sprint-sheet.png', import.meta.url).href, { frameWidth: 384, frameHeight: 384 });
    scene.load.spritesheet('gameplay-kibera-shield-goon-attack-sheet', new URL('../assets/gameplay/generated/kibera-shield-goon-attack-sheet.png', import.meta.url).href, { frameWidth: 384, frameHeight: 384 });
  }
}
