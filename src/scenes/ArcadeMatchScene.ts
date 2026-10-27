import Phaser from 'phaser';
import { ARCADE_FIGHTERS, type ArcadeFighterId } from '../config/ArcadeFighters';
import { formatKeyName, getControlKeys, type ControlAction } from '../config/Controls';
import { startStreamingMusic } from '../systems/StreamingMusic';
import { TouchControls } from '../ui/TouchControls';

type MatchData = { fighters?: ArcadeFighterId[] };
type Move = 'punch' | 'kick' | 'special';
type Fighter = {
  id: ArcadeFighterId; x: number; jump: number; velocityY: number; facing: 1 | -1;
  health: number; wins: number; stunUntil: number; attackUntil: number; hitAt: number;
  attack: Move | null; attackStartedAt: number; attackResolved: boolean; contactChecked: boolean; nextAttackAt: number;
  blocking: boolean; moving: boolean; duck: number; ducking: boolean; duckUpdatedAt: number; jumpUpdatedAt: number;
  sprite: Phaser.GameObjects.Sprite; shadow: Phaser.GameObjects.Ellipse;
};
type Controls = Record<ControlAction, Phaser.Input.Keyboard.Key>;

const FLOOR_Y = 682;
const ROUND_SECONDS = 90;
const MIN_GAP = 105;
const DUCK_SECONDS = 0.26;
const ACTION_MS: Record<Move, number> = { punch: 440, kick: 560, special: 650 };

export class ArcadeMatchScene extends Phaser.Scene {
  private selected: [ArcadeFighterId, ArcadeFighterId] = ['majembe', 'mbavu'];
  private fighters!: [Fighter, Fighter];
  private controls?: Controls;
  private touchControls?: TouchControls;
  private queuedAttack: Move | null = null;
  private queuedAttackUntil = 0;
  private phase: 'fighting' | 'between' | 'finished' = 'between';
  private clock = ROUND_SECONDS;
  private round = 1;
  private healthFills: Phaser.GameObjects.Rectangle[] = [];
  private scoreTexts: Phaser.GameObjects.Text[] = [];
  private timerText!: Phaser.GameObjects.Text;
  private announcement!: Phaser.GameObjects.Text;
  private bus!: Phaser.GameObjects.Sprite;
  private pedestrians: { sprite: Phaser.GameObjects.Sprite; velocity: number; phase: number }[] = [];
  private aiNextAttackAt = 0;
  private aiGuardUntil = 0;
  private aiDuckAt = 0;
  private aiDuckUntil = 0;
  private aiReactedAttackAt = -1;

  constructor() { super('ArcadeMatchScene'); }

  init(data: MatchData) {
    const chosen = data?.fighters;
    this.selected = chosen?.length === 2 && chosen.every(id => id in ARCADE_FIGHTERS)
      ? [chosen[0], chosen[1]] : ['majembe', 'mbavu'];
  }

  preload() {
    const images = [
      ['arcade-archives', new URL('../assets/optimized/arcade/archives-clean.webp', import.meta.url).href],
      ['arcade-fence', new URL('../assets/optimized/arcade/archives-fence.webp', import.meta.url).href],
    ];
    for (const [key, url] of images) if (!this.textures.exists(key)) this.load.image(key, url);
    for (const id of this.selected) if (!this.textures.exists(`arcade-${id}-walk`)) {
      this.load.spritesheet(`arcade-${id}-walk`, new URL(`../assets/optimized/arcade/${id}-walk-v2.webp`, import.meta.url).href,
        { frameWidth: 480, frameHeight: 448 });
    }
    for (const id of this.selected) if (!this.textures.exists(`arcade-${id}-idle`)) {
      this.load.spritesheet(`arcade-${id}-idle`, new URL(`../assets/optimized/arcade/${id}-idle.webp`, import.meta.url).href,
        { frameWidth: 256, frameHeight: 448 });
    }
    for (const id of this.selected) for (const action of ['punch', 'kick', 'duck'] as const) {
      const key = `arcade-${id}-${action}-sheet`;
      if (!this.textures.exists(key)) this.load.spritesheet(key,
        new URL(`../assets/optimized/arcade/${id}-${action}-sheet.webp`, import.meta.url).href,
        { frameWidth: 480, frameHeight: 448 });
    }
    for (const index of [1, 2, 3, 4] as const) if (!this.textures.exists(`arcade-pedestrian-${index}-walk`)) {
      this.load.spritesheet(`arcade-pedestrian-${index}-walk`,
        new URL(`../assets/optimized/arcade/pedestrian-${index}-walk.webp`, import.meta.url).href,
        { frameWidth: 128, frameHeight: 256 });
    }
    if (!this.textures.exists('arcade-matatu')) this.load.spritesheet('arcade-matatu',
      new URL('../assets/optimized/gameplay/generated/nairobi-matatu-bus-sheet.webp', import.meta.url).href,
      { frameWidth: 512, frameHeight: 224 });
  }

