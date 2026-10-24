import Phaser from 'phaser';
import { stopStreamingMusic } from '../systems/StreamingMusic';
import { getStoryLanguage, isSoundEnabled } from '../config/GameSettings';

type StoryStartData = { character?: string; chapatis?: number; health?: number };

const GAME_WIDTH = 1280;
const GAME_HEIGHT = 720;

type ComicPanel = { chapter: string; background: string; accent: number };

export class StoryCutsceneScene extends Phaser.Scene {
  private startData: StoryStartData = {};
  private panelIndex = 0;
  private storyAudio?: Phaser.Sound.BaseSound;
  private lastHoverAt = -1000;

  constructor() { super('StoryCutsceneScene'); }

  preload() {
    const backgrounds = [
      ['story-chapter1-taken-background', '../assets/optimized/story/chapter-1-taken-background.webp'],
      ['story-chapter2-blocked-background', '../assets/optimized/story/chapter-2-city-blocked-background.webp'],
      ['story-chapter3-rescue-background', '../assets/optimized/story/chapter-3-rescue-background.webp'],
    ] as const;
    backgrounds.forEach(([key, path]) => {
      if (!this.textures.exists(key)) this.load.image(key, new URL(path, import.meta.url).href);
    });
    if (!this.cache.audio.exists('story-intro')) {
      this.load.audio('story-intro', new URL('../assets/optimized/audio/story-intro.mp3', import.meta.url).href);
    }
  }

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
        { chapter: 'SURA 1 — WATEKWA', background: 'story-chapter1-taken-background', accent: 0xe1443f },
        { chapter: 'SURA 2 — JIJI LIMEZUILIWA', background: 'story-chapter2-blocked-background', accent: 0xe1443f },
        { chapter: 'SURA 3 — UOKOAJI', background: 'story-chapter3-rescue-background', accent: 0xe1443f },
      ]
      : [
        { chapter: 'CHAPTER 1 — TAKEN', background: 'story-chapter1-taken-background', accent: 0xe1443f },
        { chapter: 'CHAPTER 2 — THE CITY IS BLOCKED', background: 'story-chapter2-blocked-background', accent: 0xe1443f },
        { chapter: 'CHAPTER 3 — THE RESCUE', background: 'story-chapter3-rescue-background', accent: 0xe1443f },
      ];
  }

  private showPanel() {
    this.children.removeAll();
    const panel = this.panels()[this.panelIndex];
    this.showStoryPanel(panel);
  }

  private showStoryPanel(panel: ComicPanel) {
    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, panel.background)
      .setDisplaySize(GAME_WIDTH, GAME_HEIGHT).setDepth(-4);
    // Keep the story copy crisp and legible over the generated dark alley.
    this.add.rectangle(1102, 360, 356, GAME_HEIGHT, 0x05070b, 0.18).setDepth(-3);

    const divider = this.add.graphics().setDepth(1);
    divider.lineStyle(7, panel.accent, 0.98).lineBetween(916, 0, 772, GAME_HEIGHT);
    divider.lineStyle(2, 0xffc51d, 0.94).lineBetween(929, 0, 785, GAME_HEIGHT);

    const heading = this.add.text(938, 91, panel.chapter, {
      fontFamily: 'Arial Black, Impact, sans-serif', fontSize: '28px', color: '#ffc51d',
      stroke: '#050505', strokeThickness: 5, fontStyle: 'italic', padding: { left: 3, right: 6, top: 2, bottom: 2 },
    }).setOrigin(0, 0.5).setDepth(10);
    if (heading.width > 245) heading.setScale(245 / heading.width, 1);
    this.add.text(1244, 91, `${this.panelIndex + 1}/3`, {
      fontFamily: 'Arial Black, sans-serif', fontSize: '20px', color: '#ffffff', stroke: '#050505', strokeThickness: 4,
    }).setOrigin(1, 0.5).setDepth(10);

    const progress = this.add.graphics().setDepth(10);
    for (let i = 0; i < 3; i++) {
      progress.fillStyle(i <= this.panelIndex ? 0xffc51d : 0x55585d, 1).fillRoundedRect(1182 + i * 28, 117, 22, 8, 4);
    }
    progress.lineStyle(2, panel.accent, 0.95).lineBetween(938, 121, 1162, 121);

    const sw = getStoryLanguage() === 'sw';
    const highlight = '#ffc51d';
    const body = '#f5f7fb';
    const englishLines: Array<Array<[string, string]>>[] = [
      [[['Mbavu Destroyer', highlight], [' has', body]], [['kidnapped ', body], ['Mjaka Mfine,', highlight]], [['your girlfriend, and', body]], [['disappeared with her', body]], [['into his hideout in the city.', body]]],
      [[['To slow you down, he has', body]], [['sent ', body], ['goons', highlight], [' across ', body], ['Nairobi', highlight]], [['to hunt you and stop you', body]], [['from getting to him.', body]]],
      [[['Go find ', body], ['Mbavu Destroyer', highlight]], [['and save your girlfriend.', body]], [['Ensure you teach him a', body]], [['lesson he will never forget.', body]]],
    ];
    const swahiliLines: Array<Array<[string, string]>>[] = [
      [[['Mbavu Destroyer', highlight], [' amemteka', body]], [['Mjaka Mfine', highlight], [', mpenzi wako,', body]], [['na kutoweka naye katika', body]], [['maficho yake jijini.', body]]],
      [[['Ili kukupunguza kasi,', body]], [['ametuma ', body], ['goons', highlight], [' kote ', body], ['Nairobi', highlight]], [['kukuwinda na kukuzuia', body]], [['usimfikie.', body]]],
      [[['Mtafute ', body], ['Mbavu Destroyer', highlight]], [['na umwokoe mpenzi wako.', body]], [['Hakikisha unamfundisha', body]], [['somo ambalo', body]], [['hatalisahau kamwe.', body]]],
    ];
    const lines = (sw ? swahiliLines : englishLines)[this.panelIndex];
    const copyY = sw ? 252 : 236;
    lines.forEach((segments, row) => {
      let x = 930;
      const y = copyY + row * 43;
      const rowObjects = segments.map(([text, color]) => {
        const part = this.add.text(x, y, text, {
          fontFamily: 'Arial, sans-serif', fontSize: '24px', color,
          fontStyle: color === '#ffc51d' ? 'bold' : 'normal',
          stroke: '#08090b', strokeThickness: 2, padding: { left: 1, right: 2, top: 2, bottom: 3 },
        }).setDepth(10);
        x += part.width;
        return part;
      });
      const rowWidth = x - 930;
      if (rowWidth > 335) rowObjects.forEach((part) => part.setScale(335 / rowWidth, 1));
    });

    const swahili = getStoryLanguage() === 'sw';
    const buttonLabel = this.panelIndex === 2
      ? (swahili ? 'ANZA PAMBANO' : 'START THE FIGHT')
      : (swahili ? 'ENDELEA' : 'NEXT');
    this.createButton(GAME_WIDTH - 215, 638, buttonLabel, true);
  }

  private createButton(x: number, y: number, label: string, withArrow = false) {
    const button = this.add.container(x, y).setDepth(30);
    const bg = this.add.graphics();
    bg.fillStyle(0xffc51d).lineStyle(4, 0x050505).fillRoundedRect(-155, -33, 310, 66, 8).strokeRoundedRect(-155, -33, 310, 66, 8);
    const caption = this.add.text(withArrow ? -14 : 0, 0, label, { fontFamily: 'Arial Black', fontSize: '22px', color: '#111111', fontStyle: 'italic' }).setOrigin(0.5);
    const parts: Phaser.GameObjects.GameObject[] = [bg, caption];
    if (withArrow) parts.push(this.add.text(128, -1, '›', { fontFamily: 'Arial, sans-serif', fontSize: '52px', color: '#08090b', fontStyle: 'bold' }).setOrigin(0.5));
    button.add(parts).setSize(310, 66).setInteractive({ useHandCursor: true });
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
    stopStreamingMusic('menu-music');
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
