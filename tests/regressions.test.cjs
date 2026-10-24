const { test } = require('node:test');
const assert = require('node:assert/strict');
const ts = require('typescript');
const fs = require('node:fs');
const path = require('node:path');

test('streaming music retries after a gesture, respects sound settings and releases old tracks', async () => {
  const previousAudio = globalThis.Audio, previousWindow = globalThis.window;
  const listeners = {}, tracks = [];
  let enabled = true, allowed = false;
  globalThis.window = { addEventListener(name, listener) { listeners[name] = listener; } };
  globalThis.Audio = class {
    constructor(url) { this.url = url; this.paused = true; this.readyState = 1; this.attempts = 0; tracks.push(this); }
    addEventListener() {}
    play() { this.attempts++; if (!allowed) return Promise.reject(Object.assign(new Error(), { name: 'NotAllowedError' })); this.paused = false; return Promise.resolve(); }
    pause() { this.paused = true; }
    removeAttribute(name) { assert.equal(name, 'src'); this.released = true; }
    load() { this.reloaded = true; }
  };
  try {
    const music = loadSource('src/systems/StreamingMusic.ts', { '../config/GameSettings': { isSoundEnabled: () => enabled } });
    music.startStreamingMusic('menu-music', '/menu.mp3', 0.24);
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(music.getStreamingMusicStatus().error, 'NotAllowedError');
    assert.equal(tracks[0].preload, 'none');
    allowed = true;
    listeners.pointerdown();
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(music.getStreamingMusicStatus().playing, true);
    enabled = false; listeners['ni-mbaya:sound-changed']();
    assert.equal(tracks[0].paused, true);
    enabled = true; listeners['ni-mbaya:sound-changed']();
    assert.equal(tracks[0].paused, false);
    music.startStreamingMusic('fight-music', '/fight.mp3', 0.2);
    assert.equal(tracks[0].released, true);
    assert.equal(tracks[0].reloaded, true);
    assert.equal(music.getStreamingMusicStatus().track, 'fight-music');
    music.stopStreamingMusic('menu-music');
    assert.equal(tracks[1].paused, false);
    music.stopStreamingMusic('fight-music');
    assert.deepEqual(music.getStreamingMusicStatus(), { track: null });
  } finally { globalThis.Audio = previousAudio; globalThis.window = previousWindow; }
});

test('optional combat audio loads after the arena instead of blocking its startup', () => {
  const { loadCoreGameplayAssets, loadBattleAnimationAssets } = loadSource('src/config/DeferredLevelAssets.ts', { phaser: {} });
  const audio = [];
  const scene = { textures: { exists: () => false }, cache: { audio: { exists: () => false } },
    load: { image() {}, spritesheet() {}, audio(key) { audio.push(key); } } };
  loadCoreGameplayAssets(scene, 1, 'MBAVU DESTROYER');
  assert.deepEqual(audio, []);
  assert.equal(loadBattleAnimationAssets(scene, 1, 'MBAVU DESTROYER'), true);
  assert.deepEqual(audio.sort(), ['challenge-win', 'heavy-hit', 'hero-defeat', 'punch-hit', 'special-attack']);
});

test('precomputed cleanup spans stay inside all seven original sheets', () => {
  const { SPRITE_FRAGMENT_RUNS } = loadSource('src/systems/SpriteFragmentRuns.ts');
  assert.equal(Object.keys(SPRITE_FRAGMENT_RUNS).length, 7);
  for (const [key, spans] of Object.entries(SPRITE_FRAGMENT_RUNS)) {
    const pixels = (key.includes('mbavu') ? 512 : 384) * 8 * 384;
    assert.equal(spans.length % 2, 0);
    assert.ok(spans.length > 0);
    for (let index = 0; index < spans.length; index += 2) {
      assert.ok(spans[index] >= 0 && spans[index + 1] > 0 && spans[index] + spans[index + 1] <= pixels);
    }
  }
});

test('runner cleanup removes fragments inside and outside its bounds in both directions', () => {
  const { removeDetachedPixels } = loadSource('src/systems/EnemyRunTexture.ts');
  for (const flipped of [false, true]) {
    const pixels = new Uint8ClampedArray(32 * 32 * 4);
    const at = (x, y) => (y * 32 + (flipped ? 31 - x : x)) * 4 + 3;
    // Connected U-shaped body with a detached fleck inside its bounding box.
    for (let y = 4; y <= 26; y++) {
      pixels[at(5, y)] = 255;
      pixels[at(25, y)] = 255;
    }
    for (let x = 5; x <= 25; x++) pixels[at(x, 26)] = 255;
    pixels[at(15, 10)] = 255;
    pixels[at(1, 1)] = 255;
    pixels[at(4, 12)] = 8; // Soft edge attached to the body.
    removeDetachedPixels(pixels, 32, 32);
    assert.equal(pixels[at(15, 10)], 0);
    assert.equal(pixels[at(1, 1)], 0);
    assert.equal(pixels[at(5, 12)], 255);
    assert.equal(pixels[at(4, 12)], 8);
    assert.equal(pixels[at(25, 26)], 255);
  }
});

test('all escape sprint animations use cleaned textures', () => {
  const phaser = { Scene: class {}, Physics: { Arcade: { Sprite: class {} } } };
  const keys = ['goon-red-run', 'goon-hoodie-run', 'goon-club-run', 'kibera-stone-sprint', 'kibera-shield-sprint'];
  const { LevelScene } = loadSource('src/scenes/LevelScene.ts', {
    phaser, '../config/GameConfig': {},
    '../systems/EnemyRunTexture': { getCleanEnemyRunTexture: (_, key) => key + '-clean' },
  });
  const created = [];
  const scene = Object.assign(Object.create(LevelScene.prototype), {
    textures: { exists: () => true },
    anims: {
      exists: key => !keys.includes(key),
      generateFrameNumbers: (texture, range) => Array.from({ length: 8 }, (_, frame) => ({ texture, frame })),
      create: config => created.push(config),
    },
  });
  scene.createSceneAnimations();
  assert.deepEqual(created.map(anim => anim.key).sort(), keys.sort());
  for (const anim of created) {
    assert.equal(anim.repeat, -1);
    assert.equal(anim.frames.length, 8);
    assert.ok(anim.frames.every(frame => frame.texture.endsWith('-clean')));
  }
});

