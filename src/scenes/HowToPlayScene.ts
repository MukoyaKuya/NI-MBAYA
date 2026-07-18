import Phaser from 'phaser';
import { isSoundEnabled } from '../config/GameSettings';

type LevelStartData = { character?: string; chapatis?: number; health?: number; levelId?: number };

const GAME_WIDTH = 1280;
const GAME_HEIGHT = 720;

export class HowToPlayScene extends Phaser.Scene {
  private startData: LevelStartData = {};
  private lastHoverAt = -1000;

  constructor() { super('HowToPlayScene'); }

  init(data: LevelStartData = {}) { this.startData = data; }

  create() {
    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'nairobi-cbd-background').setDisplaySize(GAME_WIDTH, GAME_HEIGHT).setDepth(-2);
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x020305, 0.78).setDepth(-1);
    this.add.text(GAME_WIDTH / 2, 62, 'HOW TO PLAY', { fontFamily: 'Arial Black, Impact, sans-serif', fontSize: '44px', color: '#ffc51d', stroke: '#050505', strokeThickness: 8, fontStyle: 'italic' }).setOrigin(0.5);
    this.add.text(GAME_WIDTH / 2, 108, 'FIGHT THROUGH NAIROBI AND RESCUE MJAKA MFINE', { fontFamily: 'Arial Black', fontSize: '15px', color: '#ffffff', stroke: '#050505', strokeThickness: 4 }).setOrigin(0.5);

    this.drawPanel(110, 158, 500, 334, 'KEYBOARD', [
      ['MOVE', '← / →'], ['LANE', '↑ / ↓'], ['JUMP', 'SPACE'], ['PUNCH', 'J'], ['KICK', 'K'], ['SPECIAL', 'L'],
    ]);
    this.drawPanel(670, 158, 500, 334, 'MOBILE', [
      ['MOVE + LANE', 'LEFT JOYSTICK'], ['JUMP', 'J BUTTON'], ['PUNCH', 'P BUTTON'], ['KICK', 'K BUTTON'], ['SPECIAL', 'S BUTTON'],
    ]);
    this.add.text(GAME_WIDTH / 2, 534, 'TIP: KEEP GOONS IN YOUR LANE. DEFEAT THREE TO MAKE A HEALTH CHAPATI DROP.', { fontFamily: 'Arial Black', fontSize: '16px', color: '#ffc51d', stroke: '#050505', strokeThickness: 4, align: 'center', wordWrap: { width: 900 } }).setOrigin(0.5);
    this.createStartButton();
    this.input.keyboard?.once('keydown-SPACE', () => this.startLevel());
    this.input.keyboard?.once('keydown-ENTER', () => this.startLevel());
  }

  private drawPanel(x: number, y: number, width: number, height: number, heading: string, rows: string[][]) {
    const panel = this.add.graphics();
    panel.fillStyle(0x07101d, 0.95).lineStyle(3, 0xffc51d, 0.9);
    panel.fillRoundedRect(x, y, width, height, 12).strokeRoundedRect(x, y, width, height, 12);
    this.add.text(x + width / 2, y + 36, heading, { fontFamily: 'Arial Black', fontSize: '22px', color: '#ffc51d', fontStyle: 'italic' }).setOrigin(0.5);
    rows.forEach(([action, control], index) => {
      const rowY = y + 83 + index * 42;
      this.add.text(x + 35, rowY, action, { fontFamily: 'Arial Black', fontSize: '15px', color: '#dce6f4' }).setOrigin(0, 0.5);
      const keyBg = this.add.graphics();
      keyBg.fillStyle(0x172337, 1).lineStyle(1, 0xffffff, 0.34).fillRoundedRect(x + 260, rowY - 16, 205, 32, 5).strokeRoundedRect(x + 260, rowY - 16, 205, 32, 5);
      this.add.text(x + 362, rowY, control, { fontFamily: 'Arial Black', fontSize: '14px', color: '#ffffff' }).setOrigin(0.5);
    });
  }

  private createStartButton() {
    const button = this.add.container(GAME_WIDTH / 2, 642);
    const bg = this.add.graphics();
    bg.fillStyle(0xffc51d).lineStyle(4, 0x050505).fillRoundedRect(-185, -34, 370, 68, 8).strokeRoundedRect(-185, -34, 370, 68, 8);
    const label = this.add.text(0, 0, 'START THE FIGHT', { fontFamily: 'Arial Black', fontSize: '27px', color: '#111111', fontStyle: 'italic' }).setOrigin(0.5);
    button.add([bg, label]).setSize(370, 68).setInteractive({ useHandCursor: true });
    button.on('pointerover', () => {
      this.playHoverSound();
      this.tweens.add({ targets: button, scale: 1.06, duration: 90 });
    });
    button.on('pointerout', () => this.tweens.add({ targets: button, scale: 1, duration: 80 }));
    button.on('pointerdown', () => this.startLevel());
  }

  private startLevel() {
    if (isSoundEnabled() && !this.sound.locked && this.cache.audio.exists('select')) this.sound.play('select', { volume: 0.8 });
    this.scene.start('LevelScene', { ...this.startData, levelId: 1 });
  }

  private playHoverSound() {
    if (!isSoundEnabled() || this.sound.locked || !this.cache.audio.exists('ui-hover') || this.time.now - this.lastHoverAt < 90) return;
    this.lastHoverAt = this.time.now;
    this.sound.play('ui-hover', { volume: 0.3 });
  }
}
