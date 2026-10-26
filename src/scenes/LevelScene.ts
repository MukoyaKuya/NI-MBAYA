import { PLAYER_ART, PLAYER_DEFEAT_FALL_DISPLAY, PLAYER_FEINT_FRAMES, MJAKA_ART, type PlayerArtSpec } from '../config/PlayerArt';
import { throwEnemyStone } from '../systems/EnemyProjectiles';
import { isEnemyStriking, isEnemyWalking, getEnemyTextureFlip, getEnemyExitMotion } from '../systems/EnemyMotion';
import { getEnemyDefeatPose } from '../systems/EnemyDefeatMotion';
import { createLevelAnimations } from '../systems/LevelAnimations';
import { LEVELS, getLevelDefinition, type LevelDefinition } from '../config/Levels';
import { getGameplayTime } from '../systems/GameplayClock';
import { trackAssetLoading } from '../systems/PerformanceMonitor';
import { separateEnemyCrowd } from '../systems/CrowdSystem';
import { StageRenderer } from '../systems/StageRenderer';
import { HealthPickupSystem } from '../systems/HealthPickupSystem';
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
  fall?: { direction: number; startY: number; width: number; height: number };
  victoryDirection: 1 | -1;
  victoryLaneY: number;
  victoryGone: boolean;
  renderedAttackAt: number;
  walking: boolean;
};

type LevelStartData = {
  levelId?: number;
  character?: string;
  chapatis?: number;
  health?: number;
};

const MAX_SIMULTANEOUS_ENEMY_ATTACKS = 2;
const ENEMY_ATTACK_SLOT_WINDOW = 900;

export class LevelScene extends Phaser.Scene {
  private player!: Player;
  private playerArt!: Phaser.GameObjects.Sprite;
  private playerShadow!: Phaser.GameObjects.Image;
  private currentPlayerArtKey = '';
  private playerDefeatStarted = false;
  private renderedPlayerHit = -1;
  private enemies!: Phaser.Physics.Arcade.Group;
  private enemyList: EnemyGoon[] = [];
  private enemyVisuals: EnemyVisual[] = [];
  private combat!: CombatSystem;
  private healthPickups!: HealthPickupSystem;
  private sounds!: SoundSystem;
  private hud!: HUD;
  private defeatAftermathStarted = false;
  private defeatOverlayShown = false;
  private defeatAftermathElapsed = 0;
  private level!: LevelDefinition;
  private levelCleared = false;
  private transitioningLevel = false;
  private selectedCharacter: PlayableCharacter = 'MBAVU DESTROYER';
  private touchControls?: TouchControls;
  private startData: LevelStartData = {};

  constructor() {
    super('LevelScene');
  }

  init(data: LevelStartData = {}) {
    this.startData = { ...data, character: 'MBAVU DESTROYER' };
  }

  preload() {
    trackAssetLoading(this);
    const levelId = this.startData.levelId ?? 1;
    const character = 'MBAVU DESTROYER';
    loadCoreGameplayAssets(this, levelId, character);
    loadDeferredLevelAssets(this, levelId);
  }

