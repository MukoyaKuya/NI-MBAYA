import { getDailyRewardBalance } from '../config/DailyChallenge';
import Phaser from 'phaser';
import { startStreamingMusic } from '../systems/StreamingMusic';
import { getStoryLanguage, isSoundEnabled } from '../config/GameSettings';
import { copyFor, FIGHTER_BIOS } from '../config/WorldContent';

const GAME_WIDTH = 1280;
const GAME_HEIGHT = 720;
const FIGHTER_ART = [
  ['menu-mbavu', new URL('../assets/optimized/menu/generated/mbavu.webp', import.meta.url).href],
  ['menu-majembe', new URL('../assets/optimized/menu/generated/majembe.webp', import.meta.url).href],
] as const;

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
  gameCharacter?: 'MBAVU DESTROYER';
  locked: boolean;
  power: number;
  speed: number;
  bounds: [number, number, number, number];
  portrait: [number, number, number, number];
};

type FighterCard = {
  container: Phaser.GameObjects.Container;
  definition: FighterDefinition;
  frame: Phaser.GameObjects.Graphics;
  arrow: Phaser.GameObjects.Text;
  width: number;
};

const FIGHTERS: FighterDefinition[] = [
  {
    id: 'majembe', name: 'MAJEMBE', role: 'STREET FIGHTER', artKey: 'menu-mbavu',
    gameCharacter: 'MBAVU DESTROYER', locked: false, power: 4, speed: 4,
    bounds: [86, 60, 713, 1599], portrait: [174, 38, 568, 336],
  },
  {
    id: 'mbavu', name: 'MBAVU', role: 'DEFEAT HIM TO UNLOCK', artKey: 'menu-majembe',
    locked: true, power: 5, speed: 3,
    bounds: [211, 19, 540, 1499], portrait: [235, 10, 614, 364],
  },
];

export class CharacterSelectScene extends Phaser.Scene {
  private selectedIndex = 0;
  private startData: CharacterSelectData = {};
  private cards: FighterCard[] = [];
  private menuMusic?: Phaser.Sound.BaseSound;
  private hoverSound?: Phaser.Sound.BaseSound;
  private lastHoverAt = -1000;
  private fighterProfileText?: Phaser.GameObjects.Text;
  private hero!: Phaser.GameObjects.Image;
  private heroName!: Phaser.GameObjects.Text;
  private heroRole!: Phaser.GameObjects.Text;
  private stats!: Phaser.GameObjects.Graphics;
  private selectBackground!: Phaser.GameObjects.Graphics;
  private selectCaption!: Phaser.GameObjects.Text;
  private selectArrow!: Phaser.GameObjects.Graphics;
  private confirming = false;

  constructor() { super('CharacterSelectScene'); }

  preload() {
    if (!this.textures.exists('selection-nairobi-background')) {
      this.load.image('selection-nairobi-background', new URL('../assets/optimized/gameplay/generated/nairobi-cbd-background.webp', import.meta.url).href);
    }
    if (!this.textures.exists('gameplay-chapati-health-pickup-sheet')) {
      this.load.spritesheet('gameplay-chapati-health-pickup-sheet', new URL('../assets/optimized/gameplay/generated/chapati-health-pickup-sheet.webp', import.meta.url).href, { frameWidth: 384, frameHeight: 384 });
    }
    FIGHTER_ART.forEach(([key, url]) => {
      if (!this.textures.exists(key)) this.load.image(key, url);
    });
  }

  create(data: CharacterSelectData = {}) {
    this.startData = { ...data, character: 'MBAVU DESTROYER' };
    this.selectedIndex = 0;
    this.confirming = false;
    this.cards = [];
    this.cameras.main.setBackgroundColor('#07090c');
    this.add.image(640, 360, 'selection-nairobi-background').setDisplaySize(GAME_WIDTH, GAME_HEIGHT).setDepth(-20);
    this.add.rectangle(640, 360, GAME_WIDTH, GAME_HEIGHT, 0x030509, 0.10).setDepth(-19);
    this.startMenuAudio();
    this.preparePortraitFrames();
    this.createHeroPreview();
    this.createDetailsPanel();
    this.createHeader();
    FIGHTERS.forEach((fighter, index) => this.createFighterCard(fighter, index));
    this.createFighterProfile();
    this.createSelectButton();
    this.updateCardLayout();
    this.input.keyboard?.on('keydown-LEFT', () => this.changeSelection(-1));
    this.input.keyboard?.on('keydown-RIGHT', () => this.changeSelection(1));
    this.input.keyboard?.on('keydown-UP', () => this.changeSelection(-1));
    this.input.keyboard?.on('keydown-DOWN', () => this.changeSelection(1));
    this.input.keyboard?.on('keydown-ESC', () => this.goBack());
    this.input.keyboard?.on('keydown-ENTER', () => this.confirmSelection());
    this.input.keyboard?.on('keydown-SPACE', () => this.confirmSelection());
  }

