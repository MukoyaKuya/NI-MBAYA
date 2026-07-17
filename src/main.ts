import Phaser from 'phaser';
import { gameConfig } from './config/GameConfig';
import './style.css';

// Phaser owns the canvas lifecycle; Vite only provides bundling and hot reload.
new Phaser.Game(gameConfig);
