// src/GameScene.js
export default class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
        this.life;
        this.player;
        this.asteroids;
        this.lifeText;
        this.scoreText;
        this.inputText;
        this.inputField;
        this.score;
        this.screenWidth;
        this.screenHeight;
        this.tiro;
        this.onda;
        this.velocidade = 500;
        this.qntBaseInimigos = 5;
        this.inimigosRestantes;
        this.fundoMovimento; // Adicionar variável para o fundo em movimento

    }

    preload() {
    }

    create() {
        const { width, height } = this.sys.game.config; // Obtenha as dimensões do jogo
        this.fundoMovimento = this.add.tileSprite(0, 0, width,height, 'fumaca').setOrigin(0);
        this.add.image(0, 0, 'fundo_menu').setOrigin(0).setDisplaySize(width, height); // Ajuste a imagem ao espaço do jogo
        
        
        this.screenWidth = width;
        this.screenHeight = height;
        // Inicializar variáveis
        this.life = 3;
        this.player = null;
        this.asteroids = null;
        this.lifeText = null;
        this.scoreText = null;
        this.inputText = '';
        this.inputField = null;
        this.score = 0;
        this.tiro = null;
        this.onda = 1;
        this.velocidadeBase = this.velocidade / 1000;
        this.inimigosRestantes = this.qntBaseInimigos;

        // Criar o player fora da tela
        this.player = this.physics.add.sprite(width * 0.5, height + 100, 'player');
        this.player.setDisplaySize(70, 70);
        this.player.setOrigin(0.5, 0.5);
        this.player.body.setCollideWorldBounds(false);
        //rotacionar o player 90 graus
        this.player.setRotation(Phaser.Math.DegToRad(-90));

        // Criar a animação do player
        this.player.play('player_anim');

        // Animação para mover o player para a posição desejada
        this.tweens.add({
            targets: this.player,
            y: height * 0.68,
            duration: 2000,
            ease: 'Power2',
            onComplete: () => {
                // Iniciar o jogo após a animação
                this.startGame();
                this.comecarOnda();
            }
        });

        // Criar o grupo de asteroides
        this.asteroids = this.physics.add.group();

        // Criar painel de vida e pontuação
        this.add.image(0, 0, 'painel').setOrigin(0).setDisplaySize(width , height); // Ajuste a imagem ao espaço do jogo

        
        // Criar texto de vida
        this.lifeText = this.add.text(width * 0.43, height * 0.867, '3', { fontSize: '22px', fill: '#ffffff'});

        // Criar texto de pontuação
        this.scoreText = this.add.text(width * 0.27, height * 0.819, '0', { fontSize: '22px', fill: '#ffffff'});


        this.ondaText = this.add.text(width * 0.75, height * 0.845, this.onda, { fontSize: '22px', fill: '#ffffff'});
        // Campo de entrada de texto
        this.inputField = this.add.text(width * 0.5, height * 0.75, '', { fontSize: '32px', fill: '#FFF'});
        this.inputField.setOrigin(0.5, 0);

        // Criar evento de teclado
        this.input.keyboard.on('keydown', this.handleInput, this);
    }

    startGame() {
        // Evento de colisão entre player e asteroides
        this.physics.add.collider(this.player, this.asteroids, this.handleCollision, null, this);
    }

    comecarOnda() {
        const waveMessage = this.add.text(this.screenWidth / 2, this.screenHeight / 2, `Onda ${this.onda}`, {
            fontSize: '40px',
            fill: '#ffffff',
            fontFamily: 'super-dario-advance-4'
        });
        waveMessage.setOrigin(0.5, 0.5);

        this.time.addEvent({
            delay: 2000, // Atraso de 2 segundos
            callback: () => {
                waveMessage.destroy();
                this.inimigosRestantes = this.qntBaseInimigos + Math.floor(this.onda * 0.5);
                const contas = this.gerarContas();
                for (let i = 0; i < this.inimigosRestantes; i++) {
                    this.time.addEvent({
                        delay: i * 2000,
                        callback: () => this.spawnAsteroid(contas[i % contas.length]),
                        callbackScope: this
                    });
                }
            },
            callbackScope: this
        });
    }

    gerarContas() {
        const contas = [];
        const onda = this.onda;

        const resultadoExiste = (resultado) => {
            return contas.some(conta => conta.resultado === resultado);
        };

        // Nível 1: [1;9] + [1;9]
        for (let i = 0; i < Math.max(5 - Math.floor(onda / 2), 1); i++) {
            let num1, num2, resultado;
            do {
                num1 = Phaser.Math.Between(1, 9);
                num2 = Phaser.Math.Between(1, 9);
                resultado = num1 + num2;
            } while (resultadoExiste(resultado));
            contas.push({ num1, num2, operador: '+', resultado });
        }

        // Nível 2: [1;9] - [1;9]
        for (let i = 0; i < Math.max(3 - Math.floor(onda / 3), 1); i++) {
            let num1, num2, resultado;
            do {
                num1 = Phaser.Math.Between(1, 9);
                num2 = Phaser.Math.Between(1, 9);
                if (num1 < num2) {
                    [num1, num2] = [num2, num1]; // Troca os valores para garantir que num1 seja maior que num2
                }
                resultado = num1 - num2;
            } while (resultadoExiste(resultado));
            contas.push({ num1, num2, operador: '-', resultado });
        }

        // Nível 3: [10;19] + [1;9]
        for (let i = 0; i < Math.max(2 - Math.floor(onda / 4), 1); i++) {
            let num1, num2, resultado;
            do {
                num1 = Phaser.Math.Between(10, 19);
                num2 = Phaser.Math.Between(1, 9);
                resultado = num1 + num2;
            } while (resultadoExiste(resultado));
            contas.push({ num1, num2, operador: '+', resultado });
        }

        // Nível 4: [10;19] - [1;9]
        for (let i = 0; i < Math.max(2 - Math.floor(onda / 5), 1); i++) {
            let num1, num2, resultado;
            do {
                num1 = Phaser.Math.Between(10, 19);
                num2 = Phaser.Math.Between(1, 9);
                resultado = num1 - num2;
            } while (resultadoExiste(resultado));
            contas.push({ num1, num2, operador: '-', resultado });
        }

        // Nível 5: [n]*[n] (onde o tamanho de n é ditado pela qual onda está)
        for (let i = 0; i < Math.floor(onda / 2); i++) {
            let num1, num2, resultado;
            do {
                const n = Phaser.Math.Between(1, Math.min(onda, 10));
                num1 = Phaser.Math.Between(1, n);
                num2 = Phaser.Math.Between(1, n);
                resultado = num1 * num2;
            } while (resultadoExiste(resultado));
            contas.push({ num1, num2, operador: '*', resultado });
        }

        // deixar só a quantidade de contas necessárias
        contas.length = this.inimigosRestantes;

        return contas;
    }

    update() {
        this.fundoMovimento.tilePositionY -= 5;
        this.asteroids.children.iterate(function (asteroid) {
            if (asteroid) {
                const direction = new Phaser.Math.Vector2(this.player.x - asteroid.x, this.player.y - asteroid.y);
                direction.normalize();
                const speed = this.velocidadeBase;
                asteroid.x += direction.x * speed;
                asteroid.y += direction.y * speed;

                // Calcular o ângulo entre o asteroide e o player
                const angle = Phaser.Math.Angle.Between(asteroid.x, asteroid.y, this.player.x, this.player.y);
                asteroid.setRotation(angle - Phaser.Math.DegToRad(90)); // Ajustar a rotação do asteroide

                asteroid.text.x = asteroid.x - asteroid.text.width / 2;
                asteroid.text.y = asteroid.y + 20;
            }
        }, this);

        this.checkAnswer();
        this.checkGameOver();

        if (this.life <= 0) {
            //destruir o player
            this.scene.start('GameOverScene');
        }

    }

    checkAnswer() {
        if (this.tiroDisparado) {
            return;
        }

        this.asteroids.children.iterate(function (asteroid) {
            if (asteroid && asteroid.result === parseInt(this.inputText)) {

                // Rotacionar o player com animação
                const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, asteroid.x, asteroid.y);
                this.tweens.add({
                    targets: this.player,
                    rotation: angle,
                    duration: 500, // Duração da animação em milissegundos
                    ease: 'Power2'
                });

                // Criar o sprite do tiro
                const tiro = this.physics.add.sprite(this.player.x, this.player.y, 'tiro');
                tiro.setDisplaySize(50, 50);
                tiro.setOrigin(0.5, 0.5);

                // Reproduzir a animação do tiro
                tiro.play('tiro_anim');

                // Animação do tiro em direção ao asteroide
                this.physics.moveTo(tiro, asteroid.x, asteroid.y, 750);

                this.inputField.setColor('#00ff00'); // Mudar para verde

                // Evento de colisão entre o tiro e o asteroide
                this.physics.add.collider(tiro, asteroid, (tiro, asteroid) => {
                    tiro.destroy();
                    asteroid.text.destroy();
                    asteroid.destroy();
                    this.score += 10;
                    this.scoreText.setText(this.score);
                    this.tiroDisparado = false;

                    // Criar o sprite de explosão na posição do asteroide
                    const explosao = this.add.sprite(asteroid.x, asteroid.y, 'explosao');
                    explosao.setDisplaySize(70, 70);
                    explosao.setOrigin(0.5, 0.5);
                    explosao.play('explosao_anim');

                    // Destruir a explosão após a animação terminar
                    explosao.on('animationcomplete', () => {
                        explosao.destroy();
                    });
                    this.inputText = '';
                    this.inputField.setText(this.inputText);
                    this.inputField.setColor('#FFF'); // Voltar para a cor original

                    this.inimigosRestantes -= 1;
                    if (this.inimigosRestantes <= 0) {
                        this.onda += 1;
                        this.comecarOnda();
                    }
                });

                this.tiroDisparado = true;
                return true;
            }
        }, this);
    }

    animateInputField(callback) {
        this.tweens.add({
            targets: this.inputField,
            duration: 2000,
            repeat: 2,
            yoyo: true,
            ease: 'Power1',
            onStart: () => {
                this.inputField.setColor('#00ff00'); // Mudar para verde
            },
            onComplete: () => {
                this.inputField.setColor('#FFF'); // Voltar para a cor original
                if (callback) callback();
            }
        });
    }

    checkGameOver() {
        if (this.life <= 0) {
            this.scene.start('GameOverScene', { score: this.score, wave: this.onda });
        }
    }

    handleCollision(player, asteroid) {
    // Reproduz a animação de explosão no local da colisão
        let explosao = this.add.sprite(asteroid.x, asteroid.y, 'explosao');
        explosao.play('explosao_anim');
        explosao.on('animationcomplete', () => {
            explosao.destroy();
        });


        this.life -= 1;
        this.lifeText.setText(this.life);
        asteroid.text.destroy();
        asteroid.destroy();

        this.inimigosRestantes -= 1;
        if (this.inimigosRestantes <= 0) {
            this.onda += 1;
            this.comecarOnda();
        }
    }

    handleInput(event) {
        // Ignorar teclas F1, F2, F3
        if (['F1', 'F2', 'F3'].includes(event.key)) {
            return;
        }

        if (event.key === 'Enter') {
            this.inputText = '';
            this.inputField.setText(this.inputText);
        } else if (event.key === 'Backspace') {
            this.inputText = this.inputText.slice(0, -1);
            this.inputField.setText(this.inputText);
        } else if (event.key.match(/[0-9]/)) {
            this.inputText += event.key;
            this.inputField.setText(this.inputText);
        }
    }

    spawnAsteroid(conta) {
        const x = Phaser.Math.Between(this.screenWidth * 0.1, this.screenWidth * 0.9);
        const { num1, num2, operador, resultado } = conta;

        const asteroid = this.physics.add.sprite(x, -50, 'inimigo'); // Crie o sprite do asteroide
        asteroid.setDisplaySize(50, 55); // Defina o tamanho do asteroide
        asteroid.setOrigin(0.5, 0.5); // Defina a origem do asteroide

        asteroid.play('inimigo_anim'); // Reproduzir a animação do asteroide

        asteroid.setVelocity(0, 100); // Defina a velocidade do asteroide
        asteroid.result = resultado;

        const text = this.add.text(x, 0, `${num1} ${operador} ${num2}`, { fontSize: '20px', fill: '#ffffff'});
        asteroid.text = text;

        this.asteroids.add(asteroid);
    }
}