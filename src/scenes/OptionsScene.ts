import Phaser from 'phaser';
import { startStreamingMusic } from '../systems/StreamingMusic';
import { CONTROL_ACTIONS, CONTROL_LABELS, ControlAction, formatKeyName, getControlKeys, normalizeKeyName, resetControlKeys, setControlKey } from '../config/Controls';
import { cycleDifficulty, getDifficultySettings, getStoryLanguage, isSoundEnabled, toggleSoundEnabled, toggleStoryLanguage } from '../config/GameSettings';

type Setting = 'difficulty' | 'sound' | 'language' | 'screen';
type Icon = Setting | ControlAction | 'reset';
type OptionRow = {
  container: Phaser.GameObjects.Container;
  value: Phaser.GameObjects.Text;
  plate: Phaser.GameObjects.Graphics;
  center: number;
  width: number;
  setting?: Setting;
  action?: ControlAction;
};
const GOLD = 0xffc51d;
const RED = 0xaf1f19;
const INK = 0x080a0c;

export class OptionsScene extends Phaser.Scene {
  private rows: OptionRow[] = [];
  private waitingForKey?: ControlAction;
  private captureText?: Phaser.GameObjects.Text;
  private statusTimer?: Phaser.Time.TimerEvent;
  private lastHoverAt = -1000;
  private leaving = false;

  constructor() { super('OptionsScene'); }

  preload() {
    if (!this.textures.exists('options-reference-background')) {
      this.load.image('options-reference-background', new URL('../assets/optimized/menu/options-background.webp', import.meta.url).href);
    }
  }