  private preparePortraitFrames() {
    for (const fighter of FIGHTERS) {
      const texture = this.textures.get(fighter.artKey);
      if (!texture.has('selection-hero')) texture.add('selection-hero', 0, ...fighter.bounds);
      if (!texture.has('selection-head')) texture.add('selection-head', 0, ...fighter.portrait);
    }
  }

  private displayText(x: number, y: number, text: string, size: number, color = '#fff2d4') {
    return this.add.text(x, y, text, {
      fontFamily: 'Impact, Arial Black, sans-serif', fontSize: `${size}px`,
      fontStyle: 'italic', color,
      padding: { left: 3, right: Math.ceil(size * 0.3), top: 2, bottom: 2 },
    });
  }

  private fitText(text: Phaser.GameObjects.Text, width: number) {
    text.setScale(Math.min(1, width / Math.max(text.width, 1)), 1);
  }

  private createHeroPreview() {
    this.add.ellipse(454, 699, 260, 27, 0x000000, 0.46).setDepth(2);
    this.hero = this.add.image(454, 702, 'menu-mbavu', 'selection-hero')
      .setOrigin(0.5, 1).setDepth(4).setName('fighter-hero');
    const title = this.add.container(37, 498).setAngle(-8).setDepth(12);
    const streak = this.add.graphics();
    streak.fillStyle(0x060606, 0.92).fillPoints([
      new Phaser.Geom.Point(-10, 82), new Phaser.Geom.Point(510, 84),
      new Phaser.Geom.Point(526, 141), new Phaser.Geom.Point(-20, 136),
    ], true);
    streak.fillStyle(0xffbf0a, 1).fillPoints([
      new Phaser.Geom.Point(-4, 105), new Phaser.Geom.Point(490, 98),
      new Phaser.Geom.Point(502, 126), new Phaser.Geom.Point(-12, 132),
    ], true);
    for (let i = 0; i < 45; i++) {
      streak.fillStyle(i % 2 ? 0x050505 : 0xffbf0a, 0.8).fillRect(-12 + i * 12, 128 + i % 4, 9, 2);
    }
    this.heroName = this.displayText(0, -2, '', 110).setStroke('#0a0b0d', 3).setShadow(4, 5, '#000000', 0, false, true).setName('fighter-hero-name');
    this.heroRole = this.displayText(69, 100, '', 31, '#ffca14').setStroke('#050505', 5);
    title.add([streak, this.heroName, this.heroRole]);
  }

  private createDetailsPanel() {
    const panel = this.add.graphics().setDepth(20);
    panel.fillStyle(0x080b0e, 1).fillPoints([
      new Phaser.Geom.Point(896, 0), new Phaser.Geom.Point(1280, 0),
      new Phaser.Geom.Point(1280, 720), new Phaser.Geom.Point(720, 720),
    ], true);
    // Deterministic grain gives the panel texture without another bitmap download.
    for (let i = 0; i < 900; i++) {
      const y = (i * 137) % 720;
      const x = 900 + ((i * 173) % 380);
      panel.fillStyle(i % 2 ? 0x38404a : 0x000000, 0.11).fillRect(x, y, 1 + i % 3, 1);
    }
    panel.lineStyle(5, 0xffc413, 1).lineBetween(896, 0, 720, 720);
    panel.lineStyle(1, 0x666b6f, 0.7).lineBetween(835, 426, 1253, 426).lineBetween(831, 507, 1253, 507);
  }

