import Phaser from 'phaser';
import { getAchievements, Achievement } from '../config/Achievements';
import { getStoryLanguage, isSoundEnabled } from '../config/GameSettings';
import { copyFor } from '../config/WorldContent';

const WIDTH = 1280;
const HEIGHT = 720;

export class AchievementsScene extends Phaser.Scene {
  constructor() { super('AchievementsScene'); }

  create() {
    const language = getStoryLanguage();
    const sw = language === 'sw';
    const achievements = getAchievements();
    const earned = achievements.filter(badge => badge.unlocked).length;
    this.add.image(WIDTH / 2, HEIGHT / 2, 'menu-v2-background').setDisplaySize(WIDTH, HEIGHT);
    this.add.rectangle(WIDTH / 2, HEIGHT / 2, WIDTH, HEIGHT, 0x040a12, 0.92);
    this.add.text(80, 42, sw ? 'MAFANIKIO' : 'ACHIEVEMENTS', {
      fontFamily: 'Impact, Arial Black, sans-serif', fontSize: '54px', fontStyle: 'italic', color: '#ffc51d',
    });
    this.add.text(82, 106, sw ? 'KILA ENEO. HATUA MOJA ZAIDI.' : 'EVERY LOCATION. ANOTHER MILESTONE.', {
      fontFamily: 'Arial Black, sans-serif', fontSize: '15px', color: '#c6cbd2',
    }).setLetterSpacing(2);
    this.add.text(1200, 66, `${earned} / ${achievements.length}`, {
      fontFamily: 'Impact, Arial Black, sans-serif', fontSize: '40px', color: '#ffc51d',
    }).setOrigin(1, 0);
    this.add.text(1200, 111, sw ? 'ZIMEFUNGULIWA' : 'UNLOCKED', {
      fontFamily: 'Arial Black, sans-serif', fontSize: '12px', color: '#aab3c0',
    }).setOrigin(1, 0).setLetterSpacing(2);

    achievements.forEach((badge, index) => {
      const champion = index === 4;
      const x = champion ? 80 : 80 + (index % 2) * 572;
      const y = champion ? 516 : 160 + Math.floor(index / 2) * 172;
      this.drawBadge(x, y, champion ? 1120 : 548, champion ? 110 : 148, badge, index + 1, language);
    });
    this.add.text(80, 668, sw ? 'Maliza viwango kufungua beji. Maendeleo yanahifadhiwa kwenye kivinjari hiki.' : 'Clear levels to earn badges. Progress is saved on this browser.', {
      fontFamily: 'Arial, sans-serif', fontSize: '16px', color: '#99a5b5',
    }).setOrigin(0, 0.5);
    this.createBackButton(sw);
    this.input.keyboard?.on('keydown-ESC', this.goBack, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.input.keyboard?.off('keydown-ESC', this.goBack, this));
  }

  private drawBadge(x: number, y: number, width: number, height: number, badge: Achievement, number: number, language: 'en' | 'sw') {
    const gold = badge.unlocked ? 0xffc51d : 0x465365;
    const panel = this.add.graphics();
    panel.fillStyle(badge.unlocked ? 0x19201e : 0x0c1623, 0.98).fillRoundedRect(x, y, width, height, 8);
    panel.lineStyle(2, gold, badge.unlocked ? 0.95 : 0.65).strokeRoundedRect(x, y, width, height, 8);
    panel.fillStyle(gold).fillRect(x, y + 18, 3, height - 36);
    panel.fillStyle(badge.unlocked ? 0x392d0d : 0x172332).fillCircle(x + 53, y + height / 2, 28);
    panel.lineStyle(2, gold).strokeCircle(x + 53, y + height / 2, 28);
    this.add.text(x + 53, y + height / 2, number === 5 ? '★' : String(number).padStart(2, '0'), {
      fontFamily: 'Arial Black, sans-serif', fontSize: '23px', color: badge.unlocked ? '#ffc51d' : '#758497',
    }).setOrigin(0.5);
    const textX = x + 100;
    this.add.text(textX, y + 18, copyFor(language, badge.title), {
      fontFamily: 'Impact, Arial Black, sans-serif', fontSize: '27px', color: badge.unlocked ? '#ffcf42' : '#c1c8d2',
    });
    this.add.text(textX, y + 54, copyFor(language, badge.description), {
      fontFamily: 'Arial, sans-serif', fontSize: '15px', color: '#99a8ba', wordWrap: { width: width - 124 },
    });
    const barWidth = width === 1120 ? 560 : width - 220;
    const barY = y + height - 26;
    panel.fillStyle(0x273445).fillRoundedRect(textX, barY, barWidth, 5, 2);
    if (badge.progress > 0) panel.fillStyle(0xffc51d).fillRoundedRect(textX, barY, barWidth * badge.progress / badge.target, 5, 2);
    const status = badge.unlocked ? (language === 'sw' ? 'IMEFUNGULIWA' : 'UNLOCKED')
      : badge.target > 1 ? `${badge.progress} / ${badge.target}` : (language === 'sw' ? 'IMEFUNGWA' : 'LOCKED');
    this.add.text(x + width - 22, barY + 2, status, {
      fontFamily: 'Arial Black, sans-serif', fontSize: '10px', color: badge.unlocked ? '#ffc51d' : '#718198',
    }).setOrigin(1, 0.5);
  }

  private createBackButton(sw: boolean) {
    const button = this.add.container(1105, 668);
    const background = this.add.rectangle(0, 0, 190, 44, 0xffc51d).setStrokeStyle(2, 0x906b10);
    const label = this.add.text(0, 0, sw ? 'RUDI' : 'BACK', {
      fontFamily: 'Impact, Arial Black, sans-serif', fontSize: '23px', color: '#10141b', fontStyle: 'italic',
    }).setOrigin(0.5);
    button.add([background, label]).setSize(190, 44).setInteractive({ useHandCursor: true });
    button.on('pointerover', () => button.setScale(1.03));
    button.on('pointerout', () => button.setScale(1));
    button.on('pointerdown', () => {
      if (isSoundEnabled() && !this.sound.locked && this.cache.audio.exists('select')) this.sound.play('select', { volume: 0.8 });
      this.goBack();
    });
  }

  private goBack() { this.scene.start('MainMenuScene'); }
}
