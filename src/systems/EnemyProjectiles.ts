import Phaser from 'phaser';
import type { EnemyGoon } from '../entities/EnemyGoon';
import type { Player } from '../entities/Player';

export function throwEnemyStone(scene: Phaser.Scene, enemy: EnemyGoon, player: Player) {
    const attackAt = enemy.lastAttackAt;
    scene.time.delayedCall(380, () => {
      if (!enemy.active || enemy.state !== 'attack' || enemy.lastAttackAt !== attackAt || player.state === 'defeat') return;

      const startX = enemy.x + (player.x >= enemy.x ? 42 : -42);
      const startY = enemy.y - 54;
      const targetY = player.y - 46;
      const direction = new Phaser.Math.Vector2(player.x - startX, targetY - startY);
      if (direction.lengthSq() === 0) direction.set(1, 0);
      direction.normalize();

      const stone = scene.physics.add.image(startX, startY, 'stone-projectile')
        .setDepth(Math.max(enemy.y, player.y) + 2)
        .setVelocity(direction.x * 470, direction.y * 470)
        .setAngularVelocity(direction.x >= 0 ? 760 : -760);
      stone.setCircle(10);
      (stone.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);

      const overlap = scene.physics.add.overlap(stone, player, () => {
        if (!stone.active || player.state === 'defeat' || Math.abs(player.z - enemy.z) > 40) return;
        player.takeDamage(enemy.attackDamage, 230, enemy.x);
        scene.events.emit('sfx:player-hurt', false);
        scene.cameras.main.shake(75, 0.003);
        if (overlap.active) overlap.destroy();
        stone.destroy();
      });

      scene.time.delayedCall(1450, () => {
        // The impact callback may already have removed this overlap. Phaser's
        // Collider.destroy() is not idempotent and throws when called twice.
        if (overlap.active) overlap.destroy();
        if (stone.active) stone.destroy();
      });
    });
  }
