import Phaser from 'phaser';
import { CONTROL_ACTIONS, CONTROL_LABELS, ControlAction, formatKeyName, getControlKeys, normalizeKeyName, resetControlKeys, setControlKey } from '../config/Controls';
import { cycleDifficulty, getDifficultySettings, getStoryLanguage, isSoundEnabled, toggleSoundEnabled, toggleStoryLanguage } from '../config/GameSettings';

const GAME_WIDTH = 1280;
const GAME_HEIGHT = 720;

type OptionRow = {
  container: Phaser.GameObjects.Container;
  label: Phaser.GameObjects.Text;
  value: Phaser.GameObjects.Text;
  action?: ControlAction;
};

export class OptionsScene extends Phaser.Scene {
  private rows: OptionRow[] = [];
  private waitingForKey?: ControlAction;
  private captureText?: Phaser.GameObjects.Text;
  private menuMusic?: Phaser.Sound.BaseSound;

  constructor() {
    super('OptionsScene');
  }

  create() {
    this.sound.mute = !isSoundEnabled();
    this.startMenuMusic();
    this.drawBackground();
    this.createTitle();
    this.createSystemRows();
    this.createControlRows();
    this.createFooterActions();

    this.input.keyboard?.on('keydown-ESC', () => this.goBack());
    this.input.keyboard?.on('keydown', (event: KeyboardEvent) => this.captureKey(event));
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.keyboard?.off('keydown');
      this.menuMusic = undefined;
    });
  }

  private drawBackground() {
    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'menu-v2-background')
      .setDisplaySize(GAME_WIDTH, GAME_HEIGHT)
      .setDepth(-20);
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x020305, 0.7).setDepth(-19);
    const frame = this.add.graphics().setDepth(4);
    frame.lineStyle(4, 0xd8d1c8, 0.85);
    frame.strokeRect(16, 16, GAME_WIDTH - 32, GAME_HEIGHT - 32);
  }

  private createTitle() {
    this.add.text(GAME_WIDTH / 2, 74, 'OPTIONS', {
      fontFamily: 'Arial Black, Impact, sans-serif',
      fontSize: '62px',
      color: '#ffc423',
      stroke: '#050505',
      strokeThickness: 9,
      fontStyle: 'italic',
    }).setOrigin(0.5).setDepth(10);

    this.captureText = this.add.text(GAME_WIDTH / 2, 132, '', {
      fontFamily: 'Arial Black, Impact, sans-serif',
      fontSize: '20px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 5,
    }).setOrigin(0.5).setDepth(10);
  }

  private createSystemRows() {
    this.addOptionRow(205, 'DIFFICULTY', getDifficultySettings().label.toUpperCase(), () => {
      cycleDifficulty();
      this.refreshRows();
      this.showStatus('DIFFICULTY UPDATED');
    });

    this.addOptionRow(275, 'SOUND', isSoundEnabled() ? 'ON' : 'OFF', () => {
      const enabled = toggleSoundEnabled();
      this.sound.mute = !enabled;
      if (enabled) this.startMenuMusic();
      else this.menuMusic?.stop();
      this.refreshRows();
      this.showStatus(enabled ? 'SOUND ON' : 'SOUND OFF');
    });

    this.addOptionRow(345, 'STORY LANGUAGE', getStoryLanguage() === 'sw' ? 'KISWAHILI' : 'ENGLISH', () => {
      const language = toggleStoryLanguage();
      this.refreshRows();
      this.showStatus(language === 'sw' ? 'LUGHA: KISWAHILI' : 'LANGUAGE: ENGLISH');
    });
  }

  private createControlRows() {
    this.add.text(GAME_WIDTH / 2, 410, 'KEYBOARD BUTTONS', {
      fontFamily: 'Arial Black, Impact, sans-serif',
      fontSize: '22px',
      color: '#ffc423',
      stroke: '#050505',
      strokeThickness: 5,
      fontStyle: 'italic',
    }).setOrigin(0.5).setDepth(10);

    const keys = getControlKeys();
    CONTROL_ACTIONS.forEach((action, index) => {
      const column = index < 4 ? 0 : 1;
      const row = index % 4;
      const x = column === 0 ? 390 : 890;
      const y = 462 + row * 48;
      this.addOptionRow(y, CONTROL_LABELS[action].toUpperCase(), formatKeyName(keys[action]), () => this.beginKeyCapture(action), action, x, 420);
    });
  }

  private createFooterActions() {
    this.createButton(433, 674, 250, 44, 'RESET KEYS', () => {
      resetControlKeys();
      this.refreshRows();
      this.showStatus('KEYS RESET');
    });
    this.createButton(740, 674, 250, 44, 'BACK', () => this.goBack());
  }

  private addOptionRow(
    y: number,
    labelText: string,
    valueText: string,
    onClick: () => void,
    action?: ControlAction,
    x = GAME_WIDTH / 2,
    width = 560,
  ) {
    const container = this.add.container(x, y).setDepth(20);
    const bg = this.add.graphics();
    bg.fillStyle(0x07101d, 0.92);
    bg.lineStyle(3, 0xffbd1a, 0.85);
    bg.fillRoundedRect(-width / 2, -26, width, 52, 8);
    bg.strokeRoundedRect(-width / 2, -26, width, 52, 8);
    const label = this.add.text(-width / 2 + 24, 0, labelText, {
      fontFamily: 'Arial Black, Impact, sans-serif',
      fontSize: '18px',
      color: '#ffffff',
      stroke: '#050505',
      strokeThickness: 4,
    }).setOrigin(0, 0.5);
    const value = this.add.text(width / 2 - 24, 0, valueText, {
      fontFamily: 'Arial Black, Impact, sans-serif',
      fontSize: '20px',
      color: '#ffc423',
      stroke: '#050505',
      strokeThickness: 5,
      fontStyle: 'italic',
    }).setOrigin(1, 0.5);

    container.add([bg, label, value]);
    container.setSize(width, 52).setInteractive({ useHandCursor: true });
    container.on('pointerover', () => {
      if (isSoundEnabled() && !this.sound.locked) this.sound.play('ui-hover', { volume: 0.26 });
      this.tweens.add({ targets: container, scale: 1.035, duration: 80 });
    });
    container.on('pointerout', () => this.tweens.add({ targets: container, scale: 1, duration: 80 }));
    container.on('pointerdown', () => {
      this.playSelectSound();
      onClick();
    });
    this.rows.push({ container, label, value, action });
  }

  private createButton(x: number, y: number, width: number, height: number, label: string, onClick: () => void) {
    const button = this.add.container(x, y).setDepth(30);
    const bg = this.add.graphics();
    bg.fillStyle(0xffbd1a, 1);
    bg.lineStyle(4, 0x050505, 1);
    bg.fillRoundedRect(-width / 2, -height / 2, width, height, 8);
    bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 8);
    const text = this.add.text(0, 0, label, {
      fontFamily: 'Arial Black, Impact, sans-serif',
      fontSize: '22px',
      color: '#111111',
      fontStyle: 'italic',
    }).setOrigin(0.5);
    button.add([bg, text]);
    button.setSize(width, height).setInteractive({ useHandCursor: true });
    button.on('pointerover', () => this.tweens.add({ targets: button, scale: 1.06, duration: 90 }));
    button.on('pointerout', () => this.tweens.add({ targets: button, scale: 1, duration: 80 }));
    button.on('pointerdown', () => {
      this.playSelectSound();
      onClick();
    });
  }

  private beginKeyCapture(action: ControlAction) {
    this.waitingForKey = action;
    this.captureText?.setText(`PRESS NEW KEY FOR ${CONTROL_LABELS[action].toUpperCase()}`);
  }

  private captureKey(event: KeyboardEvent) {
    if (!this.waitingForKey) return;
    event.preventDefault();
    const action = this.waitingForKey;
    this.waitingForKey = undefined;
    setControlKey(action, normalizeKeyName(event));
    this.captureText?.setText('');
    this.refreshRows();
    this.showStatus(`${CONTROL_LABELS[action].toUpperCase()} UPDATED`);
  }

  private refreshRows() {
    const keys = getControlKeys();
    this.rows.forEach((row) => {
      if (row.action) row.value.setText(formatKeyName(keys[row.action]));
      else if (row.label.text === 'DIFFICULTY') row.value.setText(getDifficultySettings().label.toUpperCase());
      else if (row.label.text === 'SOUND') row.value.setText(isSoundEnabled() ? 'ON' : 'OFF');
      else if (row.label.text === 'STORY LANGUAGE') row.value.setText(getStoryLanguage() === 'sw' ? 'KISWAHILI' : 'ENGLISH');
    });
  }

  private showStatus(message: string) {
    this.captureText?.setText(message);
    this.time.delayedCall(850, () => {
      if (!this.waitingForKey && this.captureText?.text === message) this.captureText.setText('');
    });
  }

  private startMenuMusic() {
    if (!isSoundEnabled() || !this.cache.audio.exists('menu-music')) return;
    this.menuMusic = this.sound.get('menu-music') ?? this.sound.add('menu-music', { loop: true, volume: 0.24 });
    if (!this.menuMusic.isPlaying) this.menuMusic.play();
  }

  private playSelectSound() {
    if (!isSoundEnabled() || this.sound.locked || !this.cache.audio.exists('select')) return;
    this.sound.play('select', { volume: 0.85 });
  }

  private goBack() {
    this.scene.start('MainMenuScene');
  }
}