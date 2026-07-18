import Phaser from 'phaser';

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
