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
  await expect.poll(() => page.evaluate(() => (window as any).__game.scene.getScene('ArcadeMatchScene')
    .fighters[0].sprite.anims.currentAnim?.key)).toBe('arcade-mbavu-guard');
  const guardFrame = await page.evaluate(() => (window as any).__game.scene.getScene('ArcadeMatchScene')
    .fighters[0].sprite.anims.currentFrame.index);
  await expect.poll(() => page.evaluate(() => (window as any).__game.scene.getScene('ArcadeMatchScene')
    .fighters[0].sprite.anims.currentFrame.index), { timeout: 2000, intervals: [100] }).not.toBe(guardFrame);
  expect(await page.evaluate(() => (window as any).__game.scene.getScene('ArcadeMatchScene')
    .fighters[1].sprite.anims.currentAnim?.key)).toMatch(/^arcade-majembe-(guard|walking)$/);
  const crowd = await page.evaluate(() => (window as any).__game.scene.getScene('ArcadeMatchScene')
    .pedestrians.map((p: any) => ({ velocity: p.velocity, flipX: p.sprite.flipX })));
  expect(crowd.map((p: any) => Math.sign(p.velocity))).toEqual([1, -1, 1, -1]);
  expect(crowd.map((p: any) => p.flipX)).toEqual([false, true, false, false]);
  await page.evaluate(() => { (window as any).__game.scene.getScene('ArcadeMatchScene').bus.x = 1100; });
  const busStart = await page.evaluate(() => (window as any).__game.scene.getScene('ArcadeMatchScene').bus.x);
  await page.waitForTimeout(300);
  expect(await page.evaluate(() => (window as any).__game.scene.getScene('ArcadeMatchScene').bus.x)).toBeLessThan(busStart);
  await page.screenshot({ path: '.git/arcade-match.png' });
  await page.evaluate(() => {
    const match = (window as any).__game.scene.getScene('ArcadeMatchScene');
    match.fighters[0].x = 330;
    match.fighters[1].x = 950;
    match.fighters[0].stunUntil = 0;
    match.fighters[0].attackUntil = 0;
    match.fighters[1].attack = null;
    match.fighters[1].attackUntil = 0;
    match.aiNextAttackAt = Number.MAX_SAFE_INTEGER;
  });
  const before = await page.evaluate(() => (window as any).__game.scene.getScene('ArcadeMatchScene').fighters[0].x);
  await page.keyboard.down('ArrowRight');
  await expect.poll(() => page.evaluate(() => (window as any).__game.scene.getScene('ArcadeMatchScene').fighters[0].sprite.anims.currentAnim?.key)).toBe('arcade-mbavu-walking');
  await page.waitForTimeout(220);
  await page.keyboard.up('ArrowRight');
  const after = await page.evaluate(() => (window as any).__game.scene.getScene('ArcadeMatchScene').fighters[0].x);
  expect(after).toBeGreaterThan(before);
  await page.evaluate(() => {
    const match = (window as any).__game.scene.getScene('ArcadeMatchScene');
    match.fighters[0].x = 540;
    match.fighters[1].x = 645;
    match.aiNextAttackAt = Number.MAX_SAFE_INTEGER;
    match.aiGuardUntil = 0;
    match.fighters[0].stunUntil = 0;
    match.fighters[0].attackUntil = 0;
    match.fighters[0].nextAttackAt = 0;
    match.fighters[1].attack = null;
    match.fighters[1].attackUntil = 0;
  });
  await page.keyboard.down('j');
  await expect.poll(() => page.evaluate(() => (window as any).__game.scene.getScene('ArcadeMatchScene').fighters[0].sprite.texture.key), { timeout: 3000 }).toBe('arcade-mbavu-punch-sheet');
  const windupFrame = await page.evaluate(() => (window as any).__game.scene.getScene('ArcadeMatchScene').fighters[0].sprite.frame.name);
  await expect.poll(() => page.evaluate(() => (window as any).__game.scene.getScene('ArcadeMatchScene').fighters[0].sprite.frame.name),
    { timeout: 1000, intervals: [30] }).not.toBe(windupFrame);
  await page.screenshot({ path: '.git/arcade-punch.png' });
  await page.keyboard.up('j');
  await expect.poll(() => page.evaluate(() => (window as any).__game.scene.getScene('ArcadeMatchScene').fighters[1].health),
    { timeout: 2000 }).toBeLessThan(100);
  const targetHealth = await page.evaluate(() => (window as any).__game.scene.getScene('ArcadeMatchScene').fighters[1].health);
  expect(targetHealth).toBeLessThan(100);
  await page.evaluate(() => { (window as any).__game.scene.getScene('ArcadeMatchScene').aiNextAttackAt = 0; });
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
  await page.waitForFunction(() => (window as any).__game.scene.getScene('ArcadeMatchScene').phase === 'fighting');
  const facing = await page.evaluate(() => (window as any).__game.scene.getScene('ArcadeMatchScene')
    .fighters.map((fighter: any) => fighter.facing));
  expect(facing).toEqual([1, -1]);
  await page.screenshot({ path: '.git/arcade-match-majembe.png' });
  await page.evaluate(() => {
    const match = (window as any).__game.scene.getScene('ArcadeMatchScene');
    match.fighters[0].x = 540;
    match.fighters[1].x = 675;
    match.aiNextAttackAt = Number.MAX_SAFE_INTEGER;
    match.fighters[1].attack = null;
    match.fighters[1].attackUntil = 0;
    match.fighters[1].stunUntil = 0;
    match.aiDuckAt = match.time.now;
    match.aiDuckUntil = match.time.now + 1000;
  });
  await page.evaluate(() => {
    const match = (window as any).__game.scene.getScene('ArcadeMatchScene');
    match.fighters[0].nextAttackAt = 0;
    match.beginAttack(match.fighters[0], 'kick', match.time.now);
  });
  await expect.poll(() => page.evaluate(() => (window as any).__game.scene.getScene('ArcadeMatchScene').fighters[1].duck),
    { timeout: 1500 }).toBeGreaterThan(0.4);
  await expect.poll(() => page.evaluate(() => (window as any).__game.scene.getScene('ArcadeMatchScene').fighters[0].attack),
    { timeout: 1500 }).toBeNull();
  expect(await page.evaluate(() => (window as any).__game.scene.getScene('ArcadeMatchScene').fighters[1].health)).toBe(100);
  await page.evaluate(() => { (window as any).__game.scene.getScene('ArcadeMatchScene').aiNextAttackAt = Number.MAX_SAFE_INTEGER; });
  await expect.poll(() => page.evaluate(() => (window as any).__game.scene.getScene('ArcadeMatchScene').fighters[1].duck),
    { timeout: 2000 }).toBe(0);
  const startingHealth = await page.evaluate(() => (window as any).__game.scene.getScene('ArcadeMatchScene').fighters[0].health);
  await page.evaluate(() => {
    const match = (window as any).__game.scene.getScene('ArcadeMatchScene');
    match.fighters[0].x = 540;
    match.fighters[1].x = 670;
    match.aiNextAttackAt = Number.MAX_SAFE_INTEGER;
  });
  await page.keyboard.down('ArrowDown');
  await expect.poll(() => page.evaluate(() => (window as any).__game.scene.getScene('ArcadeMatchScene').fighters[0].duck),
    { timeout: 2000 }).toBeGreaterThanOrEqual(0.7);
  await expect.poll(() => page.evaluate(() => (window as any).__game.scene.getScene('ArcadeMatchScene').fighters[0].sprite.texture.key))
    .toBe('arcade-majembe-duck-sheet');
  await page.screenshot({ path: '.git/arcade-duck.png' });
  await page.evaluate(() => {
    const match = (window as any).__game.scene.getScene('ArcadeMatchScene');
    match.fighters[1].nextAttackAt = 0;
    match.beginAttack(match.fighters[1], 'kick', match.time.now);
  });
  await page.waitForTimeout(650);
  expect(await page.evaluate(() => (window as any).__game.scene.getScene('ArcadeMatchScene').fighters[0].health))
    .toBe(startingHealth);
  await page.keyboard.up('ArrowDown');
  await expect.poll(() => page.evaluate(() => (window as any).__game.scene.getScene('ArcadeMatchScene').fighters[0].duck),
    { timeout: 2000 }).toBe(0);
  await page.evaluate(() => {
    const match = (window as any).__game.scene.getScene('ArcadeMatchScene');
    match.fighters[0].x = 540;
    match.fighters[1].x = 670;
    match.fighters[1].nextAttackAt = 0;
    match.beginAttack(match.fighters[1], 'kick', match.time.now);
  });
  await expect.poll(() => page.evaluate(() => (window as any).__game.scene.getScene('ArcadeMatchScene').fighters[0].health),
    { timeout: 2000 }).toBeLessThan(startingHealth);
});

