import { test, expect, type Page } from '@playwright/test';

const checkpoint = { character: 'MBAVU DESTROYER', levelId: 1, chapatis: 125, health: 64 };

async function openInstructions(page: Page) {
  await page.goto('/');
  await page.waitForFunction(() => (window as any).__game?.scene.getScene('MainMenuScene')?.fighterArtReady);
  await expect(page.locator('#scene-loading-overlay')).toBeHidden();
  await page.evaluate(data => (window as any).__game.scene.getScene('MainMenuScene').scene.start('HowToPlayScene', data), checkpoint);
  await page.waitForFunction(() => (window as any).__game.scene.isActive('HowToPlayScene'));
  await expect(page.locator('#scene-loading-overlay')).toBeHidden();
}

async function labels(page: Page) {
  return page.evaluate(() => {
    const scene = (window as any).__game.scene.getScene('HowToPlayScene');
    const text = (name: string) => scene.children.getByName(name).text;
    return {
      title: text('instructions-title'),
      keyboard: ['jump', 'punch', 'kick', 'special'].map(action => text(`instructions-key-${action}`)),
      mobile: ['jump', 'punch', 'kick', 'special'].map(action => text(`instructions-touch-${action}`)),
    };
  });
}

async function expectCheckpoint(page: Page) {
  await page.waitForFunction(() => (window as any).__game.scene.isActive('LevelScene'));
  expect(await page.evaluate(() => (window as any).__game.scene.getScene('LevelScene').startData)).toMatchObject(checkpoint);
}

test('instructions show accurate controls and support Enter, Space and reentry', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await openInstructions(page);
  expect(await labels(page)).toEqual({ title: 'HOW TO PLAY', keyboard: ['SPACE', 'J', 'K', 'L'], mobile: ['J', 'P', 'K', 'S'] });
  await page.screenshot({ path: '.git/how-to-play-desktop.png' });
  await page.keyboard.press('Enter');
  await expectCheckpoint(page);
  await expect(page.locator('#scene-loading-overlay')).toBeHidden();
  await page.evaluate(data => (window as any).__game.scene.getScene('LevelScene').scene.start('HowToPlayScene', data), checkpoint);
  await page.waitForFunction(() => (window as any).__game.scene.isActive('HowToPlayScene'));
  await expect(page.locator('#scene-loading-overlay')).toBeHidden();
  await page.keyboard.press('Space');
  await expectCheckpoint(page);
  expect(errors).toEqual([]);
});

test('Swahili instructions fit landscape phones and start the fight by touch', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true });
  const page = await context.newPage();
  await page.addInitScript(() => localStorage.setItem('ni-mbaya-story-language', 'sw'));
  await openInstructions(page);
  expect((await labels(page)).title).toBe('JINSI YA KUCHEZA');
  await page.screenshot({ path: '.git/how-to-play-mobile.png' });
  const box = await page.locator('canvas').boundingBox();
  expect(box).not.toBeNull();
  await page.touchscreen.tap(box!.x + box!.width / 2, box!.y + box!.height * 652 / 720);
  await expectCheckpoint(page);
  await context.close();
});
