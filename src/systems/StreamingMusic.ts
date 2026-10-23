import { isSoundEnabled } from '../config/GameSettings';

let current: { key: string; audio: HTMLAudioElement; error?: string } | undefined;
let listening = false;

function resume() {
  if (!current) return;
  if (!isSoundEnabled()) { current.audio.pause(); return; }
  if (!current.audio.paused) return;
  const track = current;
  void track.audio.play().then(() => { track.error = undefined; }).catch((error: Error) => {
    track.error = error.name;
    // Autoplay rejection is expected until the first click/tap. The shared
    // gesture listener retries even if the user has moved to another menu.
  });
}

/** Stream background music; never wait for an entire MP3 or Phaser load pack. */
export function startStreamingMusic(key: string, url: string, volume: number) {
  if (typeof Audio === 'undefined') return;
  if (!listening) {
    listening = true;
    window.addEventListener('pointerdown', resume, true);
    window.addEventListener('keydown', resume, true);
    window.addEventListener('ni-mbaya:sound-changed', resume);
  }
  if (current?.key !== key) {
    stopStreamingMusic();
    const audio = new Audio(url);
    audio.preload = 'none';
    audio.loop = true;
    current = { key, audio };
    audio.addEventListener('error', () => {
      if (current?.audio === audio) current.error = `Media error ${audio.error?.code ?? 'unknown'}`;
    });
  }
  current.audio.volume = volume;
  resume();
}

export function stopStreamingMusic(key?: string) {
  if (!current || (key && current.key !== key)) return;
  current.audio.pause();
  current.audio.removeAttribute('src');
  current.audio.load();
  current = undefined;
}

export function getStreamingMusicStatus() {
  return current ? { track: current.key, playing: !current.audio.paused, readyState: current.audio.readyState, error: current.error } : { track: null };
}
