import BootScene from './scenes/BootScene.js';
import MenuScene from './scenes/MenuScene.js';
import GameScene from './scenes/GameScene.js';
import GameOverScene from './scenes/GameOverScene.js';
import PreloadScene from './scenes/PreloadScene.js';

const aspectRatio = 9 / 16;
const maxWidth = window.innerWidth * 0.8; // 90% da largura da tela
const maxHeight = window.innerHeight * 0.8; // 90% da altura da tela

let width, height;

if (maxWidth / maxHeight > aspectRatio) {
  height = maxHeight;
  width = height * aspectRatio;
} else {
  width = maxWidth;
  height = width / aspectRatio;
}

const config = {
  type: Phaser.AUTO,
  width: width,
  height: height,
  parent: 'game-container',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false
    }
  },
  scene: [BootScene, PreloadScene, MenuScene, GameScene, GameOverScene],
  backgroundColor: '#000000',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  render: {
    pixelArt: false,
    antialias: true,
    willReadFrequently: true
  }
};
  
const game = new Phaser.Game(config);