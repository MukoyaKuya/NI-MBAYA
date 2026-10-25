import { test, expect } from '@playwright/test';

test('Level 1 drives the compressed animated bus across the arena', async ({ page }) => {
  const failures: string[] = [];
  page.on('pageerror', error => failures.push(error.message));
  const busResponse = page.waitForResponse(response => /nairobi-matatu-bus-sheet.*\.webp/.test(response.url()));
  await page.goto('/?level=1');
  const response = await busResponse;
  expect(response.status()).toBe(200);
  await page.waitForFunction(() => (window as any).__game?.scene.getScene('LevelScene')?.player?.active);
  await expect(page.locator('#scene-loading-overlay')).toBeHidden();
  const initial = await page.evaluate(() => {
    const scene = (window as any).__game.scene.getScene('LevelScene');
    const bus = scene.children.getByName('level1-matatu');
    return { key: bus.texture.key, animation: bus.anims.currentAnim?.key, frame: bus.frame.name,
      x: bus.x, width: bus.displayWidth, height: bus.displayHeight };
  });
  expect(initial.key).toBe('nairobi-matatu-bus-sheet');
  expect(initial.animation).toBe('nairobi-matatu-bus-drive');
  expect(initial.width).toBeCloseTo(340);
  expect(initial.height).toBeCloseTo(149);
  await page.waitForFunction(start => {
    const bus = (window as any).__game.scene.getScene('LevelScene').children.getByName('level1-matatu');
    return bus.frame.name !== start.frame && bus.x < start.x - 25;
  }, initial);
  await page.waitForFunction(() => {
    const bus = (window as any).__game.scene.getScene('LevelScene').children.getByName('level1-matatu');
    return bus.x < 850;
  });
  await page.screenshot({ path: '.git/level1-matatu-bus.png' });
  expect(failures).toEqual([]);
});

test('Level 2 keeps its existing matatu', async ({ page }) => {
  await page.goto('/?level=2');
  await page.waitForFunction(() => (window as any).__game?.scene.getScene('LevelScene')?.player?.active);
  const texture = await page.evaluate(() => {
    const scene = (window as any).__game.scene.getScene('LevelScene');
    return scene.children.getByName('level2-matatu').texture.key;
  });
  expect(texture).toBe('nairobi-matatu-conductor');
});
