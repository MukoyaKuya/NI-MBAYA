import { getDailyChallenge, getDailyRewardBalance, DAILY_TARGET } from '../config/DailyChallenge';
import Phaser from 'phaser';
import { EnemyGoon, EnemyVisualVariant } from '../entities/EnemyGoon';
import { Player } from '../entities/Player';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/GameConfig';

export type PlayableCharacter = 'MBAVU DESTROYER' | 'MJAKA FINE';

export class HUD {
  private panel: Phaser.GameObjects.Graphics;
  private healthFill: Phaser.GameObjects.Rectangle;
  private healthText: Phaser.GameObjects.Text;
  private enemyFill: Phaser.GameObjects.Rectangle;
  private chapatisText: Phaser.GameObjects.Text;
  private comboNumber: Phaser.GameObjects.Text;
  private comboLabel: Phaser.GameObjects.Text;
  private objectiveCount: Phaser.GameObjects.Text;
  private objectiveLabel: Phaser.GameObjects.Text;
  private objectiveProgress: Phaser.GameObjects.Rectangle;
  private enemyName: Phaser.GameObjects.Text;
  private enemyHealthText: Phaser.GameObjects.Text;
  private pauseText: Phaser.GameObjects.Text;
  private pausedByHud = false;
  private displayedChapatis = Number.NaN;
  private dailyRewardBalance = getDailyRewardBalance();
  private dailyText: Phaser.GameObjects.Text;
  private nextDailyRefreshAt = 0;
  private pauseOverlay?: Phaser.GameObjects.Container;
  private onQuitToMenu?: () => void;