test('Majembe hit reaction and knockdown both use the cleaned fall sheet', () => {
  const phaser = { Scene: class {}, Physics: { Arcade: { Sprite: class {} } } };
  const cleanKey = 'gameplay-mbavu-defeat-fall-sheet-clean';
  const { LevelScene } = loadSource('src/scenes/LevelScene.ts', {
    phaser, '../config/GameConfig': {},
    '../systems/EnemyRunTexture': { getCleanPlayerFallTexture: () => cleanKey },
  });
  const created = [];
  const scene = Object.assign(Object.create(LevelScene.prototype), {
    textures: { exists: () => true },
    anims: {
      exists: key => !['mbavu-hit-reaction', 'mbavu-defeat-fall'].includes(key),
      generateFrameNumbers: (key, range) => Array.from({ length: range.end + 1 }, (_, frame) => ({ key, frame })),
      create: config => created.push(config),
    },
  });
  scene.createSceneAnimations();
  assert.equal(created.length, 2);
  for (const anim of created) assert.ok(anim.frames.every(frame => frame.key === cleanKey));
  assert.deepEqual(created.find(anim => anim.key === 'mbavu-defeat-fall').frames.map(frame => frame.frame), [0, 1, 2, 3, 4, 5, 6, 7]);
});

test('enemy falls preserve proportions, settle on the road and stop drifting', () => {
  const { getEnemyDefeatPose } = loadSource('src/systems/EnemyDefeatMotion.ts');
  for (const direction of [-1, 1]) {
    const start = getEnemyDefeatPose(0, 210, 250, 480, 580, direction);
    assert.equal(Math.abs(start.angle), 0);
    assert.equal(start.y, 480);
    const midway = getEnemyDefeatPose(210, 210, 250, 480, 580, direction);
    assert.ok(Math.abs(midway.angle) > 0 && Math.abs(midway.angle) < 90);
    const end = getEnemyDefeatPose(420, 210, 250, 480, 580, direction);
    assert.equal(end.angle, direction * 90);
    assert.ok(Math.abs(end.y + 210 / 2 - 580) < 0.001);
    assert.deepEqual(getEnemyDefeatPose(2000, 210, 250, 480, 580, direction), end);
    assert.equal(end.offsetX, direction * 32);
  }
});

function loadSource(relative, mocks = {}, cache = new Map()) {
  const filename = path.resolve(__dirname, '..', relative);
  if (cache.has(filename)) return cache.get(filename);
  const code = ts.transpileModule(fs.readFileSync(filename, 'utf8').replaceAll('import.meta.url', JSON.stringify(require('node:url').pathToFileURL(filename).href)), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
  }).outputText;
  const module = { exports: {} };
  cache.set(filename, module.exports);
  const requireSource = (id) => {
    if (id in mocks) return mocks[id];
    if (id.startsWith('.')) return loadSource(path.relative(path.resolve(__dirname, '..'), path.resolve(path.dirname(filename), id + '.ts')), mocks, cache);
    return require(id);
  };
  new Function('require', 'module', 'exports', code)(requireSource, module, module.exports);
  return module.exports;
}

test('progress, options and controls work when storage access throws', () => {
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, get() { throw new Error('blocked'); } });
  const cache = new Map();
  const load = (name) => loadSource(`src/config/${name}.ts`, {}, cache);
  const progress = load('GameProgress');
  assert.equal(progress.getJourneySave(), null);
  const save = { levelId: 2, character: 'MBAVU DESTROYER', chapatis: 12, health: 65 };
  progress.saveJourneyProgress(save);
  assert.deepEqual(progress.getJourneySave(), save);
  assert.equal(progress.unlockLocationStory(2), true);
  assert.equal(progress.unlockLocationStory(2), false);
  const settings = load('GameSettings');
  assert.equal(settings.cycleDifficulty(), 'hard');
  assert.equal(settings.getDifficulty(), 'hard');
  settings.setSoundEnabled(false);
  assert.equal(settings.isSoundEnabled(), false);
  assert.equal(settings.toggleStoryLanguage(), 'sw');
  const controls = load('Controls');
  controls.setControlKey('punch', 'Q');
  assert.equal(controls.getControlKeys().punch, 'Q');
  assert.equal(controls.resetControlKeys().punch, 'J');
  delete globalThis.localStorage;
});

test('failed writes use session values and reset masks old persisted values', () => {
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
    getItem: () => 'old', setItem() { throw new Error('quota'); }, removeItem() { throw new Error('blocked'); },
  } });
  const storage = loadSource('src/config/Storage.ts');
  assert.equal(storage.readStorage('key'), 'old');
  storage.writeStorage('key', 'new');
  assert.equal(storage.readStorage('key'), 'new');
  storage.removeStorage('key');
  assert.equal(storage.readStorage('key'), null);
  delete globalThis.localStorage;
});

test('HUD cannot resume a level completion or defeat pause', () => {
  const { HUD } = loadSource('src/ui/HUD.ts', { phaser: {}, '../config/GameConfig': { GAME_WIDTH: 1280, GAME_HEIGHT: 720 } });
  const hud = Object.create(HUD.prototype);
  hud.pausedByHud = false;
  hud.scene = { physics: { world: { isPaused: true, resume() { assert.fail('must retain level pause'); } } } };
  hud.togglePause();
  assert.equal(hud.pausedByHud, false);
});

