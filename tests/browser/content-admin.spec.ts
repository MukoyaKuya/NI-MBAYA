import { test, expect } from '@playwright/test';

test('content dashboard edits a draft and previews it in the game', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/admin/');
  await expect(page.getByRole('heading', { name: /Make every word count/i })).toBeVisible();
  await expect(page.locator('#section-count')).toContainText('fields');
  await page.getByRole('searchbox', { name: 'Search game text' }).fill('DAILY CHALLENGE');
  const entry = page.locator('.entry').filter({ has: page.locator('.entry-original', { hasText: /^DAILY CHALLENGE$/ }) }).first();
  await expect(entry).toBeVisible();
  await entry.locator('textarea').fill('STREET CHALLENGE');
  await expect(page.locator('#edited-count')).toHaveText('01');
  const popupPromise = page.waitForEvent('popup');
  await page.getByRole('button', { name: /Preview game/i }).click();
  const preview = await popupPromise;
  await preview.waitForFunction(() => (window as any).__game?.scene.getScene('MainMenuScene')?.scene?.isActive());
  const texts = await preview.evaluate(() => {
    const output: string[] = [];
    const visit = (child: any) => {
      if (child.type === 'Text') output.push(child.text);
      if (Array.isArray(child.list)) child.list.forEach(visit);
    };
    (window as any).__game.scene.getScene('MainMenuScene').children.list.forEach(visit);
    return output;
  });
  expect(texts).toContain('STREET CHALLENGE');
  expect(errors).toEqual([]);
});

test('a draft survives a dashboard reload and cannot publish without a token', async ({ page }) => {
  await page.goto('/admin/');
  await page.getByRole('searchbox', { name: 'Search game text' }).fill('HOW TO PLAY');
  const entry = page.locator('.entry').filter({ has: page.locator('.entry-original', { hasText: /^HOW TO PLAY$/ }) }).first();
  await entry.locator('textarea').fill('FIGHT GUIDE');
  await page.reload();
  await page.getByRole('searchbox', { name: 'Search game text' }).fill('HOW TO PLAY');
  await expect(entry.locator('textarea')).toHaveValue('FIGHT GUIDE');
  await page.getByRole('button', { name: /Publish changes/i }).click();
  await expect(page.locator('#toast')).toContainText('Enter a GitHub token');
});

test('publishing sends only the content file to GitHub and clears the token', async ({ page }) => {
  let published: any;
  await page.route(/api\.github\.com\/repos\/MukoyaKuya\/NI-MBAYA\/contents\/public\/content\/game-copy\.json/, async route => {
    if (route.request().method() === 'GET') {
      await route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' },
        body: JSON.stringify({ sha: 'original-sha', content: btoa('{"version":1,"overrides":{}}') }) });
    } else {
      published = route.request().postDataJSON();
      expect(route.request().headers().authorization).toBe('Bearer test-token');
      await route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' },
        body: JSON.stringify({ commit: { sha: 'new-commit' } }) });
    }
  });
  await page.goto('/admin/');
  await page.getByRole('searchbox', { name: 'Search game text' }).fill('HOW TO PLAY');
  const entry = page.locator('.entry').filter({ has: page.locator('.entry-original', { hasText: /^HOW TO PLAY$/ }) }).first();
  await entry.locator('textarea').fill('FIGHT GUIDE');
  await page.locator('#github-token').fill('test-token');
  await page.getByRole('button', { name: /Publish changes/i }).click();
  await expect(page.locator('#toast')).toContainText('Published to GitHub');
  expect(published.sha).toBe('original-sha');
  expect(JSON.parse(atob(published.content)).overrides['HOW TO PLAY']).toBe('FIGHT GUIDE');
  expect(await page.locator('#github-token').inputValue()).toBe('');
  expect(await page.evaluate(() => localStorage.getItem('ni-mbaya-content-draft'))).toBeNull();
});

test('published copy appears in the game and a missing content file cannot block play', async ({ page }) => {
  await page.route(/\/content\/game-copy\.json/, route => route.fulfill({
    status: 200, contentType: 'application/json',
    body: JSON.stringify({ version: 1, overrides: { 'DAILY CHALLENGE': 'STREET MISSIONS' } }),
  }));
  await page.goto('/');
  await page.waitForFunction(() => (window as any).__game?.scene.getScene('MainMenuScene')?.scene?.isActive());
  const text = await page.evaluate(() => {
    const scene = (window as any).__game.scene.getScene('MainMenuScene');
    const output: string[] = [];
    const visit = (child: any) => {
      if (child.type === 'Text') output.push(child.text);
      if (Array.isArray(child.list)) child.list.forEach(visit);
    };
    scene.children.list.forEach(visit);
    return output;
  });
  expect(text).toContain('STREET MISSIONS');
  await page.unroute(/\/content\/game-copy\.json/);
  await page.route(/\/content\/game-copy\.json/, route => route.abort());
  await page.reload();
  await page.waitForFunction(() => (window as any).__game?.scene.getScene('MainMenuScene')?.scene?.isActive());
});
