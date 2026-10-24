import type { EnemyGoon } from '../entities/EnemyGoon';

/** Match the departure pace to the authored gait instead of sliding every actor at sprint speed. */
export function getEnemyExitMotion(variant: EnemyGoon['visualVariant'], elapsed: number) {
  const dog = variant === 'gameplay-attack-dog';
  const heavy = variant === 'gameplay-goon-heavy';
  const walking = !dog;
  const pace = dog ? 260 : heavy ? 100 : 135;
  const progress = Math.max(0, Math.min(1, (elapsed - 220) / 380));
  const ramp = progress * progress * (3 - 2 * progress);
  return { speed: pace * ramp, timeScale: ramp, walking };
}

export function isEnemyStriking(enemy: EnemyGoon, time: number) {
  if (enemy.state === 'hit' || enemy.state === 'defeat') return false;
  const variant = enemy.visualVariant;
  const duration = variant === 'gameplay-kibera-stone-goon' ? 720
    : variant === 'gameplay-kibera-shield-goon' ? 820
    : variant === 'gameplay-attack-dog' ? 660
    : variant === 'gameplay-goon-club' ? 680 : 520;
  return enemy.lastAttackAt > 0 && time - enemy.lastAttackAt < duration;
}

export function isEnemyWalking(enemy: EnemyGoon, time: number, wasWalking = false) {
  if (enemy.state === 'hit' || enemy.state === 'defeat' || isEnemyStriking(enemy, time)) return false;
  const body = enemy.body as Phaser.Physics.Arcade.Body;
  return Math.hypot(body.velocity.x, body.velocity.y) > (wasWalking ? 4 : 12);
}


export function getEnemyTextureFlip(enemyFlipX: boolean, textureKey: string) {
  // These original portraits face left; all motion sheets face right.
  const facesLeft = textureKey === 'gameplay-goon' || textureKey === 'gameplay-goon-club' || textureKey === 'gameplay-goon-hoodie';
  return facesLeft ? !enemyFlipX : enemyFlipX;
}