test('attack expiration unregisters its overlap collider exactly once', () => {
  const phaser = { GameObjects: { Events: { DESTROY: 'destroy' } } };
  const { CombatSystem } = loadSource('src/systems/CombatSystem.ts', { phaser });
  let destroyListener, expire, destroyCount = 0;
  const overlap = { active: true, destroy() { this.active = false; destroyCount++; } };
  const zone = { body: { setAllowGravity() {}, setImmovable() {} }, once(event, callback) { destroyListener = callback; }, destroy() { destroyListener(); } };
  const scene = {
    add: { zone: () => zone },
    physics: { add: { existing() {}, overlap: () => overlap } },
    time: { delayedCall(ms, callback) { assert.equal(ms, 90); expire = callback; } },
  };
  const combat = new CombatSystem(scene, { x: 0, y: 0, facing: 1 }, {}, {});
  combat.spawnPlayerHitbox('punch');
  expire();
  assert.equal(destroyCount, 1);
  destroyListener();
  assert.equal(destroyCount, 1);
});


test('leaving a HUD-paused level restores physics and global animations', () => {
  const { HUD } = loadSource('src/ui/HUD.ts', { phaser: { Scenes: { Events: { SHUTDOWN: 'shutdown' } } }, '../config/GameConfig': { GAME_WIDTH: 1280, GAME_HEIGHT: 720 } });
  let shutdown, resumedPhysics = 0, resumedAnimations = 0;
  const fluent = new Proxy({}, { get: () => () => fluent });
  const scene = {
    add: new Proxy({}, { get: () => () => fluent }),
    input: { keyboard: { on() {}, off() {} } },
    events: { once(event, callback) { assert.equal(event, 'shutdown'); shutdown = callback; } },
    physics: { world: { isPaused: false, pause() { this.isPaused = true; }, resume() { resumedPhysics++; this.isPaused = false; } } },
    anims: { pauseAll() {}, resumeAll() { resumedAnimations++; } },
  };
  const hud = new HUD(scene);
  hud.togglePause();
  assert.equal(scene.physics.world.isPaused, true);
  shutdown();
  assert.equal(resumedPhysics, 1);
  assert.equal(resumedAnimations, 1);
  assert.equal(hud.pausedByHud, false);
});


test('HUD shutdown tolerates Phaser disposing the physics world first', () => {
  const { HUD } = loadSource('src/ui/HUD.ts', { phaser: { Scenes: { Events: { SHUTDOWN: 'shutdown' } } }, '../config/GameConfig': { GAME_WIDTH: 1280, GAME_HEIGHT: 720 } });
  let shutdown, resumedAnimations = 0;
  const fluent = new Proxy({}, { get: () => () => fluent });
  const scene = {
    add: new Proxy({}, { get: () => () => fluent }),
    input: { keyboard: { on() {}, off() {} } },
    events: { once(event, callback) { shutdown = callback; } },
    physics: { world: { isPaused: false, pause() { this.isPaused = true; } } },
    anims: { pauseAll() {}, resumeAll() { resumedAnimations++; } },
  };
  const hud = new HUD(scene);
  hud.togglePause();
  scene.physics.world = null;
  assert.doesNotThrow(shutdown);
  assert.equal(resumedAnimations, 1);
});


test('repeated procedural impacts reuse their decoded noise buffer', () => {
  const { SoundSystem } = loadSource('src/systems/SoundSystem.ts', { phaser: {} });
  const sound = Object.create(SoundSystem.prototype);
  sound.noiseBuffers = new Map();
  SoundSystem.master = {};
  let buffersCreated = 0;
  const node = () => ({ connect() { return this; }, gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, frequency: {}, start() {} });
  sound.ensureContext = () => ({ state: 'running', currentTime: 0, sampleRate: 44100,
    createBuffer(channels, count) { buffersCreated++; return { getChannelData: () => new Float32Array(count) }; },
    createBufferSource: node, createBiquadFilter: node, createGain: node,
  });
  for (let i = 0; i < 100; i++) sound.noise(0.07, 1100, 0.055);
  assert.equal(buffersCreated, 1);
});


function crowdEnemy(x, y) {
  return { x, y, state: 'attack', body: { velocity: { x: 0, y: 0 } },
    setVelocity(x, y) { this.body.velocity = { x, y }; } };
}

test('crowd separation never teleports actors and coincident actors separate symmetrically', () => {
  const { separateEnemyCrowd } = loadSource('src/systems/CrowdSystem.ts');
  const enemies = [crowdEnemy(500, 540), crowdEnemy(500, 540)];
  separateEnemyCrowd(enemies);
  assert.deepEqual(enemies.map(e => [e.x, e.y]), [[500, 540], [500, 540]]);
  assert.equal(enemies[0].body.velocity.x, -enemies[1].body.velocity.x);
  assert.ok(enemies[0].body.velocity.x < 0);
});

test('crowded stationary enemies settle without alternating corrections', () => {
  const { separateEnemyCrowd } = loadSource('src/systems/CrowdSystem.ts');
  const enemies = [crowdEnemy(500, 540), crowdEnemy(520, 540)];
  let previousGap = 20;
  for (let frame = 0; frame < 240; frame++) {
    for (const e of enemies) e.setVelocity(0, 0);
    separateEnemyCrowd(enemies);
    for (const e of enemies) { e.x += e.body.velocity.x / 60; e.y += e.body.velocity.y / 60; }
    const gap = enemies[1].x - enemies[0].x;
    assert.ok(gap >= previousGap && gap <= 74.001);
    previousGap = gap;
  }
  assert.ok(previousGap > 73.9);
});

