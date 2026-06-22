export default class PreloadScene extends Phaser.Scene {
    constructor() {
        super('PreloadScene');
    }

    preload() {
        console.log('PreloadScene');
        const { width, height } = this.scale;

        this.load.on('progress', (value) => {
            const loadingImage = this.add.sprite(this.scale.width / 2, this.scale.height / 2, 'loading').setOrigin(0.5);
            loadingImage.setScale(0.15);
            loadingImage.play('loading');
        });

        // Carregar os assets
        this.load.image('fundo_menu', 'assets/Fundo.png');
        this.load.image('fumaca', 'assets/Fumacas_Passantes.png');
        this.load.image('simbolos', 'assets/Simbolos.png');
        this.load.image('titulo', 'assets/Titulo.png');
        this.load.image('botao_jogar', 'assets/Botao_Jogar.png');
        this.load.image('botao_continuar', 'assets/CONTINUAR.png');
        this.load.image('painel', 'assets/Painel.png');
        this.load.image('gameover', 'assets/Game_Over.png');
        
        this.load.spritesheet('astronautinha', 'assets/Astronautinha.png', { frameWidth: 64, frameHeight: 64 });
        this.load.spritesheet('player', 'assets/Nave.png', { frameWidth: 1080, frameHeight: 1080 });
        this.load.spritesheet('inimigo', 'assets/Nave_Inimiga.png', { frameWidth: 1080, frameHeight: 1080 });
        this.load.spritesheet('explosao', 'assets/Explosao.png', { frameWidth: 80, frameHeight: 60 });
        this.load.spritesheet('tiro', 'assets/Tiro.png', { frameWidth: 64, frameHeight: 64 });

        this.load.font('super-dario-advance-4', 'assets/super-dario-advance-4.ttf');

        

        // Esperar o carregamento completo
        this.load.on('complete', () => {
            this.createAnimations();
        });
        this.load.start();
    }

    createAnimations() {
        // Criar animações
        this.anims.create({
            key: 'astronautinha_anim',
            frames: this.anims.generateFrameNumbers('astronautinha', { start: 0, end: 299 }),
            frameRate: 30,
            repeat: -1
        });

        this.anims.create({
            key: 'player_anim',
            frames: this.anims.generateFrameNumbers('player', { start: 0, end: 3 }),
            frameRate: 30,
            repeat: -1
        });

        this.anims.create({
            key: 'inimigo_anim',
            frames: this.anims.generateFrameNumbers('inimigo', { start: 0, end: 3 }),
            frameRate: 30,
            repeat: -1
        });

        this.anims.create({
            key: 'explosao_anim',
            frames: this.anims.generateFrameNumbers('explosao', { start: 0, end: 8 }),
            frameRate: 15,
            repeat: 0
        });

        this.anims.create({
            key: 'tiro_anim',
            frames: this.anims.generateFrameNumbers('tiro', { start: 0, end: 1 }),
            frameRate: 15,
            repeat: -1
        });

        // Garantir que as animações foram criadas
        this.time.delayedCall(100, () => {
            this.scene.start('MenuScene');
        });
    }

    create() {
        // Nada a fazer aqui
    }
}
