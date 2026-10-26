import { test, expect } from '@playwright/test';

test('Either fighter can face an animated CPU opponent in Arcade', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => (window as any).__game?.scene.isActive('MainMenuScene'));
  await page.mouse.click(640, 455);
  await page.waitForFunction(() => (window as any).__game.scene.isActive('ArcadeSelectScene'));
  await page.screenshot({ path: '.git/arcade-selection.png' });
  await page.mouse.click(525, 350);
  await expect.poll(() => page.evaluate(() => (window as any).__game.scene.getScene('ArcadeSelectScene').chosen)).toBe('mbavu');
  await page.mouse.click(640, 651);
  await page.waitForFunction(() => (window as any).__game.scene.isActive('ArcadeMatchScene'));
  await page.waitForFunction(() => (window as any).__game.scene.getScene('ArcadeMatchScene').phase === 'fighting');
  const layers = await page.evaluate(() => {
    const match = (window as any).__game.scene.getScene('ArcadeMatchScene');
    return {
      busDepth: match.bus.depth,
      fenceDepth: match.children.list.find((item: any) => item.texture?.key === 'arcade-fence').depth,
      fighterDepth: match.fighters[0].sprite.depth,
      fighters: match.fighters.map((fighter: any) => fighter.id),
    };
  });
  expect(layers.fighters).toEqual(['mbavu', 'majembe']);
  expect(layers.busDepth).toBeLessThan(layers.fenceDepth);
  expect(layers.fenceDepth).toBeLessThan(layers.fighterDepth);
  await expect.poll(() => page.evaluate(() => (window as any).__game.scene.getScene('ArcadeMatchScene').bus.displayWidth)).toBeGreaterThan(300);
  await expect.poll(() => page.evaluate(() => (window as any).__game.scene.getScene('ArcadeMatchScene').pedestrians.every((p: any) => p.sprite.anims.isPlaying))).toBe(true);
  await page.evaluate(() => { (window as any).__game.scene.getScene('ArcadeMatchScene').bus.x = 400; });
  await page.screenshot({ path: '.git/arcade-match.png' });
  const before = await page.evaluate(() => (window as any).__game.scene.getScene('ArcadeMatchScene').fighters[0].x);
  await page.keyboard.down('d');
  await expect.poll(() => page.evaluate(() => (window as any).__game.scene.getScene('ArcadeMatchScene').fighters[0].sprite.anims.currentAnim?.key)).toBe('arcade-mbavu-walking');
  await page.waitForTimeout(220);
  await page.keyboard.up('d');
  const after = await page.evaluate(() => (window as any).__game.scene.getScene('ArcadeMatchScene').fighters[0].x);
  expect(after).toBeGreaterThan(before);
  await page.evaluate(() => {
    const match = (window as any).__game.scene.getScene('ArcadeMatchScene');
    match.fighters[0].x = 540;
    match.fighters[1].x = 645;
    match.aiNextAttackAt = performance.now() + 1200;
  });
  await page.keyboard.down('f');
  await expect.poll(() => page.evaluate(() => (window as any).__game.scene.getScene('ArcadeMatchScene').fighters[0].sprite.texture.key), { timeout: 3000 }).toBe('arcade-mbavu-punch');
  await page.screenshot({ path: '.git/arcade-punch.png' });
  await page.keyboard.up('f');
  await page.waitForFunction(() => (window as any).__game.scene.getScene('ArcadeMatchScene').fighters[1].health < 100);
  const targetHealth = await page.evaluate(() => (window as any).__game.scene.getScene('ArcadeMatchScene').fighters[1].health);
  expect(targetHealth).toBeLessThan(100);
  await page.waitForTimeout(320);
  await expect.poll(() => page.evaluate(() => {
    const match = (window as any).__game.scene.getScene('ArcadeMatchScene');
    return match.fighters[1].sprite.anims.currentAnim?.key === 'arcade-majembe-walking'
      || match.fighters[1].attack !== null;
  }), { timeout: 5000 }).toBe(true);
  await page.evaluate(() => {
    const match = (window as any).__game.scene.getScene('ArcadeMatchScene');
    match.fighters[0].x = 540;
    match.fighters[1].x = 660;
    match.aiNextAttackAt = 0;
  });
  await expect.poll(() => page.evaluate(() => (window as any).__game.scene.getScene('ArcadeMatchScene').fighters[0].health),
    { timeout: 6000 }).toBeLessThan(100);
  await page.evaluate(() => {
    const match = (window as any).__game.scene.getScene('ArcadeMatchScene');
    match.finishRound(0);
  });
  await page.waitForFunction(() => (window as any).__game.scene.getScene('ArcadeMatchScene').round === 2);
  await page.waitForFunction(() => (window as any).__game.scene.getScene('ArcadeMatchScene').phase === 'fighting');
  await page.evaluate(() => {
    const match = (window as any).__game.scene.getScene('ArcadeMatchScene');
    match.finishRound(0);
  });
  await page.waitForFunction(() => (window as any).__game.scene.getScene('ArcadeMatchScene').phase === 'finished');
  await page.screenshot({ path: '.git/arcade-result.png' });
  await page.mouse.click(465, 503);
  await page.waitForTimeout(250);
  expect(await page.evaluate(() => (window as any).__game.scene.getScene('ArcadeMatchScene').round)).toBe(1);
});

test('Majembe can be selected against CPU Mbavu', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => (window as any).__game?.scene.isActive('MainMenuScene'));
  await page.mouse.click(640, 455);
  await page.waitForFunction(() => (window as any).__game.scene.isActive('ArcadeSelectScene'));
  await page.mouse.click(640, 651);
  await page.waitForFunction(() => (window as any).__game.scene.isActive('ArcadeMatchScene'));
  const ids = await page.evaluate(() => (window as any).__game.scene.getScene('ArcadeMatchScene').fighters.map((fighter: any) => fighter.id));
  expect(ids).toEqual(['majembe', 'mbavu']);
});
