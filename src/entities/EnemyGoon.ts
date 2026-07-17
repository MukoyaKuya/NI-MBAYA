import Phaser from 'phaser';
import { DifficultySettings } from '../config/GameSettings';
import { Player } from './Player';

export type EnemyState = 'idle' | 'walk' | 'attack' | 'hit' | 'defeat';
export type EnemyVisualVariant =
  | 'gameplay-goon'
  | 'gameplay-goon-club'
  | 'gameplay-goon-hoodie'
  | 'gameplay-goon-chain'
  | 'gameplay-goon-heavy'
  | 'gameplay-kibera-stone-goon'
  | 'gameplay-kibera-shield-goon'
  | 'gameplay-attack-dog';

export class EnemyGoon extends Phaser.Physics.Arcade.Sprite {
  health = 55;
  maxHealth = 55;
  state: EnemyState = 'idle';
  attackDamage = 8;
  attackRange = 86;
  orbitOffset = 160;
  laneOffset = 0;
  moveSpeed = 130;
  visualVariant: EnemyVisualVariant = 'gameplay-goon';
  z = 0;
  defeatedAt = 0;
  lastAttackAt = 0;
  attackStartedAt = 0;
  private canAttackAt = 0;
  private lockedUntil = 0;
  private attackCooldown = 1050;
  private nextDogBarkAt = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'goon-idle');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setCollideWorldBounds(true);
    this.setDrag(1200, 1200);
    this.setMaxVelocity(300, 260);
    this.setSize(66, 78);
    this.setOffset(15, 44);
    (this.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
  }

  configure(offset: number, variant: EnemyVisualVariant, speed: number, difficulty: DifficultySettings, laneOffset = 0) {
    this.orbitOffset = offset;
    this.laneOffset = laneOffset;
    this.visualVariant = variant;
    this.moveSpeed = speed * difficulty.enemySpeedMultiplier;
    const heavy = variant === 'gameplay-goon-heavy';
    const chain = variant === 'gameplay-goon-chain';
    const dog = variant === 'gameplay-attack-dog';
    const stone = variant === 'gameplay-kibera-stone-goon';
    const shield = variant === 'gameplay-kibera-shield-goon';
    this.attackRange = stone ? 430 : dog ? 118 : chain ? 126 : variant === 'gameplay-goon-club' || heavy || shield ? 138 : 88;
    this.attackDamage = Math.round((heavy ? 15 : shield ? 14 : dog ? 11 : stone || chain ? 10 : variant === 'gameplay-goon-club' ? 12 : 8) * difficulty.enemyDamageMultiplier);
    this.attackCooldown = Math.round((stone ? 1650 : shield ? 1480 : heavy ? 1380 : dog ? 900 : chain ? 1080 : variant === 'gameplay-goon-club' ? 1220 : 1020) * difficulty.enemyAttackCooldownMultiplier);
    this.maxHealth = Math.round((shield ? 110 : heavy ? 95 : chain ? 68 : variant === 'gameplay-goon-club' ? 70 : stone ? 52 : dog ? 48 : 55) * difficulty.enemyHealthMultiplier);
    this.health = this.maxHealth;
    // Spread the opening attacks so a newly loaded level cannot stun-lock the player.
    const formationIndex = Phaser.Math.Clamp(Math.round(laneOffset / 18) + 2, 0, 5);
    this.canAttackAt = this.scene.time.now + 550 + formationIndex * 190;
    if (dog) this.nextDogBarkAt = this.scene.time.now + Phaser.Math.Between(350, 1100);
  }

  update(time: number, player: Player, attackSlotAvailable = true) {
    if (this.state === 'defeat') return;
    if (this.health <= 0) {
      this.defeat();
      return;
    }
    if (time < this.lockedUntil) return;

    const dxToPlayer = player.x - this.x;
    const dyToPlayer = player.y - this.y;
    const distanceToPlayer = Math.abs(dxToPlayer);
    const stone = this.visualVariant === 'gameplay-kibera-stone-goon';
    if (this.visualVariant === 'gameplay-attack-dog' && distanceToPlayer <= 540 && time >= this.nextDogBarkAt) {
      this.scene.events.emit('sfx:dog-bark');
      this.nextDogBarkAt = time + Phaser.Math.Between(1900, 3200);
    }
    const side = this.orbitOffset < 0 ? -1 : 1;
    const desiredGap = this.attackRange * (stone ? 0.8 : this.visualVariant === 'gameplay-goon-club' ? 0.86 : 0.78) + Math.min(Math.abs(this.orbitOffset) * 0.06, 28);
    const targetX = Phaser.Math.Clamp(player.x + side * desiredGap, 90, this.scene.scale.width - 90);
    // Formation offsets keep the crowd readable, but offsets larger than the
    // player's 28px hit lane make an enemy permanently unhittable: the enemy
    // keeps mirroring the player's Y position at that fixed distance. Collapse
    // the formation into a reachable combat lane as enemies engage.
    const combatLaneOffset = Phaser.Math.Clamp(this.laneOffset, -20, 20);
    const targetY = Phaser.Math.Clamp(player.y + combatLaneOffset, 470, 620);
    const dxToTarget = targetX - this.x;
    const dyToTarget = targetY - this.y;
    this.setFlipX(player.x < this.x);

    if (stone && distanceToPlayer < 170) {
      const retreatDirection = dxToPlayer >= 0 ? -1 : 1;
      this.setVelocity(retreatDirection * this.moveSpeed, Math.abs(dyToPlayer) > 18 ? Math.sign(dyToPlayer) * this.moveSpeed * 0.32 : 0);
      this.setCombatState('walk');
      return;
    }

    if (distanceToPlayer <= this.attackRange && Math.abs(dyToPlayer) <= 72) {
      this.setVelocity(0, 0);
      this.setCombatState('attack');
      if (attackSlotAvailable && time >= this.canAttackAt) {
        const bat = this.visualVariant === 'gameplay-goon-club';
        this.lastAttackAt = time;
        if (stone) {
          this.scene.events.emit('enemy:stone-throw', this);
        } else {
          player.takeDamage(this.attackDamage, bat ? 360 : 260, this.x);
          this.scene.events.emit('sfx:player-hurt', bat || this.visualVariant === 'gameplay-goon-heavy' || this.visualVariant === 'gameplay-kibera-shield-goon');
        }
        this.canAttackAt = time + this.attackCooldown;
        this.scene.cameras.main.shake(bat ? 115 : 80, bat ? 0.005 : 0.003);
      }
      return;
    }

    const vx = Math.abs(dxToTarget) > 14 ? Math.sign(dxToTarget) * this.moveSpeed : 0;
    const vy = Math.abs(dyToTarget) > 10 ? Math.sign(dyToTarget) * this.moveSpeed * 0.55 : 0;
    this.setVelocity(vx, vy);
    this.setCombatState(vx !== 0 || vy !== 0 ? 'walk' : 'idle');
  }

  takeDamage(damage: number, knockback: number, fromX: number) {
    if (this.state === 'defeat') return;
    if (this.visualVariant === 'gameplay-kibera-shield-goon') {
      damage = Math.max(1, Math.round(damage * 0.5));
      knockback *= 0.55;
    }
    this.health = Math.max(0, this.health - damage);
    const direction = this.x >= fromX ? 1 : -1;
    this.setVelocity(direction * knockback, 0);
    this.lockedUntil = this.scene.time.now + 250;
    this.setCombatState(this.health > 0 ? 'hit' : 'defeat');
    if (this.health <= 0) this.defeat();
  }

  private defeat() {
    if (this.state === 'defeat' && this.defeatedAt > 0) return;
    this.defeatedAt = this.scene.time.now;
    this.setCombatState('defeat');
    this.setTint(0x555555);
    this.setVelocity(0, 0);
    this.disableBody(false, false);
  }

  private setCombatState(state: EnemyState) {
    if (this.state === state) return;
    this.state = state;
    if (state === 'attack') this.attackStartedAt = this.scene.time.now;
    this.setTexture(state === 'hit' ? 'goon-hit' : 'goon-idle');
  }
}



