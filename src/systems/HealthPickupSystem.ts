import Phaser from 'phaser';
import { GAME_WIDTH, GROUND_Y } from '../config/GameConfig';
import { Player } from '../entities/Player';
import { EnemyGoon } from '../entities/EnemyGoon';
import { SoundSystem } from './SoundSystem';
import { getCleanChapatiTexture } from './EnemyRunTexture';

export class HealthPickupSystem {
  private chapatiPickup?: Phaser.GameObjects.Sprite;
  private chapatiShadow?: Phaser.GameObjects.Ellipse;
  private chapatiSpawned = false;
  private chapatiLanded = false;

  constructor(
    private scene: Phaser.Scene,
    private player: Player,
    private enemyList: EnemyGoon[],
    private sounds: SoundSystem,
  ) {}

  update() {
    if (this.player.state === 'defeat' || (this.chapatiSpawned && !this.chapatiPickup)) return;

    if (!this.chapatiSpawned) {
      let defeatedCount = 0;
      for (const enemy of this.enemyList) if (enemy.state === 'defeat') defeatedCount++;
      if (defeatedCount >= 3) this.spawnChapatiPickup();
    }

    if (!this.chapatiPickup || !this.chapatiLanded) return;
    const closeEnough = Math.abs(this.player.x - this.chapatiPickup.x) < 64
      && Math.abs(this.player.y - this.chapatiPickup.y) < 92;
    if (!closeEnough) return;

    const healed = Math.min(30, 100 - this.player.health);
    this.player.health = Math.min(100, this.player.health + 30);
    const pickupX = this.chapatiPickup.x;
    const pickupY = this.chapatiPickup.y;
    this.chapatiPickup.destroy();
    this.chapatiShadow?.destroy();
    this.chapatiPickup = undefined;
    this.chapatiShadow = undefined;
    this.scene.cameras.main.flash(150, 255, 196, 46, false);
    this.sounds.playPickup();

    const label = this.scene.add.text(pickupX, pickupY - 58, healed > 0 ? `+${healed} HEALTH` : 'HEALTH FULL', {
      fontFamily: 'Arial Black',
      fontSize: '22px',
      color: '#ffe36a',
      stroke: '#3b1600',
      strokeThickness: 5,
      fontStyle: 'italic',
    }).setOrigin(0.5).setDepth(1200);
    this.scene.tweens.add({
      targets: label,
      y: label.y - 45,
      alpha: 0,
      duration: 850,
      ease: 'Cubic.Out',
      onComplete: () => label.destroy(),
    });
  }

  private spawnChapatiPickup() {
    this.chapatiSpawned = true;
    this.chapatiLanded = false;
    const x = Phaser.Math.Clamp(this.player.x + (this.player.facing > 0 ? 145 : -145), 110, GAME_WIDTH - 110);
    const landingY = GROUND_Y - 38;
    this.chapatiShadow = this.scene.add.ellipse(x, GROUND_Y - 8, 72, 20, 0x000000, 0.32)
      .setDepth(GROUND_Y - 3)
      .setScale(0.25)
      .setAlpha(0.08);
    this.chapatiPickup = this.scene.add.sprite(x, 155, getCleanChapatiTexture(this.scene.textures))
      .setDisplaySize(92, 92)
      .setDepth(GROUND_Y - 1)
      .play('chapati-health-spin', true);

    this.scene.tweens.add({
      targets: this.chapatiPickup,
      y: landingY,
      duration: 1050,
      ease: 'Bounce.Out',
      onUpdate: () => {
        if (!this.chapatiPickup || !this.chapatiShadow) return;
        const progress = Phaser.Math.Clamp((this.chapatiPickup.y - 155) / (landingY - 155), 0, 1);
        this.chapatiShadow.setScale(0.25 + progress * 0.75).setAlpha(0.08 + progress * 0.24);
      },
      onComplete: () => {
        this.chapatiLanded = true;
        if (this.chapatiPickup) {
          this.scene.tweens.add({
            targets: this.chapatiPickup,
            y: landingY - 8,
            duration: 520,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.InOut',
          });
        }
      },
    });
  }

}
