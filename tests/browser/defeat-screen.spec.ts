import { test, expect } from '@playwright/test';

test('defeat warning animates, Replay responds to hover, and Replay restarts combat', async ({ page }) => {
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
  await page.waitForTimeout(700);
  const initial = await page.evaluate(() => {
    const scene = (window as any).__game.scene.getScene('LevelScene');
    const title = scene.children.list.find((child: any) => child.text === 'UMEVAMIWA!' && child.depth === 2002);
    const glow = scene.children.list.find((child: any) => child.text === 'UMEVAMIWA!' && child.depth === 2001);
    const replay = scene.children.getByName('defeat-replay');
    return { title: title?.text, glowAlpha: glow?.alpha, replayScale: replay?.scaleX };
  });
  await page.screenshot({ path: '.git/defeat-screen-desktop.png' });
  expect(initial.title).toBe('UMEVAMIWA!');
  expect(initial.replayScale).toBeCloseTo(1, 1);
  await page.waitForTimeout(270);
  const glowAlphaLater = await page.evaluate(() => {
    const scene = (window as any).__game.scene.getScene('LevelScene');
    return scene.children.list.find((child: any) => child.text === 'UMEVAMIWA!' && child.depth === 2001)?.alpha;
  });
  expect(glowAlphaLater).not.toBeCloseTo(initial.glowAlpha, 2);

  await page.mouse.move(640, 485);
  await expect.poll(() => page.evaluate(() => (window as any).__game.scene.getScene('LevelScene').children.getByName('defeat-replay')?.scaleX))
    .toBeGreaterThan(1.06);
  await page.screenshot({ path: '.git/defeat-screen-hover.png' });
  await page.mouse.click(640, 485);
  await page.waitForFunction(() => {
    const scene = (window as any).__game.scene.getScene('LevelScene');
    return scene.player?.active && scene.player.health === 100 && !scene.defeatOverlayShown;
  });
  expect(errors).toEqual([]);
});
