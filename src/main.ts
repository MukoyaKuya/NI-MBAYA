import Phaser from 'phaser';
import { gameConfig } from './config/GameConfig';
import './style.css';
import { installPerformanceMonitor } from './systems/PerformanceMonitor';

// Phaser owns the canvas lifecycle; Vite only provides bundling and hot reload.
performance.mark('ni-mbaya:engine-ready');
installPerformanceMonitor(new Phaser.Game(gameConfig));
