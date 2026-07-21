import Phaser from 'phaser';
import { getDifficultySettings, getStoryLanguage } from '../config/GameSettings';
import { loadBattleAnimationAssets, loadCoreGameplayAssets, loadDeferredLevelAssets } from '../config/DeferredLevelAssets';
import { saveJourneyProgress, unlockLocationStory } from '../config/GameProgress';
import { LOCATION_STORIES } from '../config/WorldContent';
import { copyFor, LEVEL_CONTEXT } from '../config/WorldContent';
import { GAME_HEIGHT, GAME_WIDTH, GROUND_Y } from '../config/GameConfig';
import { EnemyGoon, EnemyVisualVariant } from '../entities/EnemyGoon';
import { Player } from '../entities/Player';
import { CombatSystem } from '../systems/CombatSystem';
import { SoundSystem } from '../systems/SoundSystem';
import { HUD, PlayableCharacter } from '../ui/HUD';
import { TouchControls } from '../ui/TouchControls';

type EnemyVisual = {
  enemy: EnemyGoon;
  art: Phaser.GameObjects.Sprite;
  shadow: Phaser.GameObjects.Image;
  baseWidth: number;
  baseHeight: number;
  defeatStarted: boolean;
  victoryDirection: 1 | -1;
  victoryLaneY: number;
  victoryGone: boolean;
  renderedAttackAt: number;
};

type PlayerArtSpec = {
  key: string;
  width: number;
  height: number;
  yOffset: number;
  xOffset: number;
};

type LevelStartData = {
  levelId?: number;
  character?: string;
  chapatis?: number;
  health?: number;
};

type EnemySpawn = {
  x: number;
  offset: number;
  variant: EnemyVisualVariant;
  speed: number;
};

type LevelDefinition = {
  id: number;
  title: string;
  location: string;
  backgroundKey: string;
  reward: number;
  enemies: EnemySpawn[];
};

const PLAYER_ART: Record<string, PlayerArtSpec> = {
  idle: { key: 'gameplay-mbavu-idle', width: 168, height: 252, yOffset: 68, xOffset: 0 },
  walk: { key: 'gameplay-mbavu-run-sheet', width: 190, height: 285, yOffset: 84, xOffset: 4 },
  punch: { key: 'gameplay-mbavu-punch', width: 205, height: 286, yOffset: 82, xOffset: 22 },
  kick: { key: 'gameplay-mbavu-standing-kick', width: 205, height: 286, yOffset: 82, xOffset: 30 },
  special: { key: 'gameplay-mbavu-kick', width: 365, height: 244, yOffset: 120, xOffset: 58 },
  jump: { key: 'gameplay-mbavu-kick', width: 315, height: 210, yOffset: 130, xOffset: 30 },
  hit: { key: 'gameplay-mbavu-idle', width: 168, height: 252, yOffset: 68, xOffset: -10 },
  defeat: { key: 'gameplay-mbavu-defeat', width: 260, height: 174, yOffset: 36, xOffset: 0 },
};

const PLAYER_DEFEAT_FALL_DISPLAY = { width: 360, height: 270, yOffset: 126 };
const MAX_SIMULTANEOUS_ENEMY_ATTACKS = 2;
const ENEMY_ATTACK_SLOT_WINDOW = 900;
const MJAKA_ART: Record<string, PlayerArtSpec> = {
  idle: { key: 'menu-mjaka', width: 176, height: 276, yOffset: 82, xOffset: 0 },
  walk: { key: 'menu-mjaka', width: 176, height: 276, yOffset: 82, xOffset: 0 },
  punch: { key: 'gameplay-mjaka-palm-strike', width: 214, height: 267, yOffset: 78, xOffset: 24 },
  kick: { key: 'gameplay-mjaka-high-kick', width: 250, height: 267, yOffset: 78, xOffset: 42 },
  special: { key: 'gameplay-mjaka-rush-kick', width: 330, height: 233, yOffset: 108, xOffset: 58 },
  jump: { key: 'menu-mjaka', width: 176, height: 276, yOffset: 92, xOffset: 0 },
  hit: { key: 'menu-mjaka', width: 176, height: 276, yOffset: 82, xOffset: -8 },
  defeat: { key: 'menu-mjaka', width: 176, height: 276, yOffset: 82, xOffset: 0 },
};

const PLAYER_FEINT_FRAMES: PlayerArtSpec[] = [
  { ...PLAYER_ART.idle, key: 'gameplay-mbavu-idle', xOffset: 0, width: 168, height: 252, yOffset: 68 },
  { ...PLAYER_ART.idle, key: 'gameplay-mbavu-feint-1', xOffset: -2, width: 170, height: 250, yOffset: 67 },
  { ...PLAYER_ART.idle, key: 'gameplay-mbavu-feint-2', xOffset: 2, width: 166, height: 256, yOffset: 70 },
  { ...PLAYER_ART.idle, key: 'gameplay-mbavu-feint-3', xOffset: -4, width: 172, height: 248, yOffset: 66 },
  { ...PLAYER_ART.idle, key: 'gameplay-mbavu-feint-4', xOffset: 1, width: 168, height: 254, yOffset: 69 },
];

const LEVELS: LevelDefinition[] = [
  {
    id: 1,
    title: 'LEVEL 1',
    location: 'NAIROBI CBD',
    backgroundKey: 'nairobi-cbd-background',
    reward: 250,
    enemies: [
      { x: 210, offset: -315, variant: 'gameplay-goon-hoodie', speed: 118 },
      { x: 355, offset: -190, variant: 'gameplay-goon-club', speed: 126 },
      { x: 820, offset: 175, variant: 'gameplay-goon', speed: 132 },
      { x: 1000, offset: 305, variant: 'gameplay-goon-club', speed: 122 },
      { x: 1140, offset: 430, variant: 'gameplay-goon-hoodie', speed: 112 },
    ],
  },
  {
    id: 2,
    title: 'LEVEL 2',
    location: 'DOWNTOWN BACKSTREET',
    backgroundKey: 'gameplay-background',
    reward: 400,
    enemies: [
      { x: 180, offset: -350, variant: 'gameplay-goon', speed: 136 },
      { x: 310, offset: -245, variant: 'gameplay-goon-hoodie', speed: 128 },
      { x: 465, offset: -135, variant: 'gameplay-goon-club', speed: 132 },
      { x: 900, offset: 160, variant: 'gameplay-goon', speed: 142 },
      { x: 1060, offset: 285, variant: 'gameplay-goon-club', speed: 136 },
      { x: 1190, offset: 415, variant: 'gameplay-goon-hoodie', speed: 126 },
    ],
  },
  {
    id: 3,
    title: 'LEVEL 3',
    location: 'NAIROBI ROOFTOPS',
    backgroundKey: 'level3-nairobi-rooftop-background',
    reward: 650,
    enemies: [
      { x: 150, offset: -390, variant: 'gameplay-goon-chain', speed: 146 },
      { x: 320, offset: -250, variant: 'gameplay-attack-dog', speed: 176 },
      { x: 485, offset: -120, variant: 'gameplay-goon-heavy', speed: 108 },
      { x: 870, offset: 155, variant: 'gameplay-goon-chain', speed: 150 },
      { x: 1040, offset: 300, variant: 'gameplay-attack-dog', speed: 180 },
      { x: 1190, offset: 440, variant: 'gameplay-goon-heavy', speed: 112 },
    ],
  },
  {
    id: 4,
    title: 'LEVEL 4',
    location: 'KIBERA',
    backgroundKey: 'level4-kibera-background',
    reward: 900,
    enemies: [
      { x: 150, offset: -410, variant: 'gameplay-kibera-stone-goon', speed: 132 },
      { x: 330, offset: -270, variant: 'gameplay-kibera-shield-goon', speed: 96 },
      { x: 500, offset: -125, variant: 'gameplay-kibera-stone-goon', speed: 138 },
      { x: 850, offset: 145, variant: 'gameplay-kibera-shield-goon', speed: 100 },
      { x: 1040, offset: 305, variant: 'gameplay-kibera-stone-goon', speed: 142 },
      { x: 1190, offset: 455, variant: 'gameplay-kibera-shield-goon', speed: 98 },
    ],
  },
];

