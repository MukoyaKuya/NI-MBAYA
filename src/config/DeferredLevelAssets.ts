import Phaser from 'phaser';

// Keep every URL explicit so Vite emits these files into the production build,
// while Phaser can still request them only when their scene needs them.
const assetUrls: Record<string, string> = {
  'audio/special-attack.mp3': new URL('../assets/audio/special-attack.mp3', import.meta.url).href,
  'audio/punch-hit-sora.mp3': new URL('../assets/audio/punch-hit-sora.mp3', import.meta.url).href,
  'audio/heavy-hit.mp3': new URL('../assets/audio/heavy-hit.mp3', import.meta.url).href,
  'audio/challenge.mp3': new URL('../assets/audio/challenge.mp3', import.meta.url).href,
  'audio/hero-defeat.mp3': new URL('../assets/audio/hero-defeat.mp3', import.meta.url).href,
  'audio/dog-growl.mp3': new URL('../assets/audio/dog-growl.mp3', import.meta.url).href,
  'menu/generated/mjaka.png': new URL('../assets/menu/generated/mjaka.png', import.meta.url).href,
  'gameplay/generated/chapati-health-pickup-sheet.png': new URL('../assets/gameplay/generated/chapati-health-pickup-sheet.png', import.meta.url).href,
  'gameplay/generated/mbavu-idle.png': new URL('../assets/gameplay/generated/mbavu-idle.png', import.meta.url).href,
  'gameplay/generated/mbavu-feint-1.png': new URL('../assets/gameplay/generated/mbavu-feint-1.png', import.meta.url).href,
  'gameplay/generated/mbavu-feint-2.png': new URL('../assets/gameplay/generated/mbavu-feint-2.png', import.meta.url).href,
  'gameplay/generated/mbavu-feint-3.png': new URL('../assets/gameplay/generated/mbavu-feint-3.png', import.meta.url).href,
  'gameplay/generated/mbavu-feint-4.png': new URL('../assets/gameplay/generated/mbavu-feint-4.png', import.meta.url).href,
  'gameplay/generated/mbavu-run-sheet.png': new URL('../assets/gameplay/generated/mbavu-run-sheet.png', import.meta.url).href,
  'gameplay/generated/mbavu-punch.png': new URL('../assets/gameplay/generated/mbavu-punch.png', import.meta.url).href,
  'gameplay/generated/mbavu-flying-kick-canonical.png': new URL('../assets/gameplay/generated/mbavu-flying-kick-canonical.png', import.meta.url).href,
  'gameplay/generated/mbavu-kick.png': new URL('../assets/gameplay/generated/mbavu-kick.png', import.meta.url).href,
  'gameplay/generated/mbavu-defeat.png': new URL('../assets/gameplay/generated/mbavu-defeat.png', import.meta.url).href,
  'gameplay/generated/mbavu-defeat-fall-fullboots-sheet.png': new URL('../assets/gameplay/generated/mbavu-defeat-fall-fullboots-sheet.png', import.meta.url).href,
  'gameplay/generated/mjaka-palm-strike.png': new URL('../assets/gameplay/generated/mjaka-palm-strike.png', import.meta.url).href,
  'gameplay/generated/mjaka-high-kick.png': new URL('../assets/gameplay/generated/mjaka-high-kick.png', import.meta.url).href,
  'gameplay/generated/mjaka-rush-kick.png': new URL('../assets/gameplay/generated/mjaka-rush-kick.png', import.meta.url).href,
  'gameplay/generated/nairobi-cbd-background.png': new URL('../assets/gameplay/generated/nairobi-cbd-background.png', import.meta.url).href,
  'gameplay/generated/gameplay-background.png': new URL('../assets/gameplay/generated/gameplay-background.png', import.meta.url).href,
  'gameplay/generated/nairobi-goon.png': new URL('../assets/gameplay/generated/nairobi-goon.png', import.meta.url).href,
  'gameplay/generated/goon-hoodie.png': new URL('../assets/gameplay/generated/goon-hoodie.png', import.meta.url).href,
  'gameplay/generated/goon-club.png': new URL('../assets/gameplay/generated/goon-club.png', import.meta.url).href,
  'gameplay/generated/goon-red-attack-sheet.png': new URL('../assets/gameplay/generated/goon-red-attack-sheet.png', import.meta.url).href,
  'gameplay/generated/goon-hoodie-attack-sheet.png': new URL('../assets/gameplay/generated/goon-hoodie-attack-sheet.png', import.meta.url).href,
  'gameplay/generated/goon-club-attack-sheet.png': new URL('../assets/gameplay/generated/goon-club-attack-sheet.png', import.meta.url).href,
  'gameplay/generated/goon-red-walk-sheet.png': new URL('../assets/gameplay/generated/goon-red-walk-sheet.png', import.meta.url).href,
  'gameplay/generated/goon-hoodie-walk-sheet.png': new URL('../assets/gameplay/generated/goon-hoodie-walk-sheet.png', import.meta.url).href,
  'gameplay/generated/goon-club-walk-sheet.png': new URL('../assets/gameplay/generated/goon-club-walk-sheet.png', import.meta.url).href,
  'gameplay/generated/goon-red-run-sheet.png': new URL('../assets/gameplay/generated/goon-red-run-sheet.png', import.meta.url).href,
  'gameplay/generated/goon-hoodie-run-sheet.png': new URL('../assets/gameplay/generated/goon-hoodie-run-sheet.png', import.meta.url).href,
  'gameplay/generated/goon-club-run-sheet.png': new URL('../assets/gameplay/generated/goon-club-run-sheet.png', import.meta.url).href,
  'gameplay/generated/level3-nairobi-rooftop-background.png': new URL('../assets/gameplay/generated/level3-nairobi-rooftop-background.png', import.meta.url).href,
  'gameplay/generated/attack-dog-attack-sheet.png': new URL('../assets/gameplay/generated/attack-dog-attack-sheet.png', import.meta.url).href,
  'gameplay/generated/attack-dog-run-sheet.png': new URL('../assets/gameplay/generated/attack-dog-run-sheet.png', import.meta.url).href,
  'gameplay/generated/attack-dog-defeat-sheet.png': new URL('../assets/gameplay/generated/attack-dog-defeat-sheet.png', import.meta.url).href,
  'gameplay/generated/goon-chain-idle-sheet.png': new URL('../assets/gameplay/generated/goon-chain-idle-sheet.png', import.meta.url).href,
  'gameplay/generated/goon-chain-walk-sheet.png': new URL('../assets/gameplay/generated/goon-chain-walk-sheet.png', import.meta.url).href,
  'gameplay/generated/goon-chain-attack-sheet.png': new URL('../assets/gameplay/generated/goon-chain-attack-sheet.png', import.meta.url).href,
  'gameplay/generated/goon-chain-defeat-sheet.png': new URL('../assets/gameplay/generated/goon-chain-defeat-sheet.png', import.meta.url).href,
  'gameplay/generated/goon-heavy-idle-sheet.png': new URL('../assets/gameplay/generated/goon-heavy-idle-sheet.png', import.meta.url).href,
  'gameplay/generated/goon-heavy-walk-sheet.png': new URL('../assets/gameplay/generated/goon-heavy-walk-sheet.png', import.meta.url).href,
  'gameplay/generated/goon-heavy-attack-sheet.png': new URL('../assets/gameplay/generated/goon-heavy-attack-sheet.png', import.meta.url).href,
  'gameplay/generated/goon-heavy-defeat-sheet.png': new URL('../assets/gameplay/generated/goon-heavy-defeat-sheet.png', import.meta.url).href,
  'gameplay/generated/level4-kibera-background.png': new URL('../assets/gameplay/generated/level4-kibera-background.png', import.meta.url).href,
  'gameplay/generated/kibera-stone-goon-idle.png': new URL('../assets/gameplay/generated/kibera-stone-goon-idle.png', import.meta.url).href,
  'gameplay/generated/kibera-shield-goon-idle.png': new URL('../assets/gameplay/generated/kibera-shield-goon-idle.png', import.meta.url).href,
  'gameplay/generated/kibera-stone-goon-walk-sheet.png': new URL('../assets/gameplay/generated/kibera-stone-goon-walk-sheet.png', import.meta.url).href,
  'gameplay/generated/kibera-stone-goon-sprint-sheet.png': new URL('../assets/gameplay/generated/kibera-stone-goon-sprint-sheet.png', import.meta.url).href,
  'gameplay/generated/kibera-stone-goon-throw-sheet.png': new URL('../assets/gameplay/generated/kibera-stone-goon-throw-sheet.png', import.meta.url).href,
  'gameplay/generated/kibera-shield-goon-walk-sheet.png': new URL('../assets/gameplay/generated/kibera-shield-goon-walk-sheet.png', import.meta.url).href,
  'gameplay/generated/kibera-shield-goon-sprint-sheet.png': new URL('../assets/gameplay/generated/kibera-shield-goon-sprint-sheet.png', import.meta.url).href,
  'gameplay/generated/kibera-shield-goon-attack-sheet.png': new URL('../assets/gameplay/generated/kibera-shield-goon-attack-sheet.png', import.meta.url).href,
};