function enemyAI(variant, x, state = 'attack') {
  const phaser = { Physics: { Arcade: { Sprite: class {} } }, Math: { Clamp: (value, min, max) => Math.max(min, Math.min(max, value)) } };
  const { EnemyGoon } = loadSource('src/entities/EnemyGoon.ts', { phaser });
  const enemy = Object.assign(Object.create(EnemyGoon.prototype), {
    x, y: 540, state, health: 100, visualVariant: variant, attackRange: variant.includes('stone') ? 430 : 138,
    orbitOffset: 180, laneOffset: 0, moveSpeed: 130, lockedUntil: 0, canAttackAt: 999999, retreating: false,
    scene: { scale: { width: 1280 }, time: { now: 1000 } },
    setFlipX(value) { this.flipX = value; }, setVelocity(x, y) { this.velocity = { x, y }; }, setTexture() {},
  });
  return enemy;
}

test('crowd pressure near attack range does not flicker between walking and attacking', () => {
  const enemy = enemyAI('gameplay-kibera-shield-goon', 145);
  const player = { x: 0, y: 540 };
  enemy.update(1000, player);
  assert.equal(enemy.state, 'attack');
  enemy.x = 160;
  enemy.update(1016, player);
  assert.equal(enemy.state, 'walk');
});

test('stone thrower retreat uses separate entry and exit distances', () => {
  const enemy = enemyAI('gameplay-kibera-stone-goon', 169);
  const player = { x: 0, y: 540 };
  enemy.update(1000, player);
  assert.equal(enemy.retreating, true);
  enemy.x = 200;
  enemy.update(1016, player);
  assert.equal(enemy.retreating, true);
  enemy.x = 216;
  enemy.update(1032, player);
  assert.equal(enemy.retreating, false);
  assert.equal(enemy.state, 'attack');
});


test('crowd-driven movement plays footsteps even when AI remains in attack stance', () => {
  const { isEnemyWalking } = loadSource('src/systems/EnemyMotion.ts');
  const enemy = crowdEnemy(500, 540);
  enemy.lastAttackAt = 0;
  enemy.visualVariant = 'gameplay-kibera-stone-goon';
  enemy.setVelocity(25, 0);
  assert.equal(isEnemyWalking(enemy, 1000), true);
  enemy.state = 'walk';
  enemy.setVelocity(0, 0);
  assert.equal(isEnemyWalking(enemy, 1000), false);
});

test('stone throw animation plants feet even when player moves into retreat range', () => {
  const enemy = enemyAI('gameplay-kibera-stone-goon', 169);
  enemy.lastAttackAt = 900;
  enemy.update(1000, { x: 0, y: 540 });
  assert.equal(enemy.state, 'attack');
  assert.deepEqual(enemy.velocity, { x: 0, y: 0 });
  assert.equal(enemy.retreating, false);
});

test('crowd pressure does not slide a planted stone thrower', () => {
  const { separateEnemyCrowd } = loadSource('src/systems/CrowdSystem.ts');
  const enemy = crowdEnemy(500, 540);
  enemy.lastAttackAt = 900;
  enemy.visualVariant = 'gameplay-kibera-stone-goon';
  separateEnemyCrowd([enemy, crowdEnemy(520, 540)], 1000);
  assert.deepEqual(enemy.body.velocity, { x: 0, y: 0 });
});

test('level 4 walk sheets load before the arena starts', () => {
  const { loadDeferredLevelAssets } = loadSource('src/config/DeferredLevelAssets.ts', { phaser: {} });
  const sheets = [];
  loadDeferredLevelAssets({ textures: { exists: () => false }, load: { image() {}, spritesheet(key) { sheets.push(key); } } }, 4);
  assert.ok(sheets.includes('gameplay-kibera-stone-goon-walk-sheet'));
  assert.ok(sheets.includes('gameplay-kibera-shield-goon-walk-sheet'));
});


test('all earlier levels preload their locomotion sheets', () => {
  const { loadCoreGameplayAssets, loadDeferredLevelAssets } = loadSource('src/config/DeferredLevelAssets.ts', { phaser: {} });
  for (const level of [1, 2, 3]) {
    const sheets = [];
    const scene = { textures: { exists: () => false }, cache: { audio: { exists: () => false } },
      load: { image() {}, audio() {}, spritesheet(key) { sheets.push(key); } } };
    loadCoreGameplayAssets(scene, level, 'MBAVU DESTROYER');
    loadDeferredLevelAssets(scene, level);
    const expected = level === 3 ? ['gameplay-attack-dog-run-sheet', 'gameplay-goon-chain-walk-sheet', 'gameplay-goon-heavy-walk-sheet']
      : ['gameplay-goon-red-walk-sheet', 'gameplay-goon-hoodie-walk-sheet', 'gameplay-goon-club-walk-sheet'];
    for (const key of expected) assert.ok(sheets.includes(key), `level ${level}: ${key}`);
  }
});

test('slow crowd movement does not flicker between idle and walking', () => {
  const { isEnemyWalking } = loadSource('src/systems/EnemyMotion.ts');
  const enemy = crowdEnemy(500, 540);
  enemy.setVelocity(8, 0);
  assert.equal(isEnemyWalking(enemy, 1000, false), false);
  assert.equal(isEnemyWalking(enemy, 1000, true), true);
  enemy.setVelocity(3, 0);
  assert.equal(isEnemyWalking(enemy, 1000, true), false);
});

