// theme.js — tokens de design e manifesto de assets (handoff Contando Estrelas)
// Fonte de verdade: design_handoff_contando_estrelas/README.md

export const ASSET_BASE = 'pack';

// Dimensões alvo (mobile portrait). pixelArt:true, escala FIT.
export const GAME_W = 320;
export const GAME_H = 660;

// Paleta como números (para tint, Graphics, etc.)
export const COLORS = {
  magenta:     0xFF4D97, // primária, CTA, boss
  teal:        0x3FD6C8, // confirmar, escudo
  gold:        0xFFD24A, // pontuação, "ONDA", destaque
  green:       0x8FD64F, // acerto
  red:         0xFF5A6A, // dano, erro, vida
  bgDark:      0x160419, // fundo de jogo
  panelPurple: 0x3A1136, // painéis semitransparentes
  outline:     0x2A0E2C, // contornos de texto
  bossRed:     0xC0392B, // sinalização do boss
  keyBorder:   0x6A3A66, // borda das teclas
  white:       0xFFFFFF,
};

// Mesmas cores como string CSS (para fill de texto)
export const CSS = {
  magenta: '#FF4D97',
  teal:    '#3FD6C8',
  gold:    '#FFD24A',
  green:   '#8FD64F',
  red:     '#FF5A6A',
  outline: '#2A0E2C',
  white:   '#FFFFFF',
  pink:    '#FF8CBB',
  tealSoft:'#9FE7DF',
};

// Famílias de fonte (Google Fonts carregadas no index.html)
export const FONTS = {
  display: '"Pixelify Sans"', // HUD labels, botões, título, "ONDA", "PREPARE-SE"
  body:    'Fredoka',         // números, contas, pontuação, teclado
};

// Aplica o contorno-sombra pixel padrão do handoff a um Text.
export function applyShadow(txt, offset = 2) {
  txt.setShadow(offset, offset, CSS.outline, 0, false, true);
  return txt;
}

// Manifesto dos VFX usados no MVP. fw/fh derivados das tiras PNG (ver pack/vfx).
// frames = nº de quadros; rate = frameRate.
export const VFX = {
  explosion:       { file: 'explosion_01.png',        fw: 118, fh: 118, frames: 16, rate: 28 },
  explosionRock:   { file: 'explosion_rock_01.png',   fw: 125, fh: 116, frames: 24, rate: 30 },
  explosionBig:    { file: 'explosion_big_01.png',    fw: 139, fh: 136, frames: 16, rate: 18 },
  explosionLittle: { file: 'explosion_little_02.png', fw: 89,  fh: 93,  frames: 16, rate: 24 },
  fire:            { file: 'fire_01.png',             fw: 125, fh: 121, frames: 16, rate: 18 },
  impact:          { file: 'impact_01.png',           fw: 137, fh: 98,  frames: 16, rate: 30 },
  confusion:       { file: 'confusion_01.png',        fw: 120, fh: 109, frames: 24, rate: 22 },
  coin:            { file: 'coin_01.png',             fw: 115, fh: 113, frames: 24, rate: 24 },
  confetti:        { file: 'confetti_03.png',         fw: 109, fh: 101, frames: 24, rate: 24 },
};

// Sprites estáticos (load.image). [key, arquivo]
export const IMAGES = [
  ['player',     'player.png'],
  ['shot',       'shot.png'],
  ['ast-large',  'ast-large.png'],
  ['ast-mid',    'ast-mid.png'],
  ['ast-small',  'ast-small.png'],
  ['life-full',  'life-full.png'],
  ['life-empty', 'life-empty.png'],
  ['moon',       'moon.png'],
  ['planet',     'planet.png'],
  ['bg',         'bg.png'],
  ['stars',      'stars.png'],
  ['powerup',    'powerup.png'],
];

// Spritesheets especiais (não-VFX). [key, arquivo, frameW, frameH]
export const SHEETS = [
  ['gem',         'gem.png',          16, 20], // 3 frames; usamos frame 0 no HUD
  ['boostFlame',  'vfx/boost_heavy_1.png', 14, 10], // 3 frames — chama do motor
];

// Cria todas as animações de VFX (chamar no create() da PreloadScene).
export function createVfxAnims(scene) {
  for (const [key, def] of Object.entries(VFX)) {
    if (scene.anims.exists(key)) continue;
    scene.anims.create({
      key,
      frames: scene.anims.generateFrameNumbers(key, { start: 0, end: def.frames - 1 }),
      frameRate: def.rate,
      repeat: 0,
    });
  }
}
