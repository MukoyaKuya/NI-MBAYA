import Phaser from 'phaser';
import { gameConfig } from './config/GameConfig';
import './style.css';
import { getGameplayTime } from './systems/GameplayClock';
import { installPerformanceMonitor } from './systems/PerformanceMonitor';

// Phaser owns the canvas lifecycle; Vite only provides bundling and hot reload.
performance.mark('ni-mbaya:engine-ready');
const game = new Phaser.Game(gameConfig);
installPerformanceMonitor(game);
if (import.meta.env.VITE_E2E === 'true') {
  Object.assign(window, { __game: game, __getGameplayTime: getGameplayTime });
}