test('portrait and motion-sheet orientation both face the intended direction', () => {
  const { getEnemyTextureFlip } = loadSource('src/systems/EnemyMotion.ts');
  for (const direction of [false, true]) {
    for (const portrait of ['gameplay-goon', 'gameplay-goon-club', 'gameplay-goon-hoodie']) assert.equal(getEnemyTextureFlip(direction, portrait), !direction);
    for (const motion of ['gameplay-goon-red-walk-sheet', 'gameplay-goon-chain', 'gameplay-goon-heavy', 'gameplay-attack-dog', 'gameplay-kibera-stone-goon']) assert.equal(getEnemyTextureFlip(direction, motion), direction);
  }
});

test('enemy steering slows down near its formation target', () => {
  const enemy = enemyAI('gameplay-goon-club', 138, 'walk');
  enemy.y = 640;
  enemy.update(1000, { x: 0, y: 540 });
  assert.ok(Math.abs(enemy.velocity.x) < enemy.moveSpeed);
  assert.ok(enemy.velocity.x < 0);
});


test('achievements reflect actual cleared locations and campaign progress', () => {
  const { getAchievements } = loadSource('src/config/Achievements.ts');
  const badges = getAchievements([1, 3]);
  assert.deepEqual(badges.map(b => b.unlocked), [true, false, true, false, false]);
  assert.equal(badges[4].progress, 2);
  assert.equal(badges[4].target, 4);
  assert.ok(getAchievements([1, 2, 3, 4]).every(b => b.unlocked));
});

test('duplicate and invalid saved levels cannot unlock extra achievements', () => {
  const { getAchievements } = loadSource('src/config/Achievements.ts');
  const badges = getAchievements([1, 1, 1, -1, 0, 5, 2.5, Infinity]);
  assert.equal(badges.filter(b => b.unlocked).length, 1);
  assert.equal(badges[4].progress, 1);
  assert.equal(badges[4].unlocked, false);
  assert.ok(getAchievements([]).every(b => !b.unlocked && b.progress === 0));
});

test('achievements recognize level clears saved before the screen existed', () => {
  const cache = new Map();
  const progress = loadSource('src/config/GameProgress.ts', {}, cache);
  progress.unlockLocationStory(2);
  const { getAchievements } = loadSource('src/config/Achievements.ts', {}, cache);
  assert.equal(getAchievements()[1].unlocked, true);
});


test('daily challenge resets at Nairobi midnight rather than UTC midnight', () => {
  const daily = loadSource('src/config/DailyChallenge.ts');
  assert.equal(daily.getDailyDate(new Date('2026-10-22T20:59:59Z')), '2026-10-22');
  assert.equal(daily.getDailyDate(new Date('2026-10-22T21:00:00Z')), '2026-10-23');
});

test('daily progress starts at zero, counts actual defeats and caps at the target', () => {
  const daily = loadSource('src/config/DailyChallenge.ts');
  const now = new Date('2026-10-22T10:00:00Z');
  assert.equal(daily.getDailyChallenge(now).defeats, 0);
  assert.equal(daily.claimDailyReward(now), 0);
  for (let i = 0; i < 25; i++) daily.recordDailyDefeat(now);
  assert.equal(daily.getDailyChallenge(now).defeats, 20);
  assert.equal(daily.getDailyChallenge(now).claimed, false);
});

test('daily reward is claimed once, survives resets, and adds once on the next day', () => {
  const daily = loadSource('src/config/DailyChallenge.ts');
  const today = new Date('2026-10-22T20:59:59Z');
  const tomorrow = new Date('2026-10-22T21:00:00Z');
  for (let i = 0; i < 19; i++) daily.recordDailyDefeat(today);
  assert.equal(daily.claimDailyReward(today), 0);
  daily.recordDailyDefeat(today);
  assert.equal(daily.claimDailyReward(today), 250);
  assert.equal(daily.claimDailyReward(today), 0);
  assert.equal(daily.getDailyChallenge(today).rewardChapatis, 250);
  assert.deepEqual(daily.getDailyChallenge(tomorrow), { date: '2026-10-23', defeats: 0, claimed: false, rewardChapatis: 250 });
  for (let i = 0; i < 20; i++) daily.recordDailyDefeat(tomorrow);
  assert.equal(daily.claimDailyReward(tomorrow), 250);
  assert.equal(daily.getDailyChallenge(tomorrow).rewardChapatis, 500);
});

test('daily challenge recovers safely from malformed saved state', () => {
  const cache = new Map();
  const storage = loadSource('src/config/Storage.ts', {}, cache);
  const daily = loadSource('src/config/DailyChallenge.ts', {}, cache);
  const now = new Date('2026-10-22T10:00:00Z');
  storage.writeStorage('ni-mbaya-daily-challenge', '{broken');
  assert.equal(daily.getDailyChallenge(now).defeats, 0);
  storage.writeStorage('ni-mbaya-daily-challenge', JSON.stringify({ date: '2026-10-22', defeats: 2, claimed: true, rewardChapatis: -250 }));
  assert.equal(daily.getDailyChallenge(now).claimed, false);
  assert.equal(daily.getDailyChallenge(now).rewardChapatis, 0);
  assert.equal(daily.claimDailyReward(now), 0);
});

test('one defeated enemy counts once even if defeat is called again at scene time zero', () => {
  const cache = new Map();
  const { EnemyGoon } = loadSource('src/entities/EnemyGoon.ts', { phaser: { Physics: { Arcade: { Sprite: class {} } } } }, cache);
  const { getDailyChallenge } = loadSource('src/config/DailyChallenge.ts', {}, cache);
  const enemy = Object.assign(Object.create(EnemyGoon.prototype), {
    state: 'idle', scene: { time: { now: 0 } },
    setTexture() {}, setTint() {}, setVelocity() {}, disableBody() {},
  });
  enemy.defeat();
  enemy.defeat();
  assert.equal(getDailyChallenge().defeats, 1);
});


