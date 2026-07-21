import Phaser from 'phaser';
import { getStoryLanguage, isSoundEnabled } from '../config/GameSettings';
import { copyFor, FIGHTER_BIOS } from '../config/WorldContent';

const GAME_WIDTH = 1280;
const GAME_HEIGHT = 720;
const CARD_Y = 336;
const CARD_WIDTH = 276;
const CARD_HEIGHT = 486;
const CARD_X = [302, 640, 978];

type CharacterSelectData = {
  returnToLevel?: boolean;
  character?: string;
  levelId?: number;
  chapatis?: number;
  health?: number;
};

type FighterDefinition = {
  id: string;
  name: string;
  role: string;
  artKey: string;
  gameCharacter?: 'MBAVU DESTROYER' | 'MJAKA FINE';
  locked: boolean;
  power: number;
  speed: number;
  portraitWidth: number;
  portraitHeight: number;
  portraitY: number;
};

type FighterCard = {
  container: Phaser.GameObjects.Container;
  definition: FighterDefinition;
};

const FIGHTERS: FighterDefinition[] = [
  {
    id: 'majembe', name: 'MAJEMBE', role: 'STREET FIGHTER', artKey: 'menu-mbavu',
    gameCharacter: 'MBAVU DESTROYER', locked: false, power: 4, speed: 4,
    portraitWidth: 230, portraitHeight: 350, portraitY: -66,
  },
  {
    id: 'mjaka', name: 'MJAKA FINE', role: 'RUSH FIGHTER', artKey: 'menu-mjaka',
    gameCharacter: 'MJAKA FINE', locked: false, power: 3, speed: 5,
    portraitWidth: 218, portraitHeight: 350, portraitY: -66,
  },
  {
    id: 'mbavu', name: 'MBAVU', role: 'DEFEAT HIM TO UNLOCK', artKey: 'menu-majembe',
    locked: true, power: 5, speed: 3,
    portraitWidth: 228, portraitHeight: 358, portraitY: -62,
  },
];

export class CharacterSelectScene extends Phaser.Scene {
  private selectedIndex = 0;
  private selectionHalo?: Phaser.GameObjects.Graphics;
  private dots?: Phaser.GameObjects.Container;
  private startData: CharacterSelectData = {};
  private cards: FighterCard[] = [];
  private menuMusic?: Phaser.Sound.BaseSound;
  private hoverSound?: Phaser.Sound.BaseSound;
  private lastHoverAt = -1000;
  private fighterProfileText?: Phaser.GameObjects.Text;

  constructor() {
    super('CharacterSelectScene');
  }