  create(data: LevelStartData = this.startData) {
    this.level = getLevelDefinition(data.levelId ?? 1);
    this.selectedCharacter = 'MBAVU DESTROYER';
    this.levelCleared = false;
    this.transitioningLevel = false;
    this.playerDefeatStarted = false;
    this.renderedPlayerHit = -1;
    this.defeatAftermathStarted = false;
    this.defeatOverlayShown = false;
    this.defeatAftermathElapsed = 0;
    this.enemyList = [];
    this.enemyVisuals = [];

    // A previous clear or defeat can leave the shared Arcade world paused.
    // Always resume it when this scene is started or replayed.
    this.physics.world.resume();
    this.anims.resumeAll();
    this.physics.world.setBounds(0, 0, GAME_WIDTH, GAME_HEIGHT);
    new StageRenderer(this).draw(this.level);

    this.player = new Player(this, 560, GROUND_Y - 64);
    this.player.health = Phaser.Math.Clamp(data.health ?? 100, 1, 100);
    this.player.chapatis = data.chapatis ?? 0;
    this.player.setDepth(10).setVisible(false);
    this.playerShadow = this.add.image(this.player.x, this.player.y, 'shadow').setDepth(2);
    const initialArt = 'gameplay-mbavu-idle';
    this.playerArt = this.add.sprite(this.player.x, this.player.y, initialArt).setDepth(18);
    this.createSceneAnimations();

    this.enemies = this.physics.add.group({ classType: EnemyGoon, runChildUpdate: false });
    this.level.enemies.forEach((config, index) => this.createEnemy(config, index));
    // CrowdSystem provides soft foot-space avoidance without a second collision solver.

    this.sounds = new SoundSystem(this);
    this.healthPickups = new HealthPickupSystem(this, this.player, this.enemyList, this.sounds);
    this.events.on('sfx:player-hurt', this.handlePlayerHurt, this);
    this.events.on('sfx:dog-bark', this.handleDogBark, this);
    this.events.on('enemy:stone-throw', this.handleStoneThrow, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.events.off('sfx:player-hurt', this.handlePlayerHurt, this);
      this.events.off('sfx:dog-bark', this.handleDogBark, this);
      this.events.off('enemy:stone-throw', this.handleStoneThrow, this);
    });
    this.combat = new CombatSystem(this, this.player, this.enemies, this.sounds);
    this.hud = new HUD(
      this,
      this.level.title,
      this.level.location,
      this.selectedCharacter,
      () => this.openCharacterSelect(),
      () => this.scene.start('MainMenuScene'),
    );
    if (this.shouldShowTouchControls()) {
      this.input.addPointer(3);
      this.touchControls = new TouchControls(this);
    }
    this.showLevelIntro();
    this.loadBattleAnimationsInBackground();