test('daily defeats and claimed rewards survive a fresh page session', () => {
  const values = new Map();
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
    getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value),
  } });
  try {
    const now = new Date('2026-10-22T10:00:00Z');
    const firstPage = loadSource('src/config/DailyChallenge.ts');
    firstPage.recordDailyDefeat(now);
    const nextPage = loadSource('src/config/DailyChallenge.ts');
    assert.equal(nextPage.getDailyChallenge(now).defeats, 1);
    for (let i = 0; i < 19; i++) nextPage.recordDailyDefeat(now);
    nextPage.claimDailyReward(now);
    const reloaded = loadSource('src/config/DailyChallenge.ts');
    assert.equal(reloaded.getDailyChallenge(now).rewardChapatis, 250);
    assert.equal(reloaded.claimDailyReward(now), 0);
  } finally { delete globalThis.localStorage; }
});


test('retired Mjaka saves continue with Majembe without losing progress', () => {
  const progress = loadSource('src/config/GameProgress.ts');
  progress.saveJourneyProgress({ levelId: 3, character: 'MJAKA FINE', chapatis: 900, health: 42 });
  assert.deepEqual(progress.getJourneySave(), { levelId: 3, character: 'MBAVU DESTROYER', chapatis: 900, health: 42 });
});


test('each received hit produces a new reaction and defeat rejects further hits', () => {
  const { Player } = loadSource('src/entities/Player.ts', { phaser: { Physics: { Arcade: { Sprite: class {} } } } });
  const player = Object.assign(Object.create(Player.prototype), {
    state: 'idle', health: 100, hitSequence: 0, x: 500, z: 0, scene: { time: { now: 1000 } },
    setVelocity() {}, setTexture() {},
  });
  player.takeDamage(10, 260, 400);
  assert.equal(player.state, 'hit');
  assert.equal(player.hitSequence, 1);
  player.takeDamage(10, 260, 400);
  assert.equal(player.hitSequence, 2);
  player.takeDamage(100, 260, 400);
  assert.equal(player.state, 'defeat');
  assert.equal(player.hitSequence, 3);
  player.takeDamage(10, 260, 400);
  assert.equal(player.hitSequence, 3);
});

test('hit and fall frames are ready before the player can take damage', () => {
  const { loadCoreGameplayAssets } = loadSource('src/config/DeferredLevelAssets.ts', { phaser: {} });
  const sheets = [];
  loadCoreGameplayAssets({ textures: { exists: () => false }, cache: { audio: { exists: () => false } },
    load: { image() {}, audio() {}, spritesheet(key, url, frames) { sheets.push({ key, frames }); } } }, 1, 'MBAVU DESTROYER');
  assert.deepEqual(sheets.find(sheet => sheet.key === 'gameplay-mbavu-defeat-fall-sheet').frames, { frameWidth: 512, frameHeight: 384 });
});

test('hit reactions restart per hit while fatal knockdown plays once and holds its final pose', () => {
  const phaser = { Scene: class {}, Physics: { Arcade: { Sprite: class {} } }, Math: { Clamp: (v, min, max) => Math.max(min, Math.min(max, v)) } };
  const { LevelScene } = loadSource('src/scenes/LevelScene.ts', { phaser, '../config/GameConfig': { GAME_WIDTH: 1280, GAME_HEIGHT: 720, GROUND_Y: 604 } });
  const plays = [];
  const art = { anims: {}, play(key) { plays.push(key); this.anims.currentAnim = { key }; this.anims.isPlaying = true; return this; },
    stop() { assert.fail('reaction must not be stopped by the next render frame'); },
    setTexture() { assert.fail('reaction must not be overwritten by a static pose'); },
  };
  for (const name of ['setDisplaySize', 'setPosition', 'setFlipX', 'setAlpha', 'setAngle', 'setTint', 'setDepth']) art[name] = () => art;
  const shadow = {};
  for (const name of ['setPosition', 'setScale', 'setAlpha', 'setDepth']) shadow[name] = () => shadow;
  const scene = Object.assign(Object.create(LevelScene.prototype), {
    player: { state: 'hit', hitSequence: 1, x: 560, y: 540, z: 0, facing: 1 },
    playerArt: art, playerShadow: shadow, selectedCharacter: 'MBAVU DESTROYER', enemyVisuals: [], playerDefeatStarted: false,
    anims: { exists: () => true }, textures: { exists: () => true }, tweens: { killTweensOf() {} },
  });
  scene.syncGeneratedArt(1000);
  scene.syncGeneratedArt(1016);
  assert.deepEqual(plays, ['mbavu-hit-reaction']);
  scene.player.hitSequence = 2;
  scene.syncGeneratedArt(1032);
  assert.deepEqual(plays, ['mbavu-hit-reaction', 'mbavu-hit-reaction']);
  scene.player.state = 'defeat';
  scene.syncGeneratedArt(1050);
  scene.syncGeneratedArt(1066);
  art.anims.isPlaying = false;
  scene.syncGeneratedArt(2000);
  assert.deepEqual(plays, ['mbavu-hit-reaction', 'mbavu-hit-reaction', 'mbavu-defeat-fall']);
});

test('level 3 departures match dog running and heavy walking, with a smooth start', () => {
  const { getEnemyExitMotion } = loadSource('src/systems/EnemyMotion.ts');
  for (const variant of ['gameplay-attack-dog', 'gameplay-goon-heavy', 'gameplay-goon-chain']) {
    assert.equal(getEnemyExitMotion(variant, 200).speed, 0);
    const halfway = getEnemyExitMotion(variant, 410);
    const full = getEnemyExitMotion(variant, 600);
    assert.equal(halfway.speed, full.speed / 2);
    assert.equal(halfway.timeScale, 0.5);
    assert.equal(full.timeScale, 1);
  }
  assert.equal(getEnemyExitMotion('gameplay-attack-dog', 1000).speed, 260);
  assert.equal(getEnemyExitMotion('gameplay-goon-heavy', 1000).speed, 100);
});

