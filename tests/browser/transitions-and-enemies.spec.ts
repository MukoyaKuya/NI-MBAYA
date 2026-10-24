import { test, expect } from '@playwright/test';

test('scene transitions show an animated loader until the destination renders', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => (window as any).__game?.scene.isActive('MainMenuScene'));
  let release!: () => void;
  const gate = new Promise<void>(resolve => release = resolve);
  await page.route('**/chapati-health-pickup-sheet.webp', async route => { await gate; await route.continue(); });
  await page.evaluate(() => (window as any).__game.scene.getScene('MainMenuScene').scene.start('CharacterSelectScene'));
  try {
    await expect(page.locator('#scene-loading-overlay')).toBeVisible({ timeout: 3000 });
    await expect(page.locator('.scene-loading__spinner')).toHaveCSS('animation-name', 'scene-loading-spin');
    await page.waitForTimeout(400);
    await expect(page.locator('#scene-loading-overlay')).toBeVisible();
    await page.screenshot({ path: 'test-results/transition-loading.png' });
  } finally { release(); }
  await page.waitForFunction(() => (window as any).__game.scene.isActive('CharacterSelectScene'));
  await expect(page.locator('#scene-loading-overlay')).toBeHidden();
});

test('slow optional sheets never enlarge attacking goons or make departures slide', async ({ page }) => {
  await page.route(/goon-(red|hoodie|club)-(attack|run)-sheet\.webp/, route => route.abort());
  await page.goto('/');
  await page.waitForFunction(() => (window as any).__game?.scene.isActive('MainMenuScene'));
  await page.evaluate(() => {
    const game = (window as any).__game;
    const scene = game.scene.getScene('LevelScene');
    scene.events.once('create', () => scene.enemyList.forEach((enemy: any) => enemy.canAttackAt = Infinity));
    game.scene.getScene('MainMenuScene').scene.start('LevelScene', { levelId: 1 });
  });
  await page.waitForFunction(() => (window as any).__game.scene.getScene('LevelScene').player?.active);
  const result = await page.evaluate(() => {
    const scene = (window as any).__game.scene.getScene('LevelScene');
    const now = (window as any).__getGameplayTime(scene);
    const visual = scene.enemyVisuals.find((v: any) => v.enemy.visualVariant === 'gameplay-goon-hoodie');
    const enemy = visual.enemy;
    enemy.state = 'idle'; enemy.lastAttackAt = 0; enemy.setVelocity(0, 0);
    scene.syncEnemyVisual(visual, 0, now);
    const idle = { texture: visual.art.texture.key, width: visual.art.displayWidth, height: visual.art.displayHeight };
    enemy.state = 'attack'; enemy.lastAttackAt = now;
    scene.syncEnemyVisual(visual, 0, now + 1);
    const attack = { texture: visual.art.texture.key, width: visual.art.displayWidth, height: visual.art.displayHeight };
    scene.player.takeDamage(1000, 0, 0);
    scene.updateDefeatAftermath(now + 16, 16);
    scene.defeatAftermathElapsed = 1000;
    scene.syncEnemyVisual(visual, 0, now + 1000);
    const departure = { animation: visual.art.anims.currentAnim?.key, playing: visual.art.anims.isPlaying, width: visual.art.displayWidth, frame: visual.art.frame.name, x: enemy.x };
    return { idle, attack, departure };
  });
  await page.waitForFunction(initial => {
    const scene = (window as any).__game.scene.getScene('LevelScene');
    const visual = scene.enemyVisuals.find((v: any) => v.enemy.visualVariant === 'gameplay-goon-hoodie');
    return visual.art.anims.currentAnim?.key === 'goon-hoodie-walk'
      && visual.art.frame.name !== initial.frame && visual.enemy.x < initial.x;
  }, result.departure);
  await expect(page.locator('#scene-loading-overlay')).toBeHidden();
  await page.screenshot({ path: 'test-results/slow-sheet-departure.png' });
  expect(result.attack.texture).toBe(result.idle.texture);
  expect(result.attack.width).toBeCloseTo(result.idle.width);
  expect(result.attack.height).toBeCloseTo(result.idle.height);
  expect(result.departure.animation).toBe('goon-hoodie-walk');
  expect(result.departure.playing).toBe(true);
  expect(result.departure.width).toBeCloseTo(result.idle.width);
});


