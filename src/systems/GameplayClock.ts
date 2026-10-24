import type Phaser from 'phaser';

type ClockState = { offset: number; pausedAt?: number };
const clocks = new WeakMap<Phaser.Scene, ClockState>();

function state(scene: Phaser.Scene) {
  let clock = clocks.get(scene);
  if (!clock) { clock = { offset: 0 }; clocks.set(scene, clock); }
  return clock;
}

/** Gameplay deadlines share a clock that excludes time spent in the pause menu. */
export function getGameplayTime(scene: Phaser.Scene) {
  const clock = state(scene);
  return (clock.pausedAt ?? scene.time?.now ?? 0) - clock.offset;
}

export function pauseGameplay(scene: Phaser.Scene) {
  const clock = state(scene);
  if (clock.pausedAt !== undefined) return;
  clock.pausedAt = scene.time?.now ?? 0;
  if (scene.time) scene.time.paused = true;
  scene.tweens?.pauseAll();
}

export function resumeGameplay(scene: Phaser.Scene) {
  const clock = state(scene);
  if (clock.pausedAt === undefined) return;
  clock.offset += (scene.time?.now ?? 0) - clock.pausedAt;
  clock.pausedAt = undefined;
  if (scene.time) scene.time.paused = false;
  scene.tweens?.resumeAll();
}
