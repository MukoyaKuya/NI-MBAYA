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
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 1650, x: 0 },
      debug: false,
    },
  },
  scene: [BootScene, MainMenuScene, CharacterSelectScene, OptionsScene, CultureScene, StoryCollectionScene, StoryCutsceneScene, HowToPlayScene, LevelScene],
};
