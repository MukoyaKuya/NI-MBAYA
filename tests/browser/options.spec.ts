import { test, expect, type Page } from '@playwright/test';

async function clickGame(page: Page, x: number, y: number, touch = false) {
  const bounds = await page.locator('canvas').boundingBox();
  if (!bounds) throw new Error('Game canvas missing');
  const px = bounds.x + bounds.width * x / 1280;
  const py = bounds.y + bounds.height * y / 720;
  if (touch) await page.touchscreen.tap(px, py);
  else await page.mouse.click(px, py);
}

async function openOptions(page: Page, touch = false) {
  await page.goto('/');
  await page.waitForFunction(() => (window as any).__game?.scene.isActive('MainMenuScene'));
  await expect(page.locator('#scene-loading-overlay')).toBeHidden();
  await clickGame(page, 635, 598, touch);
  await page.waitForFunction(() => (window as any).__game.scene.isActive('OptionsScene'));
  await expect(page.locator('#scene-loading-overlay')).toBeHidden();
}

async function value(page: Page, name: string) {
  return page.evaluate(name => {
    const scene = (window as any).__game.scene.getScene('OptionsScene');
    return scene.children.getByName(`options-setting-${name}`)?.getByName(`options-value-${name}`)?.text
      ?? scene.children.getByName(`options-control-${name}`).getByName(`options-value-${name}`).text;
  }, name);
}

async function pressKey(page: Page, key: string) {
  const frame = () => page.evaluate(() => new Promise<void>(resolve => (window as any).__game.events.once('poststep', () => resolve())));
  await frame();
  await page.keyboard.down(key);
  await frame();
  await page.keyboard.up(key);
  await frame();
}

test('options arrows, saved settings, fullscreen, key capture and reset work', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await openOptions(page);
  await expect.poll(() => value(page, 'difficulty')).toBe('NORMAL');
  await page.screenshot({ path: '.git/options-redesign-desktop.png' });
  await clickGame(page, 920, 161);
  await expect.poll(() => value(page, 'difficulty')).toBe('HARD');
  await clickGame(page, 679, 161);
  await expect.poll(() => value(page, 'difficulty')).toBe('NORMAL');
  await clickGame(page, 679, 161);
  await expect.poll(() => value(page, 'difficulty')).toBe('EASY');
  await clickGame(page, 679, 161);
  await expect.poll(() => value(page, 'difficulty')).toBe('HARD');
  await clickGame(page, 920, 211);
  await expect.poll(() => value(page, 'sound')).toBe('OFF');
  expect(await page.evaluate(() => (window as any).__game.sound.mute)).toBe(true);
  await clickGame(page, 679, 211);
  await expect.poll(() => value(page, 'sound')).toBe('ON');
  await clickGame(page, 920, 261);
  await expect.poll(() => value(page, 'language')).toBe('KISWAHILI');

  const fullscreenSupported = await page.evaluate(() => document.fullscreenEnabled);
  await clickGame(page, 920, 311);
  if (fullscreenSupported) {
    await expect.poll(() => page.evaluate(() => !!document.fullscreenElement)).toBe(true);
    await expect.poll(() => value(page, 'screen')).toBe('FULL SCREEN');
    await clickGame(page, 679, 311);
    await expect.poll(() => page.evaluate(() => !!document.fullscreenElement)).toBe(false);
    await expect.poll(() => value(page, 'screen')).toBe('NORMAL SCREEN');
  } else {
    await page.waitForFunction(() => (window as any).__game.scene.getScene('OptionsScene').children.getByName('options-status').text.includes('UNAVAILABLE'));
  }

  await clickGame(page, 826, 499);
  await expect.poll(() => value(page, 'punch')).toBe('PRESS KEY');
  await page.screenshot({ path: '.git/options-redesign-capture.png' });
  await pressKey(page, 'q');
  await expect.poll(() => value(page, 'punch')).toBe('Q');
  await clickGame(page, 826, 543);
  await pressKey(page, 'Escape');
  expect(await page.evaluate(() => (window as any).__game.scene.isActive('OptionsScene'))).toBe(true);
  expect(await value(page, 'kick')).toBe('K');
  await openOptions(page);
  expect(await value(page, 'difficulty')).toBe('HARD');
  expect(await value(page, 'language')).toBe('KISWAHILI');
  expect(await value(page, 'punch')).toBe('Q');
  await clickGame(page, 472, 666);
  await expect.poll(() => value(page, 'punch')).toBe('J');
  expect(await page.evaluate(() => localStorage.getItem('ni-mbaya-controls'))).toBeNull();
  await pressKey(page, 'Escape');
  await page.waitForFunction(() => (window as any).__game.scene.isActive('MainMenuScene'));
  expect(errors).toEqual([]);
});

test('options stay usable by touch on a landscape phone', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true });
  const page = await context.newPage();
  await openOptions(page, true);
  await page.screenshot({ path: '.git/options-redesign-mobile.png' });
  await clickGame(page, 679, 161, true);
  await expect.poll(() => value(page, 'difficulty')).toBe('EASY');
  await clickGame(page, 920, 211, true);
  await expect.poll(() => value(page, 'sound')).toBe('OFF');
  await clickGame(page, 456, 455, true);
  await expect.poll(() => value(page, 'left')).toBe('PRESS KEY');
  await clickGame(page, 456, 455, true);
  await expect.poll(() => value(page, 'left')).toBe('LEFT');
  await clickGame(page, 799, 666, true);
  await page.waitForFunction(() => (window as any).__game.scene.isActive('MainMenuScene'));
  await context.close();
});