  constructor(
    private scene: Phaser.Scene,
    private levelTitle = 'LEVEL 1',
    private locationName = 'NAIROBI CBD',
    character: PlayableCharacter = 'MBAVU DESTROYER',
    onChangeCharacter?: () => void,
    onQuitToMenu?: () => void,
  ) {
    this.onQuitToMenu = onQuitToMenu;
    this.panel = scene.add.graphics().setScrollFactor(0).setDepth(1080);
    this.drawPanels();
    const daily = getDailyChallenge();
    this.dailyText = scene.add.text(640, 113, `DAILY CHALLENGE  ${daily.defeats}/${DAILY_TARGET}`, {
      fontFamily: 'Arial Black, sans-serif', fontSize: '11px', color: '#ffc51d', stroke: '#07101d', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(1082).setScrollFactor(0);

    const portraitKey = character === 'MJAKA FINE' ? 'menu-mjaka' : 'gameplay-mbavu-idle';
    const displayName = character === 'MBAVU DESTROYER' ? 'MAJEMBE' : character;
    scene.add.rectangle(66, 63, 76, 76, 0x101827, 1).setStrokeStyle(3, 0xffbd1a, 1).setScrollFactor(0).setDepth(1081);
    scene.add.image(66, 66, portraitKey).setDisplaySize(68, 96).setScrollFactor(0).setDepth(1082);
    scene.add.text(112, 20, displayName, { fontFamily: 'Arial Black', fontSize: '17px', color: '#ffffff', fontStyle: 'italic' }).setScrollFactor(0).setDepth(1082);
    scene.add.text(112, 43, 'LEVEL 25  •  FIGHTER', { fontFamily: 'Arial Black', fontSize: '10px', color: '#9fb0c9' }).setScrollFactor(0).setDepth(1082);
    this.healthFill = scene.add.rectangle(112, 66, 164, 13, 0x48df55).setOrigin(0, 0.5).setScrollFactor(0).setDepth(1082);
    this.healthText = scene.add.text(286, 60, '100/100', { fontFamily: 'Arial Black', fontSize: '11px', color: '#ffffff' }).setOrigin(1, 0).setScrollFactor(0).setDepth(1082);

    const changeText = scene.add.text(112, 83, 'CHANGE FIGHTER  ›', { fontFamily: 'Arial Black', fontSize: '10px', color: '#ffc51d' }).setScrollFactor(0).setDepth(1083);
    const changeZone = scene.add.zone(178, 91, 150, 22).setScrollFactor(0).setDepth(1084).setInteractive({ useHandCursor: true });
    changeZone.on('pointerover', () => changeText.setColor('#ffffff'));
    changeZone.on('pointerout', () => changeText.setColor('#ffc51d'));
    changeZone.on('pointerdown', () => {
      (this.scene as any).sounds?.playUiSelect();
      onChangeCharacter?.();
    });

    scene.add.text(482, 27, 'MISSION', {
      fontFamily: 'Arial Black, sans-serif', fontSize: '10px', color: '#ffc51d',
    }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(1083);
    scene.add.text(798, 27, this.levelTitle, {
      fontFamily: 'Arial Black, sans-serif', fontSize: '10px', color: '#b7c8df',
    }).setOrigin(1, 0.5).setScrollFactor(0).setDepth(1083);
    this.objectiveLabel = scene.add.text(482, 48, this.locationName, {
      fontFamily: 'Arial Black, sans-serif', fontSize: '17px', color: '#ffffff', fontStyle: 'italic',
    }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(1082);
    this.objectiveCount = scene.add.text(798, 72, '0 / 0', {
      fontFamily: 'Arial Black, sans-serif', fontSize: '16px', color: '#ffc51d',
    }).setOrigin(1, 0.5).setScrollFactor(0).setDepth(1083);
    scene.add.text(482, 72, 'GOONS DEFEATED', {
      fontFamily: 'Arial, sans-serif', fontSize: '10px', color: '#b7c8df', fontStyle: 'bold',
    }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(1082);
    this.objectiveProgress = scene.add.rectangle(482, 88, 0, 6, 0xffbd1a)
      .setOrigin(0, 0.5).setScrollFactor(0).setDepth(1083);

    scene.add.image(886, 43, 'gameplay-chapati-health-pickup-sheet', 0).setDisplaySize(42, 42).setScrollFactor(0).setDepth(1083);
    scene.add.text(916, 21, 'CHAPATIS', { fontFamily: 'Arial Black', fontSize: '9px', color: '#eabf6a', fontStyle: 'italic' }).setScrollFactor(0).setDepth(1082);
    this.chapatisText = scene.add.text(916, 32, '0', { fontFamily: 'Arial Black', fontSize: '22px', color: '#ffffff', fontStyle: 'italic' }).setScrollFactor(0).setDepth(1082);
    scene.add.text(916, 61, 'COLLECTED', { fontFamily: 'Arial Black', fontSize: '8px', color: '#ffffff' }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(1082);

    this.pauseText = scene.add.text(1219, 42, 'Ⅱ', { fontFamily: 'Arial Black', fontSize: '25px', color: '#ffc51d' }).setOrigin(0.5).setScrollFactor(0).setDepth(1083);
    const pauseZone = scene.add.zone(1219, 42, 60, 60).setScrollFactor(0).setDepth(1084).setInteractive({ useHandCursor: true });
    pauseZone.on('pointerover', () => this.pauseText.setScale(1.12).setColor('#ffffff'));
    pauseZone.on('pointerout', () => this.pauseText.setScale(1).setColor('#ffc51d'));
    pauseZone.on('pointerdown', () => {
      (this.scene as any).sounds?.playUiSelect();
      this.togglePause();
    });
    scene.input.keyboard?.on('keydown-ESC', this.togglePause, this);
    scene.input.keyboard?.on('keydown-P', this.togglePause, this);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      if (this.pausedByHud) {
        scene.physics.world?.resume();
        scene.anims.resumeAll();
        this.pausedByHud = false;
      }
      scene.input.keyboard?.off('keydown-ESC', this.togglePause, this);
      scene.input.keyboard?.off('keydown-P', this.togglePause, this);
    });

    scene.add.text(951, 105, 'CURRENT TARGET', { fontFamily: 'Arial Black', fontSize: '8px', color: '#ffbd1a', fontStyle: 'italic' }).setScrollFactor(0).setDepth(1082);
    this.enemyName = scene.add.text(951, 117, 'BOSSY GOONS', { fontFamily: 'Arial Black', fontSize: '14px', color: '#ffffff', fontStyle: 'italic' }).setScrollFactor(0).setDepth(1082);
    this.enemyFill = scene.add.rectangle(951, 142, 216, 8, 0xf0443b).setOrigin(0, 0.5).setScrollFactor(0).setDepth(1083);
    this.enemyHealthText = scene.add.text(1182, 135, '100%', { fontFamily: 'Arial Black', fontSize: '9px', color: '#ffffff' }).setOrigin(1, 0).setScrollFactor(0).setDepth(1083);

    this.comboNumber = scene.add.text(42, 142, '', { fontFamily: 'Arial Black', fontSize: '74px', color: '#ffc51d', stroke: '#050505', strokeThickness: 8, fontStyle: 'italic' }).setScrollFactor(0).setDepth(1082);
    this.comboLabel = scene.add.text(50, 224, '', { fontFamily: 'Arial Black', fontSize: '25px', color: '#ffffff', stroke: '#050505', strokeThickness: 5, fontStyle: 'italic' }).setScrollFactor(0).setDepth(1082);
  }

  update(player: Player, enemies: EnemyGoon[], combo: number) {
    if (this.scene.time.now >= this.nextDailyRefreshAt) {
      const daily = getDailyChallenge();
      this.dailyText.setText(`DAILY CHALLENGE  ${daily.defeats}/${DAILY_TARGET}${daily.claimed ? '  CLAIMED' : daily.defeats === DAILY_TARGET ? '  COMPLETE' : ''}`);
      this.nextDailyRefreshAt = this.scene.time.now + 1000;
    }
    let aliveCount = 0;
    let currentTarget: EnemyGoon | undefined;
    let nearestDistance = Infinity;
    for (const enemy of enemies) {
      if (enemy.state === 'defeat') continue;
      aliveCount++;
      const distance = Math.abs(enemy.x - player.x);
      if (distance < nearestDistance) {
        currentTarget = enemy;
        nearestDistance = distance;
      }
    }
    const defeated = enemies.length - aliveCount;
    const health = Phaser.Math.Clamp(player.health, 0, 100);
    this.healthFill.width = 164 * (health / 100);
    this.healthFill.setFillStyle(health > 55 ? 0x48df55 : health > 25 ? 0xffbd1a : 0xf02d3a);
    this.healthText.setText(`${Math.ceil(health)}/100`);
    this.objectiveCount.setText(`${defeated} / ${enemies.length}`);
    this.objectiveProgress.width = 316 * (defeated / Math.max(enemies.length, 1));
    this.objectiveLabel.setText(aliveCount > 0 ? this.locationName : 'AREA CLEAR');
    this.objectiveLabel.setColor(aliveCount > 0 ? '#ffffff' : '#70e6a0');
    this.objectiveProgress.setFillStyle(aliveCount > 0 ? 0xffbd1a : 0x70e6a0);

    if (currentTarget) {
      const targetHealth = Phaser.Math.Clamp(currentTarget.health / Math.max(currentTarget.maxHealth, 1), 0, 1);
      this.enemyName.setText(this.getEnemyName(currentTarget.visualVariant));
      this.enemyFill.width = 216 * targetHealth;
      this.enemyHealthText.setText(`${Math.ceil(targetHealth * 100)}%`);
    } else {
      this.enemyName.setText('AREA CLEAR');
      this.enemyFill.width = 0;
      this.enemyHealthText.setText('0%');
    }

    const totalChapatis = player.chapatis + this.dailyRewardBalance;
    if (totalChapatis !== this.displayedChapatis) {
      this.displayedChapatis = totalChapatis;
      this.chapatisText.setText(totalChapatis.toLocaleString());
    }
    this.comboNumber.setText(combo > 1 ? String(combo) : '');
    this.comboLabel.setText(combo > 1 ? 'HITS!\nAWESOME!' : '');
  }

  private getEnemyName(variant: EnemyVisualVariant) {
    if (variant === 'gameplay-attack-dog') return 'ATTACK DOG';
    if (variant === 'gameplay-goon-chain') return 'CHAIN GOON';
    if (variant === 'gameplay-goon-heavy') return 'TYRE-IRON HEAVY';
    if (variant === 'gameplay-goon-club') return 'CBD GOON';
    if (variant === 'gameplay-goon-hoodie') return 'NGARA GOON';
    if (variant === 'gameplay-kibera-stone-goon') return 'KIBERA STONE THROWER';
    if (variant === 'gameplay-kibera-shield-goon') return 'KIBERA SHIELD GOON';
    return 'BOSSY GOONS';
  }

  private togglePause() {
    if (this.pausedByHud) {
      this.pausedByHud = false;
      this.scene.physics.world.resume();
      this.scene.anims.resumeAll();
      this.pauseOverlay?.destroy();
      this.pauseOverlay = undefined;
      this.pauseText.setText('Ⅱ');
      return;
    }

    // Clear/defeat pauses belong to the level, not the pause menu.
    if (this.scene.physics.world.isPaused) return;
    this.pausedByHud = true;
    this.scene.physics.world.pause();
    this.scene.anims.pauseAll();
    this.pauseText.setText('▶');
    const overlay = this.scene.add.container(0, 0).setScrollFactor(0).setDepth(1070);
    const shade = this.scene.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x03050a, 0.48);
    const label = this.scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 88, 'PAUSED', { fontFamily: 'Arial Black', fontSize: '64px', color: '#ffc51d', stroke: '#050505', strokeThickness: 8, fontStyle: 'italic' }).setOrigin(0.5);
    const hint = this.scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 34, 'PRESS ESC OR P TO RESUME', { fontFamily: 'Arial Black', fontSize: '16px', color: '#ffffff' }).setOrigin(0.5);
    overlay.add([shade, label, hint]);
    const makeButton = (y: number, text: string, action: () => void, primary = false) => {
      const button = this.scene.add.container(GAME_WIDTH / 2, y);
      const bg = this.scene.add.rectangle(0, 0, 240, 48, primary ? 0xffbd1a : 0x111a28, 0.98).setStrokeStyle(2, 0xffbd1a, 1);
      const caption = this.scene.add.text(0, 0, text, { fontFamily: 'Arial Black', fontSize: '18px', color: primary ? '#080a0f' : '#ffffff' }).setOrigin(0.5);
      button.add([bg, caption]).setSize(240, 48).setInteractive({ useHandCursor: true });
      button.on('pointerover', () => button.setScale(1.04));
      button.on('pointerout', () => button.setScale(1));
      button.on('pointerdown', action);
      overlay.add(button);
    };
    makeButton(GAME_HEIGHT / 2 + 25, 'RESUME', () => this.togglePause(), true);
    makeButton(GAME_HEIGHT / 2 + 84, 'MAIN SCREEN', () => this.onQuitToMenu?.());
    makeButton(GAME_HEIGHT / 2 + 143, 'EXIT GAME', () => this.scene.scene.start('ExitScene'));
    this.pauseOverlay = overlay;
  }

  private drawPanels() {
    const g = this.panel;
    g.clear();
    this.drawCutPanel(g, 16, 14, 330, 96, 0x07101d, 0xff9d16, 0.94);
    // Keep the mission header inside the card, with room for a full-width progress track.
    this.drawCutPanel(g, 462, 13, 356, 87, 0x07101d, 0xffbd1a, 0.97);
    g.fillStyle(0xffbd1a, 0.12);
    g.fillRect(478, 18, 324, 19);
    this.drawCutPanel(g, 850, 13, 174, 58, 0x07101d, 0xc57b24, 0.94);
    this.drawCutPanel(g, 1188, 12, 64, 62, 0x07101d, 0xffbd1a, 0.94);
    this.drawCutPanel(g, 936, 94, 278, 61, 0x07101d, 0xf0443b, 0.92);
    g.fillStyle(0x172033, 0.95);
    g.fillRect(112, 60, 164, 13);
    g.fillRect(482, 85, 316, 6);
    g.fillRect(951, 138, 216, 8);
  }

  private drawCutPanel(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number, fill: number, stroke: number, alpha: number) {
    g.fillStyle(fill, alpha);
    g.lineStyle(2, stroke, 0.95);
    g.beginPath();
    g.moveTo(x + 14, y);
    g.lineTo(x + w - 8, y);
    g.lineTo(x + w, y + 9);
    g.lineTo(x + w - 14, y + h);
    g.lineTo(x + 8, y + h);
    g.lineTo(x, y + h - 9);
    g.closePath();
    g.fillPath();
    g.strokePath();
  }
}
