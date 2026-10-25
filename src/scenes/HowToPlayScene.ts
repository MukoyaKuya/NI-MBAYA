import Phaser from 'phaser';
import { getStoryLanguage, isSoundEnabled } from '../config/GameSettings';

type LevelStartData = { character?: string; chapatis?: number; health?: number; levelId?: number };
type Direction = 'left' | 'right' | 'up' | 'down';
const GOLD = 0xffc51d;
const INK = 0x090a0c;

export class HowToPlayScene extends Phaser.Scene {
  private startData: LevelStartData = {};
  private lastHoverAt = -1000;
  private starting = false;
  constructor() { super('HowToPlayScene'); }

  preload() {
    if (!this.textures.exists('nairobi-instructions-background')) {
      this.load.image('nairobi-instructions-background', new URL('../assets/optimized/loading/nairobi-loading-background.webp', import.meta.url).href);
    }
  }

  init(data: LevelStartData = {}) { this.startData = data; this.starting = false; }

  create() {
    const sw = getStoryLanguage() === 'sw';
    this.add.image(640, 360, 'nairobi-instructions-background').setDisplaySize(1280, 720).setDepth(-2);
    this.add.rectangle(640, 360, 1280, 720, 0x09050d, 0.23).setDepth(-1);
    this.drawHeading(sw);
    this.drawPanel(210, 212, 430, 344, sw ? 'KIBODI' : 'KEYBOARD');
    this.drawPanel(660, 212, 410, 344, sw ? 'SIMU' : 'MOBILE');
    this.drawKeyboardControls(sw);
    this.drawMobileControls(sw);
    this.drawTip(sw);
    this.createStartButton(sw);
    this.input.keyboard?.once('keydown-SPACE', () => this.startLevel());
    this.input.keyboard?.once('keydown-ENTER', () => this.startLevel());
  }

  private text(x: number, y: number, label: string, size: number, color = '#f3f1e8', italic = false) {
    return this.add.text(x, y, label, {
      fontFamily: 'Arial Black, Arial, sans-serif', fontSize: `${size}px`, fontStyle: italic ? 'bold italic' : 'bold', color,
      padding: { left: 2, right: italic ? Math.ceil(size * 0.25) : 2, top: 2, bottom: 3 },
    });
  }

  private fit(text: Phaser.GameObjects.Text, maxWidth: number) {
    text.setScale(Math.min(1, maxWidth / Math.max(text.width, 1)));
    return text;
  }

  private polygon(x: number, y: number, width: number, height: number, bevel: number) {
    return [
      new Phaser.Geom.Point(x + bevel, y), new Phaser.Geom.Point(x + width - bevel, y),
      new Phaser.Geom.Point(x + width, y + height / 2), new Phaser.Geom.Point(x + width - bevel, y + height),
      new Phaser.Geom.Point(x + bevel, y + height), new Phaser.Geom.Point(x, y + height / 2),
    ];
  }

  private drawHeading(sw: boolean) {
    const title = this.text(640, 99, sw ? 'JINSI YA KUCHEZA' : 'HOW TO PLAY', 84, '#ffc51d', true)
      .setOrigin(0.5).setStroke('#160e04', 2).setShadow(3, 5, '#090502', 1, true, true).setName('instructions-title');
    this.fit(title, sw ? 850 : 775);
    this.add.graphics().fillStyle(GOLD).fillPoints([
      new Phaser.Geom.Point(305, 147), new Phaser.Geom.Point(942, 136), new Phaser.Geom.Point(987, 143),
      new Phaser.Geom.Point(690, 148), new Phaser.Geom.Point(292, 153),
    ], true);
    const subtitle = sw ? 'PIGANA NAIROBI NA UMWOKOE MJAKA MFINE' : 'FIGHT THROUGH NAIROBI AND RESCUE MJAKA MFINE';
    this.fit(this.text(640, 166, subtitle, 18).setOrigin(0.5).setShadow(0, 2, '#000000', 4), 870);
  }

  private drawPanel(x: number, y: number, width: number, height: number, heading: string) {
    const g = this.add.graphics();
    const corners = [
      new Phaser.Geom.Point(x + 10, y), new Phaser.Geom.Point(x + width - 10, y),
      new Phaser.Geom.Point(x + width, y + 10), new Phaser.Geom.Point(x + width, y + height - 10),
      new Phaser.Geom.Point(x + width - 10, y + height), new Phaser.Geom.Point(x + 10, y + height),
      new Phaser.Geom.Point(x, y + height - 10), new Phaser.Geom.Point(x, y + 10),
    ];
    g.fillStyle(INK, 0.96).lineStyle(3, GOLD).fillPoints(corners, true).strokePoints(corners, true);
    g.lineStyle(1, GOLD, 0.3).strokeRect(x + 6, y + 7, width - 12, height - 14);
    for (let i = 0; i < 240; i++) {
      g.fillStyle(i % 2 ? 0x68625a : 0x000000, 0.1).fillRect(x + 10 + i * 47 % (width - 20), y + 10 + i * 71 % (height - 20), 1 + i % 3, 1);
    }
    for (let i = 0; i < 5; i++) {
      g.lineStyle(3, GOLD, 0.75).lineBetween(x + 13 + i * 10, y + 18, x + 21 + i * 10, y + 10);
      g.lineStyle(1, GOLD, 0.4).lineBetween(x + width - 42 + i * 6, y + height - 9, x + width - 10, y + height - 40 + i * 6);
    }
    const header = this.polygon(x + 60, y - 18, width - 120, 42, 17);
    g.fillStyle(GOLD).lineStyle(3, 0x130e03).fillPoints(header, true).strokePoints(header, true);
    g.lineStyle(1, GOLD).strokePoints(this.polygon(x + 56, y - 21, width - 112, 48, 20), true);
    this.fit(this.text(x + width / 2, y + 2, heading, 29, '#090a0b', true).setOrigin(0.5), width - 145);
  }

