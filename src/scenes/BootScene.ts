import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    const loadingLabel = document.querySelector<HTMLElement>('.brand-intro__loading');
    this.load.on(Phaser.Loader.Events.PROGRESS, (progress: number) => {
      if (loadingLabel) loadingLabel.textContent = `Loading NI MBAYA · ${Math.round(progress * 100)}%`;
    });
    this.load.once(Phaser.Loader.Events.COMPLETE, () => {
      if (loadingLabel) loadingLabel.textContent = 'Starting NI MBAYA…';
    });

    // Later-stage art is loaded only when that chapter starts. This keeps the
    // first playable screen fast enough for mobile connections.
    this.load.audio('ui-hover', new URL('../assets/audio/ui-hover.mp3', import.meta.url).href);
    this.load.audio('select', new URL('../assets/audio/select.mp3', import.meta.url).href);
    this.load.image('menu-v2-background', new URL('../assets/menu/v2/menu-background-clean.png', import.meta.url).href);
    this.load.image('menu-v2-hero-status-panel', new URL('../assets/menu/v2/hero-status-panel.png', import.meta.url).href);
    this.load.image('menu-v2-ni-mbaya-logo', new URL('../assets/menu/v2/ni-mbaya-logo.png', import.meta.url).href);
    this.load.image('menu-v2-tagline', new URL('../assets/menu/v2/menu-tagline.png', import.meta.url).href);
    this.load.image('menu-v2-button-story', new URL('../assets/menu/v2/button-story.png', import.meta.url).href);
    this.load.image('menu-v2-button-arcade', new URL('../assets/menu/v2/button-arcade.png', import.meta.url).href);
    this.load.image('menu-v2-button-boss-rush', new URL('../assets/menu/v2/button-boss-rush.png', import.meta.url).href);
    this.load.image('menu-v2-button-options', new URL('../assets/menu/v2/button-options.png', import.meta.url).href);
    this.load.image('menu-v2-top-achievements', new URL('../assets/menu/v2/top-achievements.png', import.meta.url).href);
    this.load.image('menu-v2-top-settings', new URL('../assets/menu/v2/top-settings.png', import.meta.url).href);
    this.load.image('menu-v2-top-exit', new URL('../assets/menu/v2/top-exit.png', import.meta.url).href);
    this.load.image('menu-v2-daily-challenge-card', new URL('../assets/menu/v2/daily-challenge-card.png', import.meta.url).href);
    this.load.image('menu-v2-final-battle-card', new URL('../assets/menu/v2/final-battle-card.png', import.meta.url).href);
    this.load.image('menu-v2-footer-socials', new URL('../assets/menu/v2/footer-socials.png', import.meta.url).href);
    this.load.spritesheet('gameplay-chapati-health-pickup-sheet', new URL('../assets/gameplay/generated/chapati-health-pickup-sheet.png', import.meta.url).href, { frameWidth: 384, frameHeight: 384 });
  }

  create() {
    this.createFighterTexture('player-idle', 0x246bfe, 0xf8d49d);
    this.createFighterTexture('player-walk', 0x2f8cff, 0xf8d49d);
    this.createFighterTexture('player-jump', 0x8fd3ff, 0xf8d49d);
    this.createFighterTexture('player-punch', 0xffc33a, 0xf8d49d);
    this.createFighterTexture('player-kick', 0x46d07f, 0xf8d49d);
    this.createFighterTexture('player-hit', 0xff5c5c, 0xf8d49d);
    this.createFighterTexture('player-defeat', 0x4a4a58, 0xf8d49d);
    this.createFighterTexture('goon-idle', 0x9234d9, 0xb8784e);
    this.createFighterTexture('goon-hit', 0xff4f6d, 0xb8784e);
    this.createSparkTexture();
    this.createShadowTexture();
    this.createStoneProjectileTexture();

    this.finishIntroThenStart();
  }

  private finishIntroThenStart() {
    const intro = document.getElementById('brand-intro');
    const startedAt = Number(intro?.dataset.startedAt ?? Date.now());
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const minimumDuration = reducedMotion ? 250 : 900;
    let started = false;

    const startGame = () => {
      if (started) return;
      started = true;
      window.removeEventListener('brand-intro-skip', skipIntro);
      intro?.classList.add('is-leaving');

      window.setTimeout(() => {
        intro?.remove();
        const levelParam = Number(new URLSearchParams(window.location.search).get('level'));
        if (Number.isFinite(levelParam) && levelParam > 0) {
          this.scene.start('LevelScene', { levelId: levelParam });
          return;
        }
        this.scene.start('MainMenuScene');
      }, 600);
    };

    const skipIntro = () => startGame();
    window.addEventListener('brand-intro-skip', skipIntro, { once: true });

    if (intro?.dataset.skipped === 'true') {
      startGame();
      return;
    }

    window.setTimeout(startGame, Math.max(0, minimumDuration - (Date.now() - startedAt)));
  }
  private createFighterTexture(key: string, bodyColor: number, skinColor: number) {
    const g = this.add.graphics();
    g.fillStyle(bodyColor, 1);
    g.fillRoundedRect(28, 44, 40, 56, 10);
    g.fillStyle(skinColor, 1);
    g.fillCircle(48, 27, 17);
    g.fillStyle(0x151515, 1);
    g.fillCircle(54, 25, 2);
    g.lineStyle(8, bodyColor, 1);
    g.lineBetween(28, 56, 13, 80);
    g.lineBetween(68, 56, 84, 78);
    g.lineBetween(38, 98, 27, 120);
    g.lineBetween(58, 98, 70, 120);
    g.generateTexture(key, 96, 128);
    g.destroy();
  }

  private createShadowTexture() {
    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.35);
    g.fillEllipse(32, 16, 28, 7);
    g.generateTexture('shadow', 64, 32);
    g.destroy();
  }

  private createStoneProjectileTexture() {
    const g = this.add.graphics();
    g.fillStyle(0x6f6254, 1);
    g.fillCircle(12, 12, 9);
    g.lineStyle(2, 0x302a25, 1);
    g.strokeCircle(12, 12, 9);
    g.fillStyle(0xa69682, 0.7);
    g.fillCircle(9, 9, 2.5);
    g.generateTexture('stone-projectile', 24, 24);
    g.destroy();
  }

  private createSparkTexture() {
    const g = this.add.graphics();
    g.fillStyle(0xfff04a, 1);
    g.fillCircle(32, 32, 8);
    g.lineStyle(4, 0xff7a18, 1);
    for (let i = 0; i < 10; i += 1) {
      const angle = (Math.PI * 2 * i) / 10;
      g.lineBetween(32, 32, 32 + Math.cos(angle) * 28, 32 + Math.sin(angle) * 28);
    }
    g.generateTexture('hit-spark', 64, 64);
    g.destroy();
  }
}



