import Phaser from 'phaser';
import { claimDailyReward, DAILY_REWARD, DAILY_TARGET, getDailyChallenge } from '../config/DailyChallenge';
import { getJourneySave } from '../config/GameProgress';
import { isSoundEnabled } from '../config/GameSettings';

export class DailyChallengeScene extends Phaser.Scene {
  private dayLabel!: Phaser.GameObjects.Text;
  private counter!: Phaser.GameObjects.Text;
  private bank!: Phaser.GameObjects.Text;
  private fill!: Phaser.GameObjects.Rectangle;
  private claimButton!: Phaser.GameObjects.Container;
  private claimLabel!: Phaser.GameObjects.Text;
  private lastState = '';

  constructor() { super('DailyChallengeScene'); }

  create() {
    this.lastState = '';
    this.add.image(640, 360, 'menu-v2-background').setDisplaySize(1280, 720);
    this.add.rectangle(640, 360, 1280, 720, 0x040a12, 0.92);
    this.add.text(640, 75, 'DAILY CHALLENGE', {
      fontFamily: 'Impact, Arial Black, sans-serif', fontSize: '54px', fontStyle: 'italic', color: '#ffc51d',
    }).setOrigin(0.5);
    this.dayLabel = this.add.text(640, 130, '', { fontFamily: 'Arial Black, sans-serif', fontSize: '14px', color: '#a6b1c0' }).setOrigin(0.5);
    const panel = this.add.graphics();
    panel.fillStyle(0x0b1624, 0.98).fillRoundedRect(160, 178, 960, 332, 10);
    panel.lineStyle(2, 0xa67e1b).strokeRoundedRect(160, 178, 960, 332, 10);
    this.add.text(640, 240, `DEFEAT ${DAILY_TARGET} ENEMIES`, { fontFamily: 'Impact, Arial Black, sans-serif', fontSize: '46px', color: '#f4f2eb' }).setOrigin(0.5);
    this.add.text(640, 299, 'Play any level. Replays count. Defeats still count if you lose the round.', {
      fontFamily: 'Arial, sans-serif', fontSize: '20px', color: '#a7b5c6',
    }).setOrigin(0.5);
    this.add.rectangle(260, 353, 760, 12, 0x253345).setOrigin(0, 0.5);
    this.fill = this.add.rectangle(260, 353, 0, 12, 0xffc51d).setOrigin(0, 0.5);
    this.counter = this.add.text(640, 399, '', { fontFamily: 'Arial Black, sans-serif', fontSize: '27px', color: '#ffc51d' }).setOrigin(0.5);
    this.add.text(640, 462, `TODAY’S REWARD: ${DAILY_REWARD} CHAPATIS`, { fontFamily: 'Arial Black, sans-serif', fontSize: '22px', color: '#f4f2eb' }).setOrigin(0.5);
    const claim = this.button(640, 552, 440, '', () => {
      claimDailyReward();
      this.refresh();
    });
    this.claimButton = claim.button;
    this.claimLabel = claim.label;
    this.bank = this.add.text(640, 602, '', { fontFamily: 'Arial, sans-serif', fontSize: '17px', color: '#a7b5c6' }).setOrigin(0.5);
    this.button(480, 662, 260, 'PLAY NOW', () => {
      const save = getJourneySave();
      if (save) this.scene.start('LevelScene', save);
      else this.scene.start('CharacterSelectScene');
    });
    this.button(800, 662, 260, 'BACK', () => this.goBack());
    this.refresh();
    this.time.addEvent({ delay: 1000, loop: true, callback: this.refresh, callbackScope: this });
    this.input.keyboard?.on('keydown-ESC', this.goBack, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.input.keyboard?.off('keydown-ESC', this.goBack, this));
  }

  private refresh() {
    const daily = getDailyChallenge();
    const state = JSON.stringify(daily);
    if (state === this.lastState) return;
    this.lastState = state;
    this.dayLabel.setText(`${daily.date}  •  RESETS AT MIDNIGHT, NAIROBI TIME`);
    this.fill.width = 760 * daily.defeats / DAILY_TARGET;
    this.counter.setText(`${daily.defeats} / ${DAILY_TARGET} DEFEATED`);
    this.bank.setText(`Daily rewards earned: ${daily.rewardChapatis.toLocaleString()} chapatis · Saved on this browser`);
    const canClaim = daily.defeats === DAILY_TARGET && !daily.claimed;
    this.claimLabel.setText(daily.claimed ? 'REWARD CLAIMED' : canClaim ? `CLAIM ${DAILY_REWARD} CHAPATIS` : `DEFEAT ${DAILY_TARGET} ENEMIES TO CLAIM`);
    this.claimButton.setAlpha(canClaim ? 1 : 0.5);
    if (canClaim) this.claimButton.setInteractive({ useHandCursor: true });
    else this.claimButton.disableInteractive();
  }

  private button(x: number, y: number, width: number, text: string, action: () => void) {
    const button = this.add.container(x, y);
    const background = this.add.rectangle(0, 0, width, 50, 0xffc51d).setStrokeStyle(2, 0x98701a);
    const label = this.add.text(0, 0, text, { fontFamily: 'Arial Black, sans-serif', fontSize: '18px', fontStyle: 'italic', color: '#10141b' }).setOrigin(0.5);
    button.add([background, label]).setSize(width, 50).setInteractive({ useHandCursor: true });
    button.on('pointerover', () => button.setScale(1.025));
    button.on('pointerout', () => button.setScale(1));
    button.on('pointerdown', () => {
      if (isSoundEnabled() && !this.sound.locked && this.cache.audio.exists('select')) this.sound.play('select', { volume: 0.8 });
      action();
    });
    return { button, label };
  }

  private goBack() { this.scene.start('MainMenuScene'); }
}