  create() {
    this.rows = [];
    this.waitingForKey = undefined;
    this.leaving = false;
    this.sound.mute = !isSoundEnabled();
    this.startMenuMusic();
    this.add.image(640, 360, 'options-reference-background').setDisplaySize(1280, 720).setDepth(-20);
    this.add.rectangle(640, 360, 1280, 720, 0x080409, 0.13).setDepth(-19);
    this.createTitle();
    this.createSystemRows();
    this.createControlRows();
    this.createFooterActions();
    this.refreshRows();
    this.captureText = this.text(640, 705, '', 13).setOrigin(0.5).setDepth(50).setName('options-status').setStroke('#000000', 3);

    const refreshScreenMode = () => this.refreshRows();
    const fullscreenFailed = () => this.showStatus('FULL SCREEN UNAVAILABLE IN THIS BROWSER');
    this.scale.on(Phaser.Scale.Events.ENTER_FULLSCREEN, refreshScreenMode);
    this.scale.on(Phaser.Scale.Events.LEAVE_FULLSCREEN, refreshScreenMode);
    this.scale.on(Phaser.Scale.Events.FULLSCREEN_FAILED, fullscreenFailed);
    this.scale.on(Phaser.Scale.Events.FULLSCREEN_UNSUPPORTED, fullscreenFailed);
    this.input.keyboard?.on('keydown', this.handleKeyDown, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.keyboard?.off('keydown', this.handleKeyDown, this);
      this.scale.off(Phaser.Scale.Events.ENTER_FULLSCREEN, refreshScreenMode);
      this.scale.off(Phaser.Scale.Events.LEAVE_FULLSCREEN, refreshScreenMode);
      this.scale.off(Phaser.Scale.Events.FULLSCREEN_FAILED, fullscreenFailed);
      this.scale.off(Phaser.Scale.Events.FULLSCREEN_UNSUPPORTED, fullscreenFailed);
      this.statusTimer?.remove(false);
      this.statusTimer = undefined;
    });
  }

  private text(x: number, y: number, label: string, size: number, color = '#f2f0e8', italic = false) {
    return this.add.text(x, y, label, {
      fontFamily: 'Impact, Arial Black, Arial, sans-serif', fontSize: `${size}px`, color,
      fontStyle: italic ? 'italic' : 'normal',
      padding: { left: 2, right: italic ? Math.ceil(size * 0.25) : 2, top: 2, bottom: 3 },
    });
  }

  private fit(text: Phaser.GameObjects.Text, maxWidth: number) {
    text.setScale(Math.min(1, maxWidth / Math.max(text.width, 1)), 1);
    return text;
  }

  private bevel(x: number, y: number, width: number, height: number, corner = 9) {
    return [
      new Phaser.Geom.Point(x + corner, y), new Phaser.Geom.Point(x + width - corner, y),
      new Phaser.Geom.Point(x + width, y + corner), new Phaser.Geom.Point(x + width, y + height - corner),
      new Phaser.Geom.Point(x + width - corner, y + height), new Phaser.Geom.Point(x + corner, y + height),
      new Phaser.Geom.Point(x, y + height - corner), new Phaser.Geom.Point(x, y + corner),
    ];
  }

  private panel(x: number, y: number, width: number, height: number, corner = 16) {
    const g = this.add.graphics().setDepth(5);
    const points = this.bevel(x, y, width, height, corner);
    g.fillStyle(INK, 0.95).lineStyle(2, GOLD, 0.95).fillPoints(points, true).strokePoints(points, true);
    g.lineStyle(1, GOLD, 0.22).strokePoints(this.bevel(x + 5, y + 5, width - 10, height - 10, corner - 2), true);
    for (let i = 0; i < 250; i++) {
      g.fillStyle(i % 2 ? 0x8d8271 : 0x000000, 0.12).fillRect(x + 8 + i * 67 % (width - 16), y + 8 + i * 43 % (height - 16), 1 + i % 3, 1);
    }
    g.lineStyle(3, RED, 0.9).lineBetween(x + 8, y + 26, x + 27, y + 7).lineBetween(x + width - 30, y + height - 7, x + width - 7, y + height - 30);
  }

  private createTitle() {
    const brush = this.add.graphics().setDepth(6);
    brush.fillStyle(0x050506, 0.98).fillPoints([
      new Phaser.Geom.Point(344, 14), new Phaser.Geom.Point(761, 7), new Phaser.Geom.Point(819, 42),
      new Phaser.Geom.Point(799, 98), new Phaser.Geom.Point(341, 118), new Phaser.Geom.Point(315, 70),
    ], true);
    brush.fillStyle(RED).fillPoints([
      new Phaser.Geom.Point(347, 100), new Phaser.Geom.Point(776, 88), new Phaser.Geom.Point(745, 108),
      new Phaser.Geom.Point(460, 121), new Phaser.Geom.Point(321, 116),
    ], true);
    for (let i = 0; i < 65; i++) {
      brush.fillStyle(i % 3 ? 0x050506 : RED, 0.9).fillRect(318 + i * 83 % 505, 6 + i * 37 % 113, 3 + i % 7, 2 + i % 4);
    }
    this.fit(this.text(574, 66, 'OPTIONS', 103, '#ffc51d', true).setOrigin(0.5).setDepth(10).setName('options-title'), 440);
    const crown = this.add.graphics({ x: 801, y: 64 }).setDepth(10).setAngle(-10);
    crown.lineStyle(4, GOLD).strokePoints([
      new Phaser.Geom.Point(-25, 10), new Phaser.Geom.Point(-28, -18), new Phaser.Geom.Point(-10, 0),
      new Phaser.Geom.Point(3, -27), new Phaser.Geom.Point(13, -3), new Phaser.Geom.Point(31, -19), new Phaser.Geom.Point(20, 17),
    ], true).lineBetween(-24, 22, 21, 29);
  }

  private chevron(g: Phaser.GameObjects.Graphics, x: number, y: number, left = false, size = 1) {
    const sign = left ? -1 : 1;
    g.lineStyle(3, GOLD).beginPath().moveTo(x - sign * 4 * size, y - 8 * size)
      .lineTo(x + sign * 3 * size, y).lineTo(x - sign * 4 * size, y + 8 * size).strokePath();
  }

  private icon(kind: Icon, x: number, y: number) {
    const g = this.add.graphics({ x, y });
    g.fillStyle(GOLD).lineStyle(2, GOLD);
    if (kind === 'difficulty') {
      [8, 13, 19, 25].forEach((h, i) => g.fillRect(-12 + i * 7, 11 - h, 5, h));
      g.lineBetween(-15, 14, 16, 14);
    } else if (kind === 'sound') {
      g.fillPoints([[-13, -5], [-7, -5], [1, -12], [1, 12], [-7, 5], [-13, 5]].map(([a, b]) => new Phaser.Geom.Point(a, b)), true);
      g.beginPath().arc(1, 0, 8, -1, 1).strokePath().beginPath().arc(1, 0, 13, -1, 1).strokePath();
    } else if (kind === 'language') {
      g.strokeCircle(0, 0, 13).strokeEllipse(0, 0, 13, 26).lineBetween(-13, 0, 13, 0).strokeEllipse(0, 0, 24, 12);
    } else if (kind === 'screen') {
      g.strokeRect(-14, -11, 28, 19).lineBetween(0, 8, 0, 15).lineBetween(-8, 15, 8, 15);
    } else if (kind === 'special') {
      const points = Array.from({ length: 16 }, (_, i) => new Phaser.Geom.Point(Math.cos(i * Math.PI / 8) * (i % 2 ? 5 : 16), Math.sin(i * Math.PI / 8) * (i % 2 ? 5 : 16)));
      g.fillPoints(points, true).fillStyle(0xfff0ac).fillCircle(0, 0, 3);
    } else if (kind === 'punch') {
      g.fillRoundedRect(-10, -7, 19, 18, 5).fillRoundedRect(6, -1, 8, 9, 3);
      [-9, -4, 1, 6].forEach((a, i) => g.fillRoundedRect(a, -13 + Math.abs(1 - i), 4, 13, 2));
      g.lineStyle(1, INK).lineBetween(-5, -7, -5, 1).lineBetween(0, -8, 0, 0).lineBetween(5, -7, 5, 0);
    } else if (kind === 'reset') {
      g.lineStyle(3, GOLD).beginPath().arc(0, 0, 12, -2.3, 2.6).strokePath();
      g.fillTriangle(-13, -10, -5, -10, -11, -2).fillTriangle(13, 10, 5, 10, 11, 2);
    } else {
      g.fillCircle(-4, -12, 3).lineStyle(3, GOLD).lineBetween(-4, -7, -7, 3);
      if (kind === 'kick') {
        g.lineBetween(-7, 3, 12, -4).lineBetween(12, -4, 19, -7).lineBetween(-7, 3, -13, 15).lineBetween(-4, -5, 6, -8);
      } else if (kind === 'jump') {
        g.lineBetween(-4, -6, -14, -11).lineBetween(-4, -6, 10, -14).lineBetween(-7, 3, -15, 11).lineBetween(-7, 3, 6, 7);
      } else {
        g.lineBetween(-4, -6, 6, -2).lineBetween(6, -2, 10, -5).lineBetween(-7, 3, -13, 15).lineBetween(-7, 3, 2, 10).lineBetween(2, 10, 7, 7);
      }
    }
    return g;
  }

  private createSystemRows() {
    this.panel(296, 124, 688, 225);
    const settings: Array<[Setting, string]> = [['difficulty', 'DIFFICULTY'], ['sound', 'SOUND'], ['language', 'STORY LANGUAGE'], ['screen', 'SCREEN MODE']];
    settings.forEach(([setting, label], i) => {
      const container = this.add.container(640, 161 + i * 50).setDepth(20).setName(`options-setting-${setting}`);
      const frame = this.add.graphics();
      frame.fillStyle(0x151719, 0.85).lineStyle(1, GOLD, 0.6).fillPoints(this.bevel(-302, -21, 604, 43), true).strokePoints(this.bevel(-302, -21, 604, 43), true);
      frame.lineStyle(1, 0x4e4634, 0.7).lineBetween(-240, -20, -240, 21);
      this.chevron(frame, 39, 0, true); this.chevron(frame, 280, 0);
      const text = this.text(-226, 0, label, 18).setOrigin(0, 0.5);
      const plate = this.add.graphics();
      const value = this.text(155, 0, '', 22, '#ffc51d', true).setOrigin(0.5).setName(`options-value-${setting}`);
      container.add([frame, this.icon(setting, -270, 0), text, plate, value]);
      container.setSize(604, 43).setInteractive({ useHandCursor: true });
      container.on('pointerover', () => { this.playHoverSound(); text.setColor('#ffc51d'); });
      container.on('pointerout', () => text.setColor('#f2f0e8'));
      container.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
        this.playSelectSound();
        const local = container.getLocalPoint(pointer.x, pointer.y);
        this.changeSetting(setting, local.x >= 12 && local.x <= 76 ? -1 : 1);
      });
      this.rows.push({ container, value, plate, center: 155, width: 188, setting });
    });
  }

  private changeSetting(setting: Setting, direction: 1 | -1) {
    this.waitingForKey = undefined;
    if (setting === 'difficulty') { cycleDifficulty(direction); this.showStatus('DIFFICULTY UPDATED'); }
    else if (setting === 'sound') {
      const enabled = toggleSoundEnabled();
      this.sound.mute = !enabled;
      if (enabled) this.startMenuMusic();
      this.showStatus(enabled ? 'SOUND ON' : 'SOUND OFF');
    } else if (setting === 'language') {
      this.showStatus(toggleStoryLanguage() === 'sw' ? 'LUGHA: KISWAHILI' : 'LANGUAGE: ENGLISH');
    } else if (this.scale.isFullscreen) this.scale.stopFullscreen();
    else this.scale.startFullscreen();
    this.refreshRows();
  }

  private createControlRows() {
    this.panel(253, 354, 774, 278, 22);
    const paint = this.add.graphics().setDepth(8);
    paint.fillStyle(RED, 0.9).fillPoints([
      new Phaser.Geom.Point(281, 390), new Phaser.Geom.Point(595, 378), new Phaser.Geom.Point(573, 399), new Phaser.Geom.Point(271, 402),
    ], true);
    this.text(283, 379, 'KEYBOARD BUTTONS', 31, '#ffc51d', true).setOrigin(0, 0.5).setDepth(10);
    [279, 649].forEach((x, i) => {
      const g = this.add.graphics().setDepth(9);
      g.fillStyle(0x080a0c, 0.75).lineStyle(1, GOLD, 0.36).fillPoints(this.bevel(x, 407, 355, 210, 12), true).strokePoints(this.bevel(x, 407, 355, 210, 12), true);
      g.fillStyle(RED, 0.95).fillPoints([new Phaser.Geom.Point(x + 12, 408), new Phaser.Geom.Point(x + 268, 408), new Phaser.Geom.Point(x + 238, 430), new Phaser.Geom.Point(x + 7, 435)], true);
      this.text(x + 47, 420, i === 0 ? 'MOVEMENT' : 'COMBAT', 20, '#f2f0e8', true).setOrigin(0, 0.5).setDepth(12);
    });
    CONTROL_ACTIONS.forEach((action, index) => {
      const movement = index < 4;
      const container = this.add.container(movement ? 456 : 826, 455 + index % 4 * 44).setDepth(20).setName(`options-control-${action}`);
      const frame = this.add.graphics().lineStyle(1, GOLD, 0.22).lineBetween(-157, 22, 157, 22);
      const label = this.fit(this.text(-104, 0, CONTROL_LABELS[action].toUpperCase(), 16).setOrigin(0, 0.5), movement ? 112 : 140);
      const plate = this.add.graphics();
      const value = this.text(movement ? 110 : 105, 0, '', 19, '#ffc51d').setOrigin(0.5).setName(`options-value-${action}`);
      container.add([frame, this.icon(action, -148, 0), label, plate, value]);
      if (movement) {
        const key = this.add.graphics().fillStyle(0x1f2225).lineStyle(1.5, GOLD, 0.9);
        key.fillPoints(this.bevel(42, -17, 38, 34, 4), true).strokePoints(this.bevel(42, -17, 38, 34, 4), true);
        const arrow = this.add.graphics({ x: 61, y: 0 }).fillStyle(GOLD).fillPoints([
          new Phaser.Geom.Point(-9, -3), new Phaser.Geom.Point(1, -3), new Phaser.Geom.Point(1, -7),
          new Phaser.Geom.Point(9, 0), new Phaser.Geom.Point(1, 7), new Phaser.Geom.Point(1, 3), new Phaser.Geom.Point(-9, 3),
        ], true).setRotation([Math.PI, 0, -Math.PI / 2, Math.PI / 2][index]);
        container.add([key, arrow]);
      }
      container.setSize(354, 42).setInteractive({ useHandCursor: true });
      container.on('pointerover', () => { this.playHoverSound(); label.setColor('#ffc51d'); });
      container.on('pointerout', () => label.setColor('#f2f0e8'));
      container.on('pointerdown', () => { this.playSelectSound(); this.beginKeyCapture(action); });
      this.rows.push({ container, value, plate, center: movement ? 110 : 105, width: movement ? 60 : action === 'jump' ? 128 : 82, action });
    });
  }

  private createFooterActions() {
    this.createButton(472, 666, 'RESET KEYS', false, () => {
      this.waitingForKey = undefined;
      resetControlKeys(); this.refreshRows(); this.showStatus('KEYS RESET');
    });
    this.createButton(799, 666, 'BACK', true, () => this.goBack());
  }

  private createButton(x: number, y: number, label: string, primary: boolean, onClick: () => void) {
    const button = this.add.container(x, y).setDepth(30).setName(primary ? 'options-back' : 'options-reset');
    const bg = this.add.graphics().fillStyle(primary ? GOLD : INK, 0.98).lineStyle(2, GOLD);
    bg.fillPoints(this.bevel(-151, -25, 302, 50, 12), true).strokePoints(this.bevel(-151, -25, 302, 50, 12), true);
    const caption = this.text(primary ? 0 : 17, 0, label, primary ? 32 : 25, primary ? '#0a0b0d' : '#ffc51d', true).setOrigin(0.5);
    button.add([bg, caption]);
    if (!primary) button.add(this.icon('reset', -112, 0));
    button.setSize(302, 50).setInteractive({ useHandCursor: true });
    button.on('pointerover', () => { this.playHoverSound(); button.setAlpha(0.88); });
    button.on('pointerout', () => button.setAlpha(1));
    button.on('pointerdown', () => { this.playSelectSound(); onClick(); });
  }

  private beginKeyCapture(action: ControlAction) {
    if (this.waitingForKey === action) { this.cancelKeyCapture(); return; }
    this.statusTimer?.remove(false);
    this.waitingForKey = action;
    this.captureText?.setText(`PRESS NEW KEY FOR ${CONTROL_LABELS[action].toUpperCase()}  ·  ESC OR TAP AGAIN TO CANCEL`);
    if (this.captureText) this.fit(this.captureText, 950);
    this.refreshRows();
  }

  private cancelKeyCapture() {
    this.waitingForKey = undefined;
    this.refreshRows();
    this.showStatus('KEY CHANGE CANCELLED');
  }

  private handleKeyDown(event: KeyboardEvent) {
    if (event.repeat) return;
    if (this.waitingForKey) {
      event.preventDefault();
      event.stopPropagation();
      if (event.key === 'Escape') { this.cancelKeyCapture(); return; }
      const action = this.waitingForKey;
      this.waitingForKey = undefined;
      setControlKey(action, normalizeKeyName(event));
      this.refreshRows();
      this.showStatus(`${CONTROL_LABELS[action].toUpperCase()} UPDATED`);
    } else if (event.key === 'Escape') { event.stopPropagation(); this.goBack(); }
  }

  private refreshRows() {
    const keys = getControlKeys();
    const values: Record<Setting, string> = {
      difficulty: getDifficultySettings().label.toUpperCase(), sound: isSoundEnabled() ? 'ON' : 'OFF',
      language: getStoryLanguage() === 'sw' ? 'KISWAHILI' : 'ENGLISH', screen: this.scale.isFullscreen ? 'FULL SCREEN' : 'NORMAL SCREEN',
    };
    this.rows.forEach(row => {
      const capturing = !!row.action && row.action === this.waitingForKey;
      const filled = capturing || row.setting === 'difficulty';
      row.value.setText(row.action ? capturing ? 'PRESS KEY' : formatKeyName(keys[row.action]) : values[row.setting!]);
      row.value.setColor(filled ? '#0a0b0d' : '#ffc51d');
      this.fit(row.value, row.width - 10);
      row.plate.clear().fillStyle(filled ? GOLD : 0x1c1b15, 0.97).lineStyle(capturing ? 2.5 : 1.5, GOLD, 0.95);
      const points = this.bevel(row.center - row.width / 2, -17, row.width, 34, 6);
      row.plate.fillPoints(points, true).strokePoints(points, true);
    });
  }

  private showStatus(message: string) {
    this.statusTimer?.remove(false);
    this.captureText?.setText(message);
    if (this.captureText) this.fit(this.captureText, 950);
    this.statusTimer = this.time.delayedCall(1400, () => { if (!this.waitingForKey) this.captureText?.setText(''); });
  }

  private startMenuMusic() {
    startStreamingMusic('menu-music', new URL('../assets/optimized/audio/menu-music.mp3', import.meta.url).href, 0.24);
  }

  private playHoverSound() {
    if (!isSoundEnabled() || this.sound.locked || !this.cache.audio.exists('ui-hover') || this.time.now - this.lastHoverAt < 90) return;
    this.lastHoverAt = this.time.now;
    this.sound.play('ui-hover', { volume: 0.26 });
  }

  private playSelectSound() {
    if (isSoundEnabled() && !this.sound.locked && this.cache.audio.exists('select')) this.sound.play('select', { volume: 0.85 });
  }

  private goBack() {
    if (this.leaving) return;
    this.leaving = true;
    this.scene.start('MainMenuScene');
  }
}
