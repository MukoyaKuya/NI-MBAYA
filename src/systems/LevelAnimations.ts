import type Phaser from 'phaser';
import { getCleanEnemyRunTexture, getCleanPlayerFallTexture, getCleanChapatiTexture } from './EnemyRunTexture';

export function createLevelAnimations(scene: Phaser.Scene) {
    const createEightFrameAnimation = (key: string, texture: string, frameRate: number, repeat: number) => {
      if (scene.anims.exists(key) || !scene.textures.exists(texture)) return;
      const animationTexture = texture === 'gameplay-chapati-health-pickup-sheet'
        ? getCleanChapatiTexture(scene.textures)
        : getCleanEnemyRunTexture(scene.textures, texture);
      scene.anims.create({
        key,
        frames: scene.anims.generateFrameNumbers(animationTexture, { start: 0, end: 7 }),
        frameRate,
        repeat,
      });
    };
    createEightFrameAnimation('chapati-health-spin', 'gameplay-chapati-health-pickup-sheet', 12, -1);
    createEightFrameAnimation('attack-dog-run', 'gameplay-attack-dog-run-sheet', 13, -1);
    createEightFrameAnimation('attack-dog-attack', 'gameplay-attack-dog', 12, 0);
    createEightFrameAnimation('goon-chain-idle', 'gameplay-goon-chain', 6, -1);
    createEightFrameAnimation('goon-chain-walk', 'gameplay-goon-chain-walk-sheet', 10, -1);
    createEightFrameAnimation('goon-chain-attack', 'gameplay-goon-chain-attack-sheet', 13, 0);
    createEightFrameAnimation('goon-heavy-idle', 'gameplay-goon-heavy', 5, -1);
    if (!scene.anims.exists('goon-heavy-walk') && scene.textures.exists('gameplay-goon-heavy-walk-sheet')) {
      scene.anims.create({
        key: 'goon-heavy-walk',
        frames: scene.anims.generateFrameNumbers('gameplay-goon-heavy-walk-sheet', { start: 0, end: 3 }),
        frameRate: 6,
        repeat: -1,
      });
    }
    createEightFrameAnimation('goon-heavy-attack', 'gameplay-goon-heavy-attack-sheet', 11, 0);
    createEightFrameAnimation('kibera-stone-walk', 'gameplay-kibera-stone-goon-walk-sheet', 10, -1);
    createEightFrameAnimation('kibera-stone-sprint', 'gameplay-kibera-stone-goon-sprint-sheet', 14, -1);
    createEightFrameAnimation('kibera-stone-throw', 'gameplay-kibera-stone-goon-throw-sheet', 12, 0);
    createEightFrameAnimation('kibera-shield-walk', 'gameplay-kibera-shield-goon-walk-sheet', 8, -1);
    createEightFrameAnimation('kibera-shield-sprint', 'gameplay-kibera-shield-goon-sprint-sheet', 13, -1);
    createEightFrameAnimation('kibera-shield-combo', 'gameplay-kibera-shield-goon-attack-sheet', 11, 0);

    if (!scene.anims.exists('mbavu-run') && scene.textures.exists('gameplay-mbavu-run-sheet')) {
      scene.anims.create({
        key: 'mbavu-run',
        frames: scene.anims.generateFrameNumbers('gameplay-mbavu-run-sheet', { start: 0, end: 7 }),
        frameRate: 14,
        repeat: -1,
      });
    }

    if (!scene.anims.exists('mbavu-hit-reaction') && scene.textures.exists('gameplay-mbavu-defeat-fall-sheet')) {
      scene.anims.create({
        key: 'mbavu-hit-reaction',
        frames: [0, 1, 2, 1, 0].map(frame => ({ key: getCleanPlayerFallTexture(scene.textures), frame })),
        frameRate: 20,
        repeat: 0,
      });
    }

    if (!scene.anims.exists('mbavu-defeat-fall') && scene.textures.exists('gameplay-mbavu-defeat-fall-sheet')) {
      scene.anims.create({
        key: 'mbavu-defeat-fall',
        frames: scene.anims.generateFrameNumbers(getCleanPlayerFallTexture(scene.textures), { start: 0, end: 7 }),
        frameRate: 10,
        repeat: 0,
      });
    }

    if (!scene.anims.exists('goon-red-attack') && scene.textures.exists('gameplay-goon-red-attack-sheet')) {
      scene.anims.create({
        key: 'goon-red-attack',
        frames: scene.anims.generateFrameNumbers(getCleanEnemyRunTexture(scene.textures, 'gameplay-goon-red-attack-sheet'), { start: 0, end: 7 }),
        frameRate: 14,
        repeat: 0,
      });
    }

    if (!scene.anims.exists('goon-hoodie-attack') && scene.textures.exists('gameplay-goon-hoodie-attack-sheet')) {
      scene.anims.create({
        key: 'goon-hoodie-attack',
        frames: scene.anims.generateFrameNumbers(getCleanEnemyRunTexture(scene.textures, 'gameplay-goon-hoodie-attack-sheet'), { start: 0, end: 7 }),
        frameRate: 14,
        repeat: 0,
      });
    }

    if (!scene.anims.exists('goon-club-attack') && scene.textures.exists('gameplay-goon-club-attack-sheet')) {
      scene.anims.create({
        key: 'goon-club-attack',
        frames: scene.anims.generateFrameNumbers(getCleanEnemyRunTexture(scene.textures, 'gameplay-goon-club-attack-sheet'), { start: 0, end: 7 }),
        frameRate: 13,
        repeat: 0,
      });
    }

    if (!scene.anims.exists('goon-red-walk') && scene.textures.exists('gameplay-goon-red-walk-sheet')) {
      scene.anims.create({
        key: 'goon-red-walk',
        frames: scene.anims.generateFrameNumbers('gameplay-goon-red-walk-sheet', { start: 0, end: 7 }),
        frameRate: 10,
        repeat: -1,
      });
    }

    if (!scene.anims.exists('goon-hoodie-walk') && scene.textures.exists('gameplay-goon-hoodie-walk-sheet')) {
      scene.anims.create({
        key: 'goon-hoodie-walk',
        frames: scene.anims.generateFrameNumbers('gameplay-goon-hoodie-walk-sheet', { start: 0, end: 7 }),
        frameRate: 10,
        repeat: -1,
      });
    }

    if (!scene.anims.exists('goon-club-walk') && scene.textures.exists('gameplay-goon-club-walk-sheet')) {
      scene.anims.create({
        key: 'goon-club-walk',
        frames: scene.anims.generateFrameNumbers('gameplay-goon-club-walk-sheet', { start: 0, end: 7 }),
        frameRate: 10,
        repeat: -1,
      });
    }
    createEightFrameAnimation('goon-red-run', 'gameplay-goon-red-run-sheet', 14, -1);
    createEightFrameAnimation('goon-hoodie-run', 'gameplay-goon-hoodie-run-sheet', 14, -1);
    createEightFrameAnimation('goon-club-run', 'gameplay-goon-club-run-sheet', 14, -1);
  }
