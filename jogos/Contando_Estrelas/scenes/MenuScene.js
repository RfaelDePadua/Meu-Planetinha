export default class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  preload() {
    console.log('MenuScene');
  }

  create() {
    const { width, height } = this.sys.game.config; // Obtenha as dimensões do jogo
    this.add.image(0, 0, 'fundo_menu').setOrigin(0).setDisplaySize(width, height); // Ajuste a imagem ao espaço do jogo

    // Adicionar o sprite e reproduzir a animação
    const astronautinha = this.add.sprite(width / 2, 0, 'astronautinha');
    astronautinha.play('astronautinha_anim');


    this.tweens.add({
      targets: astronautinha,
      y: height + 64, // Move para fora da tela, abaixo
      duration: 10000, // Duração da animação em milissegundos
      ease: 'Linear',
      repeat: 0, // Não repete
      yoyo: false // Não volta para a posição inicial
    });

    const simbolos = this.add.image(0, 0, 'simbolos').setOrigin(0).setDisplaySize(width, height); // Ajuste a imagem ao espaço do jogo
    const maisSimbolos = this.add.image(-150, 0, 'simbolos').setOrigin(0).setDisplaySize(width, height); // Ajuste a imagem ao espaço do jogo
    maisSimbolos.flipX = true; // Inverter a imagem horizontalmente
    maisSimbolos.flipY = true; // Inverter a imagem verticalmente
    const titulo = this.add.image(0, 0, 'titulo').setOrigin(0).setDisplaySize(width, height); // Ajuste a imagem ao espaço do jogo
    const botaoJogar = this.add.image(0, 0, 'botao_jogar').setOrigin(0).setDisplaySize(width, height);

    botaoJogar.setInteractive({ useHandCursor: true, pixelPerfect: true });
    botaoJogar.on('pointerdown', () => {
      this.fadeOutElements([simbolos, titulo, botaoJogar, astronautinha], () => {
        this.scene.start('GameScene');
      });
    });

    // Signal to parent shell that the game is ready
    if (window.parent !== window) {
      window.parent.postMessage('game-ready', '*');
    }
  }

  fadeOutElements(elements, callback) {
    this.tweens.add({
      targets: elements,
      alpha: 0,
      duration: 300, // Duração da animação em milissegundos
      ease: 'Power1',
      onComplete: callback
    });
  }
}