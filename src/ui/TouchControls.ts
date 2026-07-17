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

    this.createButton(GAME_WIDTH - 105, GAME_HEIGHT - 84, 'punch', 0, 104);
    this.createButton(GAME_WIDTH - 205, GAME_HEIGHT - 86, 'kick', 1, 96);
    this.createButton(GAME_WIDTH - 166, GAME_HEIGHT - 176, 'special', 2, 86);
    this.createButton(GAME_WIDTH - 76, GAME_HEIGHT - 190, 'jump', 3, 88);
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

  private createButton(x: number, y: number, key: 'punch' | 'kick' | 'special' | 'jump', frame: number, size: number) {
    const button = this.scene.add.image(x, y, 'touch-action-buttons', frame)
      .setDisplaySize(size, size)
      .setScrollFactor(0)
      .setDepth(1188)
      .setInteractive({ useHandCursor: true });

    button.on('pointerdown', () => {
      this.intent[key] = true;
      this.scene.tweens.killTweensOf(button);
      button.setDisplaySize(size, size);
      this.scene.tweens.add({
        targets: button,
        displayWidth: size * 0.88,
        displayHeight: size * 0.88,
        duration: 65,
        yoyo: true,
        ease: 'Sine.Out',
        onComplete: () => button.setDisplaySize(size, size),
      });
    });
  }
}