for (const choice of ['majembe', 'mbavu'] as const) test(`${choice} can hit the CPU with player controls at fighting distance`, async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => (window as any).__game?.scene.isActive('MainMenuScene'));
  await page.mouse.click(640, 455);
  await page.waitForFunction(() => (window as any).__game.scene.isActive('ArcadeSelectScene'));
  if (choice === 'mbavu') await page.mouse.click(525, 350);
  await page.mouse.click(640, 651);
  await page.waitForFunction(() => (window as any).__game.scene.isActive('ArcadeMatchScene'));
  await page.waitForFunction(() => (window as any).__game.scene.getScene('ArcadeMatchScene').phase === 'fighting');
  await page.evaluate(() => {
    const match = (window as any).__game.scene.getScene('ArcadeMatchScene');
    match.aiNextAttackAt = Number.MAX_SAFE_INTEGER;
    match.aiGuardUntil = 0;
    match.aiDuckAt = 0;
    match.aiDuckUntil = 0;
    match.fighters[0].stunUntil = 0;
    match.fighters[0].attackUntil = 0;
    match.fighters[0].nextAttackAt = 0;
    match.fighters[1].attack = null;
    match.fighters[1].attackUntil = 0;
    match.fighters[0].x = 540;
    match.fighters[1].x = 680; // The CPU's normal 140 px preferred spacing.
  });
  await page.keyboard.down('j');
  await expect.poll(() => page.evaluate(() => (window as any).__game.scene.getScene('ArcadeMatchScene').fighters[1].health),
    { timeout: 1500 }).toBeLessThan(100);
  await page.keyboard.up('j');
  await expect.poll(() => page.evaluate(() => (window as any).__game.scene.getScene('ArcadeMatchScene').fighters[0].attack),
    { timeout: 1500 }).toBeNull();
  await page.evaluate(() => {
    const match = (window as any).__game.scene.getScene('ArcadeMatchScene');
    match.fighters[0].nextAttackAt = 0;
    match.fighters[1].health = 100;
    match.fighters[1].stunUntil = 0;
    match.fighters[0].x = 540;
    match.fighters[1].x = 680;
    (window as any).__originalRandom = Math.random;
    Math.random = () => 0.99; // CPU should not randomly duck this kick.
  });
  await page.keyboard.down('k');
  await expect.poll(() => page.evaluate(() => (window as any).__game.scene.getScene('ArcadeMatchScene').fighters[1].health),
    { timeout: 1500 }).toBeLessThan(100);
  await page.keyboard.up('k');
  await page.evaluate(() => { Math.random = (window as any).__originalRandom; });
});