const getLevelDefinition = (levelId: number) => LEVELS.find((level) => level.id === levelId) ?? LEVELS[0];


export class LevelScene extends Phaser.Scene {
  private player!: Player;
  private playerArt!: Phaser.GameObjects.Sprite;
  private playerShadow!: Phaser.GameObjects.Image;
  private currentPlayerArtKey = '';
  private playerDefeatStarted = false;
  private enemies!: Phaser.Physics.Arcade.Group;
  private enemyList: EnemyGoon[] = [];
  private enemyVisuals: EnemyVisual[] = [];
  private combat!: CombatSystem;
  private sounds!: SoundSystem;
  private hud!: HUD;
  private defeatAftermathStarted = false;
  private defeatOverlayShown = false;
  private defeatAftermathElapsed = 0;
  private level!: LevelDefinition;
  private levelCleared = false;
  private transitioningLevel = false;
  private chapatiPickup?: Phaser.GameObjects.Sprite;
  private chapatiShadow?: Phaser.GameObjects.Ellipse;
  private chapatiSpawned = false;
  private chapatiLanded = false;
  private selectedCharacter: PlayableCharacter = 'MBAVU DESTROYER';
  private touchControls?: TouchControls;
  private startData: LevelStartData = {};

  constructor() {
    super('LevelScene');
  }

  init(data: LevelStartData = {}) {
    this.startData = data;
  }

  preload() {
    const levelId = this.startData.levelId ?? 1;
    const character = this.startData.character === 'MJAKA FINE' ? 'MJAKA FINE' : 'MBAVU DESTROYER';
    const fighterKey = character === 'MJAKA FINE' ? 'menu-mjaka' : 'gameplay-mbavu-idle';
    const needsCoreAssets = !this.textures.exists(fighterKey)
      || !this.textures.exists('gameplay-chapati-health-pickup-sheet');
    const needsLevelAssets = !this.textures.exists(getLevelDefinition(levelId).backgroundKey);
    if (needsCoreAssets || needsLevelAssets) this.showLevelLoadingProgress();
    loadCoreGameplayAssets(this, levelId, character);
    loadDeferredLevelAssets(this, levelId);
  }

  create(data: LevelStartData = this.startData) {
    document.getElementById('level-loading-overlay')?.remove();
    this.level = getLevelDefinition(data.levelId ?? 1);
    this.selectedCharacter = data.character === 'MJAKA FINE' ? 'MJAKA FINE' : 'MBAVU DESTROYER';
    this.levelCleared = false;
    this.transitioningLevel = false;
    this.defeatAftermathStarted = false;
    this.defeatOverlayShown = false;
    this.defeatAftermathElapsed = 0;
    this.enemyList = [];
    this.enemyVisuals = [];
    this.chapatiPickup = undefined;
    this.chapatiShadow = undefined;
    this.chapatiSpawned = false;
    this.chapatiLanded = false;

    // A previous clear or defeat can leave the shared Arcade world paused.
    // Always resume it when this scene is started or replayed.
    this.physics.world.resume();
    this.physics.world.setBounds(0, 0, GAME_WIDTH, GAME_HEIGHT);
    this.drawGeneratedStage();

    this.player = new Player(this, 560, GROUND_Y - 64);
    this.player.health = Phaser.Math.Clamp(data.health ?? 100, 1, 100);
    this.player.chapatis = data.chapatis ?? 0;
    this.player.setDepth(10).setVisible(false);
    this.playerShadow = this.add.image(this.player.x, this.player.y, 'shadow').setDepth(2);
    const initialArt = this.selectedCharacter === 'MJAKA FINE' ? 'menu-mjaka' : 'gameplay-mbavu-idle';
    this.playerArt = this.add.sprite(this.player.x, this.player.y, initialArt).setDepth(18);
    this.createSceneAnimations();

    this.enemies = this.physics.add.group({ classType: EnemyGoon, runChildUpdate: false });
    this.level.enemies.forEach((config, index) => this.createEnemy(config, index));
    this.physics.add.collider(this.enemies, this.enemies);

    this.sounds = new SoundSystem(this);
    this.events.on('sfx:player-hurt', this.handlePlayerHurt, this);
    this.events.on('sfx:dog-bark', this.handleDogBark, this);
    this.events.on('enemy:stone-throw', this.handleStoneThrow, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.events.off('sfx:player-hurt', this.handlePlayerHurt, this);
      this.events.off('sfx:dog-bark', this.handleDogBark, this);
      this.events.off('enemy:stone-throw', this.handleStoneThrow, this);
    });
    this.combat = new CombatSystem(this, this.player, this.enemies, this.sounds);
    this.hud = new HUD(this, this.level.title, this.level.location, this.selectedCharacter, () => this.openCharacterSelect());
    if (this.shouldShowTouchControls()) {
      this.input.addPointer(3);
      this.touchControls = new TouchControls(this);
    }
    this.showLevelIntro();
    this.loadBattleAnimationsInBackground();

