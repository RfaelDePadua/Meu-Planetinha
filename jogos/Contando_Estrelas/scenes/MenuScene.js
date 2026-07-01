import { GAME_W, GAME_H, COLORS, CSS, FONTS, applyShadow } from './theme.js';
import { makeButton } from './ui.js';

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  create() {
    // Fundo parallax (camadas roláveis)
    this.bgFar = this.add.tileSprite(0, 0, GAME_W, GAME_H, 'bg').setOrigin(0).setAlpha(0.34);
    this.bgMid = this.add.tileSprite(0, 0, GAME_W, GAME_H, 'stars').setOrigin(0).setAlpha(0.45);
    this.bgNear = this.add.tileSprite(0, 0, GAME_W, GAME_H, 'stars').setOrigin(0).setAlpha(0.85).setScale(1.5);

    // Planeta decorativo no canto
    this.add.image(GAME_W - 30, 120, 'planet').setScale(1.4).setAlpha(0.9);

    // Título
    const title = this.add.text(GAME_W / 2, 96, 'CONTANDO\nESTRELAS', {
      fontFamily: FONTS.display, fontStyle: '700', fontSize: '44px',
      color: CSS.gold, align: 'center', lineSpacing: -6,
    }).setOrigin(0.5, 0);
    applyShadow(title, 3);

    // Nave central flutuando
    const ship = this.add.image(GAME_W / 2, 300, 'player').setScale(128 / 38);
    this.tweens.add({
      targets: ship, y: '-=10', yoyo: true, repeat: -1, duration: 1800, ease: 'Sine.easeInOut',
    });

    // Botão principal
    makeButton(this, GAME_W / 2, 478, 'Jogar', {
      variant: 'primary',
      onClick: () => this.startGame(),
    });

    // Botões secundários (stubs no MVP)
    makeButton(this, GAME_W / 2 - 68, 552, 'Som', { variant: 'secondary', fontSize: 16 });
    makeButton(this, GAME_W / 2 + 78, 552, 'Como Jogar', { variant: 'secondary', fontSize: 16 });

    // Versão
    this.add.text(GAME_W / 2, GAME_H - 16, 'v2.0', {
      fontFamily: FONTS.body, fontStyle: '600', fontSize: '11px', color: '#7a5a78',
    }).setOrigin(0.5);

    // Sinaliza ao shell pai (caso embutido) que o jogo está pronto.
    if (window.parent !== window) {
      window.parent.postMessage('game-ready', '*');
    }
  }

  startGame() {
    this.cameras.main.fadeOut(250, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('TransitionScene', { wave: 1, score: 0, life: 3 });
    });
  }

  update() {
    this.bgFar.tilePositionY -= 0.15;
    this.bgMid.tilePositionY -= 0.3;
    this.bgNear.tilePositionY -= 0.5;
  }
}
