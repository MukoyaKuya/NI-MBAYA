import Phaser from 'phaser';
import { ATTACK_DATA, AttackKind, getControlKeys } from '../config/Controls';
import { TouchIntent } from '../ui/TouchControls';

export type PlayerState = 'idle' | 'walk' | 'jump' | 'punch' | 'kick' | 'special' | 'hit' | 'defeat';

export class Player extends Phaser.Physics.Arcade.Sprite {
  health = 100;
  chapatis = 0;
  facing: 1 | -1 = 1;
  state: PlayerState = 'idle';
  z = 0;
  vz = 0;
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys: Record<string, Phaser.Input.Keyboard.Key>;
  private canAttackAt = 0;
  private lockedUntil = 0;
  private touchIntent: TouchIntent = { axisX: 0, axisY: 0, jump: false, punch: false, kick: false, special: false };

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'player-idle');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setCollideWorldBounds(true);
    this.setDrag(1450, 1450);
    this.setMaxVelocity(520, 360);
    this.setSize(48, 92);
    this.setOffset(24, 30);
    this.cursors = scene.input.keyboard!.createCursorKeys();
    this.keys = scene.input.keyboard!.addKeys(getControlKeys()) as Record<string, Phaser.Input.Keyboard.Key>;
    (this.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
  }

  setTouchIntent(intent: TouchIntent) {
    this.touchIntent = intent;
  }

  update(time: number, delta: number) {
    this.updateJumpArc(delta);

    if (this.state === 'defeat') {
      this.setVelocity(0, 0);
      return;
    }

    if (this.health <= 0) {
      this.setCombatState('defeat');
      this.setVelocity(0, 0);
      return;
    }

    const onFloor = this.z <= 0;
    if (time < this.lockedUntil) return;

    const left = this.cursors.left.isDown || this.keys.left.isDown || this.touchIntent.axisX < -0.2;
    const right = this.cursors.right.isDown || this.keys.right.isDown || this.touchIntent.axisX > 0.2;
    const up = this.cursors.up.isDown || this.touchIntent.axisY < -0.2;
    const down = this.cursors.down.isDown || this.touchIntent.axisY > 0.2;
    const jumpPressed = Phaser.Input.Keyboard.JustDown(this.keys.jump) || this.touchIntent.jump;

    this.setVelocityX(left ? -360 : right ? 360 : 0);
    this.setVelocityY(up ? -200 : down ? 200 : 0);
    if (left) this.facing = -1;
    if (right) this.facing = 1;

    const minY = 480;
    const maxY = 615;
    if (this.y < minY) {
      this.y = minY;
      if ((this.body as Phaser.Physics.Arcade.Body).velocity.y < 0) this.setVelocityY(0);
    } else if (this.y > maxY) {
      this.y = maxY;
      if ((this.body as Phaser.Physics.Arcade.Body).velocity.y > 0) this.setVelocityY(0);
    }

    if (jumpPressed && onFloor) {
      this.vz = 760;
      this.z = 1;
    }

    this.setFlipX(this.facing < 0);
    const isMoving = left || right || up || down;
    this.setCombatState(onFloor ? (isMoving ? 'walk' : 'idle') : 'jump');
  }

  consumeAttack(time: number): AttackKind | null {
    if (time < this.canAttackAt || time < this.lockedUntil || this.state === 'defeat') return null;
    const attack = this.getAttackInput();
    if (!attack) return null;
    const data = ATTACK_DATA[attack];
    this.canAttackAt = time + data.cooldown;
    this.lockedUntil = time + Math.min(data.cooldown, 360);
    this.setCombatState(attack);
    this.setVelocity(attack === 'punch' ? 125 * this.facing : attack === 'kick' ? 185 * this.facing : 245 * this.facing, 0);
    return attack;
  }

  takeDamage(damage: number, knockback: number, fromX: number) {
    if (this.state === 'defeat') return;
    this.health = Math.max(0, this.health - damage);
    const direction = this.x >= fromX ? 1 : -1;
    this.setVelocity(direction * knockback, 0);
    this.vz = this.health > 0 ? 170 : 260;
    this.z = Math.max(this.z, 1);
    this.lockedUntil = this.scene.time.now + 250;
    this.setCombatState(this.health > 0 ? 'hit' : 'defeat');
  }

  private updateJumpArc(delta: number) {
    if (this.z <= 0 && this.vz <= 0) return;
    const dt = delta / 1000;
    this.z += this.vz * dt;
    this.vz -= 1650 * dt;
    if (this.z <= 0) {
      this.z = 0;
      this.vz = 0;
    }
  }

  private getAttackInput(): AttackKind | null {
    if (Phaser.Input.Keyboard.JustDown(this.keys.punch) || this.touchIntent.punch) return 'punch';
    if (Phaser.Input.Keyboard.JustDown(this.keys.kick) || this.touchIntent.kick) return 'kick';
    if (Phaser.Input.Keyboard.JustDown(this.keys.special) || this.touchIntent.special) return 'special';
    return null;
  }

  private setCombatState(state: PlayerState) {
    if (this.state === state) return;
    this.state = state;
    this.setTexture(`player-${state === 'special' ? 'punch' : state}`);
  }
}
