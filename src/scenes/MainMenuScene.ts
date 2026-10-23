import { getDailyChallenge, DAILY_TARGET, DAILY_REWARD } from '../config/DailyChallenge';
import Phaser from 'phaser';
import { startStreamingMusic } from '../systems/StreamingMusic';
import { cycleDifficulty, getDifficultySettings, isSoundEnabled } from '../config/GameSettings';
import { getJourneySave } from '../config/GameProgress';

const GAME_WIDTH = 1280;
const GAME_HEIGHT = 720;
const SOURCE_WIDTH = 1672;
const SOURCE_HEIGHT = 941;
const SX = GAME_WIDTH / SOURCE_WIDTH;
const SY = GAME_HEIGHT / SOURCE_HEIGHT;
const FIGHTER_ART = [
  ['menu-mbavu', new URL('../assets/optimized/menu/generated/mbavu.webp', import.meta.url).href],
  ['menu-mjaka', new URL('../assets/optimized/menu/generated/mjaka.webp', import.meta.url).href],
  ['menu-majembe', new URL('../assets/optimized/menu/generated/majembe.webp', import.meta.url).href],
] as const;

type HoverButtonConfig = {
  key: string;
  box: [number, number, number, number];
  onClick: () => void;
  hoverScale?: number;
  hoverLift?: number;
};

export class MainMenuScene extends Phaser.Scene {
  private hoverSound?: Phaser.Sound.BaseSound;
  private lastHoverAt = -1000;
  private fighterArtReady = false;

  constructor() {
    super('MainMenuScene');
  }

