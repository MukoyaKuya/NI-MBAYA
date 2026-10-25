import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/GameConfig';

export class StageRenderer {
  constructor(private scene: Phaser.Scene) {}

  draw(level: { id: number; backgroundKey: string }) {
    this.scene.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, level.backgroundKey)
      .setDisplaySize(GAME_WIDTH, GAME_HEIGHT)
      .setDepth(0);
    this.scene.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.07).setDepth(2);
    if (level.id <= 2) this.createBackgroundTraffic(level.id);
    this.scene.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT - 8, GAME_WIDTH, 16, 0x050505, 0.76).setDepth(79);
  }

  private createBackgroundTraffic(levelId: number) {
    const busSheet = 'nairobi-matatu-bus-sheet';
    const animatedBus = levelId === 1 && this.scene.textures.exists(busSheet);
    const nearMatatu = this.scene.add.sprite(
      animatedBus ? GAME_WIDTH + 220 : -240,
      animatedBus ? 488 : 455,
      animatedBus ? busSheet : this.getMatatuTextureKey(),
      0,
    )
      .setName(levelId === 1 ? 'level1-matatu' : 'level2-matatu')
      .setDisplaySize(animatedBus ? 340 : 335, animatedBus ? 149 : 116)
      .setDepth(5)
      .setAlpha(0.88);

    if (animatedBus) {
      const animationKey = 'nairobi-matatu-bus-drive';
      if (!this.scene.anims.exists(animationKey)) {
        this.scene.anims.create({
          key: animationKey,
          frames: this.scene.anims.generateFrameNumbers(busSheet, { start: 0, end: 8 }),
          frameRate: 6.25,
          repeat: -1,
        });
      }
      nearMatatu.play(animationKey);
    }

    this.scene.tweens.add({
      targets: nearMatatu,
      x: animatedBus ? -220 : GAME_WIDTH + 250,
      duration: 9200,
      delay: 900,
      repeat: -1,
      repeatDelay: 4200,
      ease: animatedBus ? 'Linear' : 'Sine.InOut',
      onRepeat: () => {
        nearMatatu.y = animatedBus ? Phaser.Math.Between(477, 494) : Phaser.Math.Between(438, 462);
        nearMatatu.setAlpha(Phaser.Math.FloatBetween(0.78, 0.92));
      },
    });

    this.scene.tweens.add({
      targets: nearMatatu,
      y: nearMatatu.y - 3,
      duration: 520,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    });

  }

  private getMatatuTextureKey() {
    const sourceKey = 'nairobi-matatu-conductor';
    if (this.scene.textures.exists(sourceKey)) return sourceKey;

    // A cached or interrupted image request must never expose Phaser's green
    // missing-texture marker in the street. Keep a readable matatu on screen
    // until the real artwork is available on the next load.
    const fallbackKey = 'nairobi-matatu-fallback';
    if (!this.scene.textures.exists(fallbackKey)) {
      const art = this.scene.add.graphics();
      art.fillStyle(0x10141b, 0.95).fillRoundedRect(8, 18, 344, 84, 12);
      art.fillStyle(0xe04a25, 1).fillRoundedRect(12, 22, 336, 74, 10);
      art.fillStyle(0xffbf1a, 1).fillRect(18, 76, 324, 18);
      art.fillStyle(0x1ab8ba, 1).fillRoundedRect(28, 34, 222, 28, 4);
      art.fillStyle(0x18222f, 1).fillRoundedRect(264, 30, 62, 56, 6);
      art.lineStyle(3, 0xf4f0d8, 0.9).strokeRoundedRect(12, 22, 336, 74, 10);
      for (let x = 58; x < 244; x += 40) art.lineStyle(2, 0x10141b, 0.8).lineBetween(x, 35, x, 61);
      art.fillStyle(0x090b10, 1).fillCircle(78, 101, 18).fillCircle(290, 101, 18);
      art.fillStyle(0xc8c8c8, 1).fillCircle(78, 101, 7).fillCircle(290, 101, 7);
      art.generateTexture(fallbackKey, 360, 128);
      art.destroy();
    }
    return fallbackKey;
  }

}