    this.cameras.main.setBounds(0, 0, GAME_WIDTH, GAME_HEIGHT);
    this.input.keyboard?.on('keydown-ESC', () => this.scene.start('MainMenuScene'));
  }

  update(time: number, delta: number) {
    // Defeat aftermath must continue even while combat physics is paused.
    if (this.physics.world.isPaused && this.player?.state !== 'defeat') return;
    if (this.touchControls) this.player.setTouchIntent(this.touchControls.intent);
    this.player.update(time, delta);

    if (this.player.state === 'defeat') {
      this.updateDefeatAftermath(time, delta);
    } else {
      let attackSlots = Math.max(
        0,
        MAX_SIMULTANEOUS_ENEMY_ATTACKS - this.enemyList.filter((enemy) =>
          enemy.lastAttackAt > 0 && time - enemy.lastAttackAt < ENEMY_ATTACK_SLOT_WINDOW,
        ).length,
      );
      this.enemyList.forEach((enemy) => {
        const previousAttackAt = enemy.lastAttackAt;
        enemy.update(time, this.player, attackSlots > 0);
        if (enemy.lastAttackAt !== previousAttackAt) attackSlots = Math.max(0, attackSlots - 1);
      });
      this.separateActiveEnemies();
      this.combat.update(time);
    }

    this.hud.update(this.player, this.enemyList, this.combat.combo);
    this.syncGeneratedArt(time);
    this.updateChapatiPickup();
    this.touchControls?.postUpdate();

    if (this.player.state !== 'defeat' && !this.levelCleared && this.enemyList.length > 0 && this.enemyList.every((enemy) => enemy.state === 'defeat')) {
      this.completeLevel();
    }
  }

  private shouldShowTouchControls() {
    return window.matchMedia('(pointer: coarse)').matches
      && window.matchMedia('(max-width: 900px)').matches;
  }

  private loadBattleAnimationsInBackground() {
    if (!loadBattleAnimationAssets(this, this.level.id, this.selectedCharacter)) return;
    const activateLoadedAnimations = () => {
      if (this.scene.isActive()) this.createSceneAnimations();
    };
    // A slow connection should not make every goon stay static until the
    // entire animation pack has arrived. Enable each variant as its sheet
    // finishes, while the arena stays playable throughout.
    this.load.on(Phaser.Loader.Events.FILE_COMPLETE, activateLoadedAnimations);
    this.load.once(Phaser.Loader.Events.COMPLETE, () => {
      this.load.off(Phaser.Loader.Events.FILE_COMPLETE, activateLoadedAnimations);
      activateLoadedAnimations();
    });
    this.load.start();
  }

  private showLevelLoadingProgress() {
    document.getElementById('level-loading-overlay')?.remove();
    const overlay = document.createElement('div');
    overlay.id = 'level-loading-overlay';
    overlay.setAttribute('role', 'status');
    overlay.setAttribute('aria-live', 'polite');
    Object.assign(overlay.style, {
      position: 'fixed', inset: '0', zIndex: '1500', display: 'grid', placeItems: 'center',
      color: '#ffc51d', background: '#07111f', font: 'italic 800 22px/1 Arial Black, Arial, sans-serif',
      letterSpacing: '0.05em', textAlign: 'center',
    });
    overlay.textContent = 'PREPARING THE STREETS OF NAIROBI · 0%';
    document.body.append(overlay);
    this.load.on(Phaser.Loader.Events.PROGRESS, (progress: number) => {
      overlay.textContent = `PREPARING THE STREETS OF NAIROBI · ${Math.round(progress * 100)}%`;
    });
  }

  private drawGeneratedStage() {
    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, this.level.backgroundKey)
      .setDisplaySize(GAME_WIDTH, GAME_HEIGHT)
      .setDepth(0);
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.07).setDepth(2);
    if (this.level.id <= 2) this.createBackgroundTraffic();
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT - 8, GAME_WIDTH, 16, 0x050505, 0.76).setDepth(79);
  }

  private createBackgroundTraffic() {
    const nearMatatu = this.add.image(-240, 455, 'nairobi-matatu-conductor')
      .setDisplaySize(335, 116)
      .setDepth(5)
      .setAlpha(0.88);

    this.tweens.add({
      targets: nearMatatu,
      x: GAME_WIDTH + 250,
      duration: 9200,
      delay: 900,
      repeat: -1,
      repeatDelay: 4200,
      ease: 'Sine.InOut',
      onRepeat: () => {
        nearMatatu.y = Phaser.Math.Between(438, 462);
        nearMatatu.setAlpha(Phaser.Math.FloatBetween(0.78, 0.92));
      },
    });

    this.tweens.add({
      targets: nearMatatu,
      y: nearMatatu.y - 3,
      duration: 520,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    });

  }

  private updateChapatiPickup() {
    if (this.player.state === 'defeat') return;

    const defeatedCount = this.enemyList.filter((enemy) => enemy.state === 'defeat').length;
    if (!this.chapatiSpawned && defeatedCount >= 3) {
      this.spawnChapatiPickup();
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
    this.cameras.main.flash(150, 255, 196, 46, false);
    this.sounds.playPickup();

    const label = this.add.text(pickupX, pickupY - 58, healed > 0 ? `+${healed} HEALTH` : 'HEALTH FULL', {
      fontFamily: 'Arial Black',
      fontSize: '22px',
      color: '#ffe36a',
      stroke: '#3b1600',
      strokeThickness: 5,
      fontStyle: 'italic',
    }).setOrigin(0.5).setDepth(1200);
    this.tweens.add({
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
    this.chapatiShadow = this.add.ellipse(x, GROUND_Y - 8, 72, 20, 0x000000, 0.32)
      .setDepth(GROUND_Y - 3)
      .setScale(0.25)
      .setAlpha(0.08);
    this.chapatiPickup = this.add.sprite(x, 155, 'gameplay-chapati-health-pickup-sheet')
      .setDisplaySize(92, 92)
      .setDepth(GROUND_Y - 1)
      .play('chapati-health-spin', true);

    this.tweens.add({
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
          this.tweens.add({
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

  private showLevelIntro() {
    const label = this.add.text(GAME_WIDTH / 2, 154, `${this.level.title}: ${this.level.location}`, {
      fontFamily: 'Arial Black',
      fontSize: '34px',
      color: '#ffc51d',
      stroke: '#050505',
      strokeThickness: 7,
      fontStyle: 'italic',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(1600).setAlpha(0).setScale(0.8);
    const context = this.add.text(GAME_WIDTH / 2, 215, copyFor(getStoryLanguage(), LEVEL_CONTEXT[this.level.id]), {
      fontFamily: 'Arial, sans-serif',
      fontSize: '18px',
      color: '#ffffff',
      stroke: '#050505',
      strokeThickness: 4,
      align: 'center',
      wordWrap: { width: 780 },
      lineSpacing: 5,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(1600).setAlpha(0);

    this.tweens.add({
      targets: [label, context],
      alpha: 1,
      duration: 260,
      ease: 'Sine.Out',
    });
    this.tweens.add({
      targets: label,
      scale: 1,
      y: 148,
      duration: 260,
      ease: 'Back.Out',
    });
    this.tweens.add({
      targets: [label, context],
      alpha: 0,
      delay: 1700,
      duration: 280,
      onComplete: () => { label.destroy(); context.destroy(); },
    });
  }

  private completeLevel() {
    this.levelCleared = true;
    this.player.chapatis += this.level.reward;
    const nextLevel = LEVELS.find((level) => level.id === this.level.id + 1);
    saveJourneyProgress({
      levelId: nextLevel?.id ?? this.level.id,
      character: this.selectedCharacter,
      chapatis: this.player.chapatis,
      health: Math.min(100, this.player.health + 35),
    });
    this.enemyList.forEach((enemy) => enemy.setVelocity(0, 0));
    this.physics.world.pause();
    this.sounds.playVictory();
    this.showLevelClearOverlay(unlockLocationStory(this.level.id));
  }

  private handlePlayerHurt(heavy: boolean) {
    this.sounds.playPlayerHurt(heavy);
  }

  private handleDogBark() {
    this.sounds.playDogBark();
  }

  private handleStoneThrow(enemy: EnemyGoon) {
    const attackAt = enemy.lastAttackAt;
    this.time.delayedCall(380, () => {
      if (!enemy.active || enemy.state !== 'attack' || enemy.lastAttackAt !== attackAt || this.player.state === 'defeat') return;

      const startX = enemy.x + (this.player.x >= enemy.x ? 42 : -42);
      const startY = enemy.y - 54;
      const targetY = this.player.y - 46;
      const direction = new Phaser.Math.Vector2(this.player.x - startX, targetY - startY);
      if (direction.lengthSq() === 0) direction.set(1, 0);
      direction.normalize();

      const stone = this.physics.add.image(startX, startY, 'stone-projectile')
        .setDepth(Math.max(enemy.y, this.player.y) + 2)
        .setVelocity(direction.x * 470, direction.y * 470)
        .setAngularVelocity(direction.x >= 0 ? 760 : -760);
      stone.setCircle(10);
      (stone.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);

      const overlap = this.physics.add.overlap(stone, this.player, () => {
        if (!stone.active || this.player.state === 'defeat') return;
        this.player.takeDamage(enemy.attackDamage, 230, enemy.x);
        this.events.emit('sfx:player-hurt', false);
        this.cameras.main.shake(75, 0.003);
        if (overlap.active) overlap.destroy();
        stone.destroy();
      });

      this.time.delayedCall(1450, () => {
        // The impact callback may already have removed this overlap. Phaser's
        // Collider.destroy() is not idempotent and throws when called twice.
        if (overlap.active) overlap.destroy();
        if (stone.active) stone.destroy();
      });
    });
  }

  private showLevelClearOverlay(storyUnlocked: boolean) {
    const nextLevel = LEVELS.find((level) => level.id === this.level.id + 1);
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x030305, 0.48)
      .setScrollFactor(0)
      .setDepth(1890);

    const banner = this.add.container(GAME_WIDTH / 2, 292).setScrollFactor(0).setDepth(1900).setAlpha(0).setScale(0.86);
    const bg = this.add.graphics();
    bg.fillStyle(0x050505, 0.9);
    bg.lineStyle(4, 0xffc51d, 0.95);
    bg.fillRoundedRect(-250, -72, 500, 144, 8);
    bg.strokeRoundedRect(-250, -72, 500, 144, 8);
    const title = this.add.text(0, -24, 'LEVEL CLEAR!', {
      fontFamily: 'Arial Black',
      fontSize: '44px',
      color: '#ffc51d',
      stroke: '#050505',
      strokeThickness: 6,
      fontStyle: 'italic',
    }).setOrigin(0.5);
    const subtitle = this.add.text(0, 34, storyUnlocked ? 'NAIROBI STORY UNLOCKED!' : (nextLevel ? 'READY FOR THE NEXT GOONS?' : 'ALL LEVELS CLEARED'), {
      fontFamily: 'Arial Black',
      fontSize: '22px',
      color: '#ffffff',
      stroke: '#050505',
      strokeThickness: 4,
      fontStyle: 'italic',
    }).setOrigin(0.5);
    banner.add([bg, title, subtitle]);

    if (storyUnlocked) {
      const story = LOCATION_STORIES[this.level.id];
      const card = this.add.container(GAME_WIDTH / 2, 438).setScrollFactor(0).setDepth(1901).setAlpha(0);
      const cardBg = this.add.graphics();
      cardBg.fillStyle(0x07101d, 0.96).lineStyle(2, 0xffc51d, 0.9).fillRoundedRect(-390, -52, 780, 104, 10).strokeRoundedRect(-390, -52, 780, 104, 10);
      const cardTitle = this.add.text(0, -26, copyFor(getStoryLanguage(), story.title), { fontFamily: 'Arial Black', fontSize: '18px', color: '#ffc51d', fontStyle: 'italic' }).setOrigin(0.5);
      const cardBody = this.add.text(0, 12, copyFor(getStoryLanguage(), story.body), { fontFamily: 'Arial, sans-serif', fontSize: '15px', color: '#eef4ff', align: 'center', wordWrap: { width: 720 }, lineSpacing: 3 }).setOrigin(0.5);
      card.add([cardBg, cardTitle, cardBody]);
      this.tweens.add({ targets: card, alpha: 1, duration: 260, delay: 180 });
    }


    const button = this.add.container(GAME_WIDTH / 2, storyUnlocked ? 575 : 418)
      .setScrollFactor(0)
      .setDepth(1902)
      .setAlpha(0)
      .setScale(0.8);
    const buttonBg = this.add.graphics();
    buttonBg.fillStyle(0xffc51d, 1);
    buttonBg.lineStyle(4, 0x050505, 1);
    buttonBg.fillRoundedRect(-118, -34, 236, 68, 8);
    buttonBg.strokeRoundedRect(-118, -34, 236, 68, 8);
    const buttonText = this.add.text(0, 0, nextLevel ? 'NEXT' : 'MAIN MENU', {
      fontFamily: 'Arial Black',
      fontSize: nextLevel ? '32px' : '25px',
      color: '#111111',
      fontStyle: 'italic',
    }).setOrigin(0.5);
    button.add([buttonBg, buttonText]);
    button.setSize(236, 68).setInteractive({ useHandCursor: true });
    button.on('pointerover', () => {
      this.sounds.playUiHover();
      this.tweens.add({ targets: button, scale: 1.07, duration: 100, ease: 'Back.Out' });
    });
    button.on('pointerout', () => this.tweens.add({ targets: button, scale: 1, duration: 90, ease: 'Sine.Out' }));
    button.on('pointerdown', () => {
      this.sounds.playUiSelect();
      button.disableInteractive();
      if (nextLevel) this.startNextLevel(nextLevel.id);
      else this.returnToMainMenu();
    });

    this.tweens.add({ targets: banner, alpha: 1, scale: 1, duration: 260, ease: 'Back.Out' });
    this.tweens.add({ targets: button, alpha: 1, scale: 1, duration: 260, delay: 280, ease: 'Back.Out' });
  }
  private startNextLevel(levelId: number) {
    if (this.transitioningLevel) return;
    this.transitioningLevel = true;
    this.cameras.main.fadeOut(380, 0, 0, 0);
    this.time.delayedCall(390, () => {
      this.scene.start('LevelScene', {
        levelId,
        chapatis: this.player.chapatis,
        health: Math.min(100, this.player.health + 35),
        character: this.selectedCharacter,
      });
    });
  }

  private returnToMainMenu() {
    if (this.transitioningLevel) return;
    this.transitioningLevel = true;
    this.cameras.main.fadeOut(380, 0, 0, 0);
    this.time.delayedCall(390, () => this.scene.start('MainMenuScene'));
  }

  private openCharacterSelect() {
    this.scene.start('CharacterSelectScene', {
      returnToLevel: true,
      character: this.selectedCharacter,
      levelId: this.level.id,
      chapatis: this.player.chapatis,
      health: this.player.health,
    });
  }

  private createEnemy(config: { x: number; offset: number; variant: EnemyVisualVariant; speed: number }, index: number) {
    const enemy = new EnemyGoon(this, config.x, GROUND_Y - 64);
    enemy.configure(config.offset, config.variant, config.speed, getDifficultySettings(), (index - 2) * 18);
    enemy.setDepth(9).setVisible(false);
    this.enemies.add(enemy);
    this.enemyList.push(enemy);

    const dog = config.variant === 'gameplay-attack-dog';
    const heavy = config.variant === 'gameplay-goon-heavy';
    const stone = config.variant === 'gameplay-kibera-stone-goon';
    const shield = config.variant === 'gameplay-kibera-shield-goon';
    const larger = index === 3 || heavy;
    const width = stone ? 176 : shield ? 196 : dog ? 174 : heavy ? 205 : larger ? 158 : 138;
    const height = stone ? 190 : shield ? 212 : dog ? 116 : heavy ? 205 : larger ? 237 : 207;
    const artYOffset = dog ? 42 : stone || shield ? height * 0.48 : 84;
    const shadow = this.add.image(config.x, GROUND_Y, 'shadow').setDepth(2);
    const art = this.add.sprite(config.x, GROUND_Y - artYOffset, config.variant)
      .setDisplaySize(width, height)
      .setDepth(config.x < this.player.x ? 13 : 15);
    art.setFlipX(config.x < this.player.x);
    const victoryDirection: 1 | -1 = index % 2 === 0 ? -1 : 1;
    const victoryLaneY = GROUND_Y - 64 + (index - 2) * 7;
    this.enemyVisuals.push({
      enemy,
      art,
      shadow,
      baseWidth: width,
      baseHeight: height,
      defeatStarted: false,
      victoryDirection,
      victoryLaneY,
      victoryGone: false,
      renderedAttackAt: 0,
    });
  }

  private syncGeneratedArt(time: number) {
    const spec = this.getPlayerArtSpec(time);
    if (this.selectedCharacter === 'MBAVU DESTROYER' && this.player.state === 'walk' && this.anims.exists('mbavu-run')) {
      if (this.currentPlayerArtKey !== 'gameplay-mbavu-run-animation') {
        this.currentPlayerArtKey = 'gameplay-mbavu-run-animation';
        this.playerArt.play('mbavu-run', true);
      }
    } else if (this.currentPlayerArtKey !== spec.key) {
      this.currentPlayerArtKey = spec.key;
      this.playerArt.stop();
      this.playerArt.setTexture(spec.key);
    }

    const bob = this.player.state === 'walk' ? Math.sin(time / 72) * 5 : 0;
    const attackLift = this.player.state === 'kick' || this.player.state === 'special' || this.player.state === 'jump' ? -18 : 0;
    this.playerShadow.setPosition(this.player.x, this.player.y);
    const playerShadowScale = 1.3 * (1 - this.player.z / 600);
    this.playerShadow.setScale(playerShadowScale, playerShadowScale * 0.5).setAlpha(0.35 * (1 - this.player.z / 600));

    if (this.player.state === 'defeat' && this.selectedCharacter === 'MBAVU DESTROYER' && this.anims.exists('mbavu-defeat-fall')) {
      if (!this.playerDefeatStarted) {
        this.playerDefeatStarted = true;
        this.tweens.killTweensOf(this.playerArt);
        this.playerArt.play('mbavu-defeat-fall', true);
      }
      const defeatX = Phaser.Math.Clamp(
        this.player.x,
        PLAYER_DEFEAT_FALL_DISPLAY.width / 2 + 18,
        GAME_WIDTH - PLAYER_DEFEAT_FALL_DISPLAY.width / 2 - 18,
      );
      this.playerArt
        .setDisplaySize(PLAYER_DEFEAT_FALL_DISPLAY.width, PLAYER_DEFEAT_FALL_DISPLAY.height)
        .setPosition(defeatX, this.player.y - PLAYER_DEFEAT_FALL_DISPLAY.yOffset)
        .setFlipX(this.player.facing < 0)
        .setAlpha(0.92)
        .setAngle(0);
    } else {
      this.playerDefeatStarted = false;
      this.playerArt
        .setDisplaySize(spec.width, spec.height)
        .setPosition(this.player.x + spec.xOffset * this.player.facing, this.player.y - spec.yOffset - this.player.z + bob + attackLift)
        .setFlipX(this.player.facing < 0)
        .setAlpha(1)
        .setAngle(this.getPlayerAngle());
    }

    this.playerShadow.setDepth(this.player.y - 2);
    this.playerArt.setDepth(this.player.y - 1);

    this.enemyVisuals.forEach((visual, index) => this.syncEnemyVisual(visual, index, time));
  }

  private getPlayerArtSpec(time: number) {
    if (this.selectedCharacter === 'MJAKA FINE') return MJAKA_ART[this.player.state] ?? MJAKA_ART.idle;
    if (this.player.state === 'idle') {
      const feint = PLAYER_FEINT_FRAMES[Math.floor(time / 140) % PLAYER_FEINT_FRAMES.length];
      return this.textures.exists(feint.key) ? feint : PLAYER_ART.idle;
    }
    const spec = PLAYER_ART[this.player.state] ?? PLAYER_ART.idle;
    return this.textures.exists(spec.key) ? spec : PLAYER_ART.idle;
  }

  private createSceneAnimations() {
    const createEightFrameAnimation = (key: string, texture: string, frameRate: number, repeat: number) => {
      if (this.anims.exists(key) || !this.textures.exists(texture)) return;
      this.anims.create({
        key,
        frames: this.anims.generateFrameNumbers(texture, { start: 0, end: 7 }),
        frameRate,
        repeat,
      });
    };
    createEightFrameAnimation('chapati-health-spin', 'gameplay-chapati-health-pickup-sheet', 12, -1);
    createEightFrameAnimation('attack-dog-run', 'gameplay-attack-dog-run-sheet', 13, -1);
    createEightFrameAnimation('attack-dog-attack', 'gameplay-attack-dog', 12, 0);
    createEightFrameAnimation('attack-dog-defeat', 'gameplay-attack-dog-defeat-sheet', 10, 0);
    createEightFrameAnimation('goon-chain-idle', 'gameplay-goon-chain', 6, -1);
    createEightFrameAnimation('goon-chain-walk', 'gameplay-goon-chain-walk-sheet', 10, -1);
    createEightFrameAnimation('goon-chain-attack', 'gameplay-goon-chain-attack-sheet', 13, 0);
    createEightFrameAnimation('goon-chain-defeat', 'gameplay-goon-chain-defeat-sheet', 10, 0);
    createEightFrameAnimation('goon-heavy-idle', 'gameplay-goon-heavy', 5, -1);
    createEightFrameAnimation('goon-heavy-walk', 'gameplay-goon-heavy-walk-sheet', 8, -1);
    createEightFrameAnimation('goon-heavy-attack', 'gameplay-goon-heavy-attack-sheet', 11, 0);
    createEightFrameAnimation('goon-heavy-defeat', 'gameplay-goon-heavy-defeat-sheet', 9, 0);
    createEightFrameAnimation('kibera-stone-walk', 'gameplay-kibera-stone-goon-walk-sheet', 10, -1);
    createEightFrameAnimation('kibera-stone-sprint', 'gameplay-kibera-stone-goon-sprint-sheet', 14, -1);
    createEightFrameAnimation('kibera-stone-throw', 'gameplay-kibera-stone-goon-throw-sheet', 12, 0);
    createEightFrameAnimation('kibera-shield-walk', 'gameplay-kibera-shield-goon-walk-sheet', 8, -1);
    createEightFrameAnimation('kibera-shield-sprint', 'gameplay-kibera-shield-goon-sprint-sheet', 13, -1);
    createEightFrameAnimation('kibera-shield-combo', 'gameplay-kibera-shield-goon-attack-sheet', 11, 0);

    if (!this.anims.exists('mbavu-run') && this.textures.exists('gameplay-mbavu-run-sheet')) {
      this.anims.create({
        key: 'mbavu-run',
        frames: this.anims.generateFrameNumbers('gameplay-mbavu-run-sheet', { start: 0, end: 7 }),
        frameRate: 14,
        repeat: -1,
      });
    }

    if (!this.anims.exists('mbavu-defeat-fall') && this.textures.exists('gameplay-mbavu-defeat-fall-sheet')) {
      this.anims.create({
        key: 'mbavu-defeat-fall',
        frames: this.anims.generateFrameNumbers('gameplay-mbavu-defeat-fall-sheet', { start: 0, end: 7 }),
        frameRate: 10,
        repeat: 0,
      });
    }

    if (!this.anims.exists('goon-red-attack') && this.textures.exists('gameplay-goon-red-attack-sheet')) {
      this.anims.create({
        key: 'goon-red-attack',
        frames: this.anims.generateFrameNumbers('gameplay-goon-red-attack-sheet', { start: 0, end: 7 }),
        frameRate: 14,
        repeat: 0,
      });
    }

    if (!this.anims.exists('goon-hoodie-attack') && this.textures.exists('gameplay-goon-hoodie-attack-sheet')) {
      this.anims.create({
        key: 'goon-hoodie-attack',
        frames: this.anims.generateFrameNumbers('gameplay-goon-hoodie-attack-sheet', { start: 0, end: 7 }),
        frameRate: 14,
        repeat: 0,
      });
    }

    if (!this.anims.exists('goon-club-attack') && this.textures.exists('gameplay-goon-club-attack-sheet')) {
      this.anims.create({
        key: 'goon-club-attack',
        frames: this.anims.generateFrameNumbers('gameplay-goon-club-attack-sheet', { start: 0, end: 7 }),
        frameRate: 13,
        repeat: 0,
      });
    }

    if (!this.anims.exists('goon-red-walk') && this.textures.exists('gameplay-goon-red-walk-sheet')) {
      this.anims.create({
        key: 'goon-red-walk',
        frames: this.anims.generateFrameNumbers('gameplay-goon-red-walk-sheet', { start: 0, end: 7 }),
        frameRate: 10,
        repeat: -1,
      });
    }

    if (!this.anims.exists('goon-hoodie-walk') && this.textures.exists('gameplay-goon-hoodie-walk-sheet')) {
      this.anims.create({
        key: 'goon-hoodie-walk',
        frames: this.anims.generateFrameNumbers('gameplay-goon-hoodie-walk-sheet', { start: 0, end: 7 }),
        frameRate: 10,
        repeat: -1,
      });
    }

    if (!this.anims.exists('goon-club-walk') && this.textures.exists('gameplay-goon-club-walk-sheet')) {
      this.anims.create({
        key: 'goon-club-walk',
        frames: this.anims.generateFrameNumbers('gameplay-goon-club-walk-sheet', { start: 0, end: 7 }),
        frameRate: 10,
        repeat: -1,
      });
    }
    if (!this.anims.exists('goon-red-run') && this.textures.exists('gameplay-goon-red-run-sheet')) {
      this.anims.create({
        key: 'goon-red-run',
        frames: this.anims.generateFrameNumbers('gameplay-goon-red-run-sheet', { start: 0, end: 7 }),
        frameRate: 14,
        repeat: -1,
      });
    }

    if (!this.anims.exists('goon-hoodie-run') && this.textures.exists('gameplay-goon-hoodie-run-sheet')) {
      this.anims.create({
        key: 'goon-hoodie-run',
        frames: this.anims.generateFrameNumbers('gameplay-goon-hoodie-run-sheet', { start: 0, end: 7 }),
        frameRate: 14,
        repeat: -1,
      });
    }

    if (!this.anims.exists('goon-club-run') && this.textures.exists('gameplay-goon-club-run-sheet')) {
      this.anims.create({
        key: 'goon-club-run',
        frames: this.anims.generateFrameNumbers('gameplay-goon-club-run-sheet', { start: 0, end: 7 }),
        frameRate: 14,
        repeat: -1,
      });
    }
  }

  private updateDefeatAftermath(time: number, delta: number) {
    if (!this.defeatAftermathStarted) {
      this.defeatAftermathStarted = true;
      this.sounds.playPlayerDefeat();
      this.defeatAftermathElapsed = 0;
      this.cameras.main.shake(220, 0.006);
      this.enemyList.forEach((enemy) => enemy.setVelocity(0, 0));
      this.physics.world.pause();
    }

    this.defeatAftermathElapsed += delta;
    const dt = delta / 1000;
    this.enemyVisuals.forEach((visual, index) => {
      const { enemy } = visual;
      if (enemy.state === 'defeat' || visual.victoryGone) return;

      enemy.x += visual.victoryDirection * (225 + index * 20) * dt;
      enemy.y = visual.victoryLaneY;

      const exitedLeft = visual.victoryDirection < 0 && enemy.x < -180;
      const exitedRight = visual.victoryDirection > 0 && enemy.x > GAME_WIDTH + 180;
      if (exitedLeft || exitedRight) {
        visual.victoryGone = true;
        visual.art.setVisible(false);
        visual.shadow.setVisible(false);
      }
    });

    if (!this.defeatOverlayShown && this.defeatAftermathElapsed > 1550) {
      this.showDefeatedOverlay();
    }
  }

  private separateActiveEnemies() {
    for (let i = 0; i < this.enemyList.length; i += 1) {
      const a = this.enemyList[i];
      if (a.state === 'defeat') continue;
      for (let j = i + 1; j < this.enemyList.length; j += 1) {
        const b = this.enemyList[j];
        if (b.state === 'defeat') continue;

        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const minX = 74;
        const minY = 28;
        if (Math.abs(dx) >= minX || Math.abs(dy) >= minY) continue;

        const pushX = ((minX - Math.abs(dx)) / 2) * (dx >= 0 ? 1 : -1);
        const pushY = ((minY - Math.abs(dy)) / 2) * (dy >= 0 ? 1 : -1) * 0.45;
        a.x = Phaser.Math.Clamp(a.x - pushX, 70, GAME_WIDTH - 70);
        b.x = Phaser.Math.Clamp(b.x + pushX, 70, GAME_WIDTH - 70);
        a.y = Phaser.Math.Clamp(a.y - pushY, 468, 620);
        b.y = Phaser.Math.Clamp(b.y + pushY, 468, 620);
      }
    }
  }

  private showDefeatedOverlay() {
    this.defeatOverlayShown = true;
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x050108, 0.46)
      .setScrollFactor(0)
      .setDepth(2000);

    const defeatedText = this.add.text(GAME_WIDTH / 2, 252, 'UMEVAMIWA!', {
      fontFamily: 'Arial Black',
      fontSize: '92px',
      color: '#ff2338',
      stroke: '#fff2a8',
      strokeThickness: 8,
      fontStyle: 'italic',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(2002).setAngle(-5).setScale(0.2);

    this.tweens.add({ targets: defeatedText, scale: 1, angle: 2, duration: 360, ease: 'Back.Out' });
    this.tweens.add({ targets: defeatedText, y: defeatedText.y - 10, duration: 520, ease: 'Sine.InOut', yoyo: true, repeat: -1, delay: 360 });

    const subtitle = this.add.text(GAME_WIDTH / 2, 332, 'Goons Wamekupiga Mbavu', {
      fontFamily: 'Arial Black',
      fontSize: '24px',
      color: '#ffffff',
      stroke: '#050505',
      strokeThickness: 5,
      fontStyle: 'italic',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(2002).setAlpha(0);
    this.tweens.add({ targets: subtitle, alpha: 1, duration: 240, delay: 220 });

    const button = this.add.container(GAME_WIDTH / 2, 432).setScrollFactor(0).setDepth(2002);
    const buttonBg = this.add.graphics();
    buttonBg.fillStyle(0xffbf1b, 1);
    buttonBg.lineStyle(4, 0x050505, 1);
    buttonBg.fillRoundedRect(-116, -34, 232, 68, 8);
    buttonBg.strokeRoundedRect(-116, -34, 232, 68, 8);
    const buttonText = this.add.text(0, 0, 'REPLAY', {
      fontFamily: 'Arial Black',
      fontSize: '30px',
      color: '#111111',
      fontStyle: 'italic',
    }).setOrigin(0.5);
    button.add([buttonBg, buttonText]);
    button.setSize(232, 68).setInteractive({ useHandCursor: true });
    button.on('pointerdown', () => {
      if (this.transitioningLevel) return;
      this.transitioningLevel = true;
      this.sounds.playUiSelect();
      button.disableInteractive();
      this.physics.world.resume();
      this.anims.resumeAll();
      this.scene.start('LevelScene', {
        levelId: this.level.id,
        chapatis: this.player.chapatis,
        health: 100,
        character: this.selectedCharacter,
      });
    });
    button.on('pointerover', () => this.tweens.add({ targets: button, scale: 1.06, duration: 90 }));
    button.on('pointerout', () => this.tweens.add({ targets: button, scale: 1, duration: 90 }));
    this.tweens.add({ targets: button, scale: { from: 0.75, to: 1 }, alpha: { from: 0, to: 1 }, duration: 260, delay: 360, ease: 'Back.Out' });
  }

  private syncEnemyVisual(visual: EnemyVisual, index: number, time: number) {
    const { enemy, art, shadow, baseWidth, baseHeight } = visual;
    const dog = enemy.visualVariant === 'gameplay-attack-dog';
    const heavy = enemy.visualVariant === 'gameplay-goon-heavy';
    const stone = enemy.visualVariant === 'gameplay-kibera-stone-goon';
    const shield = enemy.visualVariant === 'gameplay-kibera-shield-goon';
    const kiberaGoon = stone || shield;

    if (this.player.state === 'defeat' && enemy.state !== 'defeat') {
      if (visual.victoryGone) {
        art.setVisible(false);
        shadow.setVisible(false);
        return;
      }

      art.setVisible(true);
      shadow.setVisible(true);
      const runAnim = this.getEnemyRunAnimationKey(enemy.visualVariant);
      if (runAnim && this.anims.exists(runAnim) && (art.anims.currentAnim?.key !== runAnim || !art.anims.isPlaying)) {
        art.play(runAnim, true);
      } else if (!runAnim) {
        art.stop();
        art.setTexture(enemy.visualVariant);
      }
      enemy.y = visual.victoryLaneY;
      const runPhase = time / 95 + index * 0.8;
      const stride = Math.sin(runPhase);
      const lift = Math.abs(stride) * 4;
      shadow.setPosition(enemy.x, visual.victoryLaneY).setDepth(visual.victoryLaneY - 2).setAlpha(0.28);
      const enemyShadowScale = (baseWidth / 138) * (1.12 + Math.abs(stride) * 0.08);
      shadow.setScale(enemyShadowScale, enemyShadowScale * 0.44);
      art
        .setPosition(enemy.x + visual.victoryDirection * 10, visual.victoryLaneY - (dog ? 42 : kiberaGoon ? baseHeight * 0.48 : 86) - enemy.z - lift)
        .setDisplaySize(dog || kiberaGoon ? baseWidth : baseWidth * 1.86, dog || kiberaGoon ? baseHeight : baseHeight * 1.34)
        .setFlipX(visual.victoryDirection < 0)
        .setAlpha(1)
        .setTint(0xffffff)
        .setAngle(0)
        .setDepth(visual.victoryLaneY - 1);
      return;
    }

    if (enemy.state === 'defeat') {
      if (!visual.defeatStarted) {
        visual.defeatStarted = true;
        const defeatAnim = this.getEnemyDefeatAnimationKey(enemy.visualVariant);
        if (defeatAnim && this.anims.exists(defeatAnim)) {
          art.play(defeatAnim, false).setAngle(0);
          if (dog) art.setDisplaySize(260, 164);
          else if (enemy.visualVariant === 'gameplay-goon-heavy') art.setDisplaySize(270, 270);
          else if (enemy.visualVariant === 'gameplay-goon-chain') art.setDisplaySize(300, 230);
        } else if (kiberaGoon) {
          art.setTexture(enemy.visualVariant).setDisplaySize(baseWidth, baseHeight).setAngle(enemy.x < this.player.x ? -78 : 78);
        } else {
          art.setTexture(enemy.visualVariant).setDisplaySize(baseHeight, baseWidth).setAngle(enemy.x < this.player.x ? -72 : 72);
        }
        this.tweens.add({ targets: [art, shadow], alpha: 0, delay: 850, duration: 620, ease: 'Sine.In', onComplete: () => { art.setVisible(false); shadow.setVisible(false); } });
      }
      const generatedDefeat = Boolean(this.getEnemyDefeatAnimationKey(enemy.visualVariant) && this.anims.exists(this.getEnemyDefeatAnimationKey(enemy.visualVariant)));
      const defeatOffsetY = dog ? 65 : kiberaGoon ? baseHeight * 0.42 : enemy.visualVariant === 'gameplay-goon-heavy' ? 120 : enemy.visualVariant === 'gameplay-goon-chain' ? 102 : 34;
      const defeatHalfWidth = generatedDefeat ? art.displayWidth / 2 : 20;
      const defeatX = Phaser.Math.Clamp(enemy.x, defeatHalfWidth + 12, GAME_WIDTH - defeatHalfWidth - 12);
      art.setPosition(defeatX, enemy.y - defeatOffsetY - enemy.z).setDepth(enemy.y - 1);
      shadow.setPosition(defeatX, enemy.y).setDepth(enemy.y - 2);
      return;
    }

    const hit = enemy.state === 'hit';
    const walking = enemy.state === 'walk';
    const fighting = enemy.state === 'attack';
    const texture = enemy.visualVariant;
    const attackDirection: 1 | -1 = enemy.x < this.player.x ? 1 : -1;
    const walkPhase = time / 120 + index * 0.75;
    const walkStride = walking ? Math.sin(walkPhase) : 0;
    const walkLift = walking ? Math.abs(walkStride) * 3 : 0;
    const walkX = walking ? Math.cos(walkPhase) * 2 : 0;
    const strikeWindow = stone ? 720 : shield ? 820 : dog ? 660 : enemy.visualVariant === 'gameplay-goon-club' ? 680 : 520;
    const striking = enemy.lastAttackAt > 0 && time - enemy.lastAttackAt < strikeWindow;

    if (walking) {
      const walkAnim = this.getEnemyWalkAnimationKey(enemy.visualVariant);
      if (walkAnim && this.anims.exists(walkAnim) && (art.anims.currentAnim?.key !== walkAnim || !art.anims.isPlaying)) art.play(walkAnim, true);
      else if (!walkAnim) {
        art.stop();
        art.setTexture(texture);
      }
    } else if (striking) {
      const attackAnim = this.getEnemyAttackAnimationKey(enemy.visualVariant);
      if (attackAnim && this.anims.exists(attackAnim) && (visual.renderedAttackAt !== enemy.lastAttackAt || art.anims.currentAnim?.key !== attackAnim)) {
        visual.renderedAttackAt = enemy.lastAttackAt;
        art.play(attackAnim, false);
      } else if (!this.anims.exists(attackAnim)) {
        art.stop();
        art.setTexture(texture);
      }
    } else {
      if (art.anims.isPlaying) art.stop();
      if (art.texture.key !== texture || dog) art.setTexture(texture, 0);
    }

    shadow.setPosition(enemy.x, enemy.y);
    const enemyShadowScale = (baseWidth / 138) * 1.18 * (1 - enemy.z / 600) * (walking ? 0.98 + Math.abs(walkStride) * 0.06 : 1);
    shadow.setScale(enemyShadowScale, enemyShadowScale * 0.5).setAlpha(0.35 * (1 - enemy.z / 600));

    const walkWidth = dog || kiberaGoon ? baseWidth : heavy ? 240 : baseWidth * 1.55;
    const walkHeight = dog || kiberaGoon ? baseHeight : heavy ? 240 : baseHeight * 1.22;
    const attackWidth = stone ? 205 : shield ? 224 : dog ? 270 : heavy ? 270 : enemy.visualVariant === 'gameplay-goon-club' ? baseWidth * 2.1 : baseWidth * 1.9;
    const attackHeight = stone ? 218 : shield ? 236 : dog ? 150 : heavy ? 270 : baseHeight * (enemy.visualVariant === 'gameplay-goon-club' ? 1.32 : 1.28);
    const attackOffset = stone ? 24 : shield ? 32 : dog ? 38 : heavy ? 30 : enemy.visualVariant === 'gameplay-goon-club' ? 34 : 24;
    const artYOffset = dog ? 42 : kiberaGoon ? (striking ? attackHeight : baseHeight) * 0.48 : heavy ? (striking ? 120 : walking ? 106 : 91) : 68;
    const guardBob = fighting && !striking ? Math.sin(time / 130 + index) * 1.5 : 0;

    art
      .setPosition(
        enemy.x + (striking ? attackDirection * attackOffset : walkX),
        enemy.y - artYOffset - enemy.z - walkLift + (striking ? (dog || heavy || kiberaGoon ? 0 : 8) : guardBob),
      )
      .setDisplaySize(striking ? attackWidth : walking ? walkWidth : baseWidth, striking ? attackHeight : walking ? walkHeight : baseHeight)
      .setFlipX(striking ? attackDirection < 0 : walking ? enemy.x > this.player.x : enemy.x < this.player.x)
      .setAlpha(hit ? 0.76 : 1)
      .setTint(hit ? 0xffcccc : 0xffffff)
      .setAngle(0);

    shadow.setDepth(enemy.y - 2);
    art.setDepth(enemy.y - 1);
  }

  private getEnemyAttackAnimationKey(variant: EnemyVisualVariant) {
    if (variant === 'gameplay-attack-dog') return 'attack-dog-attack';
    if (variant === 'gameplay-goon-chain') return 'goon-chain-attack';
    if (variant === 'gameplay-goon-heavy') return 'goon-heavy-attack';
    if (variant === 'gameplay-kibera-stone-goon') return 'kibera-stone-throw';
    if (variant === 'gameplay-kibera-shield-goon') return 'kibera-shield-combo';
    if (variant === 'gameplay-goon-club') return 'goon-club-attack';
    if (variant === 'gameplay-goon-hoodie') return 'goon-hoodie-attack';
    return 'goon-red-attack';
  }

  private getEnemyWalkAnimationKey(variant: EnemyVisualVariant) {
    if (variant === 'gameplay-kibera-stone-goon') return 'kibera-stone-walk';
    if (variant === 'gameplay-kibera-shield-goon') return 'kibera-shield-walk';
    if (variant === 'gameplay-attack-dog') return 'attack-dog-run';
    if (variant === 'gameplay-goon-chain') return 'goon-chain-walk';
    if (variant === 'gameplay-goon-heavy') return 'goon-heavy-walk';
    if (variant === 'gameplay-goon-club') return 'goon-club-walk';
    if (variant === 'gameplay-goon-hoodie') return 'goon-hoodie-walk';
    return 'goon-red-walk';
  }

  private getEnemyRunAnimationKey(variant: EnemyVisualVariant) {
    if (variant === 'gameplay-kibera-stone-goon') return 'kibera-stone-sprint';
    if (variant === 'gameplay-kibera-shield-goon') return 'kibera-shield-sprint';
    if (variant === 'gameplay-attack-dog') return 'attack-dog-run';
    if (variant === 'gameplay-goon-chain') return 'goon-chain-walk';
    if (variant === 'gameplay-goon-heavy') return 'goon-heavy-walk';
    if (variant === 'gameplay-goon-club') return 'goon-club-run';
    if (variant === 'gameplay-goon-hoodie') return 'goon-hoodie-run';
    return 'goon-red-run';
  }

  private getEnemyDefeatAnimationKey(variant: EnemyVisualVariant) {
    if (variant === 'gameplay-attack-dog') return 'attack-dog-defeat';
    if (variant === 'gameplay-goon-chain') return 'goon-chain-defeat';
    if (variant === 'gameplay-goon-heavy') return 'goon-heavy-defeat';
    return '';
  }

  private getPlayerAngle() {
    if (this.player.state === 'special' || this.player.state === 'jump') return -4 * this.player.facing;
    if (this.player.state === 'kick') return -2 * this.player.facing;
    if (this.player.state === 'punch') return 3 * this.player.facing;
    if (this.player.state === 'hit') return -5 * this.player.facing;
    return 0;
  }
}














