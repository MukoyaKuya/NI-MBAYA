import Phaser from 'phaser';

/** An exit destination for browser tabs, which cannot reliably close themselves. */
export class ExitScene extends Phaser.Scene {
  constructor() { super('ExitScene'); }

  create() {
    this.sound.stopAll();
    this.cameras.main.setBackgroundColor('#07101d');
    const { width, height } = this.scale;
    this.add.text(width / 2, height / 2 - 85, 'GAME EXITED', {
      fontFamily: 'Arial Black, sans-serif', fontSize: '54px', color: '#ffc51d',
    }).setOrigin(0.5);
    this.add.text(width / 2, height / 2 - 12, 'You can close this tab, or return to the main screen.', {
      fontFamily: 'Arial, sans-serif', fontSize: '22px', color: '#eef4ff',
    }).setOrigin(0.5);
    const button = this.add.container(width / 2, height / 2 + 80);
    const background = this.add.rectangle(0, 0, 280, 58, 0xffbd1a).setStrokeStyle(2, 0xffffff, 0.4);
    const label = this.add.text(0, 0, 'MAIN SCREEN', {
      fontFamily: 'Arial Black, sans-serif', fontSize: '23px', color: '#080a0f',
    }).setOrigin(0.5);
    button.add([background, label]).setSize(280, 58).setInteractive({ useHandCursor: true });
    button.on('pointerover', () => button.setScale(1.04));
    button.on('pointerout', () => button.setScale(1));
    button.on('pointerdown', () => this.scene.start('MainMenuScene'));
  }
}