  private createHeader() {
    const back = this.add.container(77, 41).setDepth(40).setName('fighter-back');
    const bg = this.add.graphics();
    bg.fillStyle(0xffc413).lineStyle(2, 0x322510).fillRoundedRect(-54, -22, 108, 44, 5).strokeRoundedRect(-54, -22, 108, 44, 5);
    bg.fillStyle(0x080b0d).fillTriangle(-36, 0, -27, -8, -27, 8);
    back.add([bg, this.displayText(-18, -15, 'BACK', 24, '#080b0d')]).setSize(108, 44).setInteractive({ useHandCursor: true });
    back.on('pointerdown', () => { this.playSelectSound(); this.goBack(); });
    back.on('pointerover', () => back.setScale(1.03));
    back.on('pointerout', () => back.setScale(1));
    const heading = this.displayText(900, 79, 'CHOOSE YOUR FIGHTER', 32, '#ffc413').setDepth(30);
    this.fitText(heading, 354);
    const underline = this.add.graphics().setDepth(30);
    underline.lineStyle(3, 0xffc413).lineBetween(900, 122, 1253, 122);
    underline.lineStyle(1, 0xffc413, 0.45).lineBetween(907, 126, 1248, 124);
    const wallet = this.add.container(1172, 38).setDepth(30).setName('fighter-wallet');
    const walletBg = this.add.graphics();
    walletBg.fillStyle(0x070b10, 0.98).lineStyle(1.5, 0xffc413).fillRoundedRect(-82, -22, 164, 44, 7).strokeRoundedRect(-82, -22, 164, 44, 7);
    const chapati = this.add.image(-59, 0, 'gameplay-chapati-health-pickup-sheet', 0).setDisplaySize(31, 31);
    const amount = this.displayText(8, -17, ((this.startData.chapatis ?? 0) + getDailyRewardBalance()).toLocaleString(), 28, '#ffffff')
      .setOrigin(0.5, 0).setName('fighter-wallet-amount');
    wallet.add([walletBg, chapati, amount]);
  }

  private createFighterCard(definition: FighterDefinition, index: number) {
    const width = index === 0 ? 390 : 420;
    const container = this.add.container(index === 0 ? 1060 : 1045, index === 0 ? 205 : 345)
      .setDepth(30).setName(`fighter-card-${definition.id}`);
    const frame = this.add.graphics();
    const portrait = this.add.image(-width / 2 + 20, -58, definition.artKey, 'selection-head')
      .setOrigin(0, 0).setDisplaySize(196, 116);
    if (definition.locked) portrait.setTint(0x777777);
    const name = this.displayText(8, 17, definition.name, 29, definition.locked ? '#a7adb7' : '#fff5df');
    this.fitText(name, 151);
    const arrow = this.displayText(width / 2 - 39, -28, '›', 52, definition.locked ? '#59616d' : '#ffc413').setFontFamily('Arial, sans-serif').setFontStyle('bold');
    container.add([frame, portrait, name, arrow]);
    if (definition.locked) {
      const lock = this.add.graphics();
      lock.lineStyle(4, 0xffc413).strokeRoundedRect(54, -28, 17, 22, 8);
      lock.fillStyle(0xffc413).fillRoundedRect(48, -16, 29, 24, 4);
      lock.fillStyle(0x151515).fillCircle(62, -6, 3).fillRect(61, -6, 3, 8);
      container.add([lock, this.displayText(8, 48, 'DEFEAT HIM TO UNLOCK', 10, '#a7adb7')]);
    }
    container.setSize(width, 124).setInteractive({ useHandCursor: true });
    container.on('pointerover', () => { this.playHoverSound(); arrow.setX(width / 2 - 35); });
    container.on('pointerout', () => arrow.setX(width / 2 - 39));
    container.on('pointerdown', () => {
      this.playSelectSound();
      this.selectedIndex = index;
      this.updateCardLayout();
    });
    this.cards.push({ container, definition, frame, arrow, width });
  }

  private createFighterProfile() {
    this.stats = this.add.graphics().setDepth(30);
    this.displayText(861, 441, 'PWR', 18).setDepth(30);
    this.displayText(861, 472, 'SPD', 18).setDepth(30);
    this.displayText(830, 520, 'FIGHTER PROFILE', 17, '#ffc413').setDepth(30);
    this.fighterProfileText = this.add.text(831, 550, '', {
      fontFamily: 'Arial, sans-serif', fontSize: '17px', color: '#f4f4f2',
      wordWrap: { width: 414 }, lineSpacing: 5,
    }).setDepth(30).setName('fighter-profile');
  }

  private drawStat(y: number, color: number, value: number) {
    for (let i = 0; i < 5; i++) {
      this.stats.fillStyle(i < value ? color : 0x242a33).fillRoundedRect(939 + i * 47, y, 37, 15, 3);
    }
  }