test('actual combat defeat makes all five enemies walk away with changing frames', async ({ page }) => {
  await page.route(/goon-(red|hoodie|club)-(attack|run)-sheet\.webp/, route => route.abort());
  await page.goto('/?level=1');
  await page.waitForFunction(() => (window as any).__game?.scene.getScene('LevelScene')?.player?.active);
  await expect(page.locator('#scene-loading-overlay')).toBeHidden();
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(180);
  await page.keyboard.up('ArrowRight');
  await page.keyboard.press('j');
  await page.keyboard.press('k');
  // Let real enemy AI defeat Majembe. No health, state, or clock manipulation.
  await page.waitForFunction(() => (window as any).__game.scene.getScene('LevelScene').player.state === 'defeat');
  const departures = await page.evaluate(() => new Promise<any[]>(resolve => {
    const scene = (window as any).__game.scene.getScene('LevelScene');
    const records = scene.enemyVisuals.map((visual: any) => ({
      variant: visual.enemy.visualVariant, initialX: visual.enemy.x,
      x: visual.enemy.x, frames: new Set<string>(), animation: '',
    }));
    let timer: ReturnType<typeof setTimeout>;
    const finish = () => {
      clearTimeout(timer);
      scene.events.off('postupdate', sample);
      resolve(records.map((record: any) => ({ ...record, frames: [...record.frames] })));
    };
    const sample = () => {
      scene.enemyVisuals.forEach((visual: any, index: number) => {
        const record = records[index];
        record.x = visual.enemy.x;
        record.animation = visual.art.anims.currentAnim?.key ?? '';
        record.frames.add(String(visual.art.frame.name));
      });
      if (records.every((record: any) => record.frames.size >= 3 && Math.abs(record.x - record.initialX) > 8)) finish();
    };
    timer = setTimeout(finish, 5000);
    scene.events.on('postupdate', sample);
  }));
  expect(departures).toHaveLength(5);
  for (const enemy of departures) {
    expect(enemy.animation).toMatch(/^goon-(red|hoodie|club)-walk$/);
    expect(enemy.frames.length).toBeGreaterThanOrEqual(3);
    expect(Math.abs(enemy.x - enemy.initialX)).toBeGreaterThan(8);
  }
});


test('loading stays visibly active when no asset has finished downloading', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => (window as any).__game?.scene.getScene('MainMenuScene')?.fighterArtReady);
  let release!: () => void;
  const gate = new Promise<void>(resolve => release = resolve);
  await page.route('**/*.webp', async route => { await gate; await route.continue(); });
  await page.evaluate(() => {
    const game = (window as any).__game;
    for (const key of ['menu-mbavu', 'menu-majembe', 'gameplay-chapati-health-pickup-sheet']) {
      if (game.textures.exists(key)) game.textures.remove(key);
    }
    game.scene.getScene('MainMenuScene').scene.start('CharacterSelectScene');
  });
  try {
    await expect(page.locator('#scene-loading-overlay')).toBeVisible();
    await expect(page.locator('.scene-loading__card > p').first()).toHaveText('Downloading artwork...');
    await expect(page.locator('.scene-loading__track')).not.toHaveAttribute('aria-valuenow');
    const before = await page.locator('.scene-loading__track').evaluate(track => getComputedStyle(track, '::after').transform);
    await page.waitForFunction(before => {
      const track = document.querySelector('.scene-loading__track');
      return track && getComputedStyle(track, '::after').transform !== before;
    }, before);
    await page.screenshot({ path: 'test-results/loading-no-completed-assets.png' });
  } finally { release(); }
  await page.waitForFunction(() => (window as any).__game.scene.isActive('CharacterSelectScene'));
  await expect(page.locator('#scene-loading-overlay')).toBeHidden();
});