  private separator(x: number, y: number, width: number) {
    this.add.graphics().lineStyle(1, GOLD, 0.25).lineBetween(x, y, x + width, y);
  }

  private keycap(x: number, y: number, width: number, label: string, name?: string, height = 36) {
    const g = this.add.graphics();
    const top = y - height / 2 - 2;
    g.fillStyle(0x08090b).fillRoundedRect(x - width / 2 - 2, top + 1, width + 4, height + 4, 5);
    g.fillStyle(0x303337).lineStyle(1.5, 0xb8b9b7, 0.8)
      .fillRoundedRect(x - width / 2, top, width, height, 4).strokeRoundedRect(x - width / 2, top, width, height, 4);
    g.fillStyle(0x1c1e21).fillRoundedRect(x - width / 2 + 4, top + 4, width - 8, height - 7, 3);
    g.lineStyle(2, 0xd69820, 0.8).lineBetween(x - width / 2 + 6, y + height / 2, x + width / 2 - 6, y + height / 2);
    const text = this.fit(this.text(x, y - 1, label, Math.min(18, height * 0.55)).setOrigin(0.5), width - 12);
    if (name) text.setName(name);
  }

  private arrow(x: number, y: number, direction: Direction, size = 1, color = 0xf5f5ee) {
    const rotations = { right: 0, down: Math.PI / 2, left: Math.PI, up: -Math.PI / 2 };
    this.add.graphics({ x, y }).fillStyle(color).fillPoints([
      new Phaser.Geom.Point(-10, -3), new Phaser.Geom.Point(2, -3), new Phaser.Geom.Point(2, -8),
      new Phaser.Geom.Point(11, 0), new Phaser.Geom.Point(2, 8), new Phaser.Geom.Point(2, 3), new Phaser.Geom.Point(-10, 3),
    ], true).setScale(size).setRotation(rotations[direction]);
  }

  private drawKeyboardControls(sw: boolean) {
    const labels = sw ? ['SONGA', 'BADILI NJIA', 'RUKA', 'NGUMI', 'TEKE', 'MAALUMU'] : ['MOVE', 'LANE', 'JUMP', 'PUNCH', 'KICK', 'SPECIAL'];
    const rows = [280, 334, 383, 431, 479, 527];
    labels.forEach((label, i) => {
      this.fit(this.text(245, rows[i], label, 17).setOrigin(0, 0.5), 165);
      if (i < labels.length - 1) this.separator(240, rows[i] + 25, 370);
    });
    const directions: Direction[][] = [['left', 'right'], ['up', 'down']];
    directions.forEach(([a, b], index) => {
      const y = rows[index];
      this.keycap(462, y, 53, ''); this.arrow(462, y - 2, a);
      this.text(511, y - 1, '/', 23).setOrigin(0.5);
      this.keycap(561, y, 53, ''); this.arrow(561, y - 2, b);
    });
    this.keycap(511, rows[2], 150, 'SPACE', 'instructions-key-jump');
    ['J', 'K', 'L'].forEach((key, i) => this.keycap(511, rows[i + 3], 88, key, `instructions-key-${['punch', 'kick', 'special'][i]}`));
  }

  private joystick(x: number, y: number) {
    const g = this.add.graphics();
    g.fillStyle(0x040507).lineStyle(2, GOLD).fillCircle(x, y, 38).strokeCircle(x, y, 38);
    g.fillStyle(0x2c3034).lineStyle(2, 0x747779).fillCircle(x, y, 28).strokeCircle(x, y, 28);
    g.fillStyle(0x141719).lineStyle(4, 0x959a9d).fillCircle(x, y, 18).strokeCircle(x, y, 18);
    g.lineStyle(2, 0xffffff, 0.22).beginPath().arc(x, y - 1, 14, Math.PI, Math.PI * 1.8).strokePath();
    g.fillStyle(GOLD).fillTriangle(x, y - 33, x - 5, y - 26, x + 5, y - 26);
    g.fillTriangle(x, y + 33, x - 5, y + 26, x + 5, y + 26);
    g.fillTriangle(x - 33, y, x - 26, y - 5, x - 26, y + 5);
    g.fillTriangle(x + 33, y, x + 26, y - 5, x + 26, y + 5);
  }

