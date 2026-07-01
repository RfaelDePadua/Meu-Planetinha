import { GAME_W, GAME_H, CSS, FONTS, applyShadow } from './theme.js';

// Número de inimigos por onda (fonte única, usada aqui e na GameScene via init).
export function enemyCountForWave(wave) {
  return Math.min(4 + wave, 10);
}

export default class TransitionScene extends Phaser.Scene {
  constructor() {
    super('TransitionScene');
  }

  init(data) {
    this.wave = data.wave || 1;
    this.score = data.score || 0;
    this.life = data.life != null ? data.life : 3;
  }

  create() {
    this.add.tileSprite(0, 0, GAME_W, GAME_H, 'bg').setOrigin(0).setAlpha(0.34);
    this.add.tileSprite(0, 0, GAME_W, GAME_H, 'stars').setOrigin(0).setAlpha(0.5);

    const count = enemyCountForWave(this.wave);
    const cx = GAME_W / 2;

    const prep = this.add.text(cx, 210, 'PREPARE-SE', {
      fontFamily: FONTS.display, fontStyle: '700', fontSize: '22px', color: CSS.teal,
    }).setOrigin(0.5).setAlpha(0);
    applyShadow(prep, 2);

    const ondaLbl = this.add.text(cx, 280, 'ONDA', {
      fontFamily: FONTS.display, fontStyle: '700', fontSize: '64px', color: CSS.gold,
    }).setOrigin(0.5).setAlpha(0);
    applyShadow(ondaLbl, 3);

    const num = this.add.text(cx, 372, `${this.wave}`, {
      fontFamily: FONTS.body, fontStyle: '700', fontSize: '100px', color: CSS.white,
    }).setOrigin(0.5).setScale(0.2).setAlpha(0);
    applyShadow(num, 3);

    const enemiesLbl = this.add.text(cx, 470, `${count} INIMIGOS`, {
      fontFamily: FONTS.display, fontStyle: '700', fontSize: '18px', color: CSS.white,
    }).setOrigin(0.5).setAlpha(0);
    applyShadow(enemiesLbl, 2);

    this.tweens.add({ targets: prep, alpha: 1, duration: 300 });
    this.tweens.add({ targets: ondaLbl, alpha: 1, duration: 300, delay: 200 });
    this.tweens.add({
      targets: num, alpha: 1, scale: 1, duration: 600, delay: 350, ease: 'Back.easeOut',
    });
    this.tweens.add({ targets: enemiesLbl, alpha: 1, duration: 300, delay: 700 });

    this.time.delayedCall(2300, () => {
      this.cameras.main.fadeOut(250, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('GameScene', {
          wave: this.wave, score: this.score, life: this.life, enemyCount: count,
        });
      });
    });
  }
}