  private createSelectButton() {
    const button = this.add.container(1034, 644).setDepth(40).setSize(440, 74)
      .setInteractive({ useHandCursor: true }).setName('fighter-select');
    this.selectBackground = this.add.graphics();
    this.selectCaption = this.displayText(0, -31, 'SELECT', 49, '#060809').setOrigin(0.5, 0);
    this.selectArrow = this.add.graphics({ x: 178, y: 0 });
    button.add([this.selectBackground, this.selectCaption, this.selectArrow]);
    button.on('pointerover', () => { this.playHoverSound(); this.selectArrow.setX(183); });
    button.on('pointerout', () => this.selectArrow.setX(178));
    button.on('pointerdown', () => { this.playSelectSound(); this.confirmSelection(); });
  }

  private updateCardLayout() {
    const fighter = this.cards[this.selectedIndex].definition;
    this.hero.setTexture(fighter.artKey, 'selection-hero').setScale(660 / fighter.bounds[3])
      .setTint(fighter.locked ? 0x888888 : 0xffffff);
    this.heroName.setText(fighter.name);
    this.fitText(this.heroName, 570);
    this.heroRole.setText(fighter.role);
    this.fitText(this.heroRole, 475);
    this.cards.forEach((card, index) => {
      const selected = index === this.selectedIndex;
      const left = -card.width / 2;
      card.frame.clear().fillStyle(selected ? 0x1b1a12 : 0x0a0d11, 0.97)
        .lineStyle(selected ? 3 : 1.5, selected ? 0xffc413 : 0x5a5d61);
      const points = [new Phaser.Geom.Point(left + 23, -62), new Phaser.Geom.Point(card.width / 2, -62), new Phaser.Geom.Point(card.width / 2, 62), new Phaser.Geom.Point(left, 62)];
      card.frame.fillPoints(points, true).strokePoints(points, true);
      if (selected) {
        card.frame.fillStyle(0xffbf00, 0.18).fillTriangle(left + 24, -59, left + 208, 59, left + 2, 59);
      }
    });
    this.stats.clear();
    this.drawStat(445, 0xff352b, fighter.power);
    this.drawStat(475, 0xffc413, fighter.speed);
    this.fighterProfileText?.setFontSize(17).setText(copyFor(getStoryLanguage(), FIGHTER_BIOS[fighter.id]));
    if (this.fighterProfileText && this.fighterProfileText.height > 51) this.fighterProfileText.setFontSize(15);
    this.selectBackground.clear().fillStyle(fighter.locked ? 0x30343a : 0xffc413).fillPoints([
      new Phaser.Geom.Point(-212, -37), new Phaser.Geom.Point(220, -37),
      new Phaser.Geom.Point(220, 37), new Phaser.Geom.Point(-220, 37),
    ], true);
    this.selectCaption.setText(fighter.locked ? 'LOCKED' : 'SELECT').setColor(fighter.locked ? '#adb2bb' : '#060809');
    this.selectArrow.clear().fillStyle(fighter.locked ? 0xadb2bb : 0x060809).fillPoints([
      new Phaser.Geom.Point(0, -16), new Phaser.Geom.Point(8, -16),
      new Phaser.Geom.Point(21, 0), new Phaser.Geom.Point(8, 16),
      new Phaser.Geom.Point(0, 16), new Phaser.Geom.Point(12, 0),
    ], true);
  }

  private changeSelection(direction: number) {
    this.selectedIndex = Phaser.Math.Wrap(this.selectedIndex + direction, 0, this.cards.length);
    this.updateCardLayout();
  }

  private showLockedToast() {
    const message = this.displayText(1035, 697, 'DEFEAT MBAVU TO UNLOCK', 16, '#ffc413').setOrigin(0.5).setDepth(80);
    this.tweens.add({ targets: message, alpha: 0, delay: 850, duration: 220, onComplete: () => message.destroy() });
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
    if (this.confirming) return;
    const fighter = this.cards[this.selectedIndex]?.definition;
    if (!fighter || fighter.locked || !fighter.gameCharacter) {
      this.cameras.main.shake(120, 0.006);
      this.showLockedToast();
      return;
    }
    this.confirming = true;
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
    startStreamingMusic('menu-music', new URL('../assets/optimized/audio/menu-music.mp3', import.meta.url).href, 0.24);
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
