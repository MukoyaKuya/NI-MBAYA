import Phaser from 'phaser';
import { getStoryLanguage, isSoundEnabled, toggleStoryLanguage } from '../config/GameSettings';
import { getUnlockedStoryIds } from '../config/GameProgress';

const GAME_WIDTH = 1280;
const GAME_HEIGHT = 720;

export class CultureScene extends Phaser.Scene {
  constructor() {
    super('CultureScene');
  }

  preload() {
    if (!this.textures.exists('culture-world-background')) {
      this.load.image('culture-world-background', new URL('../assets/optimized/culture/generated/world-background-v1.webp', import.meta.url).href);
    }
  }

  create() {
    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'culture-world-background').setDisplaySize(GAME_WIDTH, GAME_HEIGHT).setDepth(-2);
    this.drawContent();
    this.input.keyboard?.on('keydown-ESC', () => this.scene.start('MainMenuScene'));
  }

  private drawContent() {
    const sw = getStoryLanguage() === 'sw';
    const heading = sw ? 'ULIMWENGU WA NI MBAYA' : 'THE WORLD OF NI MBAYA';
    const intro = sw
      ? 'Mchezo wa mapigano wa kivinjari unaoweka wahusika na maeneo yaliyochochewa na Nairobi katikati ya uzoefu.'
      : 'A browser fighting game that puts Nairobi-inspired characters and places at the centre of the experience.';
    const about = sw
      ? 'Hii ni kazi ya ubunifu, si mwakilishi rasmi wa maeneo au jamii za Nairobi. Tunajenga kwa heshima, utafiti na nafasi ya kuboresha kwa maoni.'
      : 'This is creative fiction, not an official representation of Nairobi neighbourhoods or communities. It is built with respect, research, and room to improve through feedback.';
    const audience = sw
      ? 'KWA NANI: Wachezaji wanaotaka mchezo wa action unaopatikana kirahisi na waumbaji wanaoona simulizi za Afrika zinaweza kuwa katikati ya mchezo.'
      : 'FOR: Players who want accessible action, and creators who want African stories to be central—not background—in games.';

    const title = this.add.text(GAME_WIDTH / 2, 223, heading, {
      fontFamily: 'Impact, Arial Black, sans-serif', fontSize: '80px', color: '#ffc51d',
      fontStyle: 'italic', stroke: '#341f00', strokeThickness: 1,
      shadow: { offsetX: 1, offsetY: 4, color: '#000000', blur: 4, fill: true },
    }).setOrigin(0.5);
    title.setScale(786 / title.width, 1);
    this.add.text(GAME_WIDTH / 2, 271, sw ? 'MICHEZO • NAIROBI • UBUNIFU' : 'GAMES • NAIROBI • CREATIVE FICTION', {
      fontFamily: 'Arial Black, sans-serif', fontSize: '15px', color: '#f1efeb',
    }).setLetterSpacing(2.4).setOrigin(0.5);

    this.drawRule(293);
    this.addCopy(334, intro, 26, '#f1f0ed', 66, true);
    this.drawRule(377);
    this.addCopy(414, about, 19, '#e1e1dd', 58);
    this.drawRule(453);
    this.addCopy(489, audience, 20, '#ffdc37', 52);
    this.drawRule(527);

    const storyCount = getUnlockedStoryIds().length;
    this.add.text(GAME_WIDTH / 2, 548, sw ? `HADITHI ZA MAENEO: ${storyCount}/4 ZIMEFUNGULIWA` : `LOCATION STORIES: ${storyCount}/4 UNLOCKED`, {
      fontFamily: 'Arial Black, sans-serif', fontSize: '13px', color: '#e7e6e2',
    }).setLetterSpacing(2.6).setOrigin(0.5);

    this.createButton(290, 623, 318, sw ? 'HADITHI' : 'STORIES', () => this.scene.start('StoryCollectionScene'));
    this.createButton(640, 623, 318, sw ? 'LUGHA: KISWAHILI' : 'LANGUAGE: ENGLISH', () => { toggleStoryLanguage(); this.scene.restart(); });
    this.createButton(990, 623, 318, sw ? 'RUDI' : 'BACK', () => this.scene.start('MainMenuScene'));
  }

  private addCopy(y: number, copy: string, size: number, color: string, maxHeight: number, bold = false) {
    const text = this.add.text(GAME_WIDTH / 2, y, copy, {
      fontFamily: 'Arial, sans-serif', fontSize: `${size}px`, color,
      fontStyle: bold ? 'bold' : 'normal', align: 'center',
      wordWrap: { width: 714 }, lineSpacing: 5,
      shadow: { offsetX: 0, offsetY: 2, color: '#000000', blur: 2, fill: true },
    }).setOrigin(0.5);
    // Both languages must stay inside their section at the fixed game size.
    while (text.height > maxHeight && size > 15) text.setFontSize(--size);
  }

  private drawRule(y: number) {
    const rule = this.add.graphics();
    rule.lineStyle(2, 0xf4c51e, 0.95).lineBetween(294, y, 986, y);
    rule.lineStyle(1, 0x6d4a09, 0.9).lineBetween(294, y + 2, 986, y + 2);
  }

  private createButton(x: number, y: number, width: number, label: string, action: () => void) {
    const button = this.add.container(x, y);
    const bg = this.add.graphics();
    bg.fillStyle(0x090b0e).fillRoundedRect(-width / 2 - 3, -33, width + 6, 68, 5);
    bg.fillStyle(0x8d4d06).fillRoundedRect(-width / 2, -31, width, 62, 4);
    bg.fillStyle(0xffc329).fillRoundedRect(-width / 2 + 3, -28, width - 6, 55, 2);
    bg.lineStyle(1, 0xffe28b, 0.9).lineBetween(-width / 2 + 6, -26, width / 2 - 6, -26);
    // Seeded edge wear gives the native button the reference's print texture.
    let seed = Math.round(x * 31);
    const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
    for (let i = 0; i < 280; i++) {
      const px = random() * (width - 10) - width / 2 + 5;
      const py = random() * 52 - 26;
      if (Math.abs(py) > 17 || Math.abs(px) > width / 2 - 22) {
        bg.fillStyle(0x3a2309, random() * 0.5 + 0.15).fillRect(px, py, random() * 2.4 + 0.5, random() * 2 + 0.5);
      }
    }
    const text = this.add.text(0, -1, label, {
      fontFamily: 'Impact, Arial Black, sans-serif', fontSize: '27px', color: '#11120d', fontStyle: 'italic',
    }).setOrigin(0.5);
    button.add([bg, text]).setSize(width, 64).setInteractive({ useHandCursor: true });
    button.on('pointerover', () => {
      this.tweens.killTweensOf(button);
      this.tweens.add({ targets: button, scale: 1.025, y: y - 2, duration: 100 });
      text.setColor('#482b04');
    });
    button.on('pointerout', () => {
      this.tweens.killTweensOf(button);
      this.tweens.add({ targets: button, scale: 1, y, duration: 100 });
      text.setColor('#11120d');
    });
    button.on('pointerdown', () => {
      if (isSoundEnabled() && !this.sound.locked && this.cache.audio.exists('select')) this.sound.play('select', { volume: 0.8 });
      action();
    });
  }
}
