export default class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    // Carregar recursos aqui, se necessário
    this.load.spritesheet('loading', 'assets/loading.png', { frameWidth: 640, frameHeight: 640 });
  }

  create() {

    // colocar um cor
    this.cameras.main.setBackgroundColor('#000000');
    
    // Adiciona um gif de loading
    this.anims.create({
      key: 'loading',
      frames: this.anims.generateFrameNumbers('loading', { start: 0, end: 7 }),
      frameRate: 15,
      repeat: -1,
    });


    
    // Adiciona um delay de 1 segundo para ir para a próxima cena
    this.time.delayedCall(400, () => {
      this.scene.start('PreloadScene'); // Vai para a PreloadScene
    });
  }
}
