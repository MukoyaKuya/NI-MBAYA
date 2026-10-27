import Phaser from 'phaser';
import { ARCADE_FIGHTERS, ARCADE_FIGHTER_IDS, type ArcadeFighterId } from '../config/ArcadeFighters';
import { formatKeyName, getControlKeys } from '../config/Controls';
import { startStreamingMusic } from '../systems/StreamingMusic';

export class ArcadeSelectScene extends Phaser.Scene {
  private chosen: ArcadeFighterId = 'majembe';
  private portraits: Phaser.GameObjects.Image[] = [];
  private names: Phaser.GameObjects.Text[] = [];
  private launching = false;

  constructor() { super('ArcadeSelectScene'); }

  preload() {
    for (const id of ARCADE_FIGHTER_IDS) {
      const fighter = ARCADE_FIGHTERS[id];
      if (!this.textures.exists(fighter.texture)) this.load.image(fighter.texture, fighter.image);
    }
    if (!this.textures.exists('arcade-archives')) this.load.image('arcade-archives',
      new URL('../assets/optimized/arcade/archives-clean.webp', import.meta.url).href);
  }

  create() {
    startStreamingMusic('menu-music', new URL('../assets/optimized/audio/menu-music.mp3', import.meta.url).href, 0.24);
    const controlKeys = getControlKeys();
    this.chosen = 'majembe'; this.launching = false; this.portraits = []; this.names = [];
    this.add.image(640, 360, 'arcade-archives').setDisplaySize(1280, 720);
    this.add.rectangle(640, 360, 1280, 720, 0x03050c, 0.72);
    this.add.text(640, 48, 'ARCADE • CHOOSE YOUR FIGHTER', {
      fontFamily: 'Impact, Arial Black, sans-serif', fontSize: '45px', color: '#ffc928',
    }).setOrigin(0.5).setStroke('#100b07', 5);
    this.add.text(640, 96, 'FACE THE OTHER FIGHTER IN A BEST OF THREE MATCH', {
      fontFamily: 'Arial Black, sans-serif', fontSize: '15px', color: '#fff0cf', letterSpacing: 3,
    }).setOrigin(0.5);
    [0, 1].forEach(side => this.createPanel(side));
    this.add.text(640, 650, 'START THE FIGHT  ›', {
      fontFamily: 'Impact, Arial Black, sans-serif', fontSize: '29px', color: '#0b0c0d',
      backgroundColor: '#ffc928', padding: { x: 32, y: 13 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).on('pointerdown', () => this.startFight());
    this.add.text(640, 707, `${formatKeyName(controlKeys.left)} / ${formatKeyName(controlKeys.right)}  CHOOSE    •    ENTER  FIGHT    •    ESC  BACK`, {
      fontFamily: 'Arial Black, sans-serif', fontSize: '13px', color: '#c8bfae',
    }).setOrigin(0.5);
    const listeners: [string, () => void][] = [
      [`keydown-${controlKeys.left}`, () => this.cycle(-1)],
      [`keydown-${controlKeys.right}`, () => this.cycle(1)],
      ['keydown-ENTER', () => this.startFight()], ['keydown-ESC', () => this.scene.start('MainMenuScene')],
    ];
    for (const [event, handler] of listeners) this.input.keyboard?.on(event, handler);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      for (const [event, handler] of listeners) this.input.keyboard?.off(event, handler);
    });
    this.refresh();
  }

  private createPanel(side: number) {
    const x = side === 0 ? 340 : 940;
    this.add.rectangle(x, 358, 475, 480, 0x09111b, 0.95)
      .setStrokeStyle(3, side === 0 ? 0xffc928 : 0xe14032);
    this.add.text(x, 146, side === 0 ? 'YOUR FIGHTER' : 'CPU OPPONENT', {
      fontFamily: 'Arial Black, sans-serif', fontSize: '20px', color: side === 0 ? '#ffcd36' : '#fa6b54',
    }).setOrigin(0.5);
    this.portraits.push(this.add.image(x, 370, ARCADE_FIGHTERS.majembe.texture).setDisplaySize(250, 310));
    this.names.push(this.add.text(x, 529, '', {
      fontFamily: 'Impact, Arial Black, sans-serif', fontSize: '36px', color: '#ffffff',
    }).setOrigin(0.5).setStroke('#080808', 4));
    if (side === 0) {
      const arrowStyle = { fontFamily: 'Arial Black, sans-serif', fontSize: '42px', color: '#ffc928' };
      this.add.text(x - 185, 350, '‹', arrowStyle).setOrigin(0.5)
        .setInteractive({ useHandCursor: true }).on('pointerdown', () => this.cycle(-1));
      this.add.text(x + 185, 350, '›', arrowStyle).setOrigin(0.5)
        .setInteractive({ useHandCursor: true }).on('pointerdown', () => this.cycle(1));
      this.add.text(x, 580, 'CHOOSE MAJEMBE OR MBAVU', {
        fontFamily: 'Arial Black, sans-serif', fontSize: '16px', color: '#ffcf3e',
      }).setOrigin(0.5);
    } else {
      this.add.text(x, 580, 'CONTROLLED BY THE GAME', {
        fontFamily: 'Arial Black, sans-serif', fontSize: '16px', color: '#ff8a70',
      }).setOrigin(0.5);
    }
  }

  private cycle(direction: number) {
    if (this.launching) return;
    const index = ARCADE_FIGHTER_IDS.indexOf(this.chosen);
    this.chosen = ARCADE_FIGHTER_IDS[Phaser.Math.Wrap(index + direction, 0, ARCADE_FIGHTER_IDS.length)];
    this.refresh();
  }

  private refresh() {
    const other = ARCADE_FIGHTER_IDS.find(id => id !== this.chosen)!;
    [this.chosen, other].forEach((id, side) => {
      this.portraits[side].setTexture(ARCADE_FIGHTERS[id].texture).setFlipX(side === 1);
      this.names[side].setText(ARCADE_FIGHTERS[id].name);
    });
  }

  private startFight() {
    if (this.launching) return;
    this.launching = true;
    const opponent = ARCADE_FIGHTER_IDS.find(id => id !== this.chosen)!;
    this.scene.start('ArcadeMatchScene', { fighters: [this.chosen, opponent] });
  }
}