  create(data: CharacterSelectData = {}) {
    this.startData = data;
    this.selectedIndex = data.character === 'MJAKA FINE' ? 1 : 0;
    this.cards = [];
    this.cameras.main.setBackgroundColor('#030507');
    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'menu-v2-background')
      .setDisplaySize(GAME_WIDTH, GAME_HEIGHT).setDepth(-20);
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x02050a, 0.18).setDepth(-19);
    this.startMenuAudio();

    this.createHeader();
    FIGHTERS.forEach((fighter, index) => this.createFighterCard(fighter, index));
    this.createArrowButton(103, CARD_Y, -1);
    this.createArrowButton(GAME_WIDTH - 103, CARD_Y, 1);
    this.createFighterProfile();
    this.createUiButton(GAME_WIDTH / 2, 678, 274, 56, 'SELECT', () => this.confirmSelection(), 29);
    this.updateCardLayout();

    this.input.keyboard?.on('keydown-LEFT', () => this.changeSelection(-1));
    this.input.keyboard?.on('keydown-RIGHT', () => this.changeSelection(1));
    this.input.keyboard?.on('keydown-ESC', () => this.goBack());
    this.input.keyboard?.on('keydown-ENTER', () => this.confirmSelection());
    this.input.keyboard?.on('keydown-SPACE', () => this.confirmSelection());
  }

  private createHeader() {
    this.add.text(GAME_WIDTH / 2, 53, 'CHOOSE YOUR FIGHTER', {
      fontFamily: 'Arial Black, Impact, sans-serif', fontSize: '48px',
      color: '#ffc51d', stroke: '#050505', strokeThickness: 9, fontStyle: 'italic',
    }).setOrigin(0.5).setDepth(30);

    const accent = this.add.graphics().setDepth(29);
    accent.fillStyle(0xffb515, 0.9).fillRect(GAME_WIDTH / 2 - 215, 87, 430, 4);
    accent.fillStyle(0xffffff, 0.35).fillRect(GAME_WIDTH / 2 - 125, 93, 250, 1);

    this.createUiButton(78, 53, 116, 54, '‹  BACK', () => this.goBack(), 20);

    const wallet = this.add.container(1150, 50).setDepth(30);
    const walletBg = this.add.graphics();
    walletBg.fillStyle(0x07101d, 0.94).lineStyle(2, 0xd99b18, 0.9);
    walletBg.fillRoundedRect(-92, -26, 184, 52, 8).strokeRoundedRect(-92, -26, 184, 52, 8);
    const chapati = this.add.image(-62, 0, 'gameplay-chapati-health-pickup-sheet', 0).setDisplaySize(39, 39);
    const amount = this.add.text(12, 0, (this.startData.chapatis ?? 0).toLocaleString(), {
      fontFamily: 'Arial Black', fontSize: '22px', color: '#ffffff', fontStyle: 'italic',
    }).setOrigin(0.5);
    wallet.add([walletBg, chapati, amount]);
  }

  private createFighterCard(definition: FighterDefinition, index: number) {
    const container = this.add.container(CARD_X[Math.min(index, 2)], CARD_Y).setDepth(10);
    const portrait = this.add.image(0, definition.portraitY, definition.artKey)
      .setDisplaySize(definition.portraitWidth, definition.portraitHeight);
    if (definition.locked) portrait.setTint(0xb8b8bd).setAlpha(1);

    const frame = this.createCardFrame();
    const name = this.add.text(0, 130, definition.name, {
      fontFamily: 'Arial Black, Impact, sans-serif',
      fontSize: definition.name.length > 9 ? '22px' : '27px',
      color: definition.locked ? '#c7cbd2' : '#ffffff',
      stroke: '#050505', strokeThickness: 6, fontStyle: 'italic',
    }).setOrigin(0.5);
    const role = this.add.text(0, 162, definition.role, {
      fontFamily: 'Arial Black', fontSize: definition.locked ? '10px' : '11px',
      color: definition.locked ? '#aeb4bf' : '#e4b647', fontStyle: 'italic',
    }).setOrigin(0.5);

    const stats = this.add.graphics();
    this.drawStat(stats, -94, 187, 0xef3d34, definition.power);
    this.drawStat(stats, -94, 207, 0xffba12, definition.speed);
    const pwr = this.add.text(-112, 180, 'PWR', { fontFamily: 'Arial Black', fontSize: '9px', color: '#e7edf7' });
    const spd = this.add.text(-112, 200, 'SPD', { fontFamily: 'Arial Black', fontSize: '9px', color: '#e7edf7' });
    container.add([frame, portrait, stats, name, role, pwr, spd]);

    if (definition.locked) {
      container.add([
        this.add.rectangle(0, -58, 220, 292, 0x020306, 0.16),
        this.add.text(0, -28, '🔒', { fontFamily: 'Arial', fontSize: '55px' }).setOrigin(0.5),
      ]);
    }

    container.setSize(CARD_WIDTH, CARD_HEIGHT).setInteractive({ useHandCursor: true });
    container.on('pointerover', () => {
      this.playHoverSound();
      this.tweens.killTweensOf(container);
      this.tweens.add({ targets: container, scale: 1.035, duration: 110, ease: 'Back.Out' });
    });
    container.on('pointerout', () => {
      this.tweens.killTweensOf(container);
      this.tweens.add({ targets: container, scale: 1, duration: 90, ease: 'Sine.Out' });
    });
    container.on('pointerdown', () => {
      this.playSelectSound();
      this.selectedIndex = index;
      this.updateCardLayout();
      if (definition.locked) this.cameras.main.shake(100, 0.004);
    });
    this.cards.push({ container, definition });
  }

  private createCardFrame() {
    const frame = this.add.graphics();
    frame.fillStyle(0x05070d, 0.9).lineStyle(4, 0xffbd1a, 0.95);
    frame.fillRoundedRect(-CARD_WIDTH / 2, -CARD_HEIGHT / 2, CARD_WIDTH, CARD_HEIGHT, 16)
      .strokeRoundedRect(-CARD_WIDTH / 2, -CARD_HEIGHT / 2, CARD_WIDTH, CARD_HEIGHT, 16);
    frame.lineStyle(2, 0xffffff, 0.35).strokeRoundedRect(
      -CARD_WIDTH / 2 + 9, -CARD_HEIGHT / 2 + 9, CARD_WIDTH - 18, CARD_HEIGHT - 18, 12,
    );
    frame.fillStyle(0xffbd1a, 0.16).fillRect(-CARD_WIDTH / 2 + 12, 74, CARD_WIDTH - 24, 2);
    return frame;
  }

  private createFighterProfile() {
    const profile = this.add.container(GAME_WIDTH / 2, 605).setDepth(35);
    const panel = this.add.graphics();
    panel.fillStyle(0x07101d, 0.96).lineStyle(2, 0xffbd1a, 0.92);
    panel.fillRoundedRect(-450, -29, 900, 58, 10).strokeRoundedRect(-450, -29, 900, 58, 10);
    const label = this.add.text(0, -16, 'FIGHTER PROFILE', {
      fontFamily: 'Arial Black', fontSize: '11px', color: '#ffc51d', fontStyle: 'italic', letterSpacing: 1,
    }).setOrigin(0.5);
    this.fighterProfileText = this.add.text(0, 9, '', {
      fontFamily: 'Arial, sans-serif', fontSize: '15px', color: '#eef4ff', align: 'center',
      wordWrap: { width: 840 }, lineSpacing: 2,
    }).setOrigin(0.5);
    profile.add([panel, label, this.fighterProfileText]);
  }
  private drawStat(graphics: Phaser.GameObjects.Graphics, x: number, y: number, color: number, value: number) {
    for (let i = 0; i < 5; i += 1) {
      graphics.fillStyle(i < value ? color : 0x222936, i < value ? 1 : 0.9);
      graphics.fillRoundedRect(x + 39 + i * 28, y, 23, 8, 2);
    }
  }

  private createArrowButton(x: number, y: number, direction: -1 | 1) {
    const button = this.add.container(x, y).setDepth(40);
    const bg = this.add.circle(0, 0, 32, 0x07101d, 0.92).setStrokeStyle(3, 0xffbd1a);
    const arrow = this.add.text(0, -2, direction < 0 ? '‹' : '›', {
      fontFamily: 'Arial Black', fontSize: '48px', color: '#ffc51d',
    }).setOrigin(0.5);
    button.add([bg, arrow]).setSize(72, 90).setInteractive({ useHandCursor: true });
    button.on('pointerover', () => {
      this.playHoverSound();
      this.tweens.add({ targets: button, scale: 1.12, duration: 90 });
    });
    button.on('pointerout', () => this.tweens.add({ targets: button, scale: 1, duration: 80 }));
    button.on('pointerdown', () => {
      this.playSelectSound();
      this.changeSelection(direction);
    });
  }

  private createUiButton(
    x: number, y: number, width: number, height: number,
    label: string, onClick: () => void, fontSize: number,
  ) {
    const button = this.add.container(x, y).setDepth(40);
    const bg = this.add.graphics();
    bg.fillStyle(0xffbd1a).lineStyle(3, 0x050505);
    bg.fillRoundedRect(-width / 2, -height / 2, width, height, 8)
      .strokeRoundedRect(-width / 2, -height / 2, width, height, 8);
    const text = this.add.text(0, 0, label, {
      fontFamily: 'Arial Black', fontSize: String(fontSize) + 'px',
      color: '#111111', fontStyle: 'italic',
    }).setOrigin(0.5);
    button.add([bg, text]).setSize(width, height).setInteractive({ useHandCursor: true });
    button.on('pointerover', () => {
      this.playHoverSound();
      this.tweens.add({ targets: button, scale: 1.06, duration: 90 });
    });
    button.on('pointerout', () => this.tweens.add({ targets: button, scale: 1, duration: 80 }));
    button.on('pointerdown', () => {
      this.playSelectSound();
      onClick();
    });
    return button;
  }

  private updateCardLayout() {
    const visibleCount = Math.min(3, this.cards.length);
    const windowStart = this.cards.length <= 3
      ? 0
      : Phaser.Math.Clamp(this.selectedIndex - 1, 0, this.cards.length - visibleCount);

    this.cards.forEach((card, index) => {
      const slot = index - windowStart;
      const visible = slot >= 0 && slot < visibleCount;
      card.container.setVisible(visible).setActive(visible);
      if (visible) card.container.setPosition(CARD_X[slot], CARD_Y);
    });
    this.drawSelectionHalo();
    this.drawPageDots(windowStart, visibleCount);
    this.fighterProfileText?.setText(copyFor(getStoryLanguage(), FIGHTER_BIOS[this.cards[this.selectedIndex].definition.id]));
  }

  private drawSelectionHalo() {
    this.selectionHalo?.destroy();
    const selected = this.cards[this.selectedIndex];
    if (!selected?.container.visible) return;
    const color = selected.definition.locked ? 0x9ca4b2 : 0xffc51d;
    this.selectionHalo = this.add.graphics().setDepth(9);
    this.selectionHalo.lineStyle(5, color, 0.95).strokeRoundedRect(
      selected.container.x - CARD_WIDTH / 2 - 7, CARD_Y - CARD_HEIGHT / 2 - 7,
      CARD_WIDTH + 14, CARD_HEIGHT + 14, 18,
    );
    this.selectionHalo.lineStyle(2, 0xffffff, 0.45).strokeRoundedRect(
      selected.container.x - CARD_WIDTH / 2 - 13, CARD_Y - CARD_HEIGHT / 2 - 13,
      CARD_WIDTH + 26, CARD_HEIGHT + 26, 22,
    );
  }

  private drawPageDots(windowStart: number, visibleCount: number) {
    this.dots?.destroy();
    if (this.cards.length <= 3) return;
    this.dots = this.add.container(GAME_WIDTH / 2, 626).setDepth(35);
    for (let slot = 0; slot < visibleCount; slot += 1) {
      const index = windowStart + slot;
      this.dots.add(this.add.circle(
        (slot - (visibleCount - 1) / 2) * 30, 0,
        index === this.selectedIndex ? 7 : 5,
        index === this.selectedIndex ? 0xffbd1a : 0x6b7480,
      ));
    }
  }

  private changeSelection(direction: number) {
    this.selectedIndex = Phaser.Math.Wrap(this.selectedIndex + direction, 0, this.cards.length);
    this.updateCardLayout();
  }

  private showLockedToast() {
    const message = this.add.text(GAME_WIDTH / 2, 615, 'DEFEAT MBAVU TO UNLOCK', {
      fontFamily: 'Arial Black', fontSize: '18px', color: '#ffffff',
      stroke: '#050505', strokeThickness: 5, fontStyle: 'italic',
    }).setOrigin(0.5).setDepth(80);
    this.tweens.add({
      targets: message, alpha: 0, y: 592, delay: 650, duration: 260,
      onComplete: () => message.destroy(),
    });
  }

  private goBack() {
    if (this.startData.returnToLevel) {
      this.scene.start('LevelScene', {
        levelId: this.startData.levelId, chapatis: this.startData.chapatis,
        health: this.startData.health, character: this.startData.character,
      });
      return;
    }
    this.scene.start('MainMenuScene');
  }

  private confirmSelection() {
    const fighter = this.cards[this.selectedIndex]?.definition;
    if (!fighter || fighter.locked || !fighter.gameCharacter) {
      this.cameras.main.shake(120, 0.006);
      this.showLockedToast();
      return;
    }
    if (this.startData.returnToLevel) {
      this.scene.start('LevelScene', {
        character: fighter.gameCharacter,
        levelId: this.startData.levelId,
        chapatis: this.startData.chapatis,
        health: this.startData.health,
      });
      return;
    }
    this.scene.start('StoryCutsceneScene', { character: fighter.gameCharacter, chapatis: 0, health: 100 });
  }

  private startMenuAudio() {
    this.sound.mute = !isSoundEnabled();
    if (!this.cache.audio.exists('menu-music') || !isSoundEnabled()) return;
    this.playMenuMusic();

    const resumeMusic = () => this.playMenuMusic();

    if (this.sound.locked) {
      this.input.once('pointerdown', resumeMusic);
      this.sound.once(Phaser.Sound.Events.UNLOCKED, resumeMusic);
    }

    this.input.keyboard?.once('keydown', resumeMusic);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.hoverSound?.stop();
      this.hoverSound?.destroy();
      this.hoverSound = undefined;
      this.menuMusic = undefined;
    });
  }

  private playMenuMusic() {
    this.menuMusic = this.sound.get('menu-music') ?? this.sound.add('menu-music', { loop: true, volume: 0.24 });
    if (!this.menuMusic.isPlaying) this.menuMusic.play();
  }

  private playHoverSound() {
    if (!isSoundEnabled() || this.sound.locked || !this.cache.audio.exists('ui-hover') || this.time.now - this.lastHoverAt < 90) return;
    this.lastHoverAt = this.time.now;
    this.hoverSound?.stop();
    this.hoverSound?.destroy();
    this.hoverSound = this.sound.add('ui-hover', { volume: 0.38 });
    this.hoverSound.play();
    const sound = this.hoverSound;
    this.time.delayedCall(480, () => {
      if (sound === this.hoverSound) {
        sound.stop();
        sound.destroy();
        this.hoverSound = undefined;
      }
    });
  }

  private playSelectSound() {
    if (!isSoundEnabled() || this.sound.locked || !this.cache.audio.exists('select')) return;
    this.sound.play('select', { volume: 0.85 });
  }
}
