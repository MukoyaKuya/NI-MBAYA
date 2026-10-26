import { SceneLoadingPlugin } from '../systems/SceneLoadingPlugin';
import { DailyChallengeScene } from '../scenes/DailyChallengeScene';
import { AchievementsScene } from '../scenes/AchievementsScene';
import { ExitScene } from '../scenes/ExitScene';
import Phaser from 'phaser';
import { BootScene } from '../scenes/BootScene';
import { MainMenuScene } from '../scenes/MainMenuScene';
import { CharacterSelectScene } from '../scenes/CharacterSelectScene';
import { LevelScene } from '../scenes/LevelScene';
import { OptionsScene } from '../scenes/OptionsScene';
import { CultureScene } from '../scenes/CultureScene';
import { StoryCollectionScene } from '../scenes/StoryCollectionScene';
import { StoryCutsceneScene } from '../scenes/StoryCutsceneScene';
import { HowToPlayScene } from '../scenes/HowToPlayScene';
import { ArcadeSelectScene } from '../scenes/ArcadeSelectScene';
import { ArcadeMatchScene } from '../scenes/ArcadeMatchScene';

export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;
export const GROUND_Y = 604;

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.WEBGL,
  parent: 'game',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#0f1720',
  pixelArt: false,
  loader: { maxParallelDownloads: 4 },
  plugins: { scene: [{ key: 'SceneLoading', plugin: SceneLoadingPlugin, start: true }] },
  scale: {
    fullscreenTarget: 'game',
    // Keep artwork and pointer coordinates proportional at every window size.
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    autoRound: true,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 1650, x: 0 },
      debug: false,
    },
  },
  scene: [BootScene, MainMenuScene, CharacterSelectScene, ArcadeSelectScene, ArcadeMatchScene, OptionsScene, CultureScene, StoryCollectionScene, StoryCutsceneScene, HowToPlayScene, LevelScene, ExitScene, AchievementsScene, DailyChallengeScene],
};