    this.cameras.main.setBounds(0, 0, GAME_WIDTH, GAME_HEIGHT);
    performance.mark('ni-mbaya:level-ready');
  }

  update(_time: number, delta: number) {
    const time = getGameplayTime(this);
    // Defeat aftermath must continue even while combat physics is paused.
    if (this.physics.world.isPaused && this.player?.state !== 'defeat') {
      // Clearing combat must not freeze the final enemy halfway through a fall.
      if (this.levelCleared) this.syncGeneratedArt(time);
      return;
    }
    if (this.touchControls) this.player.setTouchIntent(this.touchControls.intent);
    this.player.update(time, delta);

    if (this.player.state === 'defeat') {
      this.updateDefeatAftermath(time, delta);
    } else {
      let recentAttackCount = 0;
      for (const enemy of this.enemyList) {
        if (enemy.lastAttackAt > 0 && time - enemy.lastAttackAt < ENEMY_ATTACK_SLOT_WINDOW) recentAttackCount++;
      }
      let attackSlots = Math.max(0, MAX_SIMULTANEOUS_ENEMY_ATTACKS - recentAttackCount);
      this.enemyList.forEach((enemy) => {
        const previousAttackAt = enemy.lastAttackAt;
        enemy.update(time, this.player, attackSlots > 0);
        if (enemy.lastAttackAt !== previousAttackAt) attackSlots = Math.max(0, attackSlots - 1);
      });
      separateEnemyCrowd(this.enemyList, time);
      this.combat.update(time);
    }

    this.hud.update(this.player, this.enemyList, this.combat.combo);
    this.syncGeneratedArt(time);
    this.healthPickups.update();
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
    trackAssetLoading(this, 'LevelScene (background)');
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
    throwEnemyStone(this, enemy, this.player);
  }

  private showLevelClearOverlay(storyUnlocked: boolean) {
    const nextLevel = LEVELS.find((level) => level.id === this.level.id + 1);
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x030305, 0.22)
      .setScrollFactor(0).setDepth(1890);

    // Clipped corners and diagonal accents match the game's combat HUD.
    const panel = (width: number, height: number, gold = false) => {
      const g = this.add.graphics();
      const x = -width / 2, y = -height / 2, cut = 22;
      const coordinates = [x + cut, y, x + width - cut, y, x + width, y + cut,
        x + width, y + height - cut, x + width - cut, y + height,
        x + cut, y + height, x, y + height - cut, x, y + cut];
      const points = Array.from({ length: coordinates.length / 2 }, (_, i) => ({ x: coordinates[i * 2], y: coordinates[i * 2 + 1] }));
      g.fillStyle(gold ? 0xffd21b : 0x07090c, 0.96).fillPoints(points, true);
      g.lineStyle(9, 0x030405).strokePoints(points, true);
      g.lineStyle(3, 0xffd21b).strokePoints(points, true);
      g.lineStyle(5, gold ? 0x111111 : 0xffd21b);
      g.lineBetween(x + 7, y + 36, x + 36, y + 7);
      g.lineBetween(x + width - 36, y + height - 7, x + width - 7, y + height - 36);
      return g;
    };
    const banner = this.add.container(GAME_WIDTH / 2, 328)
      .setScrollFactor(0).setDepth(1900).setAlpha(0).setScale(0.92);
    const bg = panel(760, 194);
    bg.lineStyle(2, 0xffd21b).lineBetween(-348, 32, 348, 32);
    const title = this.add.text(0, -30, 'LEVEL CLEAR!', {
      fontFamily: 'Impact, Arial Black, sans-serif', fontSize: '94px',
      color: '#ffda16', fontStyle: 'italic', stroke: '#080808', strokeThickness: 2,
    }).setOrigin(0.5);
    const subtitle = this.add.text(0, 64, storyUnlocked ? 'NAIROBI STORY UNLOCKED!' : (nextLevel ? 'AREA SECURED. KEEP MOVING!' : 'ALL LOCATIONS CONQUERED!'), {
      fontFamily: 'Arial Black, sans-serif', fontSize: '28px', color: '#ffffff', fontStyle: 'italic',
    }).setOrigin(0.5);
    banner.add([bg, title, subtitle]);

    const story = LOCATION_STORIES[this.level.id];
    const card = this.add.container(GAME_WIDTH / 2, 499).setScrollFactor(0).setDepth(1901).setAlpha(0);
    const cardBg = panel(840, 108);
    const cardTitle = this.add.text(0, -29, copyFor(getStoryLanguage(), story.title), {
      fontFamily: 'Arial Black, sans-serif', fontSize: '22px', color: '#ffda16', fontStyle: 'italic',
    }).setOrigin(0.5);
    const cardBody = this.add.text(0, 15, copyFor(getStoryLanguage(), story.body), {
      fontFamily: 'Arial, sans-serif', fontSize: '17px', color: '#f5f5f5', align: 'center',
      wordWrap: { width: 750 }, lineSpacing: 4,
    }).setOrigin(0.5);
    card.add([cardBg, cardTitle, cardBody]);
    this.tweens.add({ targets: card, alpha: 1, duration: 260, delay: 180 });

    const button = this.add.container(GAME_WIDTH / 2, 620)
      .setScrollFactor(0).setDepth(1902).setAlpha(0).setScale(0.9);
    const buttonBg = panel(304, 74, true);
    const buttonText = this.add.text(0, -1, nextLevel ? 'NEXT' : 'MAIN MENU', {
      fontFamily: 'Arial Black, sans-serif', fontSize: nextLevel ? '42px' : '30px',
      color: '#080808', fontStyle: 'italic',
    }).setOrigin(0.5);
    button.add([buttonBg, buttonText]);
    button.setSize(304, 74).setInteractive({ useHandCursor: true });
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
    // Arcade groups overwrite body defaults when a member is added, including
    // the constructor's gravity setting. Arena depth is controlled by the AI;
    // world gravity must never pull a goon down between those updates.
    (enemy.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
    this.enemyList.push(enemy);

    const dog = config.variant === 'gameplay-attack-dog';
    const heavy = config.variant === 'gameplay-goon-heavy';
    const stone = config.variant === 'gameplay-kibera-stone-goon';
    const shield = config.variant === 'gameplay-kibera-shield-goon';
    const larger = index === 3 || heavy;
    const width = stone ? 176 : shield ? 196 : dog ? 174 : heavy ? 270 : larger ? 158 : 138;
    const height = stone ? 190 : shield ? 212 : dog ? 116 : heavy ? 270 : larger ? 237 : 207;
    const artYOffset = dog ? 42 : stone || shield ? height * 0.48 : 84;
    const shadow = this.add.image(config.x, GROUND_Y, 'shadow').setDepth(2);
    const art = this.add.sprite(config.x, GROUND_Y - artYOffset, config.variant)
      .setDisplaySize(width, height)
      .setDepth(config.x < this.player.x ? 13 : 15);
    art.setFlipX(getEnemyTextureFlip(config.x > this.player.x, config.variant));
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
      walking: false,
    });
  }

  private syncGeneratedArt(time: number) {
    const spec = this.getPlayerArtSpec(time);
    const hitAnimating = this.player.state === 'hit' && this.anims.exists('mbavu-hit-reaction');
    const falling = this.player.state === 'defeat' && this.anims.exists('mbavu-defeat-fall');
    if (falling) {
      if (!this.playerDefeatStarted) {
        this.playerDefeatStarted = true;
        this.currentPlayerArtKey = 'mbavu-defeat-fall';
        this.tweens.killTweensOf(this.playerArt);
        this.playerArt.play('mbavu-defeat-fall', false);
      }
    } else if (hitAnimating) {
      if (this.currentPlayerArtKey !== 'mbavu-hit-reaction' || this.renderedPlayerHit !== this.player.hitSequence) {
        this.currentPlayerArtKey = 'mbavu-hit-reaction';
        this.renderedPlayerHit = this.player.hitSequence;
        this.playerArt.play('mbavu-hit-reaction', false);
      }
    } else if (this.player.state === 'walk' && this.anims.exists('mbavu-run')) {
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

    if (falling) {
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
        .setAngle(0)
        .setTint(0xffffff);
    } else {
      this.playerDefeatStarted = false;
      this.playerArt
        .setDisplaySize(hitAnimating ? 360 : spec.width, hitAnimating ? 270 : spec.height)
        .setPosition(this.player.x + (hitAnimating ? 0 : spec.xOffset * this.player.facing), this.player.y - (hitAnimating ? 70 : spec.yOffset) - this.player.z + bob + attackLift)
        .setFlipX(this.player.facing < 0)
        .setAlpha(1)
        .setAngle(hitAnimating ? 0 : this.getPlayerAngle());
      this.playerArt.setTint(hitAnimating ? 0xffc3b5 : 0xffffff);
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
    createLevelAnimations(this);
  }

  private updateDefeatAftermath(time: number, delta: number) {
    if (!this.defeatAftermathStarted) {
      this.defeatAftermathStarted = true;
      this.sounds.playPlayerDefeat();
      this.defeatAftermathElapsed = 0;
      this.cameras.main.shake(220, 0.006);
      this.enemyList.forEach((enemy) => enemy.setVelocity(0, 0));
      this.enemyVisuals.forEach((visual) => {
        // Depart from the combat position, toward the nearest edge. Moving to a
        // predetermined lane made the actors jump when the player fell.
        visual.victoryDirection = visual.enemy.x < GAME_WIDTH / 2 ? -1 : 1;
        visual.victoryLaneY = visual.enemy.y;
        visual.enemy.z = 0;
      });
      this.physics.world.pause();
    }

    this.defeatAftermathElapsed += delta;
    const dt = Math.min(delta, 50) / 1000;
    this.enemyVisuals.forEach((visual) => {
      const { enemy } = visual;
      if (enemy.state === 'defeat' || visual.victoryGone) return;

      const motion = getEnemyExitMotion(enemy.visualVariant, this.defeatAftermathElapsed);
      enemy.x += visual.victoryDirection * motion.speed * dt;

      const exitedLeft = visual.victoryDirection < 0 && enemy.x < -180;
      const exitedRight = visual.victoryDirection > 0 && enemy.x > GAME_WIDTH + 180;
      if (exitedLeft || exitedRight) {
        visual.victoryGone = true;
        visual.art.setVisible(false);
        visual.shadow.setVisible(false);
      }
    });

    const fallStillPlaying = this.playerArt.anims.currentAnim?.key === 'mbavu-defeat-fall' && this.playerArt.anims.isPlaying;
    if (!this.defeatOverlayShown && this.defeatAftermathElapsed > 1550 && !fallStillPlaying) {
      this.showDefeatedOverlay();
    }
  }

  private showDefeatedOverlay() {
    this.defeatOverlayShown = true;
    // Phaser caches canvas text when it is created. Wait for the supplied font
    // so a slow download cannot leave the warning rendered in a fallback face.
    if (!document.fonts.check('124px Gorvex')) {
      void document.fonts.load('124px Gorvex').then(() => {
        if (this.scene.isActive()) this.renderDefeatedOverlay();
      }).catch(() => {
        if (this.scene.isActive()) this.renderDefeatedOverlay();
      });
      return;
    }
    this.renderDefeatedOverlay();
  }

  private renderDefeatedOverlay() {
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x050108, 0.28)
      .setScrollFactor(0)
      .setDepth(2000);

    const overlay = document.createElement('div');
    overlay.className = 'defeat-ui';
    overlay.id = 'defeat-ui';
    overlay.setAttribute('role', 'group');
    overlay.setAttribute('aria-label', 'Defeat');

    const warning = document.createElement('h1');
    warning.className = 'defeat-ui__warning';
    warning.setAttribute('aria-label', 'UMEVAMIWA!');
    [...'UMEVAMIWA!'].forEach((letter, index) => {
      const glyph = document.createElement('span');
      glyph.className = 'defeat-ui__letter';
      glyph.setAttribute('aria-hidden', 'true');
      glyph.style.setProperty('--letter-index', String(index));
      glyph.textContent = letter;
      warning.append(glyph);
    });

    const subtitle = document.createElement('p');
    subtitle.className = 'defeat-ui__subtitle';
    subtitle.textContent = 'Goons Wamekupiga Mbavu';

    const button = document.createElement('button');
    button.id = 'defeat-replay';
    button.className = 'defeat-ui__replay';
    button.type = 'button';
    button.setAttribute('aria-label', 'Replay level');
    button.innerHTML = '<span class="defeat-ui__replay-icon" aria-hidden="true">↻</span><span class="defeat-ui__replay-label">REPLAY</span><span class="defeat-ui__replay-arrows" aria-hidden="true">››</span>';
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      if (this.transitioningLevel) return;
      this.transitioningLevel = true;
      this.sounds.playUiSelect();
      button.disabled = true;
      this.physics.world.resume();
      this.anims.resumeAll();
      this.scene.start('LevelScene', {
        levelId: this.level.id,
        chapatis: this.player.chapatis,
        health: 100,
        character: this.selectedCharacter,
      });
    });
    overlay.append(warning, subtitle, button);
    // The fullscreen element is #game. An overlay attached to <body> sits
    // behind that element in fullscreen, even with a larger CSS z-index.
    const gameContainer = this.game.canvas.parentElement ?? document.body;
    gameContainer.append(overlay);

    // Phaser FIT can letterbox the canvas. Match its displayed rectangle so
    // CSS animation and the replay hit target stay aligned at every viewport.
    const positionOverlay = () => {
      const bounds = this.game.canvas.getBoundingClientRect();
      const containerBounds = gameContainer.getBoundingClientRect();
      overlay.style.left = `${bounds.left - containerBounds.left}px`;
      overlay.style.top = `${bounds.top - containerBounds.top}px`;
      overlay.style.transform = `scale(${bounds.width / GAME_WIDTH}, ${bounds.height / GAME_HEIGHT})`;
    };
    positionOverlay();
    window.addEventListener('resize', positionOverlay);
    document.addEventListener('fullscreenchange', positionOverlay);
    this.scale.on(Phaser.Scale.Events.RESIZE, positionOverlay);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      window.removeEventListener('resize', positionOverlay);
      document.removeEventListener('fullscreenchange', positionOverlay);
      this.scale.off(Phaser.Scale.Events.RESIZE, positionOverlay);
      overlay.remove();
    });
  }

  private syncEnemyVisual(visual: EnemyVisual, index: number, time: number) {
    const { enemy, art, shadow, baseWidth, baseHeight } = visual;
    const dog = enemy.visualVariant === 'gameplay-attack-dog';
    const heavy = enemy.visualVariant === 'gameplay-goon-heavy';
    const stone = enemy.visualVariant === 'gameplay-kibera-stone-goon';
    const shield = enemy.visualVariant === 'gameplay-kibera-shield-goon';
    const kiberaGoon = stone || shield;
    const legacyPortrait = enemy.visualVariant === 'gameplay-goon' || enemy.visualVariant === 'gameplay-goon-club' || enemy.visualVariant === 'gameplay-goon-hoodie';

    if (this.player.state === 'defeat' && enemy.state !== 'defeat') {
      if (visual.victoryGone) {
        art.setVisible(false);
        shadow.setVisible(false);
        return;
      }

      art.setVisible(true);
      shadow.setVisible(true);
      const motion = getEnemyExitMotion(enemy.visualVariant, this.defeatAftermathElapsed);
      art.anims.timeScale = motion.timeScale;
      const exitAnim = this.getEnemyExitAnimationKey(enemy.visualVariant);
      if (exitAnim && this.anims.exists(exitAnim) && (art.anims.currentAnim?.key !== exitAnim || !art.anims.isPlaying)) {
        art.play(exitAnim, true);
      } else if (!exitAnim) {
        art.stop();
        art.setTexture(enemy.visualVariant);
      }
      shadow.setPosition(enemy.x, visual.victoryLaneY).setDepth(visual.victoryLaneY - 2).setAlpha(0.28);
      const enemyShadowScale = (baseWidth / 138) * 1.18;
      shadow.setScale(enemyShadowScale, enemyShadowScale * 0.44);
      art
        .setPosition(enemy.x, visual.victoryLaneY - (dog ? 42 : kiberaGoon ? baseHeight * 0.48 : heavy ? 120 : 68))
        .setDisplaySize(legacyPortrait ? baseWidth * 1.55 : baseWidth, legacyPortrait ? baseHeight * 1.22 : baseHeight)
        .setFlipX(getEnemyTextureFlip(visual.victoryDirection < 0, art.texture.key))
        .setAlpha(1)
        .setTint(0xffffff)
        .setAngle(0)
        .setDepth(visual.victoryLaneY - 1);
      return;
    }

    if (enemy.state === 'defeat') {
      art.anims.timeScale = 1;
      if (!visual.defeatStarted) {
        visual.defeatStarted = true;
        art.setAlpha(1).clearTint();
        const defeatAnim = this.getEnemyDefeatAnimationKey(enemy.visualVariant);
        if (defeatAnim && this.anims.exists(defeatAnim)) {
          art.play(defeatAnim, false).setAngle(0);
          if (dog) art.setDisplaySize(260, 164);
          else if (enemy.visualVariant === 'gameplay-goon-heavy') art.setDisplaySize(270, 270);
          else if (enemy.visualVariant === 'gameplay-goon-chain') art.setDisplaySize(300, 230);
        } else {
          // Use a full-body walking frame rather than stretching a portrait or
          // freezing an oversized attack frame. Preserve the standing proportions.
          const walkAnim = this.getEnemyWalkAnimationKey(enemy.visualVariant);
          const restTexture = this.anims.exists(walkAnim)
            ? this.anims.get(walkAnim).frames[0].textureKey : enemy.visualVariant;
          art.stop();
          const width = kiberaGoon ? baseWidth : baseWidth * 1.55;
          const height = kiberaGoon ? baseHeight : baseHeight * 1.22;
          visual.fall = { direction: enemy.x < this.player.x ? -1 : 1, startY: art.y, width, height };
          art.setTexture(restTexture, 0).setDisplaySize(width, height).setAngle(0);
        }
        // Let even the heavy's eight-frame fall finish, then hold the body
        // on the road before fading. Never fade while it is still falling.
        this.tweens.add({ targets: [art, shadow], alpha: 0, delay: 1600, duration: 600, ease: 'Sine.In', onComplete: () => { art.setVisible(false); shadow.setVisible(false); } });
      }
      if (visual.fall) {
        const fall = visual.fall;
        const pose = getEnemyDefeatPose(time - enemy.defeatedAt, fall.width, fall.height, fall.startY, enemy.y + 34, fall.direction);
        const x = Phaser.Math.Clamp(enemy.x + pose.offsetX, pose.halfWidth + 12, GAME_WIDTH - pose.halfWidth - 12);
        art.setPosition(x, pose.y).setAngle(pose.angle).setDepth(enemy.y - 1);
        shadow.setPosition(x, enemy.y + 28).setDepth(enemy.y - 2);
        return;
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
    const walking = isEnemyWalking(enemy, time, visual.walking);
    visual.walking = walking;
    const fighting = enemy.state === 'attack';
    const texture = enemy.visualVariant;
    const attackDirection: 1 | -1 = enemy.x < this.player.x ? 1 : -1;
    const walkPhase = time / 120 + index * 0.75;
    const walkStride = walking ? Math.sin(walkPhase) : 0;
    const striking = isEnemyStriking(enemy, time);
    const body = enemy.body as Phaser.Physics.Arcade.Body;
    art.anims.timeScale = walking
      ? Phaser.Math.Clamp(Math.hypot(body.velocity.x, body.velocity.y) / enemy.moveSpeed, 0.25, 1.4)
      : 1;

    const walkAnim = this.getEnemyWalkAnimationKey(enemy.visualVariant);
    const restTexture = legacyPortrait && walkAnim && this.anims.exists(walkAnim)
      ? this.anims.get(walkAnim).frames[0].textureKey : texture;
    if (walking) {
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
        // Keep the full-body walk frame while optional attack art loads.
        art.setTexture(restTexture, 0);
      }
    } else {
      if (art.anims.isPlaying) art.stop();
      if (art.texture.key !== restTexture || dog || legacyPortrait) art.setTexture(restTexture, 0);
    }

    shadow.setPosition(enemy.x, enemy.y);
    const enemyShadowScale = (baseWidth / 138) * 1.18 * (1 - enemy.z / 600) * (walking ? 0.98 + Math.abs(walkStride) * 0.06 : 1);
    shadow.setScale(enemyShadowScale, enemyShadowScale * 0.5).setAlpha(0.35 * (1 - enemy.z / 600));

    const walkWidth = legacyPortrait ? baseWidth * 1.55 : baseWidth;
    const walkHeight = legacyPortrait ? baseHeight * 1.22 : baseHeight;
    const usingWalkPose = walking || (!striking && restTexture !== texture);
    // Use the same full-body cell size for attacks and their walk-frame fallback.
    // A portrait at this size would appear much larger than the sheet character.
    const attackWidth = legacyPortrait ? walkWidth : stone ? 205 : shield ? 224 : dog ? 270 : heavy ? 270 : baseWidth * 1.9;
    const attackHeight = legacyPortrait ? walkHeight : stone ? 218 : shield ? 236 : dog ? 150 : heavy ? 270 : baseHeight * 1.28;
    const attackOffset = stone ? 24 : shield ? 32 : dog ? 38 : heavy ? 30 : enemy.visualVariant === 'gameplay-goon-club' ? 34 : 24;
    const artYOffset = dog ? 42 : kiberaGoon ? (striking ? attackHeight : baseHeight) * 0.48 : heavy ? 120 : 68;
    const guardBob = fighting && !striking && !walking ? Math.sin(time / 130 + index) * 1.5 : 0;

    art
      .setPosition(
        enemy.x + (striking ? attackDirection * attackOffset : 0),
        enemy.y - artYOffset - enemy.z + (striking ? (dog || heavy || kiberaGoon || legacyPortrait ? 0 : 8) : guardBob),
      )
      .setDisplaySize(striking ? attackWidth : usingWalkPose ? walkWidth : baseWidth, striking ? attackHeight : usingWalkPose ? walkHeight : baseHeight)
      .setFlipX(getEnemyTextureFlip(enemy.flipX, art.texture.key))
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

  private getEnemyExitAnimationKey(variant: EnemyVisualVariant) {
    if (variant === 'gameplay-kibera-stone-goon') return 'kibera-stone-walk';
    if (variant === 'gameplay-kibera-shield-goon') return 'kibera-shield-walk';
    if (variant === 'gameplay-attack-dog') return 'attack-dog-run';
    if (variant === 'gameplay-goon-chain') return 'goon-chain-walk';
    if (variant === 'gameplay-goon-heavy') return 'goon-heavy-walk';
    if (variant === 'gameplay-goon-club') return 'goon-club-walk';
    if (variant === 'gameplay-goon-hoodie') return 'goon-hoodie-walk';
    return 'goon-red-walk';
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













