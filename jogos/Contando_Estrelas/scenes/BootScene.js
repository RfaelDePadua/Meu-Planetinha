import { COLORS } from './theme.js';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  create() {
    this.cameras.main.setBackgroundColor(COLORS.bgDark);
    // Nada pesado para carregar aqui — segue direto para o preload real.
    this.time.delayedCall(80, () => this.scene.start('PreloadScene'));
  }
}
