import Phaser from 'phaser';
import { gameConfig } from './config/GameConfig';
import './style.css';
import { getGameplayTime } from './systems/GameplayClock';
import { installPerformanceMonitor } from './systems/PerformanceMonitor';
import { installEditableDomText, installEditableText, loadEditableContent } from './config/EditableContent';

// Register the defeat font before Phaser creates its first canvas text object.
// Vite fingerprints this URL and serves the font alongside the game bundle.
const gorvex = new FontFace('Gorvex', `url("${new URL('./assets/fonts/gorvex.regular.ttf', import.meta.url).href}")`);
document.fonts.add(gorvex);
void gorvex.load().catch(() => undefined);

// Phaser owns the canvas lifecycle; Vite only provides bundling and hot reload.
await loadEditableContent();
installEditableText();
installEditableDomText();
performance.mark('ni-mbaya:engine-ready');
const game = new Phaser.Game(gameConfig);
installPerformanceMonitor(game);
if (import.meta.env.VITE_E2E === 'true') {
  Object.assign(window, { __game: game, __getGameplayTime: getGameplayTime });
}
