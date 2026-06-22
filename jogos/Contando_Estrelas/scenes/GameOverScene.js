export default class GameOverScene extends Phaser.Scene {
  constructor() {
    super('GameOverScene');
  }

  init(data) {
    this.score = data.score;
    this.wave = data.wave;
  }

  create() {
    const { width, height } = this.sys.game.config; // Obtenha as dimensões do jogo
    this.add.image(0, 0, 'fundo_menu').setOrigin(0).setDisplaySize(width, height); // Ajuste a imagem ao espaço do jogo
    const gameover = this.add.image(width / 2, height / 2, 'gameover').setDisplaySize(width, height); // Adicione a imagem de game over ao centro do jogo

    const botaoContinuar = this.add.image(0, 50, 'botao_continuar').setOrigin(0).setDisplaySize(width, height);


    botaoContinuar.setInteractive({ useHandCursor: true, pixelPerfect: true });
    botaoContinuar.on('pointerdown', () => {
      this.fadeOutElements([gameover, botaoContinuar, this.scoreText], () => {
        this.scene.start('MenuScene');
      });
    });

    // Exibir pontuação e onda
    this.scoreText = this.add.text(width / 2, height / 2 + 40, `${this.score}`, { fontSize: '32px', fill: '#ffffff', fontFamily: 'super-dario-advance-4' }).setOrigin(0.5);  }

  fadeOutElements(elements, callback) {
    this.tweens.add({
      targets: elements,
      alpha: 0,
      duration: 300,
      onComplete: callback
    });
  }
}