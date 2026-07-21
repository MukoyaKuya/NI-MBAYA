import Phaser from 'phaser';
import { AttackKind } from '../config/Controls';
import { isSoundEnabled } from '../config/GameSettings';

type ToneShape = OscillatorType;

/** Plays production audio assets, with lightweight procedural fallbacks. */
export class SoundSystem {
  private static context?: AudioContext;
  private static master?: GainNode;
  private music?: Phaser.Sound.BaseSound;
  private victorySound?: Phaser.Sound.BaseSound;
  private defeatSound?: Phaser.Sound.BaseSound;
  private uiHover?: Phaser.Sound.BaseSound;
  private fightMusicRequested = false;
  private waitingForAudioUnlock = false;

  constructor(private scene: Phaser.Scene) {
    const unlock = () => {
      this.ensureContext();
      this.startFightMusic();
    };
    scene.input.on('pointerdown', unlock);
    scene.input.keyboard?.on('keydown', unlock);
    const onAudioFileComplete = (key: string) => {
      if (key !== 'fight-music') return;
      this.fightMusicRequested = false;
      this.startFightMusic();
    };
    scene.load.on(Phaser.Loader.Events.FILE_COMPLETE, onAudioFileComplete);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      scene.input.off('pointerdown', unlock);
      scene.input.keyboard?.off('keydown', unlock);
      scene.load.off(Phaser.Loader.Events.FILE_COMPLETE, onAudioFileComplete);
      this.music?.stop();
      this.music?.destroy();
      this.victorySound?.stop();
      this.victorySound?.destroy();
      this.defeatSound?.stop();
      this.defeatSound?.destroy();
      this.uiHover?.stop();
      this.uiHover?.destroy();
      this.music = undefined;
    });
    this.startFightMusic();
  }

  playAttack(kind: AttackKind) {
    if (!isSoundEnabled()) return;
    if (kind === 'punch') {
      this.noise(0.07, 1100, 0.055);
      this.tone(190, 95, 0.07, 0.035, 'sine');
      return;
    }
    if (kind === 'kick') {
      this.noise(0.11, 720, 0.1);
      this.tone(145, 58, 0.11, 0.075, 'triangle');
      return;
    }
    if (!this.playClip('special-attack', 0.82)) {
      this.noise(0.22, 1250, 0.2);
      this.tone(330, 72, 0.28, 0.14, 'sawtooth');
    }
  }

  playImpact(kind: AttackKind, defeated: boolean) {
    if (!isSoundEnabled()) return;
    const heavy = kind === 'kick' || kind === 'special';
    const key = heavy ? 'heavy-hit' : 'punch-hit';
    const rate = heavy ? 0.94 + Math.random() * 0.1 : 0.97 + Math.random() * 0.08;
    if (!this.playClip(key, heavy ? 0.88 : 0.74, rate)) {
      this.noise(heavy ? 0.16 : 0.1, heavy ? 360 : 520, heavy ? 0.24 : 0.17);
      this.tone(heavy ? 105 : 145, heavy ? 42 : 70, heavy ? 0.16 : 0.1, heavy ? 0.19 : 0.13, 'square');
    }
    if (defeated) this.tone(120, 48, 0.3, 0.1, 'sawtooth', 0.04);
  }

  playPlayerHurt(heavy = false) {
    if (!isSoundEnabled()) return;
    const key = heavy ? 'heavy-hit' : 'punch-hit';
    if (!this.playClip(key, heavy ? 0.78 : 0.62, heavy ? 0.9 : 0.94)) {
      this.noise(heavy ? 0.22 : 0.14, heavy ? 280 : 430, heavy ? 0.26 : 0.18);
      this.tone(heavy ? 115 : 170, 52, heavy ? 0.22 : 0.14, 0.14, 'square');
    }
  }

  playDogBark() {
    if (!isSoundEnabled()) return;
    const rate = 0.9 + Math.random() * 0.16;
    if (this.playClip('dog-growl', 0.92, rate)) return;
    this.noise(0.12, 1150, 0.3);
    this.tone(310 * rate, 120 * rate, 0.13, 0.23, 'square');
    this.noise(0.1, 900, 0.24, 0.14);
    this.tone(270 * rate, 105 * rate, 0.11, 0.19, 'sawtooth', 0.14);
  }

  playPickup() {
    if (!isSoundEnabled()) return;
    this.tone(520, 780, 0.1, 0.09, 'sine');
    this.tone(780, 1040, 0.14, 0.08, 'sine', 0.09);
  }

  playPlayerDefeat() {
    if (!isSoundEnabled()) return;
    this.music?.stop();
    if (this.scene.cache.audio.exists('hero-defeat')) {
      this.defeatSound?.stop();
      this.defeatSound?.destroy();
      this.defeatSound = this.scene.sound.add('hero-defeat', { volume: 0.95 });
      this.defeatSound.play();
      return;
    }
    this.noise(0.35, 240, 0.22);
    this.tone(180, 44, 0.65, 0.16, 'sawtooth');
  }

  playVictory() {
    if (!isSoundEnabled()) return;
    this.music?.stop();
    if (this.scene.cache.audio.exists('challenge-win')) {
      this.victorySound?.stop();
      this.victorySound?.destroy();
      this.defeatSound?.stop();
      this.defeatSound?.destroy();
      this.victorySound = this.scene.sound.add('challenge-win', { volume: 0.92 });
      this.victorySound.play();
      return;
    }
    [392, 523, 659, 784].forEach((frequency, index) => {
      this.tone(frequency, frequency * 1.02, 0.2, 0.1, 'square', index * 0.11);
    });
  }

  playUiHover() {
    if (this.scene.sound.locked || !this.scene.cache.audio.exists('ui-hover')) return;
    this.uiHover?.stop();
    this.uiHover?.destroy();
    this.uiHover = this.scene.sound.add('ui-hover', { volume: 0.38 });
    this.uiHover.play();
    const sound = this.uiHover;
    this.scene.time.delayedCall(480, () => {
      if (sound === this.uiHover) {
        sound.stop();
        sound.destroy();
        this.uiHover = undefined;
      }
    });
  }

  playUiSelect() {
    if (this.scene.sound.locked) return;
    if (this.playClip('select', 0.85)) return;
    this.tone(580, 880, 0.08, 0.12, 'sine');
  }
  private startFightMusic() {
    if (!isSoundEnabled()) return;
    const menuMusic = this.scene.sound.get('menu-music');
    menuMusic?.stop();
    menuMusic?.destroy();
    if (this.music?.isPlaying) return;
    if (!this.scene.cache.audio.exists('fight-music')) {
      this.requestFightMusic();
      return;
    }
    if (this.scene.sound.locked) {
      if (!this.waitingForAudioUnlock) {
        this.waitingForAudioUnlock = true;
        this.scene.sound.once(Phaser.Sound.Events.UNLOCKED, () => {
          this.waitingForAudioUnlock = false;
          this.startFightMusic();
        });
      }
      return;
    }
    this.music = this.scene.sound.add('fight-music', { loop: true, volume: 0.2 });
    this.music.play();
  }

  private requestFightMusic() {
    if (this.fightMusicRequested) return;
    this.fightMusicRequested = true;
    this.scene.load.audio('fight-music', new URL('../assets/audio/fight-music.mp3', import.meta.url).href);
    if (!this.scene.load.isLoading()) this.scene.load.start();
  }

  private playClip(key: string, volume: number, rate = 1) {
    if (!this.scene.cache.audio.exists(key)) return false;
    this.scene.sound.play(key, { volume, rate });
    return true;
  }

  private ensureContext() {
    if (!SoundSystem.context) {
      SoundSystem.context = new AudioContext();
      SoundSystem.master = SoundSystem.context.createGain();
      SoundSystem.master.gain.value = 0.48;
      SoundSystem.master.connect(SoundSystem.context.destination);
    }
    if (SoundSystem.context.state === 'suspended') void SoundSystem.context.resume();
    return SoundSystem.context;
  }

  private tone(
    startFrequency: number,
    endFrequency: number,
    duration: number,
    volume: number,
    shape: ToneShape,
    delay = 0,
  ) {
    const context = this.ensureContext();
    if (!SoundSystem.master || context.state === 'closed') return;
    const now = context.currentTime + delay;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = shape;
    oscillator.frequency.setValueAtTime(startFrequency, now);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, endFrequency), now + duration);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(volume, now + Math.min(0.015, duration * 0.2));
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    oscillator.connect(gain).connect(SoundSystem.master);
    oscillator.start(now);
    oscillator.stop(now + duration + 0.02);
  }

  private noise(duration: number, cutoff: number, volume: number, delay = 0) {
    const context = this.ensureContext();
    if (!SoundSystem.master || context.state === 'closed') return;
    const now = context.currentTime + delay;
    const frameCount = Math.ceil(context.sampleRate * duration);
    const buffer = context.createBuffer(1, frameCount, context.sampleRate);
    const samples = buffer.getChannelData(0);
    for (let i = 0; i < samples.length; i += 1) {
      samples[i] = (Math.random() * 2 - 1) * (1 - i / samples.length);
    }
    const source = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const gain = context.createGain();
    filter.type = 'lowpass';
    filter.frequency.value = cutoff;
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    source.buffer = buffer;
    source.connect(filter).connect(gain).connect(SoundSystem.master);
    source.start(now);
  }
}



