import BootScene from './scenes/BootScene.js';
import PreloadScene from './scenes/PreloadScene.js';
import MenuScene from './scenes/MenuScene.js';
import GameScene from './scenes/GameScene.js';
import TransitionScene from './scenes/TransitionScene.js';
import GameOverScene from './scenes/GameOverScene.js';
import { GAME_W, GAME_H } from './scenes/theme.js';

const config = {
  type: Phaser.AUTO,
  width: GAME_W,
  height: GAME_H,
  parent: 'game-container',
  backgroundColor: '#160419', // COLORS.bgDark
  pixelArt: true,
  roundPixels: true,
  physics: {
    default: 'arcade',
    arcade: { gravity: { y: 0 }, debug: false },
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [BootScene, PreloadScene, MenuScene, GameScene, TransitionScene, GameOverScene],
};

// eslint-disable-next-line no-unused-vars
const game = new Phaser.Game(config);

// Contrato compartilhado com a página jogos/jogar.html.
let shellPaused = false;
let pageHidden = document.hidden;

function syncLoopState() {
  if (shellPaused || pageHidden) game.loop.sleep();
  else game.loop.wake();
}

window.addEventListener('message', (event) => {
  const data = event.data;
  const type = typeof data === 'string' ? data : data && data.type;

  if (type === 'pause') { shellPaused = true; syncLoopState(); }
  else if (type === 'resume') { shellPaused = false; syncLoopState(); }
  else if (type === 'mute') game.sound.mute = true;
  else if (type === 'unmute') game.sound.mute = false;
  else if (type === 'restart') window.location.reload();
});

document.addEventListener('visibilitychange', () => {
  pageHidden = document.hidden;
  syncLoopState();
});
