import Phaser from 'phaser';
import { loadDeferredLevelAssets } from '../config/DeferredLevelAssets';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    // Keep later-stage art ready before gameplay starts. Runtime loader handoffs
    // can leave a restarted Phaser scene on a blank canvas on some browsers.
    loadDeferredLevelAssets(this, 3);
    loadDeferredLevelAssets(this, 4);
    this.load.audio('menu-music', new URL('../assets/audio/menu-music.mp3', import.meta.url).href);
    this.load.audio('fight-music', new URL('../assets/audio/fight-music.mp3', import.meta.url).href);
    this.load.audio('story-intro', new URL('../assets/audio/story-intro.mp3', import.meta.url).href);
    this.load.audio('ui-hover', new URL('../assets/audio/ui-hover.mp3', import.meta.url).href);
    this.load.audio('special-attack', new URL('../assets/audio/special-attack.mp3', import.meta.url).href);
    this.load.audio('punch-hit', new URL('../assets/audio/punch-hit-sora.mp3', import.meta.url).href);
    this.load.audio('heavy-hit', new URL('../assets/audio/heavy-hit.mp3', import.meta.url).href);
    this.load.audio('dog-growl', new URL('../assets/audio/dog-growl.mp3', import.meta.url).href);
    this.load.audio('challenge-win', new URL('../assets/audio/challenge.mp3', import.meta.url).href);
    this.load.audio('hero-defeat', new URL('../assets/audio/hero-defeat.mp3', import.meta.url).href);
    this.load.audio('select', new URL('../assets/audio/select.mp3', import.meta.url).href);
    this.load.image('main-menu-target', new URL('../assets/menu/reference/main-menu-target.png', import.meta.url).href);
    this.load.image('main-menu-base-clean', new URL('../assets/menu/reference/main-menu-base-clean.png', import.meta.url).href);
    this.load.image('menu-background', new URL('../assets/menu/generated/menu-background-source.png', import.meta.url).href);
    this.load.image('menu-mbavu', new URL('../assets/menu/generated/mbavu.png', import.meta.url).href);
    this.load.image('menu-mjaka', new URL('../assets/menu/generated/mjaka.png', import.meta.url).href);
    this.load.image('menu-majembe', new URL('../assets/menu/generated/majembe.png', import.meta.url).href);
    this.load.image('menu-story-button', new URL('../assets/menu/extracted/story-button.png', import.meta.url).href);
    this.load.image('menu-arcade-button', new URL('../assets/menu/extracted/arcade-button.png', import.meta.url).href);
    this.load.image('menu-boss-button', new URL('../assets/menu/extracted/boss-button.png', import.meta.url).href);
    this.load.image('menu-options-button', new URL('../assets/menu/extracted/options-button.png', import.meta.url).href);
    this.load.image('menu-final-battle-card', new URL('../assets/menu/extracted/final-battle-card.png', import.meta.url).href);
    this.load.image('menu-avatar-card', new URL('../assets/menu/extracted/avatar-card.png', import.meta.url).href);
    this.load.image('menu-achievements-icon', new URL('../assets/menu/extracted/achievements-icon.png', import.meta.url).href);
    this.load.image('menu-settings-icon', new URL('../assets/menu/extracted/settings-icon.png', import.meta.url).href);
    this.load.image('menu-exit-icon', new URL('../assets/menu/extracted/exit-icon.png', import.meta.url).href);
    this.load.image('menu-daily-card', new URL('../assets/menu/extracted/daily-card.png', import.meta.url).href);
    this.load.image('menu-story-button-standalone', new URL('../assets/menu/extracted/story-button-standalone.png', import.meta.url).href);
    this.load.image('menu-arcade-button-standalone', new URL('../assets/menu/extracted/arcade-button-standalone.png', import.meta.url).href);
    this.load.image('menu-boss-button-standalone', new URL('../assets/menu/extracted/boss-button-standalone.png', import.meta.url).href);
    this.load.image('menu-options-button-standalone', new URL('../assets/menu/extracted/options-button-standalone.png', import.meta.url).href);
    this.load.image('menu-daily-card-standalone', new URL('../assets/menu/extracted/daily-card-standalone.png', import.meta.url).href);
    this.load.image('menu-final-battle-card-standalone', new URL('../assets/menu/extracted/final-battle-card-standalone.png', import.meta.url).href);
    this.load.image('menu-avatar-card-standalone', new URL('../assets/menu/extracted/avatar-card-standalone.png', import.meta.url).href);
    this.load.image('menu-logo-text-standalone', new URL('../assets/menu/extracted/logo-text-standalone.png', import.meta.url).href);
    this.load.image('menu-top-actions-standalone', new URL('../assets/menu/extracted/top-actions-standalone.png', import.meta.url).href);
    this.load.image('menu-footer-socials-standalone', new URL('../assets/menu/extracted/footer-socials-standalone.png', import.meta.url).href);
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
    this.load.image('character-select-target', new URL('../assets/character-select/reference/character-select-target.png', import.meta.url).href);
    this.load.image('character-select-background-v2', new URL('../assets/character-select/generated/character-select-background.png', import.meta.url).href);
    this.load.image('character-card-frame-v2', new URL('../assets/character-select/generated/character-card-frame.png', import.meta.url).href);
    this.load.image('character-back-button', new URL('../assets/character-select/extracted/back-button.png', import.meta.url).href);
    this.load.image('character-currency-panel', new URL('../assets/character-select/extracted/currency-panel.png', import.meta.url).href);
    this.load.image('character-mbavu-card', new URL('../assets/character-select/extracted/mbavu-card.png', import.meta.url).href);
    this.load.image('character-mjaka-card', new URL('../assets/character-select/extracted/mjaka-card.png', import.meta.url).href);
    this.load.image('character-majembe-card', new URL('../assets/character-select/extracted/majembe-card.png', import.meta.url).href);
    this.load.image('character-select-button', new URL('../assets/character-select/extracted/select-button.png', import.meta.url).href);
    this.load.image('character-left-arrow', new URL('../assets/character-select/extracted/left-arrow.png', import.meta.url).href);
    this.load.image('character-right-arrow', new URL('../assets/character-select/extracted/right-arrow.png', import.meta.url).href);
    this.load.image('menu-achievements-hex', new URL('../assets/menu/extracted/achievements-hex.png', import.meta.url).href);
    this.load.image('menu-settings-hex', new URL('../assets/menu/extracted/settings-hex.png', import.meta.url).href);
    this.load.image('menu-exit-hex', new URL('../assets/menu/extracted/exit-hex.png', import.meta.url).href);
    this.load.image('gameplay-background', new URL('../assets/gameplay/generated/gameplay-background.png', import.meta.url).href);
    this.load.spritesheet('gameplay-chapati-health-pickup-sheet', new URL('../assets/gameplay/generated/chapati-health-pickup-sheet.png', import.meta.url).href, { frameWidth: 384, frameHeight: 384 });
    this.load.image('nairobi-cbd-background', new URL('../assets/gameplay/generated/nairobi-cbd-background.png', import.meta.url).href);
    this.load.image('nairobi-matatu-conductor', new URL('../assets/gameplay/generated/nairobi-matatu-conductor.png', import.meta.url).href);
    this.load.spritesheet('touch-action-buttons', new URL('../assets/ui/touch-action-buttons.png', import.meta.url).href, { frameWidth: 627, frameHeight: 627 });
    this.load.image('gameplay-mbavu-kick', new URL('../assets/gameplay/generated/mbavu-flying-kick-canonical.png', import.meta.url).href);
    this.load.image('gameplay-goon', new URL('../assets/gameplay/generated/nairobi-goon.png', import.meta.url).href);
    this.load.spritesheet('gameplay-goon-red-attack-sheet', new URL('../assets/gameplay/generated/goon-red-attack-sheet.png', import.meta.url).href, { frameWidth: 384, frameHeight: 384 });
    this.load.spritesheet('gameplay-goon-hoodie-attack-sheet', new URL('../assets/gameplay/generated/goon-hoodie-attack-sheet.png', import.meta.url).href, { frameWidth: 384, frameHeight: 384 });
    this.load.spritesheet('gameplay-goon-club-attack-sheet', new URL('../assets/gameplay/generated/goon-club-attack-sheet.png', import.meta.url).href, { frameWidth: 384, frameHeight: 384 });
    this.load.spritesheet('gameplay-goon-red-walk-sheet', new URL('../assets/gameplay/generated/goon-red-walk-sheet.png', import.meta.url).href, { frameWidth: 384, frameHeight: 384 });
    this.load.spritesheet('gameplay-goon-hoodie-walk-sheet', new URL('../assets/gameplay/generated/goon-hoodie-walk-sheet.png', import.meta.url).href, { frameWidth: 384, frameHeight: 384 });
    this.load.spritesheet('gameplay-goon-club-walk-sheet', new URL('../assets/gameplay/generated/goon-club-walk-sheet.png', import.meta.url).href, { frameWidth: 384, frameHeight: 384 });
    this.load.spritesheet('gameplay-goon-red-run-sheet', new URL('../assets/gameplay/generated/goon-red-run-sheet.png', import.meta.url).href, { frameWidth: 384, frameHeight: 384 });
    this.load.spritesheet('gameplay-goon-hoodie-run-sheet', new URL('../assets/gameplay/generated/goon-hoodie-run-sheet.png', import.meta.url).href, { frameWidth: 384, frameHeight: 384 });
    this.load.spritesheet('gameplay-goon-club-run-sheet', new URL('../assets/gameplay/generated/goon-club-run-sheet.png', import.meta.url).href, { frameWidth: 384, frameHeight: 384 });
    this.load.image('gameplay-mbavu-idle', new URL('../assets/gameplay/generated/mbavu-idle.png', import.meta.url).href);
    this.load.image('gameplay-mbavu-feint-1', new URL('../assets/gameplay/generated/mbavu-feint-1.png', import.meta.url).href);
    this.load.image('gameplay-mbavu-feint-2', new URL('../assets/gameplay/generated/mbavu-feint-2.png', import.meta.url).href);
    this.load.image('gameplay-mbavu-feint-3', new URL('../assets/gameplay/generated/mbavu-feint-3.png', import.meta.url).href);
    this.load.image('gameplay-mbavu-feint-4', new URL('../assets/gameplay/generated/mbavu-feint-4.png', import.meta.url).href);
    this.load.image('gameplay-mbavu-run', new URL('../assets/gameplay/generated/mbavu-run.png', import.meta.url).href);
    this.load.spritesheet('gameplay-mbavu-run-sheet', new URL('../assets/gameplay/generated/mbavu-run-sheet.png', import.meta.url).href, { frameWidth: 256, frameHeight: 384 });
    this.load.image('gameplay-mbavu-punch', new URL('../assets/gameplay/generated/mbavu-punch.png', import.meta.url).href);
    this.load.image('gameplay-goon-club', new URL('../assets/gameplay/generated/goon-club.png', import.meta.url).href);
    this.load.image('gameplay-goon-hoodie', new URL('../assets/gameplay/generated/goon-hoodie.png', import.meta.url).href);
    this.load.image('gameplay-mbavu-defeat', new URL('../assets/gameplay/generated/mbavu-defeat.png', import.meta.url).href);
    this.load.spritesheet('gameplay-mbavu-defeat-fall-sheet', new URL('../assets/gameplay/generated/mbavu-defeat-fall-fullboots-sheet.png', import.meta.url).href, { frameWidth: 512, frameHeight: 384 });
    this.load.image('gameplay-mbavu-standing-kick', new URL('../assets/gameplay/generated/mbavu-kick.png', import.meta.url).href);
    this.load.image('gameplay-mjaka-palm-strike', new URL('../assets/gameplay/generated/mjaka-palm-strike.png', import.meta.url).href);
    this.load.image('gameplay-mjaka-high-kick', new URL('../assets/gameplay/generated/mjaka-high-kick.png', import.meta.url).href);
    this.load.image('gameplay-mjaka-rush-kick', new URL('../assets/gameplay/generated/mjaka-rush-kick.png', import.meta.url).href);
    this.load.image('gameplay-goon-bat-attack', new URL('../assets/gameplay/generated/goon-bat-attack.png', import.meta.url).href);
    this.load.image('gameplay-goon-bat-attack-2', new URL('../assets/gameplay/generated/goon-bat-attack-2.png', import.meta.url).href);
    this.load.image('gameplay-goon-bat-attack-3', new URL('../assets/gameplay/generated/goon-bat-attack-3.png', import.meta.url).href);
    this.load.image('gameplay-goon-defeat', new URL('../assets/gameplay/generated/goon-defeat.png', import.meta.url).href);
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
    const minimumDuration = reducedMotion ? 500 : 2600;
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









