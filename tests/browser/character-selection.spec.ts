import { test, expect } from '@playwright/test';

async function clickGame(page: import('@playwright/test').Page, x: number, y: number, touch = false) {
  const bounds = await page.locator('canvas').boundingBox();
  if (!bounds) throw new Error('Game canvas missing');
  const point = { x: bounds.x + bounds.width * x / 1280, y: bounds.y + bounds.height * y / 720 };
  if (touch) await page.touchscreen.tap(point.x, point.y);
  else await page.mouse.click(point.x, point.y);
}

async function menu(page: import('@playwright/test').Page) {
  await page.goto('/');
  await page.waitForFunction(() => (window as any).__game?.scene.getScene('MainMenuScene')?.fighterArtReady);
  await expect(page.locator('#scene-loading-overlay')).toBeHidden();
}

test('reference selection layout previews fighters, retains locks and starts the story', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await menu(page);
  await clickGame(page, 631, 390);
  await page.waitForFunction(() => (window as any).__game.scene.isActive('CharacterSelectScene'));
  await expect(page.locator('#scene-loading-overlay')).toBeHidden();
  const layout = await page.evaluate(() => {
    const scene = (window as any).__game.scene.getScene('CharacterSelectScene');
    const hero = scene.children.getByName('fighter-hero');
    return { name: scene.children.getByName('fighter-hero-name')?.text ?? scene.heroName.text, height: hero.displayHeight, profile: scene.children.getByName('fighter-profile').text };
  });
  expect(layout.name).toBe('MAJEMBE');
  expect(layout.height).toBeGreaterThan(600);
  expect(layout.profile).toContain('Majembe is a street fighter');
  await page.screenshot({ path: '.git/fighter-selection-desktop.png' });
  await clickGame(page, 1110, 345);
  await page.waitForFunction(() => (window as any).__game.scene.getScene('CharacterSelectScene').selectCaption.text === 'LOCKED');
  await page.screenshot({ path: '.git/fighter-selection-locked.png' });
  await clickGame(page, 1035, 644);
  await page.waitForFunction(() => (window as any).__game.scene.getScene('CharacterSelectScene').children.list.some((child: any) => child.text === 'DEFEAT MBAVU TO UNLOCK'));
  expect(await page.evaluate(() => (window as any).__game.scene.isActive('StoryCutsceneScene'))).toBe(false);
  await page.keyboard.press('ArrowLeft');
  await page.waitForFunction(() => (window as any).__game.scene.getScene('CharacterSelectScene').selectCaption.text === 'SELECT');
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => (window as any).__game.scene.isActive('StoryCutsceneScene'));
  expect(errors).toEqual([]);
});

test('landscape touch selection shows the reward wallet and preserves a returning checkpoint', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true });
  const page = await context.newPage();
  await page.addInitScript(() => localStorage.setItem('ni-mbaya-daily-challenge', JSON.stringify({ date: '2000-01-01', defeats: 0, claimed: false, rewardChapatis: 250 })));
  await menu(page);
  await page.evaluate(() => (window as any).__game.scene.getScene('MainMenuScene').scene.start('CharacterSelectScene', { returnToLevel: true, levelId: 2, chapatis: 125, health: 64 }));
  await page.waitForFunction(() => (window as any).__game.scene.isActive('CharacterSelectScene'));
  await expect(page.locator('#scene-loading-overlay')).toBeHidden();
  expect(await page.evaluate(() => (window as any).__game.scene.getScene('CharacterSelectScene').children.getByName('fighter-wallet-amount')?.text ?? (window as any).__game.scene.getScene('CharacterSelectScene').children.list.find((child: any) => child.type === 'Container' && child.list.some((item: any) => item.name === 'fighter-wallet-amount')).getByName('fighter-wallet-amount').text)).toBe('375');
  await page.screenshot({ path: '.git/fighter-selection-mobile.png' });
  await clickGame(page, 1110, 345, true);
  await page.waitForFunction(() => (window as any).__game.scene.getScene('CharacterSelectScene').selectedIndex === 1);
  await clickGame(page, 1110, 205, true);
  await page.waitForFunction(() => (window as any).__game.scene.getScene('CharacterSelectScene').selectedIndex === 0);
  await clickGame(page, 1035, 644, true);
  await page.waitForFunction(() => (window as any).__game.scene.isActive('LevelScene'));
  expect(await page.evaluate(() => {
    const scene = (window as any).__game.scene.getScene('LevelScene');
    return { level: scene.level.id, health: scene.startData.health, chapatis: scene.startData.chapatis };
  })).toEqual({ level: 2, health: 64, chapatis: 125 });
  await context.close();
});