test('defeat departures preserve combat lanes, natural scale and forward facing', () => {
  const phaser = { Scene: class {}, Physics: { Arcade: { Sprite: class {} } } };
  const { LevelScene } = loadSource('src/scenes/LevelScene.ts', { phaser, '../config/GameConfig': { GAME_WIDTH: 1280, GAME_HEIGHT: 720, GROUND_Y: 604 } });
  for (const [variant, width, height, expectedAnimation, yOffset] of [
    ['gameplay-attack-dog', 174, 116, 'attack-dog-run', 42],
    ['gameplay-goon-heavy', 270, 270, 'goon-heavy-walk', 120],
  ]) {
    const calls = {};
    const art = { texture: { key: variant }, anims: { timeScale: 0.25 }, play(key) { calls.animation = key; this.texture.key = key; this.anims.currentAnim = { key }; this.anims.isPlaying = true; return this; } };
    for (const name of ['setVisible', 'setPosition', 'setDisplaySize', 'setFlipX', 'setAlpha', 'setTint', 'setAngle', 'setDepth', 'setCrop']) art[name] = (...args) => { calls[name] = args; return art; };
    const shadow = {};
    for (const name of ['setVisible', 'setPosition', 'setDepth', 'setAlpha', 'setScale']) shadow[name] = () => shadow;
    const enemy = { x: 300, y: 515, z: 0, state: 'attack', visualVariant: variant, setVelocity() {} };
    const visual = { enemy, art, shadow, baseWidth: width, baseHeight: height, victoryDirection: 1, victoryLaneY: 600, victoryGone: false };
    const scene = Object.assign(Object.create(LevelScene.prototype), {
      player: { state: 'defeat' }, playerArt: { anims: {} }, enemyList: [enemy], enemyVisuals: [visual],
      sounds: { playPlayerDefeat() {} }, cameras: { main: { shake() {} } }, physics: { world: { pause() {} } },
      anims: { exists: () => true }, defeatAftermathElapsed: 0,
    });
    scene.updateDefeatAftermath(1000, 16);
    assert.equal(enemy.x, 300);
    assert.equal(enemy.y, 515);
    assert.equal(visual.victoryDirection, -1);
    scene.defeatAftermathElapsed = 1000;
    scene.syncEnemyVisual(visual, 0, 2000);
    assert.equal(calls.animation, expectedAnimation);
    assert.equal(art.anims.timeScale, 1);
    assert.deepEqual(calls.setDisplaySize, [width, height]);
    assert.deepEqual(calls.setPosition, [300, 515 - yOffset]);
    assert.deepEqual(calls.setFlipX, [true]);
    scene.updateDefeatAftermath(2016, 16);
    assert.ok(enemy.x < 300);
    assert.equal(enemy.y, 515);
  }
});

test('red, club and hoodie goons keep their walking size and ground position throughout attacks', () => {
  const phaser = { Scene: class {}, Physics: { Arcade: { Sprite: class {} } }, Math: { Clamp: (n, min, max) => Math.max(min, Math.min(max, n)) } };
  const { LevelScene } = loadSource('src/scenes/LevelScene.ts', { phaser, '../config/GameConfig': {} });
  for (const variant of ['gameplay-goon', 'gameplay-goon-club', 'gameplay-goon-hoodie']) {
    for (const facing of [-1, 1]) {
      const calls = {};
      const art = { texture: { key: variant }, anims: {}, play(key) { this.texture.key = key; this.anims.currentAnim = { key }; this.anims.isPlaying = true; return this; }, stop() { this.anims.isPlaying = false; return this; }, setTexture(key) { this.texture.key = key; return this; } };
      for (const name of ['setPosition', 'setDisplaySize', 'setFlipX', 'setAlpha', 'setTint', 'setAngle', 'setDepth']) art[name] = (...args) => { calls[name] = args; return art; };
      const shadow = {};
      for (const name of ['setPosition', 'setDepth', 'setAlpha', 'setScale']) shadow[name] = () => shadow;
      const enemy = { x: 400, y: 540, z: 0, state: 'chase', visualVariant: variant, moveSpeed: 100, flipX: facing < 0, lastAttackAt: 0, body: { velocity: { x: 100 * facing, y: 0 } } };
      const visual = { enemy, art, shadow, baseWidth: 138, baseHeight: 207 };
      const scene = Object.assign(Object.create(LevelScene.prototype), {
        player: { x: 400 + 50 * facing, state: 'idle' },
        anims: { exists: () => true, get: () => ({ frames: [{ textureKey: 'walk-sheet' }] }) },
      });
      scene.syncEnemyVisual(visual, 0, 1000);
      const walkingSize = calls.setDisplaySize;
      const walkingY = calls.setPosition[1];
      enemy.state = 'attack'; enemy.lastAttackAt = 1100; enemy.body.velocity.x = 0;
      for (const time of [1100, 1250, 1500]) {
        scene.syncEnemyVisual(visual, 0, time);
        assert.deepEqual(calls.setDisplaySize, walkingSize, `${variant} must not grow when striking`);
        assert.equal(calls.setPosition[1], walkingY, `${variant} must not drop below its walking ground plane`);
        assert.equal(calls.setFlipX[0], facing < 0);
      }
      enemy.state = 'idle';
      scene.syncEnemyVisual(visual, 0, 2000);
      assert.deepEqual(calls.setDisplaySize, walkingSize);
      assert.equal(calls.setPosition[1], walkingY);
    }
  }
});

