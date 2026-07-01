import { GAME_W, GAME_H, COLORS, CSS, FONTS, applyShadow } from './theme.js';
import { makeButton } from './ui.js';

export default class GameOverScene extends Phaser.Scene {
  constructor() {
    super('GameOverScene');
  }

  init(data) {
    this.finalScore = data.score || 0;
    this.finalWave = data.wave || 1;
  }

  create() {
    this.cameras.main.fadeIn(250, 0, 0, 0);

    // Fundo parallax estático
    this.bgFar = this.add.tileSprite(0, 0, GAME_W, GAME_H, 'bg').setOrigin(0).setAlpha(0.34);
    this.bgMid = this.add.tileSprite(0, 0, GAME_W, GAME_H, 'stars').setOrigin(0).setAlpha(0.5);

    const cx = GAME_W / 2;

    // Anim 25 — explosão grande + detalhe
    const exp = this.add.sprite(cx, 130, 'explosionBig').setScale(0.9);
    exp.play('explosionBig');
    exp.on('animationcomplete', () => {
      const little = this.add.sprite(cx + 40, 150, 'explosionLittle').setScale(0.7);
      little.play('explosionLittle');
      little.once('animationcomplete', () => little.destroy());
    });

    const title = this.add.text(cx, 222, 'FIM DE JOGO', {
      fontFamily: FONTS.display, fontStyle: '700', fontSize: '36px', color: CSS.red,
    }).setOrigin(0.5);
    applyShadow(title, 3);

    // Painel de score
    const panel = this.add.graphics();
    panel.fillStyle(COLORS.panelPurple, 0.85);
    panel.fillRoundedRect(cx - 120, 280, 240, 110, 14);
    panel.lineStyle(2, COLORS.keyBorder, 1);
    panel.strokeRoundedRect(cx - 120, 280, 240, 110, 14);

    this.add.image(cx - 56, 322, 'gem').setFrame(0).setScale(1.3);
    const scoreText = this.add.text(cx - 36, 322, '0', {
      fontFamily: FONTS.body, fontStyle: '700', fontSize: '46px', color: CSS.gold,
    }).setOrigin(0, 0.5);
    applyShadow(scoreText, 3);

    this.add.text(cx, 366, `CHEGOU NA ONDA ${this.finalWave}`, {
      fontFamily: FONTS.display, fontStyle: '700', fontSize: '14px', color: CSS.tealSoft,
    }).setOrigin(0.5);

    // Contagem do score de 0 ao total
    this.tweens.addCounter({
      from: 0, to: this.finalScore, duration: 900, ease: 'Cubic.easeOut',
      onUpdate: (t) => scoreText.setText(`${Math.round(t.getValue())}`),
    });

    // Botões
    makeButton(this, cx, 452, 'Jogar de Novo', {
      variant: 'primary', fontSize: 22,
      onClick: () => this.restart(),
    });
    makeButton(this, cx, 520, 'Menu', {
      variant: 'secondary', fontSize: 18,
      onClick: () => this.toMenu(),
    });
  }

  restart() {
    this.cameras.main.fadeOut(250, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('TransitionScene', { wave: 1, score: 0, life: 3 });
    });
  }

  toMenu() {
    this.cameras.main.fadeOut(250, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('MenuScene');
    });
  }
}