  create() {
    startStreamingMusic('menu-music', new URL('../assets/optimized/audio/menu-music.mp3', import.meta.url).href, 0.24);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.hoverSound?.stop();
      this.hoverSound?.destroy();
      this.hoverSound = undefined;
    });
    this.cameras.main.setBackgroundColor('#050507');
    this.drawLayeredBackdrop();
    this.loadFighterArtAfterMenuIsVisible();

    this.addHoverButton({ key: 'menu-v2-button-story', box: [600, 466, 1048, 554], onClick: () => this.openCharacterSelect(), hoverScale: 1.045, hoverLift: 2 });
    this.addHoverButton({ key: 'menu-v2-button-arcade', box: [610, 558, 1044, 641], onClick: () => this.showComingSoon('ARCADE MODE'), hoverScale: 1.045, hoverLift: 2 });
    this.addHoverButton({ key: 'menu-v2-button-boss-rush', box: [612, 644, 1048, 730], onClick: () => this.showComingSoon('BOSS RUSH'), hoverScale: 1.045, hoverLift: 2 });
    this.addHoverButton({ key: 'menu-v2-button-options', box: [612, 736, 1048, 824], onClick: () => this.scene.start('OptionsScene'), hoverScale: 1.045, hoverLift: 2 });
    this.createDailyChallengeCard();
    this.addHoverButton({ key: 'menu-v2-final-battle-card', box: [1315, 748, 1658, 908], onClick: () => this.scene.start('LevelScene'), hoverScale: 1.035 });
    this.addHoverButton({ key: 'menu-v2-hero-status-panel', box: [24, 24, 342, 132], onClick: () => this.cameras.main.shake(80, 0.003), hoverScale: 1.025 });
    this.addHoverButton({ key: 'menu-v2-top-achievements', box: [1332, 26, 1430, 132], onClick: () => this.scene.start('AchievementsScene'), hoverScale: 1.06 });
    this.addHoverButton({ key: 'menu-v2-top-settings', box: [1436, 26, 1535, 132], onClick: () => this.scene.start('OptionsScene'), hoverScale: 1.06 });
    this.addHoverButton({ key: 'menu-v2-top-exit', box: [1542, 26, 1640, 132], onClick: () => this.cameras.main.fadeOut(220, 0, 0, 0), hoverScale: 1.06 });

    this.input.keyboard?.once('keydown-SPACE', () => this.openCharacterSelect());
    this.input.keyboard?.once('keydown-ENTER', () => this.openCharacterSelect());
    this.input.keyboard?.once('keydown-C', () => this.scene.start('CultureScene'));
    this.createBottomAction();
    performance.mark('ni-mbaya:menu-ready');
  }

  private createDailyChallengeCard() {
    const width = 216;
    const height = 132;
    const card = this.add.container(18 + width / 2, 558 + height / 2).setDepth(12);
    const content = this.add.container(-width / 2, -height / 2);
    const panel = this.add.graphics();
    panel.fillStyle(0x050b12, 0.97).fillRoundedRect(0, 0, width, height, 7);
    panel.lineStyle(2, 0xffc51d).strokeRoundedRect(0, 0, width, height, 7);
    panel.lineStyle(1, 0x775c1e).lineBetween(12, 32, width - 12, 32);
    const title = this.add.text(12, 11, 'DAILY CHALLENGE', { fontFamily: 'Impact, Arial Black, sans-serif', fontSize: '18px', color: '#ffc51d', fontStyle: 'italic' });
    const goal = this.add.text(12, 41, `DEFEAT ${DAILY_TARGET} ENEMIES`, { fontFamily: 'Arial Black, sans-serif', fontSize: '12px', color: '#ffffff' });
    const reward = this.add.text(12, 62, `REWARD: ${DAILY_REWARD} CHAPATIS`, { fontFamily: 'Arial Black, sans-serif', fontSize: '11px', color: '#ffcf42' });
    const status = this.add.text(12, 83, '', { fontFamily: 'Arial Black, sans-serif', fontSize: '10px', color: '#a3adbc' });
    const track = this.add.rectangle(12, 113, 144, 7, 0x253142).setOrigin(0, 0.5);
    const fill = this.add.rectangle(12, 113, 0, 7, 0xffc51d).setOrigin(0, 0.5);
    const count = this.add.text(204, 113, '', { fontFamily: 'Arial Black, sans-serif', fontSize: '11px', color: '#ffffff' }).setOrigin(1, 0.5);
    content.add([panel, title, goal, reward, status, track, fill, count]);
    card.add(content);
    let previous = '';
    const refresh = () => {
      const daily = getDailyChallenge();
      const state = `${daily.date}:${daily.defeats}:${daily.claimed}`;
      if (state === previous) return;
      previous = state;
      fill.width = 144 * daily.defeats / DAILY_TARGET;
      count.setText(`${daily.defeats}/${DAILY_TARGET}`);
      status.setText(daily.claimed ? 'REWARD CLAIMED' : daily.defeats === DAILY_TARGET ? 'READY TO CLAIM' : 'VIEW TODAY’S CHALLENGE');
      status.setColor(daily.defeats === DAILY_TARGET ? '#ffc51d' : '#a3adbc');
    };
    refresh();
    this.time.addEvent({ delay: 1000, loop: true, callback: refresh });
    card.setSize(width, height).setInteractive({ useHandCursor: true });
    card.on('pointerover', () => card.setAlpha(0.88));
    card.on('pointerout', () => card.setAlpha(1));
    card.on('pointerdown', () => { this.playSelectSound(); this.scene.start('DailyChallengeScene'); });
  }

  private createBottomAction() {
    const save = getJourneySave();
    const actionLabel = save ? `CONTINUE • LEVEL ${save.levelId}` : 'CREDITS';
    const actionWidth = save ? 330 : 150;
    const actionHeight = save ? 36 : 28;
    const button = this.add.container(GAME_WIDTH / 2, 652).setDepth(35);
    const panel = this.add.graphics();
    panel.fillStyle(0x050505, 0.9).lineStyle(2, 0xffc423, 0.95);
    panel.fillRoundedRect(-actionWidth / 2, -actionHeight / 2, actionWidth, actionHeight, 6).strokeRoundedRect(-actionWidth / 2, -actionHeight / 2, actionWidth, actionHeight, 6);
    const text = this.add.text(0, 0, actionLabel, {
      fontFamily: 'Arial Black, Impact, sans-serif', fontSize: save ? '17px' : '13px', color: '#ffc423',
      stroke: '#000000', strokeThickness: 3, fontStyle: 'italic',
    }).setOrigin(0.5);
    button.add([panel, text]).setSize(actionWidth, actionHeight).setInteractive({ useHandCursor: true });
    button.on('pointerover', () => {
      this.playHoverSound();
      this.tweens.add({ targets: button, scale: 1.04, duration: 90 });
      text.setColor('#ffffff');
    });
    button.on('pointerout', () => {
      this.tweens.add({ targets: button, scale: 1, duration: 80 });
      text.setColor('#ffc423');
    });
    button.on('pointerdown', () => {
      this.playSelectSound();
      if (save) this.scene.start('LevelScene', save);
      else this.scene.start('CultureScene');
    });
  }
  private loadFighterArtAfterMenuIsVisible() {
    FIGHTER_ART.forEach(([key, url]) => {
      if (!this.textures.exists(key)) this.load.image(key, url);
    });

    if (FIGHTER_ART.every(([key]) => this.textures.exists(key))) {
      this.fighterArtReady = true;
      this.loadMenuMusicAfterMenuIsVisible();
      return;
    }

    this.load.once(Phaser.Loader.Events.COMPLETE, () => {
      this.fighterArtReady = FIGHTER_ART.every(([key]) => this.textures.exists(key));
      if (this.scene.manager.getScenes(true).includes(this)) this.loadMenuMusicAfterMenuIsVisible();
    });
    this.load.start();
  }

  private openCharacterSelect() {
    if (!this.fighterArtReady) {
      this.showToast('FIGHTERS ARE ENTERING — ONE MOMENT');
      return;
    }
    this.scene.start('CharacterSelectScene');
  }

  private loadMenuMusicAfterMenuIsVisible() {
    if (!isSoundEnabled()) return;
    let queuedSounds = false;
    for (const [key, url] of [
      ['ui-hover', new URL('../assets/optimized/audio/ui-hover.mp3', import.meta.url).href],
      ['select', new URL('../assets/optimized/audio/select.mp3', import.meta.url).href],
    ]) {
      if (!this.cache.audio.exists(key)) { this.load.audio(key, url); queuedSounds = true; }
    }
    if (queuedSounds) this.load.start();
  }

  private playHoverSound() {
    if (!isSoundEnabled() || this.sound.locked || !this.cache.audio.exists('ui-hover') || this.time.now - this.lastHoverAt < 90) return;
    this.lastHoverAt = this.time.now;
    this.hoverSound?.stop();
    this.hoverSound?.destroy();
    this.hoverSound = this.sound.add('ui-hover', { volume: 0.38 });
    this.hoverSound.play();
    const sound = this.hoverSound;
    this.time.delayedCall(480, () => {
      if (sound === this.hoverSound) {
        sound.stop();
        sound.destroy();
        this.hoverSound = undefined;
      }
    });
  }

  private cycleDifficultyOption() {
    const difficulty = cycleDifficulty();
    this.showToast(`DIFFICULTY: ${getDifficultySettings().label.toUpperCase()}`);
    this.cameras.main.shake(difficulty === 'hard' ? 120 : 75, difficulty === 'hard' ? 0.005 : 0.003);
  }

  private showToast(message: string) {
    const panel = this.add.graphics().setDepth(60);
    panel.fillStyle(0x050505, 0.88);
    panel.lineStyle(3, 0xffc423, 0.9);
    panel.fillRoundedRect(GAME_WIDTH / 2 - 190, 610, 380, 52, 8);
    panel.strokeRoundedRect(GAME_WIDTH / 2 - 190, 610, 380, 52, 8);
    const text = this.add.text(GAME_WIDTH / 2, 636, message, {
      fontFamily: 'Arial Black, Impact, sans-serif',
      fontSize: '24px',
      color: '#ffc423',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(61);
    this.tweens.add({ targets: [panel, text], alpha: 0, delay: 900, duration: 260, onComplete: () => { panel.destroy(); text.destroy(); } });
  }

  private showComingSoon(mode: string) {
    this.showToast(`${mode} — COMING SOON`);
  }

  private drawLayeredBackdrop() {
    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'menu-v2-background').setDisplaySize(GAME_WIDTH, GAME_HEIGHT).setDepth(-20);
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x050507, 0.08).setDepth(-19);
    this.addImageInSourceBox('menu-v2-ni-mbaya-logo', [495, 12, 1225, 238], 2);
    this.addImageInSourceBox('menu-v2-tagline', [640, 248, 1088, 398], 2);
    this.addImageInSourceBox('menu-v2-footer-socials', [608, 884, 944, 930], 5);

    const frame = this.add.graphics().setDepth(30);
    frame.lineStyle(4, 0xd8d1c8, 0.85);
    frame.strokeRect(7, 7, GAME_WIDTH - 14, GAME_HEIGHT - 14);
  }

  private addImageInSourceBox(key: string, box: [number, number, number, number], depth: number) {
    const [x1, y1, x2, y2] = box;
    return this.add
      .image(((x1 + x2) / 2) * SX, ((y1 + y2) / 2) * SY, key)
      .setDisplaySize((x2 - x1) * SX, (y2 - y1) * SY)
      .setDepth(depth);
  }

  private addModeButton(config: { label: string; icon: string; y: number; onClick: () => void; primary?: boolean }) {
    const x = 644;
    const width = 392;
    const height = 58;
    const badgeWidth = 82;
    const container = this.add.container(x, config.y).setDepth(12);
    const g = this.add.graphics();
    const bodyColor = config.primary ? 0xffc423 : 0x101114;
    const badgeColor = config.primary ? 0xf2bd20 : 0x22242a;
    const borderColor = config.primary ? 0xffe06b : 0xf2f2f2;
    const textColor = config.primary ? '#101010' : '#f4f4f4';
    const strokeColor = config.primary ? '#ffef7a' : '#000000';

    const shadow = [
      new Phaser.Math.Vector2(-width / 2 + 18, -height / 2 + 10),
      new Phaser.Math.Vector2(width / 2 + 13, -height / 2 + 4),
      new Phaser.Math.Vector2(width / 2 - 15, height / 2 + 12),
      new Phaser.Math.Vector2(-width / 2 - 8, height / 2 + 7),
    ];
    const panel = [
      new Phaser.Math.Vector2(-width / 2 + 18, -height / 2 + 2),
      new Phaser.Math.Vector2(width / 2 + 6, -height / 2 - 3),
      new Phaser.Math.Vector2(width / 2 - 22, height / 2 + 4),
      new Phaser.Math.Vector2(-width / 2 - 10, height / 2 - 2),
    ];
    const badge = [
      new Phaser.Math.Vector2(-width / 2 + 10, -height / 2 + 7),
      new Phaser.Math.Vector2(-width / 2 + badgeWidth, -height / 2 + 2),
      new Phaser.Math.Vector2(-width / 2 + badgeWidth - 18, height / 2 - 4),
      new Phaser.Math.Vector2(-width / 2 - 9, height / 2 - 8),
    ];

    g.fillStyle(0x000000, 0.58);
    g.fillPoints(shadow, true);
    g.fillStyle(bodyColor, config.primary ? 0.98 : 0.92);
    g.fillPoints(panel, true);
    g.lineStyle(3, 0x050505, 0.92);
    g.strokePoints(panel, true);
    g.lineStyle(2, borderColor, config.primary ? 0.9 : 0.72);
    g.strokePoints(panel, true);
    g.fillStyle(badgeColor, 1);
    g.fillPoints(badge, true);
    g.lineStyle(2, 0x050505, 0.85);
    g.strokePoints(badge, true);

    for (let i = 0; i < 8; i += 1) {
      const sx = -width / 2 + 22 + i * 46;
      g.lineStyle(1, config.primary ? 0xf58c14 : 0xffffff, config.primary ? 0.25 : 0.12);
      g.lineBetween(sx, -height / 2 + 8, sx + 28, -height / 2 + 2);
    }

    const icon = this.add.text(-width / 2 + 39, -1, config.icon, {
      fontFamily: 'Arial Black, Impact, sans-serif',
      fontSize: '29px',
      color: config.primary ? '#0a0a0a' : '#ffffff',
      stroke: '#000000',
      strokeThickness: config.primary ? 1 : 4,
    }).setOrigin(0.5);

    const label = this.add.text(-width / 2 + 122, 0, config.label, {
      fontFamily: 'Impact, Arial Black, sans-serif',
      fontSize: '34px',
      color: textColor,
      stroke: strokeColor,
      strokeThickness: config.primary ? 1 : 5,
    }).setOrigin(0, 0.5).setRotation(-0.01);

    container.add([g, icon, label]);
    container.setSize(width, height);
    const zone = this.add.zone(x, config.y, width, height).setInteractive({ useHandCursor: true }).setDepth(21);
    zone.on('pointerover', () => {
      this.playHoverSound();
      this.tweens.killTweensOf(container);
      container.setDepth(22);
      this.tweens.add({ targets: container, scale: 1.065, duration: 110, ease: 'Back.Out' });
    });
    zone.on('pointerout', () => {
      this.tweens.killTweensOf(container);
      this.tweens.add({ targets: container, scale: 1, duration: 95, ease: 'Sine.Out', onComplete: () => container.setDepth(12) });
    });
    zone.on('pointerdown', () => {
      this.playSelectSound();
      config.onClick();
    });
    return container;
  }

  private addHoverButton(config: HoverButtonConfig) {
    const [x1, y1, x2, y2] = config.box;
    const width = (x2 - x1) * SX;
    const height = (y2 - y1) * SY;
    const image = this.add
      .image(((x1 + x2) / 2) * SX, ((y1 + y2) / 2) * SY, config.key)
      .setDisplaySize(width, height)
      .setDepth(10)
      .setInteractive({ useHandCursor: true });

    const baseScaleX = image.scaleX;
    const baseScaleY = image.scaleY;
    const baseY = image.y;
    const hoverScale = config.hoverScale ?? 1.06;
    const hoverLift = config.hoverLift ?? 0;

    image.on('pointerover', () => {
      this.playHoverSound();
      image.setDepth(20);
      this.tweens.killTweensOf(image);
      this.tweens.add({
        targets: image,
        scaleX: baseScaleX * hoverScale,
        scaleY: baseScaleY * hoverScale,
        y: baseY - hoverLift,
        duration: 110,
        ease: 'Back.Out',
      });
    });

    image.on('pointerout', () => {
      this.tweens.killTweensOf(image);
      this.tweens.add({
        targets: image,
        scaleX: baseScaleX,
        scaleY: baseScaleY,
        y: baseY,
        duration: 90,
        ease: 'Sine.Out',
        onComplete: () => image.setDepth(10),
      });
    });

    image.on('pointerdown', () => {
      this.playSelectSound();
      config.onClick();
    });
    return image;
  }

  private addTopActionZone(box: [number, number, number, number], onClick: () => void) {
    const [x1, y1, x2, y2] = box;
    const x = ((x1 + x2) / 2) * SX;
    const y = ((y1 + y2) / 2) * SY;
    const width = (x2 - x1) * SX;
    const height = (y2 - y1) * SY;
    const zone = this.add.zone(x, y, width, height).setInteractive({ useHandCursor: true });
    const halo = this.add.graphics().setDepth(19).setAlpha(0);
    const rx = width * 0.42;
    const ry = height * 0.32;
    const points = [
      new Phaser.Math.Vector2(x - rx * 0.55, y - ry),
      new Phaser.Math.Vector2(x + rx * 0.55, y - ry),
      new Phaser.Math.Vector2(x + rx, y),
      new Phaser.Math.Vector2(x + rx * 0.55, y + ry),
      new Phaser.Math.Vector2(x - rx * 0.55, y + ry),
      new Phaser.Math.Vector2(x - rx, y),
    ];
    halo.lineStyle(3, 0xffd24a, 0.95);
    halo.strokePoints(points, true);
    halo.lineStyle(1, 0xffffff, 0.65);
    halo.strokePoints(points.map((point) => new Phaser.Math.Vector2(x + (point.x - x) * 1.13, y + (point.y - y) * 1.13)), true);
    zone.on('pointerover', () => {
      this.playHoverSound();
      this.tweens.add({ targets: halo, alpha: 1, duration: 100 });
    });
    zone.on('pointerout', () => this.tweens.add({ targets: halo, alpha: 0, duration: 100 }));
    zone.on('pointerdown', () => {
      this.playSelectSound();
      onClick();
    });
  }

  private playSelectSound() {
    if (!isSoundEnabled() || this.sound.locked || !this.cache.audio.exists('select')) return;
    this.sound.play('select', { volume: 0.85 });
  }
}