  create() {
    startStreamingMusic('fight-music', new URL('../assets/optimized/audio/fight-music.mp3', import.meta.url).href, 0.26);
    this.clock = ROUND_SECONDS; this.round = 1; this.phase = 'between';
    this.healthFills = []; this.scoreTexts = []; this.pedestrians = [];
    for (const id of this.selected) if (!this.anims.exists(`arcade-${id}-walking`)) this.anims.create({
      key: `arcade-${id}-walking`, frames: this.anims.generateFrameNumbers(`arcade-${id}-walk`, { start: 0, end: 3 }),
      frameRate: 7, repeat: -1,
    });
    for (const id of this.selected) if (!this.anims.exists(`arcade-${id}-guard`)) this.anims.create({
      key: `arcade-${id}-guard`, frames: this.anims.generateFrameNumbers(`arcade-${id}-idle`, { start: 0, end: 3 }),
      frameRate: 3, repeat: -1,
    });
    for (const index of [1, 2, 3, 4] as const) if (!this.anims.exists(`arcade-pedestrian-${index}-shuffling`)) this.anims.create({
      key: `arcade-pedestrian-${index}-shuffling`,
      frames: this.anims.generateFrameNumbers(`arcade-pedestrian-${index}-walk`, { start: 0, end: 3 }),
      frameRate: 5, repeat: -1,
    });
    if (!this.anims.exists('arcade-matatu-rolling')) this.anims.create({
      key: 'arcade-matatu-rolling', frames: this.anims.generateFrameNumbers('arcade-matatu', { start: 0, end: 3 }),
      frameRate: 5, repeat: -1,
    });
    this.drawArena();
    this.createFighters();
    const controlKeys = getControlKeys();
    this.drawHud(controlKeys);
    this.controls = this.input.keyboard?.addKeys(controlKeys) as Controls | undefined;
    if (window.matchMedia('(pointer: coarse)').matches && window.matchMedia('(max-width: 900px)').matches) {
      this.input.addPointer(3);
      this.touchControls = new TouchControls(this);
    }
    const back = () => this.scene.start('ArcadeSelectScene');
    const replay = () => { if (this.phase === 'finished') this.scene.restart({ fighters: this.selected }); };
    this.input.keyboard?.on('keydown-ESC', back);
    this.input.keyboard?.on('keydown-R', replay);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.keyboard?.off('keydown-ESC', back);
      this.input.keyboard?.off('keydown-R', replay);
    });
    this.startRound();
  }

  private drawArena() {
    this.add.image(640, 360, 'arcade-archives').setDisplaySize(1280, 720).setDepth(0);
    this.bus = this.add.sprite(1310, 466, 'arcade-matatu', 0).setDisplaySize(335, 147).setDepth(2);
    this.bus.play('arcade-matatu-rolling');
    for (let i = 0; i < 4; i++) {
      const direction = i % 2 === 0 ? 1 : -1;
      const variant = i + 1;
      const sprite = this.add.sprite(i * 320 + 70, 505, `arcade-pedestrian-${variant}-walk`, i)
        .setOrigin(0.5, 1).setDisplaySize(70, 140).setFlipX(variant === 2).setDepth(3);
      sprite.play(`arcade-pedestrian-${variant}-shuffling`);
      sprite.anims.timeScale = 0.85 + i * 0.09;
      this.pedestrians.push({ sprite, velocity: direction * (20 + i * 4), phase: i * 1.7 });
    }
    // The planter and tree trunk are painted into the clean plate. Only their
    // narrow silhouettes occlude traffic; a wide gap made the bus pop out of
    // view long before it reached the tree.
    const occlusion = this.make.graphics({ x: 0, y: 0 });
    occlusion.fillStyle(0xffffff).fillRect(0, 0, 430, 720)
      .fillRect(660, 0, 230, 720).fillRect(970, 0, 310, 720);
    const mask = occlusion.createGeometryMask();
    this.bus.setMask(mask);
    this.pedestrians.forEach(person => person.sprite.setMask(mask));
    this.add.image(640, 466, 'arcade-fence').setDisplaySize(1280, 136).setDepth(5).setMask(mask);
    this.add.rectangle(640, 718, 1280, 7, 0x120b13, 0.45).setDepth(7);
  }

  private createFighters() {
    const make = (id: ArcadeFighterId, x: number, facing: 1 | -1): Fighter => {
      const shadow = this.add.ellipse(x, FLOOR_Y + 1, 115, 19, 0x090811, 0.42).setDepth(8);
      const sprite = this.add.sprite(x, FLOOR_Y, `arcade-${id}-idle`, 0)
        .setOrigin(0.5, 1).setDisplaySize(id === 'majembe' ? 195 : 218, 344).setDepth(12);
      return { id, x, jump: 0, velocityY: 0, facing, health: 100, wins: 0,
        stunUntil: 0, attackUntil: 0, hitAt: 0, attack: null, attackStartedAt: 0, attackResolved: false,
        contactChecked: false,
        nextAttackAt: 0, blocking: false, moving: false, duck: 0, ducking: false,
        duckUpdatedAt: this.time.now, jumpUpdatedAt: this.time.now, sprite, shadow };
    };
    this.fighters = [make(this.selected[0], 330, 1), make(this.selected[1], 950, -1)];
  }

  private drawHud(keys: ReturnType<typeof getControlKeys>) {
    this.add.rectangle(640, 51, 1280, 102, 0x050811, 0.72).setDepth(20);
    [0, 1].forEach(side => {
      const x = side === 0 ? 39 : 1241;
      const align = side === 0 ? 0 : 1;
      const fighter = ARCADE_FIGHTERS[this.selected[side]];
      this.add.text(x, 18, fighter.name, {
        fontFamily: 'Impact, Arial Black, sans-serif', fontSize: '30px', color: '#ffcc29',
      }).setOrigin(align, 0).setStroke('#090709', 4).setDepth(22);
      const barX = side === 0 ? 40 : 790;
      this.add.rectangle(barX, 72, 450, 20, 0x16191d).setOrigin(0, 0.5).setStrokeStyle(2, 0xffc928).setDepth(21);
      const fill = this.add.rectangle(barX + (side === 1 ? 448 : 2), 72, 446, 16, side === 0 ? 0xaaf52d : 0xf6ad24)
        .setOrigin(side === 1 ? 1 : 0, 0.5).setDepth(22);
      this.healthFills.push(fill);
      this.scoreTexts.push(this.add.text(x, 95, '○ ○', {
        fontFamily: 'Arial Black, sans-serif', fontSize: '22px', color: '#ffd23b',
      }).setOrigin(align, 0).setDepth(22));
    });
    this.add.rectangle(640, 48, 104, 82, 0x05070b, 0.96).setStrokeStyle(3, 0xffc928).setDepth(24);
    this.timerText = this.add.text(640, 46, '90', {
      fontFamily: 'Impact, Arial Black, sans-serif', fontSize: '49px', color: '#fff1cd',
    }).setOrigin(0.5).setDepth(25);
    this.announcement = this.add.text(640, 238, '', {
      fontFamily: 'Impact, Arial Black, sans-serif', fontSize: '60px', color: '#ffc928',
    }).setOrigin(0.5).setStroke('#10080b', 8).setDepth(30);
    this.add.text(20, 693,
      `YOU  ${formatKeyName(keys.left)} / ${formatKeyName(keys.right)} MOVE • ${formatKeyName(keys.jump)} JUMP • ${formatKeyName(keys.down)} DUCK • ${formatKeyName(keys.punch)} PUNCH • ${formatKeyName(keys.kick)} KICK • ${formatKeyName(keys.special)} SPECIAL`, {
      fontFamily: 'Arial Black, sans-serif', fontSize: '11px', color: '#ffe6b5',
    }).setDepth(23).setStroke('#10080b', 3);
    this.add.text(1260, 693, 'CPU OPPONENT', {
      fontFamily: 'Arial Black, sans-serif', fontSize: '11px', color: '#ffe6b5',
    }).setOrigin(1, 0).setDepth(23).setStroke('#10080b', 3);
  }

  private startRound() {
    this.phase = 'between'; this.clock = ROUND_SECONDS;
    this.queuedAttack = null; this.queuedAttackUntil = 0;
    this.fighters.forEach((fighter, index) => {
      fighter.x = index === 0 ? 330 : 950; fighter.jump = 0; fighter.velocityY = 0;
      fighter.health = 100; fighter.stunUntil = 0; fighter.attackUntil = 0;
      fighter.nextAttackAt = 0; fighter.attack = null; fighter.attackResolved = false;
      fighter.contactChecked = false; fighter.blocking = false; fighter.moving = false;
      fighter.duck = 0; fighter.ducking = false;
      fighter.duckUpdatedAt = this.time.now; fighter.jumpUpdatedAt = this.time.now;
      fighter.sprite.clearTint().setAlpha(1).setAngle(0).setVisible(true);
      fighter.shadow.setVisible(true);
    });
    this.aiNextAttackAt = 0; this.aiGuardUntil = 0; this.aiDuckAt = 0;
    this.aiDuckUntil = 0; this.aiReactedAttackAt = -1;
    this.announcement.setText(`ROUND ${this.round}`).setVisible(true).setScale(0.65);
    this.tweens.add({ targets: this.announcement, scale: 1, duration: 280, ease: 'Back.Out' });
    this.time.delayedCall(1250, () => {
      if (!this.scene.isActive()) return;
      this.announcement.setText('FIGHT!');
      this.phase = 'fighting';
      this.time.delayedCall(650, () => this.announcement.setVisible(false));
    });
    this.refreshHud();
  }

  update(time: number, delta: number) {
    // Movement stays bounded after a stall. Defensive poses use the actual
    // scene clock because Phaser can smooth delta to one nominal frame.
    const seconds = Math.min(delta, 100) / 1000;
    this.animateBackground(time, seconds);
    if (!this.controls || !this.fighters) return;
    if (this.phase === 'fighting') {
      this.clock = Math.max(0, this.clock - seconds);
      this.fighters.forEach(fighter => {
        if (fighter.attack && fighter.attackResolved && time >= fighter.attackUntil) fighter.attack = null;
      });
      this.controlPlayer(seconds, time);
      this.controlAi(seconds, time);
      this.separateFighters();
      this.resolveAttack(0, time);
      this.resolveAttack(1, time);
      if (this.clock === 0) this.finishRound(this.fighters[0].health === this.fighters[1].health
        ? null : this.fighters[0].health > this.fighters[1].health ? 0 : 1);
    }
    this.fighters.forEach(fighter => this.drawFighter(fighter, time));
    this.refreshHud();
    this.touchControls?.postUpdate();
  }

  private animateBackground(time: number, seconds: number) {
    this.bus.x -= 76 * seconds;
    if (this.bus.x < -220) this.bus.x = 1450;
    this.bus.y = 466 + Math.sin(time / 160) * 1.6;
    for (const person of this.pedestrians) {
      person.sprite.x += person.velocity * seconds;
      if (person.velocity > 0 && person.sprite.x > 1330) person.sprite.x = -50;
      if (person.velocity < 0 && person.sprite.x < -50) person.sprite.x = 1330;
      person.sprite.y = 505 + Math.sin(time / 170 + person.phase) * 2;
    }
  }

  private controlPlayer(seconds: number, time: number) {
    const fighter = this.fighters[0];
    const controls = this.controls!;
    const touch = this.touchControls?.intent;
    // Capture attacks before recovery and stun checks, as Story mode does.
    const requestedAttack = Phaser.Input.Keyboard.JustDown(controls.punch) || touch?.punch ? 'punch'
      : Phaser.Input.Keyboard.JustDown(controls.kick) || touch?.kick ? 'kick'
        : Phaser.Input.Keyboard.JustDown(controls.special) || touch?.special ? 'special' : null;
    if (requestedAttack) {
      this.queuedAttack = requestedAttack;
      this.queuedAttackUntil = time + 350;
    }
    if (time > this.queuedAttackUntil) this.queuedAttack = null;
    const stunned = time < fighter.stunUntil;
    const attacking = time < fighter.attackUntil || (fighter.attack !== null && !fighter.attackResolved);
    fighter.moving = false;
    fighter.ducking = !stunned && !attacking && fighter.jump === 0
      && (controls.down.isDown || (touch?.axisY ?? 0) > 0.2);
    this.updateDuck(fighter, time);
    fighter.blocking = false;
    if (!stunned && !attacking && !fighter.ducking && fighter.duck < 0.1) {
      const direction = Number(controls.right.isDown || (touch?.axisX ?? 0) > 0.2)
        - Number(controls.left.isDown || (touch?.axisX ?? 0) < -0.2);
      const previousX = fighter.x;
      fighter.x = Phaser.Math.Clamp(fighter.x + direction * (ARCADE_FIGHTERS[fighter.id].speed * 48) * seconds, 105, 1175);
      fighter.moving = fighter.x !== previousX;
      if ((Phaser.Input.Keyboard.JustDown(controls.jump) || touch?.jump)
        && fighter.jump === 0) { fighter.velocityY = 660; fighter.jumpUpdatedAt = time; }
      if (this.queuedAttack && this.beginAttack(fighter, this.queuedAttack, time)) {
        this.queuedAttack = null;
      }
    }
    this.updateJump(fighter, time);
  }

  private controlAi(seconds: number, time: number) {
    const fighter = this.fighters[1];
    const player = this.fighters[0];
    const stunned = time < fighter.stunUntil;
    const attacking = time < fighter.attackUntil || (fighter.attack !== null && !fighter.attackResolved);
    const distance = Math.abs(player.x - fighter.x);
    fighter.moving = false;
    // React to the visible windup once per kick; the delay leaves time for a
    // player to land a well-spaced attack instead of facing a perfect CPU.
    if (player.attack === 'kick' && player.attackStartedAt !== this.aiReactedAttackAt
      && distance < 205 && time < player.hitAt) {
      this.aiReactedAttackAt = player.attackStartedAt;
      if (Math.random() < 0.3) {
        this.aiDuckAt = time + 25;
        this.aiDuckUntil = Math.max(time + 610, player.attackUntil + 90);
        this.aiNextAttackAt = this.aiDuckUntil + 160;
      }
    }
    fighter.ducking = !stunned && !attacking && fighter.jump === 0
      && time >= this.aiDuckAt && time < this.aiDuckUntil;
    this.updateDuck(fighter, time);
    fighter.blocking = !stunned && !attacking && !fighter.ducking && fighter.duck < 0.1
      && fighter.jump === 0 && time < this.aiGuardUntil;
    if (!stunned && !attacking && !fighter.blocking && !fighter.ducking && fighter.duck < 0.1) {
      // Keep a useful fighting distance. Decisions happen on a cooldown so
      // the CPU can be read and countered rather than reacting every frame.
      const direction = distance > 140 ? Math.sign(player.x - fighter.x)
        : distance < 98 ? -Math.sign(player.x - fighter.x) : 0;
      const previousX = fighter.x;
      fighter.x = Phaser.Math.Clamp(fighter.x + direction * ARCADE_FIGHTERS[fighter.id].speed * 39 * seconds,
        105, 1175);
      fighter.moving = fighter.x !== previousX;
      if (player.attack === 'punch' && distance < 170 && time >= this.aiNextAttackAt && Math.random() < 0.3) {
        this.aiGuardUntil = time + 400;
        this.aiNextAttackAt = time + 700;
      } else if (distance < 165 && time >= this.aiNextAttackAt && player.health > 0) {
        this.beginAttack(fighter, distance < 130 ? 'punch' : 'kick', time);
        this.aiNextAttackAt = time + 850 + Math.random() * 450;
        fighter.moving = false;
      }
    }
    this.updateJump(fighter, time);
  }

  private updateJump(fighter: Fighter, time: number) {
    const seconds = Phaser.Math.Clamp((time - fighter.jumpUpdatedAt) / 1000, 0, 1.2);
    fighter.jumpUpdatedAt = time;
    if (seconds === 0) return;
    if (fighter.jump > 0 || fighter.velocityY > 0) {
      fighter.jump = Math.max(0, fighter.jump + fighter.velocityY * seconds - 825 * seconds * seconds);
      fighter.velocityY -= 1650 * seconds;
      if (fighter.jump === 0) fighter.velocityY = 0;
    }
  }

  private updateDuck(fighter: Fighter, time: number) {
    const seconds = Phaser.Math.Clamp((time - fighter.duckUpdatedAt) / 1000, 0, 0.5);
    fighter.duckUpdatedAt = time;
    fighter.duck = Phaser.Math.Clamp(fighter.duck + (fighter.ducking ? 1 : -1) * seconds / DUCK_SECONDS, 0, 1);
  }

  private beginAttack(fighter: Fighter, move: Move, time: number) {
    if (time < fighter.nextAttackAt || (fighter.attack !== null && !fighter.attackResolved)
      || fighter.jump > 100 || fighter.duck > 0.1) return false;
    fighter.attack = move; fighter.attackResolved = false; fighter.contactChecked = false;
    fighter.attackStartedAt = time;
    fighter.hitAt = time + (move === 'kick' ? 330 : ACTION_MS[move] / 2);
    fighter.attackUntil = time + ACTION_MS[move];
    fighter.nextAttackAt = fighter.attackUntil + (move === 'special' ? 250 : 80);
    return true;
  }

  private separateFighters() {
    const [player, cpu] = this.fighters;
    const gap = cpu.x - player.x;
    if (Math.abs(gap) < MIN_GAP) {
      const correction = (MIN_GAP - Math.abs(gap)) / 2;
      const side = gap < 0 ? -1 : 1;
      player.x = Phaser.Math.Clamp(player.x - side * correction, 105, 1175);
      cpu.x = Phaser.Math.Clamp(cpu.x + side * correction, 105, 1175);
    }
    player.facing = player.x <= cpu.x ? 1 : -1;
    cpu.facing = cpu.x >= player.x ? -1 : 1;
  }

  private resolveAttack(index: number, time: number) {
    const attacker = this.fighters[index];
    if (!attacker.attack || attacker.attackResolved || time < attacker.hitAt) return;
    const target = this.fighters[1 - index];
    // The contact pose persists for more than one frame. Keep its hitbox
    // active until that pose ends so a near miss can connect as fighters move.
    const activeUntil = attacker.hitAt + (attacker.attack === 'kick' ? 90 : 110);
    // A slow frame may jump over the entire contact window. Still give that
    // attack one collision check before declaring it a miss.
    if (time > activeUntil && attacker.contactChecked) { attacker.attackResolved = true; return; }
    attacker.contactChecked = true;
    const range = attacker.attack === 'punch' ? 165 : attacker.attack === 'kick' ? 175 : 185;
    if (Math.abs(attacker.x - target.x) > range || target.jump > 145) return;
    // The kick contacts the upper body. The player and CPU share this rule.
    if (attacker.attack === 'kick' && target.duck >= 0.7) return;
    const facingTarget = Math.sign(target.x - attacker.x) === attacker.facing;
    if (!facingTarget) return;
    attacker.attackResolved = true;
    const guarded = target.blocking && target.facing === -attacker.facing;
    const damage = guarded ? 2 : (attacker.attack === 'punch' ? 10 : attacker.attack === 'kick' ? 15 : 22)
      + ARCADE_FIGHTERS[attacker.id].power - 4;
    target.health = Math.max(0, target.health - damage);
    target.x = Phaser.Math.Clamp(target.x + attacker.facing * (guarded ? 13 : 31), 105, 1175);
    if (!guarded) {
      target.stunUntil = time + 250;
      target.attack = null; target.attackUntil = 0; target.ducking = false;
      target.sprite.setTint(0xff7777);
      this.time.delayedCall(130, () => target.sprite.clearTint());
    }
    this.cameras.main.shake(guarded ? 45 : 95, guarded ? 0.001 : 0.003);
    const spark = this.add.circle(target.x - attacker.facing * 28, FLOOR_Y - 225 - target.jump, guarded ? 12 : 19, guarded ? 0x91d7ff : 0xffc928, 0.86).setDepth(18);
    this.tweens.add({ targets: spark, scale: 2.4, alpha: 0, duration: 190, onComplete: () => spark.destroy() });
    if (target.health === 0) this.finishRound(index);
  }

  private drawFighter(fighter: Fighter, time: number) {
    const attacking = time < fighter.attackUntil && fighter.attack;
    const actionProgress = attacking ? Phaser.Math.Clamp((time - fighter.attackStartedAt) / ACTION_MS[attacking], 0, 0.999) : 0;
    const actionFrame = Math.floor(actionProgress * 4);
    const lunge = attacking ? Math.sin(actionProgress * Math.PI) * (attacking === 'punch' ? 13 : attacking === 'kick' ? 19 : 25) : 0;
    const ducking = !attacking && fighter.duck > 0;
    const walking = !attacking && !ducking && fighter.moving && !fighter.blocking && fighter.jump === 0
      && time >= fighter.stunUntil && this.phase === 'fighting';
    if (attacking || ducking) {
      if (fighter.sprite.anims.isPlaying) fighter.sprite.anims.stop();
      const texture = `arcade-${fighter.id}-${attacking === 'special' ? 'punch' : attacking || 'duck'}-sheet`;
      const frame = attacking ? actionFrame : Math.min(3, Math.floor(fighter.duck * 3.99));
      if (fighter.sprite.texture.key !== texture || fighter.sprite.frame.name !== String(frame)) {
        fighter.sprite.setTexture(texture, frame);
      }
      // Every action strip has one canvas scale and a shared feet baseline.
      fighter.sprite.setDisplaySize(407, 380);
    } else {
      const animation = `arcade-${fighter.id}-${walking ? 'walking' : 'guard'}`;
      if (fighter.sprite.anims.currentAnim?.key !== animation || !fighter.sprite.anims.isPlaying) fighter.sprite.play(animation);
      fighter.sprite.setDisplaySize(walking ? 407 : fighter.id === 'majembe' ? 195 : 218,
        walking ? 380 : 440);
    }
    const breathing = !walking && !attacking && !ducking && fighter.jump === 0
      ? Math.sin((time + (fighter.id === 'mbavu' ? 510 : 0)) / 310) : 0;
    fighter.sprite.setPosition(fighter.x + fighter.facing * lunge + breathing * 1.4,
      FLOOR_Y - fighter.jump - breathing * 1.5)
      .setFlipX(fighter.facing !== (fighter.id === 'majembe' ? 1 : -1))
      .setAngle(time < fighter.stunUntil ? fighter.facing * -7 : fighter.blocking ? fighter.facing * 1.5 : 0);
    fighter.shadow.setPosition(fighter.x, FLOOR_Y + 1)
      .setScale(Math.max(0.64, 1 - fighter.jump / 520) + breathing * 0.012);
  }

  private finishRound(winner: number | null) {
    if (this.phase !== 'fighting') return;
    this.phase = 'between';
    if (winner !== null) this.fighters[winner].wins++;
    this.announcement.setText(winner === null ? 'DRAW' : `${ARCADE_FIGHTERS[this.fighters[winner].id].name} WINS`)
      .setVisible(true).setScale(1);
    this.refreshHud();
    if (winner !== null && this.fighters[winner].wins === 2) {
      this.phase = 'finished';
      this.showResult();
    } else {
      this.time.delayedCall(2200, () => { if (this.scene.isActive()) { this.round++; this.startRound(); } });
    }
  }

  private showResult() {
    this.add.rectangle(640, 504, 630, 150, 0x070a10, 0.9).setStrokeStyle(2, 0xffc928).setDepth(29);
    const button = (x: number, label: string, action: () => void) => {
      this.add.text(x, 503, label, {
        fontFamily: 'Impact, Arial Black, sans-serif', fontSize: '25px', color: '#101014',
        backgroundColor: '#ffc928', padding: { x: 23, y: 12 },
      }).setOrigin(0.5).setDepth(31).setInteractive({ useHandCursor: true }).on('pointerdown', action);
    };
    button(465, 'REMATCH  R', () => this.scene.restart({ fighters: this.selected }));
    button(815, 'SELECT FIGHTERS', () => this.scene.start('ArcadeSelectScene'));
  }

  private refreshHud() {
    if (!this.fighters) return;
    this.fighters.forEach((fighter, index) => {
      this.healthFills[index].width = 446 * fighter.health / 100;
      this.scoreTexts[index].setText(`${fighter.wins > 0 ? '●' : '○'} ${fighter.wins > 1 ? '●' : '○'}`);
    });
    this.timerText.setText(String(Math.ceil(this.clock)).padStart(2, '0'));
  }
}