const asset = (path: string) => assetUrls[path];

const loadImage = (scene: Phaser.Scene, key: string, path: string) => {
  if (scene.textures.exists(key)) return false;
  scene.load.image(key, asset(path));
  return true;
};

const loadSheet = (scene: Phaser.Scene, key: string, path: string, frameWidth: number) => {
  if (scene.textures.exists(key)) return false;
  scene.load.spritesheet(key, asset(path), { frameWidth, frameHeight: 384 });
  return true;
};

const loadAudio = (scene: Phaser.Scene, key: string, path: string) => {
  if (scene.cache.audio.exists(key)) return false;
  scene.load.audio(key, asset(path));
  return true;
};

/**
 * Loads only the fighter and arena needed for the current round. The former
 * all-in-one pack made a phone download artwork for every later chapter before
 * the first punch could be thrown.
 */
export function loadCoreGameplayAssets(scene: Phaser.Scene, levelId: number, character: string) {
  loadAudio(scene, 'special-attack', 'audio/special-attack.mp3');
  loadAudio(scene, 'punch-hit', 'audio/punch-hit-sora.mp3');
  loadAudio(scene, 'heavy-hit', 'audio/heavy-hit.mp3');
  loadAudio(scene, 'challenge-win', 'audio/challenge.mp3');
  loadAudio(scene, 'hero-defeat', 'audio/hero-defeat.mp3');
  loadSheet(scene, 'gameplay-chapati-health-pickup-sheet', 'gameplay/generated/chapati-health-pickup-sheet.png', 384);

  if (character === 'MJAKA FINE') {
    loadImage(scene, 'menu-mjaka', 'menu/generated/mjaka.png');
    loadImage(scene, 'gameplay-mjaka-palm-strike', 'gameplay/generated/mjaka-palm-strike.png');
    loadImage(scene, 'gameplay-mjaka-high-kick', 'gameplay/generated/mjaka-high-kick.png');
    loadImage(scene, 'gameplay-mjaka-rush-kick', 'gameplay/generated/mjaka-rush-kick.png');
  } else {
    loadImage(scene, 'gameplay-mbavu-idle', 'gameplay/generated/mbavu-idle.png');
    loadImage(scene, 'gameplay-mbavu-punch', 'gameplay/generated/mbavu-punch.png');
    loadImage(scene, 'gameplay-mbavu-kick', 'gameplay/generated/mbavu-flying-kick-canonical.png');
    loadImage(scene, 'gameplay-mbavu-standing-kick', 'gameplay/generated/mbavu-kick.png');
    loadImage(scene, 'gameplay-mbavu-defeat', 'gameplay/generated/mbavu-defeat.png');
  }

  if (levelId === 1 || levelId === 2) {
    loadImage(scene, levelId === 1 ? 'nairobi-cbd-background' : 'gameplay-background', levelId === 1
      ? 'gameplay/generated/nairobi-cbd-background.png'
      : 'gameplay/generated/gameplay-background.png');
    loadImage(scene, 'gameplay-goon', 'gameplay/generated/nairobi-goon.png');
    loadImage(scene, 'gameplay-goon-hoodie', 'gameplay/generated/goon-hoodie.png');
    loadImage(scene, 'gameplay-goon-club', 'gameplay/generated/goon-club.png');
  }
}

