import Phaser from 'phaser';
import { getStoryLanguage, isSoundEnabled } from '../config/GameSettings';

type StoryStartData = { character?: string; chapatis?: number; health?: number };

const GAME_WIDTH = 1280;
const GAME_HEIGHT = 720;

type ComicPanel = { chapter: string; caption: string; background: string; accent: number; art?: string; artX?: number; artScale?: number };

export class StoryCutsceneScene extends Phaser.Scene {
  private startData: StoryStartData = {};
  private panelIndex = 0;
  private storyAudio?: Phaser.Sound.BaseSound;
  private lastHoverAt = -1000;

  constructor() { super('StoryCutsceneScene'); }

  init(data: StoryStartData = {}) { this.startData = data; }

  create() {
    this.startStoryAudio();
    this.showPanel();
    this.input.keyboard?.on('keydown-SPACE', () => this.advance());
    this.input.keyboard?.on('keydown-ENTER', () => this.advance());
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.stopStoryAudio());
  }

  private panels(): ComicPanel[] {
    const sw = getStoryLanguage() === 'sw';
    return sw
      ? [
        { chapter: 'SURA 1 — WATEKWA', caption: 'Mbavu Destroyer amemteka Mjaka Mfine, mpenzi wako, na kutoweka naye katika maficho yake jijini.', background: 'nairobi-cbd-background', accent: 0xe1443f, art: 'menu-mjaka', artX: 960, artScale: 1.08 },
        { chapter: 'SURA 2 — JIJI LIMEZUILIWA', caption: 'Ili kukupunguza kasi, ametuma goons kote Nairobi kukuwinda na kukuzuia usimfikie.', background: 'gameplay-background', accent: 0xffbd1a, art: 'gameplay-goon-club', artX: 925, artScale: 1.05 },
        { chapter: 'SURA 3 — UOKOAJI', caption: 'Mtafute Mbavu Destroyer na umwokoe mpenzi wako. Hakikisha unamfundisha somo ambalo hatalisahau kamwe.', background: 'nairobi-cbd-background', accent: 0x4fa6ff, art: 'menu-majembe', artX: 930, artScale: 1.08 },
      ]
      : [
        { chapter: 'CHAPTER 1 — TAKEN', caption: 'Mbavu Destroyer has kidnapped Mjaka Mfine, your girlfriend, and disappeared with her into his hideout in the city.', background: 'nairobi-cbd-background', accent: 0xe1443f, art: 'menu-mjaka', artX: 960, artScale: 1.08 },
        { chapter: 'CHAPTER 2 — THE CITY IS BLOCKED', caption: 'To slow you down, he has sent goons across Nairobi to hunt you and stop you from getting to him.', background: 'gameplay-background', accent: 0xffbd1a, art: 'gameplay-goon-club', artX: 925, artScale: 1.05 },
        { chapter: 'CHAPTER 3 — THE RESCUE', caption: 'Go find Mbavu Destroyer and save your girlfriend. Ensure you teach him a lesson he will never forget.', background: 'nairobi-cbd-background', accent: 0x4fa6ff, art: 'menu-majembe', artX: 930, artScale: 1.08 },
      ];
  }

  private showPanel() {
    this.children.removeAll();
    const panel = this.panels()[this.panelIndex];
    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, panel.background).setDisplaySize(GAME_WIDTH, GAME_HEIGHT).setDepth(-4);
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x020305, 0.48).setDepth(-3);
    this.add.rectangle(GAME_WIDTH / 2, 82, GAME_WIDTH, 164, 0x020305, 0.82).setDepth(-2);

    const frame = this.add.graphics().setDepth(20);
    frame.lineStyle(8, panel.accent, 0.95).strokeRect(22, 22, GAME_WIDTH - 44, GAME_HEIGHT - 44);
    frame.lineStyle(2, 0xf7e9b6, 0.92).strokeRect(32, 32, GAME_WIDTH - 64, GAME_HEIGHT - 64);
    for (let x = 46; x < GAME_WIDTH - 38; x += 26) frame.lineStyle(1, panel.accent, 0.18).lineBetween(x, 39, x + 18, 25);

    this.add.text(72, 65, panel.chapter, { fontFamily: 'Arial Black, Impact, sans-serif', fontSize: '34px', color: '#ffc51d', stroke: '#050505', strokeThickness: 7, fontStyle: 'italic' }).setOrigin(0, 0.5).setDepth(21);
    this.add.text(GAME_WIDTH - 74, 65, `${this.panelIndex + 1}/3`, { fontFamily: 'Arial Black', fontSize: '20px', color: '#ffffff', stroke: '#050505', strokeThickness: 5 }).setOrigin(1, 0.5).setDepth(21);

    if (panel.art) {
      const character = this.add.image(panel.artX ?? 930, 658, panel.art).setDepth(5).setAlpha(0).setOrigin(0.5, 1);
      // These menu illustrations are authored as large key art. Cap them to
      // a comic-panel height rather than rendering at their native scale.
      character.setScale(Math.min(panel.artScale ?? 0.62, 490 / character.height));
      this.tweens.add({ targets: character, alpha: 1, x: character.x - 24, duration: 420, ease: 'Cubic.Out' });
    }
    this.add.rectangle(0, 0, 650, GAME_HEIGHT, 0x020305, 0.4).setOrigin(0).setDepth(2);
    const captionPanel = this.add.graphics().setDepth(12);
    captionPanel.fillStyle(0x07101d, 0.95).lineStyle(3, panel.accent, 0.9);
    captionPanel.fillRoundedRect(76, 390, 635, 188, 12).strokeRoundedRect(76, 390, 635, 188, 12);
    const captionText = this.add.text(112, 432, panel.caption, { fontFamily: 'Arial, sans-serif', fontSize: '27px', color: '#f5f7fb', wordWrap: { width: 555 }, lineSpacing: 8, stroke: '#050505', strokeThickness: 4 }).setDepth(13).setAlpha(0).setOrigin(0, 0);
    this.tweens.add({ targets: captionText, alpha: 1, duration: 380, delay: 160, ease: 'Sine.Out' });

    this.createButton(GAME_WIDTH - 215, 638, this.panelIndex === 2 ? (getStoryLanguage() === 'sw' ? 'ANZA PAMBANO' : 'START THE FIGHT') : (getStoryLanguage() === 'sw' ? 'ENDELEA' : 'NEXT'));
  }

  private createButton(x: number, y: number, label: string) {
    const button = this.add.container(x, y).setDepth(30);
    const bg = this.add.graphics();
    bg.fillStyle(0xffc51d).lineStyle(4, 0x050505).fillRoundedRect(-155, -33, 310, 66, 8).strokeRoundedRect(-155, -33, 310, 66, 8);
    button.add([bg, this.add.text(0, 0, label, { fontFamily: 'Arial Black', fontSize: '22px', color: '#111111', fontStyle: 'italic' }).setOrigin(0.5)]).setSize(310, 66).setInteractive({ useHandCursor: true });
    button.on('pointerover', () => {
      this.playHoverSound();
      this.tweens.add({ targets: button, scale: 1.06, duration: 90 });
    });
    button.on('pointerout', () => this.tweens.add({ targets: button, scale: 1, duration: 80 }));
    button.on('pointerdown', () => this.advance());
  }

  private advance() {
    this.playSelectSound();
    if (this.panelIndex < this.panels().length - 1) {
      this.panelIndex += 1;
      this.cameras.main.fadeOut(160, 0, 0, 0);
      this.time.delayedCall(170, () => { this.cameras.main.fadeIn(180, 0, 0, 0); this.showPanel(); });
      return;
    }
    this.stopStoryAudio();
    this.scene.start('HowToPlayScene', { ...this.startData, levelId: 1 });
  }

  private startStoryAudio() {
    if (!this.cache.audio.exists('story-intro')) return;
    // The menu soundtrack is shared across scenes. Stop it before the comic
    // score begins so the two tracks cannot play on top of each other.
    const menuMusic = this.sound.get('menu-music');
    menuMusic?.stop();
    menuMusic?.destroy();
    this.storyAudio = this.sound.add('story-intro', { volume: 0.48 });
    this.storyAudio.play();
  }

  private stopStoryAudio() {
    this.storyAudio?.stop();
    this.storyAudio?.destroy();
    this.storyAudio = undefined;
  }

  private playHoverSound() {
    if (!isSoundEnabled() || this.sound.locked || !this.cache.audio.exists('ui-hover') || this.time.now - this.lastHoverAt < 90) return;
    this.lastHoverAt = this.time.now;
    this.sound.play('ui-hover', { volume: 0.3 });
  }

  private playSelectSound() {
    if (!isSoundEnabled() || this.sound.locked || !this.cache.audio.exists('select')) return;
    this.sound.play('select', { volume: 0.8 });
  }
}