  private drawMobileControls(sw: boolean) {
    this.fit(this.text(690, 284, sw ? 'SONGA + NJIA' : 'MOVE + LANE', 17).setOrigin(0, 0.5), 165);
    this.joystick(946, 282);
    this.keycap(946, 333, 128, sw ? 'JOYSTICK KUSHOTO' : 'LEFT JOYSTICK', undefined, 20);
    this.separator(690, 347, 350);
    const rows = [373, 423, 473, 523];
    const actions = sw ? ['RUKA', 'NGUMI', 'TEKE', 'MAALUMU'] : ['JUMP', 'PUNCH', 'KICK', 'SPECIAL'];
    ['J', 'P', 'K', 'S'].forEach((key, i) => {
      const y = rows[i];
      this.fit(this.text(690, y, actions[i], 17).setOrigin(0, 0.5), 150);
      const g = this.add.graphics();
      g.fillStyle(0x0e1114).lineStyle(3, GOLD).fillCircle(882, y, 20).strokeCircle(882, y, 20);
      g.lineStyle(1.5, 0x9b9c96, 0.8).strokeCircle(882, y, 16);
      this.text(882, y - 1, key, 23).setOrigin(0.5).setName(`instructions-touch-${['jump', 'punch', 'kick', 'special'][i]}`);
      this.keycap(981, y, 100, sw ? `KITUFE ${key}` : `${key} BUTTON`);
      if (i < 3) this.separator(690, y + 25, 350);
    });
  }

  private drawTip(sw: boolean) {
    const g = this.add.graphics();
    const points = this.polygon(255, 570, 770, 42, 16);
    g.fillStyle(INK, 0.96).lineStyle(2, GOLD).fillPoints(points, true).strokePoints(points, true);
    g.fillStyle(GOLD).fillTriangle(310, 578, 296, 602, 324, 602);
    this.text(310, 591, '!', 18, '#090a0b').setOrigin(0.5);
    const tip = sw
      ? 'DOKEZO: WEKA GOONS KWENYE NJIA YAKO. SHINDA WATATU ILI CHAPATI YA AFYA ITOKEE.'
      : 'TIP: KEEP GOONS IN YOUR LANE. DEFEAT THREE TO MAKE A HEALTH CHAPATI DROP.';
    const tipText = this.text(668, 591, tip, 17).setOrigin(0.5).setName('instructions-tip')
      .setFontFamily('Impact, Arial Black, sans-serif').setFontStyle('normal');
    this.fit(tipText, 660);
  }

  private createStartButton(sw: boolean) {
    const button = this.add.container(640, 652).setName('instructions-start');
    const bg = this.add.graphics();
    bg.fillStyle(0x100d03).lineStyle(2, GOLD).fillPoints(this.polygon(-224, -35, 448, 70, 22), true)
      .strokePoints(this.polygon(-224, -35, 448, 70, 22), true);
    bg.fillStyle(GOLD).lineStyle(1, 0xffed8d).fillPoints(this.polygon(-216, -29, 432, 58, 18), true)
      .strokePoints(this.polygon(-216, -29, 432, 58, 18), true);
    const label = this.fit(this.text(-20, 0, sw ? 'ANZA PAMBANO' : 'START THE FIGHT', 28, '#0a0b0c', true).setOrigin(0.5), 340);
    const chevrons = this.add.graphics();
    [166, 181].forEach(x => chevrons.fillStyle(INK).fillPoints([
      new Phaser.Geom.Point(x, -13), new Phaser.Geom.Point(x + 7, -13), new Phaser.Geom.Point(x + 19, 0),
      new Phaser.Geom.Point(x + 7, 13), new Phaser.Geom.Point(x, 13), new Phaser.Geom.Point(x + 12, 0),
    ], true));
    button.add([bg, label, chevrons]).setSize(448, 70).setInteractive({ useHandCursor: true });
    button.on('pointerover', () => { this.playHoverSound(); this.tweens.add({ targets: button, scale: 1.025, duration: 90 }); });
    button.on('pointerout', () => this.tweens.add({ targets: button, scale: 1, duration: 80 }));
    button.on('pointerdown', () => this.startLevel());
  }

  private startLevel() {
    if (this.starting) return;
    this.starting = true;
    if (isSoundEnabled() && !this.sound.locked && this.cache.audio.exists('select')) this.sound.play('select', { volume: 0.8 });
    this.scene.start('LevelScene', { ...this.startData, levelId: this.startData.levelId ?? 1 });
  }

  private playHoverSound() {
    if (!isSoundEnabled() || this.sound.locked || !this.cache.audio.exists('ui-hover') || this.time.now - this.lastHoverAt < 90) return;
    this.lastHoverAt = this.time.now;
    this.sound.play('ui-hover', { volume: 0.3 });
  }
}
