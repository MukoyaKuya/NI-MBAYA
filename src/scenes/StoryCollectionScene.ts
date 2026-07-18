import Phaser from 'phaser';
import { getStoryLanguage, isSoundEnabled, toggleStoryLanguage } from '../config/GameSettings';
import { getUnlockedStoryIds } from '../config/GameProgress';
import { copyFor, LOCATION_STORIES } from '../config/WorldContent';

const GAME_WIDTH = 1280;
const GAME_HEIGHT = 720;

export class StoryCollectionScene extends Phaser.Scene {
  constructor() { super('StoryCollectionScene'); }
  create() {
    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'menu-v2-background').setDisplaySize(GAME_WIDTH, GAME_HEIGHT).setDepth(-2);
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x020305, 0.82).setDepth(-1);
    this.drawContent();
    this.input.keyboard?.on('keydown-ESC', () => this.scene.start('CultureScene'));
  }
  private drawContent() {
    const language = getStoryLanguage(); const sw = language === 'sw'; const unlocked = getUnlockedStoryIds();
    this.add.text(GAME_WIDTH / 2, 54, sw ? 'HADITHI ZA NAIROBI' : 'NAIROBI STORIES', { fontFamily: 'Arial Black, Impact, sans-serif', fontSize: '42px', color: '#ffc51d', stroke: '#050505', strokeThickness: 8, fontStyle: 'italic' }).setOrigin(0.5);
    this.add.text(GAME_WIDTH / 2, 100, sw ? `${unlocked.length}/4 ZIMEFUNGULIWA` : `${unlocked.length}/4 UNLOCKED`, { fontFamily: 'Arial Black', fontSize: '16px', color: '#ffffff', stroke: '#050505', strokeThickness: 4 }).setOrigin(0.5);
    [1, 2, 3, 4].forEach((levelId, index) => {
      const y = 173 + index * 108; const story = LOCATION_STORIES[levelId]; const isUnlocked = unlocked.includes(levelId);
      const panel = this.add.graphics(); panel.fillStyle(0x07101d, isUnlocked ? 0.94 : 0.7).lineStyle(2, isUnlocked ? 0xffbd1a : 0x4c5565, 0.9); panel.fillRoundedRect(115, y - 42, 1050, 86, 10).strokeRoundedRect(115, y - 42, 1050, 86, 10);
      const title = isUnlocked ? copyFor(language, story.title) : (sw ? `HADITHI ${levelId} — IMEFUNGWA` : `STORY ${levelId} — LOCKED`);
      const body = isUnlocked ? copyFor(language, story.body) : (sw ? 'Maliza kiwango hiki ili kufungua hadithi.' : 'Clear this level to unlock its story.');
      this.add.text(150, y - 22, title, { fontFamily: 'Arial Black', fontSize: '18px', color: isUnlocked ? '#ffc51d' : '#9da5b2', fontStyle: 'italic' });
      this.add.text(150, y + 10, body, { fontFamily: 'Arial, sans-serif', fontSize: '14px', color: isUnlocked ? '#eef4ff' : '#8992a0', wordWrap: { width: 950 } });
    });
    this.createButton(430, 650, 290, sw ? 'LUGHA: KISWAHILI' : 'LANGUAGE: ENGLISH', () => { toggleStoryLanguage(); this.scene.restart(); });
    this.createButton(830, 650, 220, sw ? 'RUDI' : 'BACK', () => this.scene.start('CultureScene'));
  }
  private createButton(x: number, y: number, width: number, label: string, action: () => void) {
    const button = this.add.container(x, y); const bg = this.add.graphics(); bg.fillStyle(0xffbd1a).lineStyle(3, 0x050505).fillRoundedRect(-width / 2, -27, width, 54, 8).strokeRoundedRect(-width / 2, -27, width, 54, 8);
    button.add([bg, this.add.text(0, 0, label, { fontFamily: 'Arial Black', fontSize: '18px', color: '#111111', fontStyle: 'italic' }).setOrigin(0.5)]).setSize(width, 54).setInteractive({ useHandCursor: true });
    button.on('pointerdown', () => { if (isSoundEnabled() && !this.sound.locked) this.sound.play('select', { volume: 0.8 }); action(); });
  }
}
