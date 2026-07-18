import Phaser from 'phaser';
import { getStoryLanguage, isSoundEnabled, toggleStoryLanguage } from '../config/GameSettings';
import { getUnlockedStoryIds } from '../config/GameProgress';

const GAME_WIDTH = 1280;
const GAME_HEIGHT = 720;

export class CultureScene extends Phaser.Scene {
  constructor() {
    super('CultureScene');
  }

  create() {
    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'menu-v2-background').setDisplaySize(GAME_WIDTH, GAME_HEIGHT).setDepth(-2);
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x020305, 0.78).setDepth(-1);
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

    this.add.text(GAME_WIDTH / 2, 72, heading, { fontFamily: 'Arial Black, Impact, sans-serif', fontSize: '42px', color: '#ffc51d', stroke: '#050505', strokeThickness: 8, fontStyle: 'italic' }).setOrigin(0.5);
    this.add.text(GAME_WIDTH / 2, 125, sw ? 'MICHEZO • NAIROBI • UBUNIFU' : 'GAMES • NAIROBI • CREATIVE FICTION', { fontFamily: 'Arial Black', fontSize: '16px', color: '#ffffff', stroke: '#050505', strokeThickness: 4 }).setOrigin(0.5);
    this.addPanel(196, intro, '#ffffff', 25);
    this.addPanel(340, about, '#dce6f4', 21);
    this.addPanel(484, audience, '#ffc51d', 20);
    const storyCount = getUnlockedStoryIds().length;
    this.add.text(GAME_WIDTH / 2, 570, sw ? `HADITHI ZA MAENEO: ${storyCount}/4 ZIMEFUNGULIWA` : `LOCATION STORIES: ${storyCount}/4 UNLOCKED`, { fontFamily: 'Arial Black', fontSize: '15px', color: '#aeb8c6', stroke: '#050505', strokeThickness: 4 }).setOrigin(0.5);
    this.createButton(275, 652, 260, sw ? 'HADITHI' : 'STORIES', () => this.scene.start('StoryCollectionScene'));
    this.createButton(610, 652, 300, sw ? 'LUGHA: KISWAHILI' : 'LANGUAGE: ENGLISH', () => { toggleStoryLanguage(); this.scene.restart(); });
    this.createButton(970, 652, 220, sw ? 'RUDI' : 'BACK', () => this.scene.start('MainMenuScene'));
  }

  private addPanel(y: number, text: string, color: string, size: number) {
    const panel = this.add.graphics();
    panel.fillStyle(0x07101d, 0.92).lineStyle(3, 0xffbd1a, 0.85);
    panel.fillRoundedRect(150, y - 55, 980, 110, 12).strokeRoundedRect(150, y - 55, 980, 110, 12);
    this.add.text(GAME_WIDTH / 2, y, text, { fontFamily: 'Arial, sans-serif', fontSize: `${size}px`, color, align: 'center', wordWrap: { width: 900 }, lineSpacing: 7 }).setOrigin(0.5);
  }

  private createButton(x: number, y: number, width: number, label: string, action: () => void) {
    const button = this.add.container(x, y);
    const bg = this.add.graphics();
    bg.fillStyle(0xffbd1a, 1).lineStyle(3, 0x050505).fillRoundedRect(-width / 2, -27, width, 54, 8).strokeRoundedRect(-width / 2, -27, width, 54, 8);
    const text = this.add.text(0, 0, label, { fontFamily: 'Arial Black', fontSize: '18px', color: '#111111', fontStyle: 'italic' }).setOrigin(0.5);
    button.add([bg, text]).setSize(width, 54).setInteractive({ useHandCursor: true });
    button.on('pointerover', () => this.tweens.add({ targets: button, scale: 1.05, duration: 80 }));
    button.on('pointerout', () => this.tweens.add({ targets: button, scale: 1, duration: 80 }));
    button.on('pointerdown', () => { if (isSoundEnabled() && !this.sound.locked) this.sound.play('select', { volume: 0.8 }); action(); });
  }
}