test('Arcade uses Story controls: Down alone ducks, Space jumps, and L attacks', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => (window as any).__game?.scene.isActive('MainMenuScene'));
  await page.mouse.click(640, 455);
  await page.waitForFunction(() => (window as any).__game.scene.isActive('ArcadeSelectScene'));
  await page.mouse.click(640, 651);
  await page.waitForFunction(() => (window as any).__game.scene.getScene('ArcadeMatchScene').phase === 'fighting');
  await page.evaluate(() => {
    const match = (window as any).__game.scene.getScene('ArcadeMatchScene');
    match.aiNextAttackAt = Number.MAX_SAFE_INTEGER;
    match.fighters[0].x = 540;
    match.fighters[1].x = 680;
  });
  await page.keyboard.down('s');
  await page.waitForTimeout(320);
  expect(await page.evaluate(() => (window as any).__game.scene.getScene('ArcadeMatchScene').fighters[0].duck)).toBe(0);
  await page.keyboard.up('s');
  await page.keyboard.down('ArrowDown');
  await expect.poll(() => page.evaluate(() => (window as any).__game.scene.getScene('ArcadeMatchScene').fighters[0].duck))
    .toBeGreaterThan(0.7);
  await page.keyboard.up('ArrowDown');
  await expect.poll(() => page.evaluate(() => (window as any).__game.scene.getScene('ArcadeMatchScene').fighters[0].duck)).toBe(0);
  await page.keyboard.down('Space');
  await expect.poll(() => page.evaluate(() => (window as any).__game.scene.getScene('ArcadeMatchScene').fighters[0].jump),
    { timeout: 1000 }).toBeGreaterThan(0);
  await page.keyboard.up('Space');
  await expect.poll(() => page.evaluate(() => (window as any).__game.scene.getScene('ArcadeMatchScene').fighters[0].jump),
    { timeout: 2000 }).toBe(0);
  await page.keyboard.down('l');
  await expect.poll(() => page.evaluate(() => (window as any).__game.scene.getScene('ArcadeMatchScene').fighters[0].attack)).toBe('special');
  await expect.poll(() => page.evaluate(() => (window as any).__game.scene.getScene('ArcadeMatchScene').fighters[1].health),
    { timeout: 1500 }).toBeLessThan(100);
  await page.keyboard.up('l');
});

