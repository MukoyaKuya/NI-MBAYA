import { test, expect } from '@playwright/test';

async function start(page: import('@playwright/test').Page, levelId = 1) {
  page.on('pageerror', error => console.log('Browser error:', error.message));
  await page.goto('/');
  await page.waitForFunction(() => (window as any).__game?.scene.isActive('MainMenuScene'));
  await page.evaluate((levelId) => {
    const game = (window as any).__game;
    game.scene.getScene('LevelScene').events.on('create', () => {
      game.scene.getScene('LevelScene').enemyList.forEach((enemy: any) => enemy.canAttackAt = Infinity);
    });
    game.scene.getScene('MainMenuScene').scene.start('LevelScene', { levelId });
  }, levelId);
  await page.waitForFunction(() => (window as any).__game.scene.getScene('LevelScene').player?.active);
  await expect(page.locator('#scene-loading-overlay')).toBeHidden();
}

test('arena renders, keyboard moves, pause preserves timers and attack recovery', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await start(page);
  await expect(page.locator('canvas')).toBeVisible();
  await page.evaluate(() => {
    const scene = (window as any).__game.scene.getScene('LevelScene');
    scene.enemyList.forEach((enemy: any) => enemy.canAttackAt = Infinity);
  });
  const x = await page.evaluate(() => (window as any).__game.scene.getScene('LevelScene').player.x);
  await page.keyboard.down('ArrowRight');
  await page.waitForFunction(x => (window as any).__game.scene.getScene('LevelScene').player.x > x, x);
  await page.keyboard.up('ArrowRight');
  expect(await page.evaluate(() => (window as any).__game.scene.getScene('LevelScene').player.x)).toBeGreaterThan(x);
  await page.keyboard.press('p');
  // Observe the keyboard event being handled before checking the paused timers.
  await expect.poll(() => page.evaluate(() => (window as any).__game.scene.getScene('LevelScene').physics.world.isPaused)).toBe(true);
  const result = await page.evaluate(async () => {
    const scene = (window as any).__game.scene.getScene('LevelScene');
    const now = (window as any).__getGameplayTime;
    const before = now(scene);
    scene.player.canAttackAt = before + 900;
    scene.testExpired = false;
    scene.time.delayedCall(200, () => scene.testExpired = true);
    await new Promise(resolve => setTimeout(resolve, 1100));
    const paused = now(scene);
    const expiredWhilePaused = scene.testExpired;
    scene.hud.togglePause();
    return { before, paused, expiredWhilePaused, remainingCooldown: scene.player.canAttackAt - now(scene) };
  });
  expect(result.paused).toBe(result.before);
  expect(result.expiredWhilePaused).toBe(false);
  expect(result.remainingCooldown).toBeCloseTo(900, 6);
  await page.waitForFunction(() => (window as any).__game.scene.getScene('LevelScene').testExpired);
  expect(errors).toEqual([]);
});

test('all stages clear, persist progress and restart without stale physics', async ({ page }) => {
  test.setTimeout(180_000);
  await start(page);
  for (const levelId of [1, 2, 3, 4]) {
    if (levelId > 1) {
      await page.evaluate(levelId => (window as any).__game.scene.getScene('LevelScene').scene.restart({ levelId }), levelId);
      try {
        await page.waitForFunction(levelId => (window as any).__game.scene.getScene('LevelScene').level?.id === levelId, levelId, { timeout: 15_000 });
      } catch (error) {
        console.log(await page.evaluate(() => {
          const scene = (window as any).__game.scene.getScene('LevelScene');
          return { status: scene.sys.settings.status, level: scene.level?.id, loader: scene.load.state, queued: scene.load.list.size, inflight: scene.load.inflight.size };
        }));
        throw error;
      }
    }
    await page.evaluate(() => {
      const scene = (window as any).__game.scene.getScene('LevelScene');
      scene.enemyList.forEach((enemy: any) => enemy.takeDamage(10000, 0, 0));
    });
    await page.waitForFunction(() => (window as any).__game.scene.getScene('LevelScene').levelCleared);
    expect(await page.evaluate(() => (window as any).__game.scene.getScene('LevelScene').physics.world.isPaused)).toBe(true);
  }
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('ni-mbaya-unlocked-stories')!))).toEqual([1, 2, 3, 4]);
  await page.reload();
  await page.waitForFunction(() => (window as any).__game?.scene.isActive('MainMenuScene'));
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('ni-mbaya-journey-save')!).levelId)).toBe(4);
});

test('touch buttons and joystick control the actual player', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true });
  const page = await context.newPage();
  await start(page);
  expect(await page.evaluate(() => !!(window as any).__game.scene.getScene('LevelScene').touchControls)).toBe(true);
  const canvas = await page.locator('canvas').boundingBox();
  if (!canvas) throw new Error('Canvas missing');
  const cdp = await context.newCDPSession(page);
  const point = (x: number, y: number) => ({ x: canvas.x + canvas.width * x / 1280, y: canvas.y + canvas.height * y / 720 });
  // Keep the finger down until Phaser processes a frame, as a real press does.
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [point(1180, 638)] });
  await page.waitForFunction(() => (window as any).__game.scene.getScene('LevelScene').player.canAttackAt > 0);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  const x = await page.evaluate(() => (window as any).__game.scene.getScene('LevelScene').player.x);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [point(86, 628)] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [point(130, 628)] });
  await page.waitForFunction(x => (window as any).__game.scene.getScene('LevelScene').player.x > x, x);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  expect(await page.evaluate(() => (window as any).__game.scene.getScene('LevelScene').player.x)).toBeGreaterThan(x);
  await context.close();
});


test('a keyboard jump avoids grounded melee and landing restores vulnerability', async ({ page }) => {
  await start(page);
  await page.evaluate(() => {
    const scene = (window as any).__game.scene.getScene('LevelScene');
    scene.enemyList.forEach((enemy: any) => enemy.canAttackAt = Infinity);
  });
  // Observe before pressing, and hold the key across a game frame. A zero-delay
  // keydown/keyup can otherwise finish before Phaser polls input on CI.
  const snapshotPromise = page.waitForFunction(() => {
    const scene = (window as any).__game.scene.getScene('LevelScene');
    const player = scene.player;
    if (player.z <= 60) return false;
    const enemy = scene.enemyList[0];
    const altitude = player.z;
    const attack = () => {
      enemy.x = player.x - 50;
      enemy.y = player.y;
      enemy.canAttackAt = 0;
      enemy.lockedUntil = 0;
      enemy.lastAttackAt = 0;
      enemy.state = 'idle';
      enemy.update(scene.time.now, player);
    };
    player.health = 100;
    attack();
    const airborneHealth = player.health;
    player.z = 0;
    player.vz = 0;
    attack();
    return { altitude, airborneHealth, groundedHealth: player.health };
  });
  await page.keyboard.down('Space');
  const snapshot = await snapshotPromise;
  await page.keyboard.up('Space');
  const result = await snapshot.jsonValue() as { altitude: number; airborneHealth: number; groundedHealth: number };
  expect(result.altitude).toBeGreaterThan(40);
  expect(result.airborneHealth).toBe(100);
  expect(result.groundedHealth).toBeLessThan(100);
});
