import { test, expect } from '@playwright/test';

test('level-one attack animations use the fragment-cleaned frames', async ({ page }) => {
  await page.goto('/?level=1');
  await page.waitForFunction(() => {
    const scene = (window as any).__game?.scene.getScene('LevelScene');
    return scene?.anims.exists('goon-red-attack') && scene.anims.exists('goon-hoodie-attack') && scene.anims.exists('goon-club-attack');
  });
  const textures = await page.evaluate(() => {
    const scene = (window as any).__game.scene.getScene('LevelScene');
    return ['goon-red-attack', 'goon-hoodie-attack', 'goon-club-attack']
      .map(key => scene.anims.get(key).frames[0].textureKey);
  });
  expect(textures).toEqual([
    'gameplay-goon-red-attack-sheet-clean',
    'gameplay-goon-hoodie-attack-sheet-clean',
    'gameplay-goon-club-attack-sheet-clean',
  ]);
  const fragments = await page.evaluate(() => {
    const textures = (window as any).__game.textures;
    return [
      ['gameplay-goon-red-attack-sheet', 5, 91, 104],
      ['gameplay-goon-hoodie-attack-sheet', 5, 91, 111],
      ['gameplay-goon-club-attack-sheet', 3, 298, 334],
    ].map(([key, frame, x, y]: any[]) => {
      const readAlpha = (textureKey: string) => {
        const image = textures.get(textureKey).getSourceImage();
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const context = canvas.getContext('2d')!;
        context.drawImage(image, 0, 0);
        return context.getImageData(frame * 384 + x, y, 1, 1).data[3];
      };
      return { source: readAlpha(key), clean: readAlpha(`${key}-clean`) };
    });
  });
  for (const fragment of fragments) {
    expect(fragment.source).toBeGreaterThan(200);
    expect(fragment.clean).toBe(0);
  }
});

test('level-three goons fall with intact art and settle on the roof', async ({ page }) => {
  await page.goto('/?level=3');
  await page.waitForFunction(() => (window as any).__game?.scene.getScene('LevelScene')?.player?.active);
  await page.waitForFunction(() => {
    const scene = (window as any).__game.scene.getScene('LevelScene');
    return scene.anims.exists('goon-chain-walk') && scene.anims.exists('goon-heavy-walk') && scene.anims.exists('attack-dog-defeat');
  });
  await page.evaluate(() => {
    const scene = (window as any).__game.scene.getScene('LevelScene');
    scene.enemyList.forEach((enemy: any) => { enemy.canAttackAt = Infinity; });
    for (const variant of ['gameplay-goon-chain', 'gameplay-goon-heavy', 'gameplay-attack-dog']) {
      scene.enemyList.find((enemy: any) => enemy.visualVariant === variant).takeDamage(999, 0, scene.player.x);
    }
  });
  await page.waitForFunction(() => {
    const scene = (window as any).__game.scene.getScene('LevelScene');
    return scene.enemyVisuals.filter((visual: any) => visual.enemy.state === 'defeat')
      .every((visual: any) => visual.enemy.visualVariant === 'gameplay-attack-dog'
        ? visual.art.anims.currentAnim?.key === 'attack-dog-defeat' && visual.art.anims.currentFrame?.index >= 7
        : Math.abs(visual.art.angle) >= 89);
  });
  const fallen = await page.evaluate(() => {
    const scene = (window as any).__game.scene.getScene('LevelScene');
    return scene.enemyVisuals.filter((visual: any) => visual.enemy.state === 'defeat').map((visual: any) => ({
      variant: visual.enemy.visualVariant,
      texture: visual.art.texture.key,
      visible: visual.art.visible,
      alpha: visual.art.alpha,
      angle: visual.art.angle,
      groundY: visual.enemy.y + 34,
      poseY: visual.art.y,
      bounds: visual.fall?.bounds,
      width: visual.fall?.width,
      animation: visual.art.anims.currentAnim?.key,
    }));
  });
  expect(fallen).toHaveLength(3);
  for (const visual of fallen) {
    if (visual.variant === 'gameplay-attack-dog') {
      expect(visual.texture).toBe('gameplay-attack-dog-defeat-sheet-clean');
      expect(visual.animation).toBe('attack-dog-defeat');
      expect(visual.angle).toBe(0);
      expect(visual.poseY + (344 / 384 - 0.5) * 116).toBeCloseTo(visual.groundY, 0);
      continue;
    }
    expect(visual.texture).toMatch(/-(walk|run)-sheet/);
    expect(visual.texture).not.toContain('defeat');
    expect(visual.bounds).toBeDefined();
    const visibleBottom = visual.angle > 0
      ? (visual.bounds[2] / 384 - 0.5) * visual.width
      : (0.5 - visual.bounds[0] / 384) * visual.width;
    expect(visual.poseY + visibleBottom).toBeCloseTo(visual.groundY, 0);
  }
});