test('Arcade selection and attacks follow saved Story key bindings', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('ni-mbaya-controls', JSON.stringify({
    left: 'A', right: 'D', up: 'W', down: 'DOWN', jump: 'SPACE', punch: 'Q', kick: 'K', special: 'L',
  })));
  await page.goto('/');
  await page.waitForFunction(() => (window as any).__game?.scene.isActive('MainMenuScene'));
  await page.mouse.click(640, 455);
  await page.waitForFunction(() => (window as any).__game.scene.isActive('ArcadeSelectScene'));
  await page.keyboard.down('d');
  await expect.poll(() => page.evaluate(() => (window as any).__game.scene.getScene('ArcadeSelectScene').chosen)).toBe('mbavu');
  await page.keyboard.up('d');
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => (window as any).__game.scene.getScene('ArcadeMatchScene').phase === 'fighting');
  await page.evaluate(() => {
    const match = (window as any).__game.scene.getScene('ArcadeMatchScene');
    match.aiNextAttackAt = Number.MAX_SAFE_INTEGER;
    match.fighters[0].x = 540;
    match.fighters[1].x = 680;
  });
  await page.keyboard.down('q');
  await expect.poll(() => page.evaluate(() => (window as any).__game.scene.getScene('ArcadeMatchScene').fighters[1].health),
    { timeout: 1500 }).toBeLessThan(100);
  await page.keyboard.up('q');
  await page.evaluate(() => {
    const match = (window as any).__game.scene.getScene('ArcadeMatchScene');
    const player = match.fighters[0];
    match.fighters[1].health = 100;
    match.fighters[1].stunUntil = 0;
    player.attack = null;
    player.attackUntil = 0;
    player.nextAttackAt = 0;
    player.x = 540;
    match.fighters[1].x = 680;
    // Simulate a frame arriving after the whole punch contact window.
    match.beginAttack(player, 'punch', match.time.now - 1000);
  });
  await expect.poll(() => page.evaluate(() => (window as any).__game.scene.getScene('ArcadeMatchScene').fighters[1].health),
    { timeout: 1500 }).toBeLessThan(100);
});
