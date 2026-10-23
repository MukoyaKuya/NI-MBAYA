import { isEnemyStriking } from './EnemyMotion';
import { EnemyGoon } from '../entities/EnemyGoon';

/** Soft foot-space avoidance. Arcade owns integration; never teleport bodies. */
export function separateEnemyCrowd(enemies: EnemyGoon[], time = 0) {
  for (let i = 0; i < enemies.length; i++) {
    const a = enemies[i];
    if (a.state === 'defeat' || a.state === 'hit' || isEnemyStriking(a, time)) continue;
    let avoidX = 0;
    let avoidY = 0;
    for (let j = 0; j < enemies.length; j++) {
      if (i === j) continue;
      const b = enemies[j];
      if (b.state === 'defeat') continue;
      // Use the feet, not the full visual height, for a 2.5D combat lane.
      const dx = (a.x - b.x) / 74;
      const dy = (a.y - b.y) / 28;
      const distance = Math.hypot(dx, dy);
      if (distance >= 1) continue;
      const strength = (1 - distance) * 75;
      avoidX += distance > 0.001 ? dx / distance * strength : (i < j ? -1 : 1) * strength;
      avoidY += distance > 0.001 ? dy / distance * strength * 0.38 : 0;
    }
    // Cap pressure in dense crowds and keep enemies in the arena's foot lane.
    avoidX = Math.max(-75, Math.min(75, avoidX));
    avoidY = Math.max(-28, Math.min(28, avoidY));
    const body = a.body as Phaser.Physics.Arcade.Body;
    const vx = body.velocity.x + avoidX;
    const vy = body.velocity.y + avoidY;
    a.setVelocity(a.x <= 70 && vx < 0 || a.x >= 1210 && vx > 0 ? 0 : vx,
      a.y <= 470 && vy < 0 || a.y >= 620 && vy > 0 ? 0 : vy);
  }
}
