import Phaser from 'phaser';
import { ARCADE_FIGHTERS, ARCADE_FIGHTER_IDS, type ArcadeFighterId } from '../config/ArcadeFighters';
import { startStreamingMusic } from '../systems/StreamingMusic';

type Selection = { fighter: ArcadeFighterId; ready: boolean };

export class ArcadeSelectScene extends Phaser.Scene {
  private selections: [Selection, Selection] = [
    { fighter: 'majembe', ready: false }, { fighter: 'mbavu', ready: false },
  ];
  private names: Phaser.GameObjects.Text[] = [];
  private portraits: Phaser.GameObjects.Image[] = [];
  private readyLabels: Phaser.GameObjects.Text[] = [];
  private startLabel!: Phaser.GameObjects.Text;
  private launching = false;

  constructor() { super('ArcadeSelectScene'); }

  preload() {
    for (const fighter of ARCADE_FIGHTER_IDS) {
      const definition = ARCADE_FIGHTERS[fighter];
      if (!this.textures.exists(definition.texture)) this.load.image(definition.texture, definition.image);
    }
    if (!this.textures.exists('arcade-archives')) {
      this.load.image('arcade-archives', new URL('../assets/optimized/arcade/archives-clean.webp', import.meta.url).href);
    }
  }

  create() {
    startStreamingMusic('menu-music', new URL('../assets/optimized/audio/menu-music.mp3', import.meta.url).href, 0.24);
    this.selections = [{ fighter: 'majembe', ready: false }, { fighter: 'mbavu', ready: false }];
    this.launching = false;
    this.names = []; this.portraits = []; this.readyLabels = [];
    this.add.image(640, 360, 'arcade-archives').setDisplaySize(1280, 720);
    this.add.rectangle(640, 360, 1280, 720, 0x03050c, 0.72);
    this.add.text(640, 48, 'ARCADE • CHOOSE YOUR FIGHTERS', {
      fontFamily: 'Impact, Arial Black, sans-serif', fontSize: '45px', color: '#ffc928',
    }).setOrigin(0.5).setStroke('#100b07', 5);
    this.add.text(640, 96, 'TWO PLAYERS  •  ONE CITY  •  BEST OF THREE', {
      fontFamily: 'Arial Black, sans-serif', fontSize: '15px', color: '#fff0cf', letterSpacing: 3,
    }).setOrigin(0.5);

    [0, 1].forEach(side => this.createSelectionPanel(side));
    this.startLabel = this.add.text(640, 651, 'LOCK IN BOTH FIGHTERS', {
      fontFamily: 'Impact, Arial Black, sans-serif', fontSize: '28px', color: '#514522',
      backgroundColor: '#10151c', padding: { x: 28, y: 13 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    this.startLabel.on('pointerdown', () => this.startFight());
    this.add.text(640, 707, 'ESC  BACK TO MENU', {
      fontFamily: 'Arial Black, sans-serif', fontSize: '13px', color: '#c8bfae',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).on('pointerdown', () => this.scene.start('MainMenuScene'));
    const listeners: [string, () => void][] = [
      ['keydown-A', () => this.cycle(0, -1)], ['keydown-D', () => this.cycle(0, 1)],
      ['keydown-F', () => this.toggleReady(0)], ['keydown-LEFT', () => this.cycle(1, -1)],
      ['keydown-RIGHT', () => this.cycle(1, 1)], ['keydown-ENTER', () => this.toggleReady(1)],
      ['keydown-ESC', () => this.scene.start('MainMenuScene')],
    ];
    for (const [event, handler] of listeners) this.input.keyboard?.on(event, handler);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      for (const [event, handler] of listeners) this.input.keyboard?.off(event, handler);
    });
    this.refresh();
  }

  private createSelectionPanel(side: number) {
    const x = side === 0 ? 340 : 940;
    this.add.rectangle(x, 358, 475, 480, 0x09111b, 0.95).setStrokeStyle(3, side === 0 ? 0xffc928 : 0xe14032);
    this.add.text(x, 146, `PLAYER ${side + 1}`, {
      fontFamily: 'Arial Black, sans-serif', fontSize: '20px', color: side === 0 ? '#ffcd36' : '#fa6b54',
    }).setOrigin(0.5);
    const portrait = this.add.image(x, 370, ARCADE_FIGHTERS.majembe.texture).setDisplaySize(250, 310);
    this.portraits.push(portrait);
    const name = this.add.text(x, 529, '', {
      fontFamily: 'Impact, Arial Black, sans-serif', fontSize: '36px', color: '#ffffff',
    }).setOrigin(0.5).setStroke('#080808', 4);
    this.names.push(name);
    const arrowStyle = { fontFamily: 'Arial Black, sans-serif', fontSize: '34px', color: '#ffc928' };
    this.add.text(x - 185, 350, '‹', arrowStyle).setOrigin(0.5).setInteractive({ useHandCursor: true }).on('pointerdown', () => this.cycle(side, -1));
    this.add.text(x + 185, 350, '›', arrowStyle).setOrigin(0.5).setInteractive({ useHandCursor: true }).on('pointerdown', () => this.cycle(side, 1));
    const ready = this.add.text(x, 580, '', {
      fontFamily: 'Arial Black, sans-serif', fontSize: '17px', color: '#ffcf3e',
      backgroundColor: '#1b2633', padding: { x: 13, y: 8 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).on('pointerdown', () => this.toggleReady(side));
    this.readyLabels.push(ready);
  }

  private cycle(side: number, direction: number) {
    if (this.launching || this.selections[side].ready) return;
    const current = ARCADE_FIGHTER_IDS.indexOf(this.selections[side].fighter);
    this.selections[side].fighter = ARCADE_FIGHTER_IDS[Phaser.Math.Wrap(current + direction, 0, ARCADE_FIGHTER_IDS.length)];
    this.refresh();
  }

  private toggleReady(side: number) {
    if (this.launching) return;
    this.selections[side].ready = !this.selections[side].ready;
    this.refresh();
  }

  private refresh() {
    this.selections.forEach((choice, side) => {
      const fighter = ARCADE_FIGHTERS[choice.fighter];
      this.portraits[side].setTexture(fighter.texture).setFlipX(side === 1);
      this.names[side].setText(fighter.name);
      this.readyLabels[side].setText(choice.ready ? '✓ READY — CLICK TO CHANGE' : side === 0 ? 'F  LOCK IN' : 'ENTER  LOCK IN');
      this.readyLabels[side].setColor(choice.ready ? '#8dff7a' : '#ffcf3e');
    });
    const bothReady = this.selections.every(choice => choice.ready);
    this.startLabel.setText(bothReady ? 'START THE FIGHT  ›' : 'LOCK IN BOTH FIGHTERS');
    this.startLabel.setColor(bothReady ? '#0b0c0d' : '#827343').setBackgroundColor(bothReady ? '#ffc928' : '#17212c');
  }

  private startFight() {
    if (this.launching || !this.selections.every(choice => choice.ready)) return;
    this.launching = true;
    this.scene.start('ArcadeMatchScene', { fighters: this.selections.map(choice => choice.fighter) });
  }
}