/** Loads art that is only needed after the player reaches the later chapters. */
export function loadDeferredLevelAssets(scene: Phaser.Scene, levelId: number) {
  if (levelId === 3) {
    loadImage(scene, 'level3-nairobi-rooftop-background', 'gameplay/generated/level3-nairobi-rooftop-background.png');
    loadSheet(scene, 'gameplay-attack-dog', 'gameplay/generated/attack-dog-attack-sheet.png', 384);
    loadSheet(scene, 'gameplay-goon-chain', 'gameplay/generated/goon-chain-idle-sheet.png', 384);
    loadSheet(scene, 'gameplay-goon-heavy', 'gameplay/generated/goon-heavy-idle-sheet.png', 384);
    loadAudio(scene, 'dog-growl', 'audio/dog-growl.mp3');
  }

  if (levelId === 4) {
    loadImage(scene, 'level4-kibera-background', 'gameplay/generated/level4-kibera-background.png');
    loadImage(scene, 'gameplay-kibera-stone-goon', 'gameplay/generated/kibera-stone-goon-idle.png');
    loadImage(scene, 'gameplay-kibera-shield-goon', 'gameplay/generated/kibera-shield-goon-idle.png');
  }
}

/**
 * Queues the heavier motion sheets after the arena is already playable. They
 * restore the authored walking and attack animations without another blocking
 * loading screen.
 */