test('heavy walk uses the four distinct contact and passing frames in a loop', () => {
  const phaser = { Scene: class {}, Physics: { Arcade: { Sprite: class {} } } };
  const { LevelScene } = loadSource('src/scenes/LevelScene.ts', { phaser, '../config/GameConfig': {} });
  const created = [];
  const scene = Object.assign(Object.create(LevelScene.prototype), {
    textures: { exists: () => true },
    anims: {
      exists: key => key !== 'goon-heavy-walk',
      generateFrameNumbers: (key, range) => Array.from({length: range.end - range.start + 1}, (_, i) => ({key, frame: range.start + i})),
      create: config => created.push(config),
    },
  });
  scene.createSceneAnimations();
  assert.equal(created.length, 1);
  assert.deepEqual(created[0].frames.map(f => f.frame), [0, 1, 2, 3]);
  assert.equal(created[0].repeat, -1);
});

test('adding an enemy to the physics group cannot re-enable falling gravity', () => {
  const spawned = [];
  class Enemy {
    constructor(scene, x, y) {
      this.x = x; this.y = y;
      this.body = { allowGravity: false, setAllowGravity(value) { this.allowGravity = value; } };
      spawned.push(this);
    }
    configure() {}
    setDepth() { return this; }
    setVisible() { return this; }
  }
  const phaser = { Scene: class {}, Physics: { Arcade: { Sprite: class {} } } };
  const { LevelScene } = loadSource('src/scenes/LevelScene.ts', {
    phaser, '../config/GameConfig': { GAME_WIDTH: 1280, GAME_HEIGHT: 720, GROUND_Y: 604 },
    '../entities/EnemyGoon': { EnemyGoon: Enemy },
  });
  const art = {};
  for (const name of ['setDepth', 'setDisplaySize', 'setFlipX']) art[name] = () => art;
  const scene = Object.assign(Object.create(LevelScene.prototype), {
    player: { x: 560 }, enemyList: [], enemyVisuals: [],
    enemies: { add(enemy) { enemy.body.allowGravity = true; } },
    add: { image: () => art, sprite: () => art },
  });
  for (const variant of ['gameplay-attack-dog', 'gameplay-goon-heavy', 'gameplay-goon-chain']) {
    scene.createEnemy({x: 320, offset: -200, variant, speed: 120}, 0);
    const enemy = spawned.at(-1);
    assert.equal(enemy.body.allowGravity, false);
    // With zero AI velocity a grounded actor must keep its depth coordinate.
    let velocityY = 0;
    let y = enemy.y;
    for (let frame = 0; frame < 120; frame++) {
      velocityY += enemy.body.allowGravity ? 1650 / 60 : 0;
      y += velocityY / 60;
    }
    assert.equal(y, 540);
  }
});


test('gameplay clock freezes deadlines and resumes without counting paused wall time', () => {
  const clock = loadSource('src/systems/GameplayClock.ts');
  const scene = { time: { now: 1000, paused: false }, tweens: { pauseAll() {}, resumeAll() {} } };
  clock.pauseGameplay(scene);
  scene.time.now = 6000;
  assert.equal(clock.getGameplayTime(scene), 1000);
  assert.equal(scene.time.paused, true);
  clock.resumeGameplay(scene);
  scene.time.now = 6100;
  assert.equal(clock.getGameplayTime(scene), 1100);
  assert.equal(scene.time.paused, false);
});

test('grounded melee cannot damage a high jumping player but still uses its attack cooldown', () => {
  for (const altitude of [0, 40, 41, 120]) {
    const enemy = enemyAI('gameplay-goon', 450);
    enemy.canAttackAt = 0;
    enemy.attackDamage = 8;
    enemy.attackCooldown = 1000;
    enemy.z = 0;
    enemy.scene.events = { emit() {} };
    enemy.scene.cameras = { main: { shake() {} } };
    let hits = 0;
    enemy.update(1000, { x: 500, y: 540, z: altitude, takeDamage() { hits++; } });
    assert.equal(hits, altitude <= 40 ? 1 : 0);
    assert.equal(enemy.canAttackAt, 2000);
  }
});


test('enemy stones pass an airborne player and hit after landing', () => {
  class Vector2 {
    constructor(x, y) { this.x = x; this.y = y; }
    lengthSq() { return this.x * this.x + this.y * this.y; }
    set(x, y) { this.x = x; this.y = y; }
    normalize() { const length = Math.sqrt(this.lengthSq()); this.x /= length; this.y /= length; }
  }
  const { throwEnemyStone } = loadSource('src/systems/EnemyProjectiles.ts', { phaser: { Math: { Vector2 } } });
  let launch, hit, hits = 0;
  const stone = { active: true, body: { setAllowGravity() {} }, destroy() { this.active = false; } };
  for (const name of ['setDepth', 'setVelocity', 'setAngularVelocity', 'setCircle']) stone[name] = () => stone;
  const overlap = { active: true, destroy() { this.active = false; } };
  const scene = {
    time: { delayedCall(ms, callback) { if (ms === 380) launch = callback; } },
    physics: { add: { image: () => stone, overlap(a, b, callback) { hit = callback; return overlap; } } },
    events: { emit() {} }, cameras: { main: { shake() {} } },
  };
  const enemy = { active: true, state: 'attack', lastAttackAt: 1, x: 0, y: 540, z: 0, attackDamage: 10 };
  const player = { state: 'jump', x: 100, y: 540, z: 80, takeDamage() { hits++; } };
  throwEnemyStone(scene, enemy, player);
  launch(); hit();
  assert.equal(hits, 0);
  assert.equal(stone.active, true);
  player.z = 0; hit();
  assert.equal(hits, 1);
  assert.equal(stone.active, false);
  assert.equal(overlap.active, false);
});
