import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/GameConfig';

export type TouchIntent = {
  axisX: number;
  axisY: number;
  jump: boolean;
  punch: boolean;
  kick: boolean;
  special: boolean;
};

export class TouchControls {
  intent: TouchIntent = { axisX: 0, axisY: 0, jump: false, punch: false, kick: false, special: false };
  private knob: Phaser.GameObjects.Arc;
  private stickPointerId: number | null = null;

  constructor(private scene: Phaser.Scene) {
    const baseX = 86;
    const baseY = GAME_HEIGHT - 92;
    scene.add.circle(baseX, baseY, 58, 0x050505, 0.42).setStrokeStyle(3, 0xffffff, 0.2).setScrollFactor(0).setDepth(1186);
    scene.add.circle(baseX, baseY, 42, 0x1f1f1f, 0.66).setStrokeStyle(2, 0xffffff, 0.12).setScrollFactor(0).setDepth(1187);
    this.knob = scene.add.circle(baseX, baseY, 25, 0x303030, 0.92).setStrokeStyle(3, 0xffffff, 0.2).setScrollFactor(0).setDepth(1188);
    this.drawDirections(baseX, baseY);

    scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.x < GAME_WIDTH * 0.28 && pointer.y > GAME_HEIGHT * 0.58) this.stickPointerId = pointer.id;
    });
    scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (pointer.id !== this.stickPointerId) return;
      const dx = Phaser.Math.Clamp(pointer.x - baseX, -44, 44);
      const dy = Phaser.Math.Clamp(pointer.y - baseY, -44, 44);
      this.intent.axisX = dx / 44;
      this.intent.axisY = dy / 44;
      this.knob.setPosition(baseX + dx * 0.72, baseY + dy * 0.72);
    });
    scene.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (pointer.id !== this.stickPointerId) return;
      this.stickPointerId = null;
      this.intent.axisX = 0;
      this.intent.axisY = 0;
      this.knob.setPosition(baseX, baseY);
    });

    this.createButton(GAME_WIDTH - 100, GAME_HEIGHT - 82, 'punch', 'P', 0xd9453d, 100);
    this.createButton(GAME_WIDTH - 202, GAME_HEIGHT - 86, 'kick', 'K', 0xe0a521, 94);
    this.createButton(GAME_WIDTH - 160, GAME_HEIGHT - 178, 'special', 'S', 0x2c9be8, 84);
    this.createButton(GAME_WIDTH - 70, GAME_HEIGHT - 184, 'jump', 'J', 0x8846c7, 84);
  }

  postUpdate() {
    this.intent.jump = false;
    this.intent.punch = false;
    this.intent.kick = false;
    this.intent.special = false;
  }

  private drawDirections(x: number, y: number) {
    const g = this.scene.add.graphics().setScrollFactor(0).setDepth(1189);
    g.fillStyle(0xffffff, 0.5);
    g.fillTriangle(x - 50, y, x - 36, y - 9, x - 36, y + 9);
    g.fillTriangle(x + 50, y, x + 36, y - 9, x + 36, y + 9);
    g.fillTriangle(x, y - 50, x - 9, y - 36, x + 9, y - 36);
    g.fillTriangle(x, y + 50, x - 9, y + 36, x + 9, y + 36);
  }

  private createButton(
    x: number, y: number, key: 'punch' | 'kick' | 'special' | 'jump', label: string, color: number, size: number,
  ) {
    const button = this.scene.add.container(x, y).setScrollFactor(0).setDepth(1188);
    const background = this.scene.add.circle(0, 0, size / 2, 0x070b12, 0.9).setStrokeStyle(4, color, 1);
    const inner = this.scene.add.circle(0, 0, size / 2 - 8, color, 0.82).setStrokeStyle(2, 0xffffff, 0.65);
    const text = this.scene.add.text(0, -4, label, {
      fontFamily: 'Arial Black, Impact, sans-serif', fontSize: `${Math.round(size * 0.42)}px`, color: '#ffffff',
      stroke: '#080b11', strokeThickness: 7,
    }).setOrigin(0.5);
    const caption = this.scene.add.text(0, size * 0.28, key.toUpperCase(), {
      fontFamily: 'Arial Black, sans-serif', fontSize: `${Math.max(10, Math.round(size * 0.12))}px`, color: '#ffffff',
      stroke: '#080b11', strokeThickness: 3,
    }).setOrigin(0.5);
    button.add([background, inner, text, caption]).setSize(size, size).setInteractive({ useHandCursor: true });

    button.on('pointerdown', () => {
      this.intent[key] = true;
      this.scene.tweens.killTweensOf(button);
      button.setScale(1);
      this.scene.tweens.add({
        targets: button,
        scale: 0.88,
        duration: 65,
        yoyo: true,
        ease: 'Sine.Out',
        onComplete: () => button.setScale(1),
      });
    });
  }
}