export function loadBattleAnimationAssets(scene: Phaser.Scene, levelId: number, character: string) {
  let queued = false;
  const add = (didQueue: boolean) => { queued = didQueue || queued; };

  if (character !== 'MJAKA FINE') {
    add(loadImage(scene, 'gameplay-mbavu-feint-1', 'gameplay/generated/mbavu-feint-1.png'));
    add(loadImage(scene, 'gameplay-mbavu-feint-2', 'gameplay/generated/mbavu-feint-2.png'));
    add(loadImage(scene, 'gameplay-mbavu-feint-3', 'gameplay/generated/mbavu-feint-3.png'));
    add(loadImage(scene, 'gameplay-mbavu-feint-4', 'gameplay/generated/mbavu-feint-4.png'));
    add(loadSheet(scene, 'gameplay-mbavu-run-sheet', 'gameplay/generated/mbavu-run-sheet.png', 256));
    add(loadSheet(scene, 'gameplay-mbavu-defeat-fall-sheet', 'gameplay/generated/mbavu-defeat-fall-fullboots-sheet.png', 512));
  }

  if (levelId === 1 || levelId === 2) {
    add(loadSheet(scene, 'gameplay-goon-red-attack-sheet', 'gameplay/generated/goon-red-attack-sheet.png', 384));
    add(loadSheet(scene, 'gameplay-goon-hoodie-attack-sheet', 'gameplay/generated/goon-hoodie-attack-sheet.png', 384));
    add(loadSheet(scene, 'gameplay-goon-club-attack-sheet', 'gameplay/generated/goon-club-attack-sheet.png', 384));
    add(loadSheet(scene, 'gameplay-goon-red-walk-sheet', 'gameplay/generated/goon-red-walk-sheet.png', 384));
    add(loadSheet(scene, 'gameplay-goon-hoodie-walk-sheet', 'gameplay/generated/goon-hoodie-walk-sheet.png', 384));
    add(loadSheet(scene, 'gameplay-goon-club-walk-sheet', 'gameplay/generated/goon-club-walk-sheet.png', 384));
    add(loadSheet(scene, 'gameplay-goon-red-run-sheet', 'gameplay/generated/goon-red-run-sheet.png', 384));
    add(loadSheet(scene, 'gameplay-goon-hoodie-run-sheet', 'gameplay/generated/goon-hoodie-run-sheet.png', 384));
    add(loadSheet(scene, 'gameplay-goon-club-run-sheet', 'gameplay/generated/goon-club-run-sheet.png', 384));
  }

  if (levelId === 3) {
    add(loadSheet(scene, 'gameplay-attack-dog-run-sheet', 'gameplay/generated/attack-dog-run-sheet.png', 384));
    add(loadSheet(scene, 'gameplay-attack-dog-defeat-sheet', 'gameplay/generated/attack-dog-defeat-sheet.png', 384));
    add(loadSheet(scene, 'gameplay-goon-chain-walk-sheet', 'gameplay/generated/goon-chain-walk-sheet.png', 384));
    add(loadSheet(scene, 'gameplay-goon-chain-attack-sheet', 'gameplay/generated/goon-chain-attack-sheet.png', 384));
    add(loadSheet(scene, 'gameplay-goon-chain-defeat-sheet', 'gameplay/generated/goon-chain-defeat-sheet.png', 384));
    add(loadSheet(scene, 'gameplay-goon-heavy-walk-sheet', 'gameplay/generated/goon-heavy-walk-sheet.png', 384));
    add(loadSheet(scene, 'gameplay-goon-heavy-attack-sheet', 'gameplay/generated/goon-heavy-attack-sheet.png', 384));
    add(loadSheet(scene, 'gameplay-goon-heavy-defeat-sheet', 'gameplay/generated/goon-heavy-defeat-sheet.png', 384));
  }

  if (levelId === 4) {
    add(loadSheet(scene, 'gameplay-kibera-stone-goon-walk-sheet', 'gameplay/generated/kibera-stone-goon-walk-sheet.png', 384));
    add(loadSheet(scene, 'gameplay-kibera-stone-goon-sprint-sheet', 'gameplay/generated/kibera-stone-goon-sprint-sheet.png', 384));
    add(loadSheet(scene, 'gameplay-kibera-stone-goon-throw-sheet', 'gameplay/generated/kibera-stone-goon-throw-sheet.png', 384));
    add(loadSheet(scene, 'gameplay-kibera-shield-goon-walk-sheet', 'gameplay/generated/kibera-shield-goon-walk-sheet.png', 384));
    add(loadSheet(scene, 'gameplay-kibera-shield-goon-sprint-sheet', 'gameplay/generated/kibera-shield-goon-sprint-sheet.png', 384));
    add(loadSheet(scene, 'gameplay-kibera-shield-goon-attack-sheet', 'gameplay/generated/kibera-shield-goon-attack-sheet.png', 384));
  }

  return queued;
}
