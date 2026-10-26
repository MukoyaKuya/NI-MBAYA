import Phaser from 'phaser';
import { ARCADE_FIGHTERS, type ArcadeFighterId } from '../config/ArcadeFighters';
import { startStreamingMusic } from '../systems/StreamingMusic';

type MatchData = { fighters?: ArcadeFighterId[] };
type Move = 'punch' | 'kick';
type Fighter = {
  id: ArcadeFighterId; x: number; jump: number; velocityY: number; facing: 1 | -1;
  health: number; wins: number; stunUntil: number; attackUntil: number; hitAt: number;
  attack: Move | null; attackResolved: boolean; nextAttackAt: number; blocking: boolean; moving: boolean;
  sprite: Phaser.GameObjects.Sprite; shadow: Phaser.GameObjects.Ellipse;
};
type Controls = Record<string, Phaser.Input.Keyboard.Key>;

const FLOOR_Y = 682;
const ROUND_SECONDS = 90;
const MIN_GAP = 105;

export class ArcadeMatchScene extends Phaser.Scene {
  private selected: [ArcadeFighterId, ArcadeFighterId] = ['majembe', 'mbavu'];
  private fighters!: [Fighter, Fighter];
  private controls?: Controls;
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
      this.load.spritesheet(`arcade-${id}-walk`, new URL(`../assets/optimized/arcade/${id}-walk.webp`, import.meta.url).href,
        { frameWidth: 256, frameHeight: 448 });
    }
    for (const index of [1, 2, 3, 4] as const) if (!this.textures.exists(`arcade-pedestrian-${index}-walk`)) {
      this.load.spritesheet(`arcade-pedestrian-${index}-walk`,
        new URL(`../assets/optimized/arcade/pedestrian-${index}-walk.webp`, import.meta.url).href,
        { frameWidth: 128, frameHeight: 256 });
    }
    for (const id of this.selected) {
      const fighter = ARCADE_FIGHTERS[id];
      if (!this.textures.exists(fighter.texture)) this.load.image(fighter.texture, fighter.image);
      if (!this.textures.exists(fighter.punchTexture)) this.load.image(fighter.punchTexture, fighter.punchImage);
      if (!this.textures.exists(fighter.kickTexture)) this.load.image(fighter.kickTexture, fighter.kickImage);
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
    this.drawHud();
    this.controls = this.input.keyboard?.addKeys({
      p1Left: 'A', p1Right: 'D', p1Jump: 'W', p1Punch: 'F', p1Kick: 'G', p1Block: 'H',
      arrowLeft: 'LEFT', arrowRight: 'RIGHT', arrowJump: 'UP',
    }) as Controls | undefined;
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
    this.bus = this.add.sprite(-380, 459, 'arcade-matatu', 0).setDisplaySize(335, 147).setDepth(2);
    this.bus.play('arcade-matatu-rolling');
    for (let i = 0; i < 4; i++) {
      const direction = i % 2 === 0 ? 1 : -1;
      const variant = i + 1;
      const sprite = this.add.sprite(i * 320 + 70, 495, `arcade-pedestrian-${variant}-walk`, i)
        .setOrigin(0.5, 1).setDisplaySize(54, 108).setDepth(3);
      sprite.play(`arcade-pedestrian-${variant}-shuffling`);
      this.pedestrians.push({ sprite, velocity: direction * (16 + i * 4), phase: i * 1.7 });
    }
    // The planter and tree are painted into the clean plate. Reveal them by
    // masking their columns out of moving traffic and the foreground fence.
    const occlusion = this.make.graphics({ x: 0, y: 0 });
    occlusion.fillStyle(0xffffff).fillRect(0, 0, 430, 720)
      .fillRect(660, 0, 165, 720).fillRect(965, 0, 315, 720);
    const mask = occlusion.createGeometryMask();
    this.bus.setMask(mask);
    this.pedestrians.forEach(person => person.sprite.setMask(mask));
    this.add.image(640, 466, 'arcade-fence').setDisplaySize(1280, 136).setDepth(5).setMask(mask);
    this.add.rectangle(640, 718, 1280, 7, 0x120b13, 0.45).setDepth(7);
  }

  private createFighters() {
    const make = (id: ArcadeFighterId, x: number, facing: 1 | -1): Fighter => {
      const definition = ARCADE_FIGHTERS[id];
      const shadow = this.add.ellipse(x, FLOOR_Y + 1, 115, 19, 0x090811, 0.42).setDepth(8);
      const sprite = this.add.sprite(x, FLOOR_Y, definition.texture)
        .setOrigin(0.5, 1).setDisplaySize(id === 'majembe' ? 195 : 218, 344).setDepth(12);
      return { id, x, jump: 0, velocityY: 0, facing, health: 100, wins: 0,
        stunUntil: 0, attackUntil: 0, hitAt: 0, attack: null, attackResolved: false,
        nextAttackAt: 0, blocking: false, moving: false, sprite, shadow };
    };
    this.fighters = [make(this.selected[0], 330, 1), make(this.selected[1], 950, -1)];
  }

  private drawHud() {
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
    this.add.text(20, 693, 'YOU  A / D OR ← / → MOVE • W / ↑ JUMP • F PUNCH • G KICK • H BLOCK', {
      fontFamily: 'Arial Black, sans-serif', fontSize: '11px', color: '#ffe6b5',
    }).setDepth(23).setStroke('#10080b', 3);
    this.add.text(1260, 693, 'CPU OPPONENT', {
      fontFamily: 'Arial Black, sans-serif', fontSize: '11px', color: '#ffe6b5',
    }).setOrigin(1, 0).setDepth(23).setStroke('#10080b', 3);
  }

  private startRound() {
    this.phase = 'between'; this.clock = ROUND_SECONDS;
    this.fighters.forEach((fighter, index) => {
      fighter.x = index === 0 ? 330 : 950; fighter.jump = 0; fighter.velocityY = 0;
      fighter.health = 100; fighter.stunUntil = 0; fighter.attackUntil = 0;
      fighter.nextAttackAt = 0; fighter.attack = null; fighter.blocking = false; fighter.moving = false;
      fighter.sprite.clearTint().setAlpha(1).setAngle(0).setVisible(true);
      fighter.shadow.setVisible(true);
    });
    this.aiNextAttackAt = 0; this.aiGuardUntil = 0;
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
    const seconds = Math.min(delta, 50) / 1000;
    this.animateBackground(time, seconds);
    if (!this.controls || !this.fighters) return;
    if (this.phase === 'fighting') {
      this.clock = Math.max(0, this.clock - seconds);
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
  }

  private animateBackground(time: number, seconds: number) {
    this.bus.x += 61 * seconds;
    if (this.bus.x > 1500) this.bus.x = -380;
    this.bus.y = 459 + Math.sin(time / 150) * 2.2;
    for (const person of this.pedestrians) {
      person.sprite.x += person.velocity * seconds;
      if (person.velocity > 0 && person.sprite.x > 1330) person.sprite.x = -50;
      if (person.velocity < 0 && person.sprite.x < -50) person.sprite.x = 1330;
      person.sprite.y = 495 + Math.sin(time / 170 + person.phase) * 2;
    }
  }

  private controlPlayer(seconds: number, time: number) {
    const fighter = this.fighters[0];
    const controls = this.controls!;
    const stunned = time < fighter.stunUntil;
    const attacking = time < fighter.attackUntil;
    fighter.moving = false;
    fighter.blocking = !stunned && !attacking && fighter.jump === 0 && controls.p1Block.isDown;
    if (!stunned && !attacking && !fighter.blocking) {
      const direction = Number(controls.p1Right.isDown || controls.arrowRight.isDown)
        - Number(controls.p1Left.isDown || controls.arrowLeft.isDown);
      fighter.x = Phaser.Math.Clamp(fighter.x + direction * (ARCADE_FIGHTERS[fighter.id].speed * 48) * seconds, 105, 1175);
      fighter.moving = direction !== 0;
      if ((Phaser.Input.Keyboard.JustDown(controls.p1Jump) || Phaser.Input.Keyboard.JustDown(controls.arrowJump))
        && fighter.jump === 0) fighter.velocityY = 660;
      if (Phaser.Input.Keyboard.JustDown(controls.p1Punch)) this.beginAttack(fighter, 'punch', time);
      else if (Phaser.Input.Keyboard.JustDown(controls.p1Kick)) this.beginAttack(fighter, 'kick', time);
    }
    this.updateJump(fighter, seconds);
  }

  private controlAi(seconds: number, time: number) {
    const fighter = this.fighters[1];
    const player = this.fighters[0];
    const stunned = time < fighter.stunUntil;
    const attacking = time < fighter.attackUntil;
    const distance = Math.abs(player.x - fighter.x);
    fighter.moving = false;
    fighter.blocking = !stunned && !attacking && fighter.jump === 0 && time < this.aiGuardUntil;
    if (!stunned && !attacking && !fighter.blocking) {
      // Keep a useful fighting distance. Decisions happen on a cooldown so
      // the CPU can be read and countered rather than reacting every frame.
      const direction = distance > 140 ? Math.sign(player.x - fighter.x)
        : distance < 98 ? -Math.sign(player.x - fighter.x) : 0;
      fighter.x = Phaser.Math.Clamp(fighter.x + direction * ARCADE_FIGHTERS[fighter.id].speed * 39 * seconds,
        105, 1175);
      fighter.moving = direction !== 0;
      if (player.attack && distance < 170 && time >= this.aiNextAttackAt && Math.random() < 0.3) {
        this.aiGuardUntil = time + 400;
        this.aiNextAttackAt = time + 700;
      } else if (distance < 165 && time >= this.aiNextAttackAt && player.health > 0) {
        this.beginAttack(fighter, distance < 130 ? 'punch' : 'kick', time);
        this.aiNextAttackAt = time + 850 + Math.random() * 450;
        fighter.moving = false;
      }
    }
    this.updateJump(fighter, seconds);
  }

  private updateJump(fighter: Fighter, seconds: number) {
    if (fighter.jump > 0 || fighter.velocityY > 0) {
      fighter.jump = Math.max(0, fighter.jump + fighter.velocityY * seconds);
      fighter.velocityY -= 1650 * seconds;
      if (fighter.jump === 0) fighter.velocityY = 0;
    }
  }

  private beginAttack(fighter: Fighter, move: Move, time: number) {
    if (time < fighter.nextAttackAt || fighter.jump > 100) return;
    fighter.attack = move; fighter.attackResolved = false;
    fighter.hitAt = time + (move === 'punch' ? 130 : 190);
    fighter.attackUntil = time + (move === 'punch' ? 330 : 480);
    fighter.nextAttackAt = fighter.attackUntil + 80;
  }

  private separateFighters() {
    const [left, right] = this.fighters;
    const gap = right.x - left.x;
    if (gap < MIN_GAP) {
      const correction = (MIN_GAP - gap) / 2;
      left.x = Phaser.Math.Clamp(left.x - correction, 105, 1175);
      right.x = Phaser.Math.Clamp(right.x + correction, 105, 1175);
    }
    left.facing = left.x <= right.x ? 1 : -1;
    right.facing = right.x >= left.x ? -1 : 1;
  }

  private resolveAttack(index: number, time: number) {
    const attacker = this.fighters[index];
    if (!attacker.attack || attacker.attackResolved || time < attacker.hitAt) return;
    attacker.attackResolved = true;
    const target = this.fighters[1 - index];
    const range = attacker.attack === 'punch' ? 135 : 175;
    if (Math.abs(attacker.x - target.x) > range || target.jump > 145) return;
    const facingTarget = Math.sign(target.x - attacker.x) === attacker.facing;
    if (!facingTarget) return;
    const guarded = target.blocking && target.facing === -attacker.facing;
    const damage = guarded ? 2 : (attacker.attack === 'punch' ? 10 : 15) + ARCADE_FIGHTERS[attacker.id].power - 4;
    target.health = Math.max(0, target.health - damage);
    target.x = Phaser.Math.Clamp(target.x + attacker.facing * (guarded ? 13 : 31), 105, 1175);
    if (!guarded) {
      target.stunUntil = time + 250;
      target.attack = null; target.attackUntil = 0; target.sprite.setTint(0xff7777);
      this.time.delayedCall(130, () => target.sprite.clearTint());
    }
    this.cameras.main.shake(guarded ? 45 : 95, guarded ? 0.001 : 0.003);
    const spark = this.add.circle(target.x - attacker.facing * 28, FLOOR_Y - 225 - target.jump, guarded ? 12 : 19, guarded ? 0x91d7ff : 0xffc928, 0.86).setDepth(18);
    this.tweens.add({ targets: spark, scale: 2.4, alpha: 0, duration: 190, onComplete: () => spark.destroy() });
    if (target.health === 0) this.finishRound(index);
  }

  private drawFighter(fighter: Fighter, time: number) {
    const attacking = time < fighter.attackUntil && fighter.attack;
    const lunge = attacking ? (fighter.attack === 'punch' ? 20 : 31) : 0;
    const definition = ARCADE_FIGHTERS[fighter.id];
    const walking = !attacking && fighter.moving && !fighter.blocking && fighter.jump === 0
      && time >= fighter.stunUntil && this.phase === 'fighting';
    if (walking) {
      const animation = `arcade-${fighter.id}-walking`;
      if (fighter.sprite.anims.currentAnim?.key !== animation || !fighter.sprite.anims.isPlaying) fighter.sprite.play(animation);
    } else {
      if (fighter.sprite.anims.isPlaying) fighter.sprite.anims.stop();
      const texture = attacking ? fighter.attack === 'punch' ? definition.punchTexture : definition.kickTexture : definition.texture;
      if (fighter.sprite.texture.key !== texture) fighter.sprite.setTexture(texture);
    }
    const width = fighter.id === 'majembe'
      ? attacking ? fighter.attack === 'punch' ? 245 : 268 : 195
      : attacking ? fighter.attack === 'punch' ? 255 : 275 : 218;
    fighter.sprite.setPosition(fighter.x + fighter.facing * lunge, FLOOR_Y - fighter.jump)
      .setFlipX(fighter.facing !== (fighter.id === 'majembe' ? 1 : -1))
      .setAngle(attacking ? fighter.facing * -2 : fighter.blocking ? fighter.facing * 3 : 0)
      .setDisplaySize(width, walking ? 440 : 344);
    fighter.shadow.setPosition(fighter.x, FLOOR_Y + 1).setScale(Math.max(0.64, 1 - fighter.jump / 520));
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
