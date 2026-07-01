import { GAME_W, GAME_H, COLORS, CSS, FONTS, VFX, applyShadow } from './theme.js';
import { makeKey } from './ui.js';

const SHIP_Y = 408;
const SHIP_SCALE = 1.25;

// Geometria dos motores. A nave (player.png) tem 38×34 px e dois bocais.
// Em px da arte × SHIP_SCALE = px de jogo. Espelha o handoff (motorOffX=8,
// dois motores simétricos). Como o jogo roda em canvas virtual fixo
// (320×660, Scale.FIT), estes offsets ficam idênticos em qualquer dispositivo.
const ENGINE_OFF_X = 6 * SHIP_SCALE;   // distância horizontal do centro da nave
const ENGINE_OFF_Y = 25 * SHIP_SCALE;  // abaixo do centro da nave
const ENGINE_OFFSETS = [-ENGINE_OFF_X, ENGINE_OFF_X];
const BOOST_SCALE = 1.25;

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  init(data) {
    this.wave = data.wave || 1;
    this.score = data.score || 0;
    this.life = data.life != null ? data.life : 3;
    this.enemyCount = data.enemyCount || 5;

    this.inputText = '';
    this.spawnedCount = 0;
    this.resolvedCount = 0; // inimigos removidos (acerto ou colisão)
    this.gameEnded = false;
  }

  create() {
    this.cameras.main.fadeIn(250, 0, 0, 0);
    this.buildBackground();
    this.buildShip();
    this.createGroups();
    this.buildHud();
    this.buildKeypad();
    this.bindKeyboard();

    this.startWave();
  }

  // ---------------------------------------------------------------- Fundo
  buildBackground() {
    this.bgFar = this.add.tileSprite(0, 0, GAME_W, GAME_H, 'bg').setOrigin(0).setAlpha(0.34);
    this.bgMid = this.add.tileSprite(0, 0, GAME_W, GAME_H, 'stars').setOrigin(0).setAlpha(0.45);
    this.bgNear = this.add.tileSprite(0, 0, GAME_W, GAME_H, 'stars').setOrigin(0).setAlpha(0.85).setScale(1.5);
    this.moon = this.add.image(60, -120, 'moon').setAlpha(0.8);
  }

  // ---------------------------------------------------------------- Nave
  buildShip() {
    this.ship = this.physics.add.sprite(GAME_W / 2, SHIP_Y, 'player');
    this.ship.setScale(SHIP_SCALE).setDepth(5);
    this.ship.body.setSize(this.ship.width * 0.7, this.ship.height * 0.7);

    // A tira boost_heavy_1 é horizontal; giramos 90° para o jato sair na
    // vertical (para baixo). Uma chama por motor, ancorada à nave por offset.
    this.flames = ENGINE_OFFSETS.map((dx) => {
      const f = this.add
        .sprite(this.ship.x + dx, this.ship.y + ENGINE_OFF_Y, 'boostFlame')
        .setScale(BOOST_SCALE)
        .setAngle(90)
        .setDepth(6); // à frente da nave (depth 5)
      f.play('boostFlame');
      return f;
    });

    // Anim 01 — flutuação idle
    this.tweens.add({
      targets: this.ship, y: SHIP_Y - 9, yoyo: true, repeat: -1,
      duration: 1800, ease: 'Sine.easeInOut',
    });
  }

  // Mantém as chamas coladas aos bocais da nave (chamado todo frame).
  syncFlames() {
    if (!this.flames) return;
    this.flames.forEach((f, i) => {
      f.x = this.ship.x + ENGINE_OFFSETS[i];
      f.y = this.ship.y + ENGINE_OFF_Y;
    });
  }

  // ---------------------------------------------------------------- Grupos / colisões
  createGroups() {
    this.enemies = this.physics.add.group();
    this.bullets = this.physics.add.group();

    this.physics.add.overlap(this.bullets, this.enemies, this.onBulletHit, null, this);
    this.physics.add.overlap(this.ship, this.enemies, this.onEnemyReachShip, null, this);
  }

  // ---------------------------------------------------------------- HUD
  buildHud() {
    // Esquerda: gema + score
    this.add.image(16, 20, 'gem').setFrame(0).setScale(1.1).setDepth(20);
    this.scoreText = this.add.text(32, 20, `${this.score}`, {
      fontFamily: FONTS.body, fontStyle: '700', fontSize: '24px', color: CSS.white,
    }).setOrigin(0, 0.5).setDepth(20);
    applyShadow(this.scoreText, 2);
    this.scorePos = new Phaser.Math.Vector2(16, 20);

    // Direita linha 1: ONDA N
    this.waveText = this.add.text(GAME_W - 12, 10, `ONDA ${this.wave}`, {
      fontFamily: FONTS.display, fontStyle: '700', fontSize: '16px', color: CSS.gold,
    }).setOrigin(1, 0).setDepth(20);
    applyShadow(this.waveText, 2);

    // Direita linha 2: 3 corações
    this.hearts = [];
    const hy = 36;
    for (let i = 0; i < 3; i++) {
      const x = GAME_W - 12 - (2 - i) * 20 - 8;
      const tex = i < this.life ? 'life-full' : 'life-empty';
      this.hearts.push(this.add.image(x, hy, tex).setScale(0.7).setDepth(20));
    }
    this.updateHearts();
  }

  updateHearts() {
    this.hearts.forEach((h, i) => {
      h.setTexture(i < this.life ? 'life-full' : 'life-empty');
      this.tweens.killTweensOf(h);
      h.setAlpha(1);
    });
    // Último coração pisca em vida baixa
    if (this.life === 1) {
      this.tweens.add({
        targets: this.hearts[0], alpha: 0.25, yoyo: true, repeat: -1, duration: 450,
      });
    }
  }

  // ---------------------------------------------------------------- Teclado
  buildKeypad() {
    const margin = 8, gap = 7, keyW = 55, keyH = 46;
    const colX = (c) => margin + keyW / 2 + c * (keyW + gap);
    const row1Y = 547 + keyH / 2;
    const row2Y = 600 + keyH / 2;

    // Barra de resposta (top 474, h 50)
    const barY = 474, barH = 50;
    const panel = this.add.graphics().setDepth(15);
    panel.fillStyle(COLORS.panelPurple, 0.82);
    panel.fillRoundedRect(62, barY, GAME_W - 62 - 62, barH, 10);
    panel.lineStyle(2, COLORS.keyBorder, 1);
    panel.strokeRoundedRect(62, barY, GAME_W - 62 - 62, barH, 10);

    this.add.text(74, barY + barH / 2, 'RESPOSTA', {
      fontFamily: FONTS.display, fontStyle: '700', fontSize: '11px', color: CSS.tealSoft,
    }).setOrigin(0, 0.5).setDepth(16);

    this.respValue = this.add.text(GAME_W - 74, barY + barH / 2, '', {
      fontFamily: FONTS.body, fontStyle: '700', fontSize: '28px', color: CSS.white,
    }).setOrigin(1, 0.5).setDepth(16);

    // ⌫ e ✓
    makeKey(this, 33, barY + barH / 2, 50, barH, '⌫', 'del', () => this.backspace());
    makeKey(this, GAME_W - 33, barY + barH / 2, 50, barH, '✓', 'ok', () => this.submit());

    // Grid 5x2
    const layout = [['1', '2', '3', '4', '5'], ['6', '7', '8', '9', '0']];
    layout.forEach((row, r) => {
      row.forEach((d, c) => {
        makeKey(this, colX(c), r === 0 ? row1Y : row2Y, keyW, keyH, d, 'num', () => this.addDigit(d));
      });
    });
  }

  bindKeyboard() {
    this.input.keyboard.on('keydown', (e) => {
      if (this.gameEnded) return;
      if (e.key === 'Enter') this.submit();
      else if (e.key === 'Backspace') this.backspace();
      else if (/^[0-9]$/.test(e.key)) this.addDigit(e.key);
    });
  }

  // ---------------------------------------------------------------- Input lógico
  addDigit(d) {
    if (this.gameEnded || this.inputText.length >= 3) return;
    this.inputText += d;
    this.refreshResp();
    this.tryAutoFire();
  }

  backspace() {
    if (this.gameEnded) return;
    this.inputText = this.inputText.slice(0, -1);
    this.refreshResp();
  }

  submit() {
    if (this.gameEnded || this.inputText === '') return;
    const target = this.findMatch();
    if (target) this.fireAt(target);
    else this.wrongAnswer();
    this.clearInput();
  }

  tryAutoFire() {
    const target = this.findMatch();
    if (target) {
      this.fireAt(target);
      this.clearInput();
    }
  }

  findMatch() {
    const val = parseInt(this.inputText, 10);
    if (Number.isNaN(val)) return null;
    return this.enemies.getChildren().find(
      (e) => e.active && !e.targeted && e.result === val,
    );
  }

  clearInput() {
    this.inputText = '';
    this.refreshResp();
  }

  refreshResp() {
    this.respValue.setText(this.inputText);
  }

  // ---------------------------------------------------------------- Ondas / spawn
  startWave() {
    this.contas = this.gerarContas(this.enemyCount);
    for (let i = 0; i < this.enemyCount; i++) {
      this.time.delayedCall(600 + i * 1600, () => {
        if (!this.gameEnded) this.spawnEnemy(this.contas[i]);
      });
    }
  }

  gerarContas(count) {
    const contas = [];
    const usados = new Set();
    let guard = 0;
    while (contas.length < count && guard < 800) {
      guard++;
      const plus = Phaser.Math.Between(0, 1) === 1;
      let a = Phaser.Math.Between(1, 9);
      let b = Phaser.Math.Between(1, 9);
      let r, op;
      if (plus) { op = '+'; r = a + b; } else {
        if (a < b) [a, b] = [b, a];
        op = '−'; r = a - b;
      }
      if (usados.has(r)) continue;
      usados.add(r);
      contas.push({ a, b, op, r });
    }
    return contas;
  }

  spawnEnemy(conta) {
    const skins = ['ast-large', 'ast-mid', 'ast-small'];
    const skin = Phaser.Utils.Array.GetRandom(skins);
    const x = Phaser.Math.Between(40, GAME_W - 40);

    const enemy = this.physics.add.sprite(x, -30, skin);
    enemy.setScale(42 / enemy.width).setDepth(6).setAlpha(0);
    enemy.result = conta.r;
    enemy.targeted = false;
    enemy.setAngularVelocity(Phaser.Math.Between(-30, 30));
    this.enemies.add(enemy);

    const label = this.add.text(x, -30, `${conta.a} ${conta.op} ${conta.b}`, {
      fontFamily: FONTS.body, fontStyle: '700', fontSize: '20px', color: CSS.white,
    }).setOrigin(0.5).setDepth(7);
    applyShadow(label, 2);
    enemy.label = label;

    this.spawnedCount++;
    // Anim 12 — entrada (fade-in)
    this.tweens.add({ targets: enemy, alpha: 1, duration: 350 });
    this.tweens.add({ targets: label, alpha: { from: 0, to: 1 }, duration: 350 });
  }

  // ---------------------------------------------------------------- Tiro / acerto
  fireAt(enemy) {
    enemy.targeted = true;

    // Anim 06 — muzzle flash
    const muzzle = this.add.sprite(this.ship.x, this.ship.y - 16, 'impact')
      .setScale(0.4).setDepth(8);
    muzzle.play('impact');
    muzzle.once('animationcomplete', () => muzzle.destroy());

    // Anim 07 — projétil
    const bullet = this.physics.add.sprite(this.ship.x, this.ship.y - 18, 'shot').setDepth(8);
    bullet.setScale(1.4);
    bullet.target = enemy;
    this.bullets.add(bullet);
    this.physics.moveToObject(bullet, enemy, 640);

    // TODO(comet_01): rastro do projétil quando o asset definitivo chegar.
  }

  onBulletHit(bullet, enemy) {
    if (!bullet.active || !enemy.active || bullet.target !== enemy) return;
    bullet.destroy();
    this.destroyEnemy(enemy, true);
  }

  destroyEnemy(enemy, scored) {
    const x = enemy.x, y = enemy.y;
    if (enemy.label) enemy.label.destroy();
    enemy.destroy();

    // Anim 09/10 — explosão
    const exp = this.add.sprite(x, y, 'explosionRock').setScale(0.6).setDepth(9);
    exp.play('explosionRock');
    exp.once('animationcomplete', () => exp.destroy());

    if (scored) this.addScore(10, x, y);
    this.resolvedCount++;
    this.checkWaveEnd();
  }

  addScore(points, fromX, fromY) {
    this.score += points;
    this.scoreText.setText(`${this.score}`);

    // Anim 20 — pop no placar
    this.tweens.add({
      targets: this.scoreText, scale: 1.35, yoyo: true, duration: 140, ease: 'Quad.easeOut',
    });

    // coin_01 voando até o placar
    const coin = this.add.sprite(fromX, fromY, 'coin').setScale(0.4).setDepth(21);
    coin.play('coin');
    this.tweens.add({
      targets: coin, x: this.scorePos.x, y: this.scorePos.y, scale: 0.2,
      duration: 500, ease: 'Cubic.easeIn',
      onComplete: () => coin.destroy(),
    });
  }

  // ---------------------------------------------------------------- Resposta errada
  wrongAnswer() {
    // Anim 19 — estrelinhas de tontura + tremor leve (sem perder vida)
    const conf = this.add.sprite(this.ship.x, this.ship.y - 28, 'confusion').setScale(0.7).setDepth(10);
    conf.play('confusion');
    conf.once('animationcomplete', () => conf.destroy());
    this.cameras.main.shake(100, 0.005);
  }

  // ---------------------------------------------------------------- Dano
  onEnemyReachShip(ship, enemy) {
    if (!enemy.active || this.gameEnded) return;
    this.destroyEnemy(enemy, false);

    // Anim 04 — hit flash + shake
    this.ship.setTintFill(COLORS.red);
    this.time.delayedCall(80, () => this.ship.clearTint());
    this.cameras.main.shake(160, 0.008);

    this.life -= 1;
    this.updateHearts();

    if (this.life <= 0) this.endGame();
  }

  // ---------------------------------------------------------------- Fim de onda / jogo
  checkWaveEnd() {
    if (this.gameEnded) return;
    if (this.resolvedCount >= this.enemyCount) {
      this.gameEnded = true; // trava input até a transição
      // Anim 24 — confete
      const conf = this.add.sprite(GAME_W / 2, GAME_H / 2, 'confetti').setScale(1.2).setDepth(30);
      conf.play('confetti');
      this.time.delayedCall(900, () => {
        this.cameras.main.fadeOut(250, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
          this.scene.start('TransitionScene', {
            wave: this.wave + 1, score: this.score, life: this.life,
          });
        });
      });
    }
  }

  endGame() {
    if (this.gameEnded) return;
    this.gameEnded = true;
    this.flames.forEach((f) => f.setVisible(false));

    // Anim 11/25 — morte da nave
    const exp = this.add.sprite(this.ship.x, this.ship.y, 'explosionBig').setScale(0.9).setDepth(30);
    exp.play('explosionBig');
    this.ship.setVisible(false);

    this.time.delayedCall(800, () => {
      this.scene.start('GameOverScene', { score: this.score, wave: this.wave });
    });
  }

  // ---------------------------------------------------------------- Loop
  update() {
    this.bgFar.tilePositionY -= 0.1;
    this.bgMid.tilePositionY -= 0.2;
    this.bgNear.tilePositionY -= 0.4;

    // Anim 26 — corpo à deriva
    this.moon.y += 0.22;
    if (this.moon.y > GAME_H + 120) { this.moon.y = -120; this.moon.x = Phaser.Math.Between(30, GAME_W - 30); }

    // Chamas seguem a nave (uma por motor)
    this.syncFlames();

    const speed = 24 + (this.wave - 1) * 6;
    this.enemies.getChildren().forEach((e) => {
      if (!e.active) return;
      this.physics.moveToObject(e, this.ship, speed);
      if (e.label) {
        e.label.x = e.x;
        e.label.y = e.y + 26;
      }
    });

    // Bullets: homing no alvo; limpeza fora da tela
    this.bullets.getChildren().forEach((b) => {
      if (!b.active) return;
      if (b.target && b.target.active) {
        this.physics.moveToObject(b, b.target, 640);
      } else if (b.y < -40 || b.y > GAME_H + 40 || b.x < -40 || b.x > GAME_W + 40) {
        b.destroy();
      }
    });
  }
}
