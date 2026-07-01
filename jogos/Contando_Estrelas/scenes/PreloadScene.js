import {
  ASSET_BASE, GAME_W, GAME_H, COLORS, CSS, FONTS,
  IMAGES, SHEETS, VFX, createVfxAnims,
} from './theme.js';

export default class PreloadScene extends Phaser.Scene {
  constructor() {
    super('PreloadScene');
  }

  preload() {
    this.drawProgressBar();

    const path = (f) => `${ASSET_BASE}/${f}`;

    // Sprites estáticos
    for (const [key, file] of IMAGES) {
      this.load.image(key, path(file));
    }

    // Spritesheets especiais (gema do HUD, chama do motor)
    for (const [key, file, fw, fh] of SHEETS) {
      this.load.spritesheet(key, path(file), { frameWidth: fw, frameHeight: fh });
    }

    // VFX (tiras horizontais já prontas em pack/vfx)
    for (const [key, def] of Object.entries(VFX)) {
      this.load.spritesheet(key, path(`vfx/${def.file}`), {
        frameWidth: def.fw,
        frameHeight: def.fh,
      });
    }
  }

  drawProgressBar() {
    const cx = GAME_W / 2;
    const cy = GAME_H / 2;

    this.add.text(cx, cy - 40, 'CONTANDO ESTRELAS', {
      fontFamily: FONTS.display, fontStyle: '700', fontSize: '16px', color: CSS.gold,
    }).setOrigin(0.5);

    const barW = 200;
    const barH = 14;
    const box = this.add.graphics();
    box.fillStyle(COLORS.panelPurple, 0.8);
    box.fillRoundedRect(cx - barW / 2, cy, barW, barH, 6);

    const bar = this.add.graphics();
    this.load.on('progress', (value) => {
      bar.clear();
      bar.fillStyle(COLORS.teal, 1);
      bar.fillRoundedRect(cx - barW / 2 + 2, cy + 2, (barW - 4) * value, barH - 4, 4);
    });
  }

  create() {
    // A tira boost_heavy_1 é cortada sem espaçamento entre os frames; em escala
    // não-inteira a borda de um frame amostra 1px do vizinho. Recolhemos as UVs
    // horizontais em meio téxel para travar cada frame no seu próprio recorte.
    this.fixFrameBleed('boostFlame');

    this.createAnimations();
    createVfxAnims(this);

    // Garante que as fontes estejam prontas antes de desenhar texto no menu.
    const done = () => this.scene.start('MenuScene');
    if (document.fonts && document.fonts.ready) {
      Promise.all([
        document.fonts.load('700 24px "Pixelify Sans"'),
        document.fonts.load('700 24px "Fredoka"'),
      ]).catch(() => {}).then(() => document.fonts.ready).then(done, done);
    } else {
      done();
    }
  }

  // Insere meio téxel de margem nas UVs horizontais de cada frame da textura,
  // evitando que a coluna do frame vizinho "vaze" quando o sprite é escalado.
  fixFrameBleed(key) {
    if (!this.textures.exists(key)) return;
    const tex = this.textures.get(key);
    const halfTexel = 0.5 / tex.source[0].width;
    tex.getFrameNames().forEach((name) => {
      const f = tex.frames[name];
      f.u0 += halfTexel;
      f.u1 -= halfTexel;
    });
  }

  createAnimations() {
    // Chama do motor (boost_heavy_1: 3 frames)
    this.anims.create({
      key: 'boostFlame',
      frames: this.anims.generateFrameNumbers('boostFlame', { start: 0, end: 2 }),
      frameRate: 16,
      repeat: -1,
    });
  }
}
