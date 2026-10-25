import { test, expect } from '@playwright/test';

test('each Gorvex letter animates and the Replay button restarts combat', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/?level=1');
  await page.waitForFunction(() => (window as any).__game?.scene.getScene('LevelScene')?.player?.active);
  await expect(page.locator('#scene-loading-overlay')).toBeHidden();
  await page.evaluate(() => {
    const scene = (window as any).__game.scene.getScene('LevelScene');
    scene.player.takeDamage(1000, 0, 0);
    scene.showDefeatedOverlay();
  });
  const overlay = page.locator('#defeat-ui');
  await expect(overlay).toBeVisible();
  const letters = overlay.locator('.defeat-ui__letter');
  await expect(letters).toHaveCount(10);
  await expect.poll(() => page.evaluate(() => document.fonts.check('124px Gorvex'))).toBe(true);
  const animations = await letters.evaluateAll(nodes => nodes.map(node => ({
    font: getComputedStyle(node).fontFamily,
    delay: getComputedStyle(node).animationDelay,
    names: getComputedStyle(node).animationName,
  })));
  expect(animations.every(item => item.font.includes('Gorvex') && item.names.includes('defeat-letter-energy'))).toBe(true);
  expect(new Set(animations.map(item => item.delay)).size).toBe(10);
  await page.waitForTimeout(1500);
  const letterPose = await letters.nth(2).evaluate(node => getComputedStyle(node).transform);
  await page.waitForTimeout(320);
  const nextLetterPose = await letters.nth(2).evaluate(node => getComputedStyle(node).transform);
  expect(nextLetterPose).not.toBe(letterPose);
  await page.screenshot({ path: '.git/defeat-screen-desktop.png' });

  const button = page.locator('#defeat-replay');
  await expect(button).toBeVisible();
  const before = await button.evaluate(node => getComputedStyle(node).transform);
  await button.hover();
  await expect.poll(() => button.evaluate(node => getComputedStyle(node).transform)).not.toBe(before);
  await page.screenshot({ path: '.git/defeat-screen-hover.png' });
  await button.click();
  await expect(overlay).toHaveCount(0);
  await page.waitForFunction(() => {
    const scene = (window as any).__game.scene.getScene('LevelScene');
    return scene.player?.active && scene.player.health === 100 && !scene.defeatOverlayShown;
  });
  expect(errors).toEqual([]);
});

test('defeat overlay follows a letterboxed landscape canvas', async ({ page }) => {
  await page.setViewportSize({ width: 844, height: 390 });
  await page.goto('/?level=1');
  await page.waitForFunction(() => (window as any).__game?.scene.getScene('LevelScene')?.player?.active);
  await page.evaluate(() => {
    const scene = (window as any).__game.scene.getScene('LevelScene');
    scene.player.takeDamage(1000, 0, 0);
    scene.showDefeatedOverlay();
  });
  await expect(page.locator('#defeat-ui')).toBeVisible();
  const alignment = await page.evaluate(() => {
    const canvas = document.querySelector('canvas')!.getBoundingClientRect();
    const overlay = document.getElementById('defeat-ui')!.getBoundingClientRect();
    return { canvas: { x: canvas.x, y: canvas.y, width: canvas.width, height: canvas.height },
      overlay: { x: overlay.x, y: overlay.y, width: overlay.width, height: overlay.height } };
  });
  expect(alignment.overlay.x).toBeCloseTo(alignment.canvas.x, 1);
  expect(alignment.overlay.y).toBeCloseTo(alignment.canvas.y, 1);
  expect(alignment.overlay.width).toBeCloseTo(alignment.canvas.width, 1);
  expect(alignment.overlay.height).toBeCloseTo(alignment.canvas.height, 1);
  await page.screenshot({ path: '.git/defeat-screen-mobile.png' });
  await page.locator('#defeat-replay').click();
  await expect(page.locator('#defeat-ui')).toHaveCount(0);
});
