import Phaser from 'phaser';
import { ATTACK_DATA, AttackKind } from '../config/Controls';
import { EnemyGoon } from '../entities/EnemyGoon';
import { Player } from '../entities/Player';
import { SoundSystem } from './SoundSystem';

export class CombatSystem {
  combo = 0;
  private comboExpiresAt = 0;

  constructor(
    private scene: Phaser.Scene,
    private player: Player,
    private enemies: Phaser.Physics.Arcade.Group,
    private sounds: SoundSystem,
  ) {}

  update(time: number) {
    if (this.combo > 0 && time > this.comboExpiresAt) {
      this.combo = 0;
    }
    const attack = this.player.consumeAttack(time);
    if (attack) {
      this.sounds.playAttack(attack);
      this.spawnPlayerHitbox(attack);
    }
  }

  private spawnPlayerHitbox(kind: AttackKind) {
    const data = ATTACK_DATA[kind];
    // Arcade overlap callbacks run every physics step while bodies intersect.
    // Keep each attack to one hit per enemy for its short active window.
    const hitEnemies = new Set<EnemyGoon>();
    const x = this.player.x + this.player.facing * (44 + data.range / 2);
    const hitbox = this.scene.add.zone(x, this.player.y - 16, data.range, 78);
    this.scene.physics.add.existing(hitbox);

    const body = hitbox.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setImmovable(true);

    this.scene.physics.add.overlap(hitbox, this.enemies, (_zone, target) => {
      const enemy = target as unknown as EnemyGoon;
      if (enemy.state === 'defeat' || hitEnemies.has(enemy)) return;

      // 2.5D depth validation: same Y lane (depth) and matching Z altitude range
      if (Math.abs(this.player.y - enemy.y) > 28) return;
      if (Math.abs(this.player.z - enemy.z) > 40) return;

      hitEnemies.add(enemy);
      enemy.takeDamage(data.damage, data.knockback, this.player.x);
      this.sounds.playImpact(kind, enemy.health <= 0);
      this.combo += 1;
      this.comboExpiresAt = this.scene.time.now + 1500;
      this.createHitSpark(enemy.x, enemy.y - 38 - enemy.z, kind);
      this.scene.cameras.main.shake(kind === 'special' ? 150 : 95, kind === 'special' ? 0.009 : 0.005);
    });

    this.scene.time.delayedCall(90, () => hitbox.destroy());
  }

  private createHitSpark(x: number, y: number, kind: AttackKind) {
    const spark = this.scene.add.image(x, y, 'hit-spark').setDepth(20);
    spark.setScale(kind === 'special' ? 1.3 : 0.85);
    this.scene.tweens.add({
      targets: spark,
      alpha: 0,
      scale: spark.scale + 0.65,
      angle: 35,
      duration: 180,
      onComplete: () => spark.destroy(),
    });
  }
}

