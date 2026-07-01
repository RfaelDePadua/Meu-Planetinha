// ui.js — componentes reutilizáveis (botões e teclas) seguindo o handoff.
import { COLORS, CSS, FONTS, applyShadow } from './theme.js';

// Botão estilizado. variant: 'primary' (JOGAR) | 'secondary' (MENU).
// Retorna um Container; o callback onClick dispara no pointerup.
export function makeButton(scene, x, y, label, opts = {}) {
  const variant = opts.variant || 'primary';
  const isPrimary = variant === 'primary';
  const fontSize = opts.fontSize || (isPrimary ? 28 : 18);
  const padX = opts.padX != null ? opts.padX : (isPrimary ? 40 : 22);
  const padY = opts.padY != null ? opts.padY : 14;
  const depth = isPrimary ? 6 : 0;

  const labelColor = isPrimary ? CSS.white : CSS.tealSoft;
  const text = scene.add.text(0, 0, label.toUpperCase(), {
    fontFamily: FONTS.display, fontStyle: '700', fontSize: `${fontSize}px`, color: labelColor,
  }).setOrigin(0.5);
  applyShadow(text, 2);

  const w = Math.round(text.width + padX * 2);
  const h = Math.round(fontSize + padY * 2);
  const r = isPrimary ? 12 : 10;

  const shadow = scene.add.graphics();
  if (isPrimary) {
    shadow.fillStyle(0xB5247A, 1);
    shadow.fillRoundedRect(-w / 2, -h / 2 + depth, w, h, r);
  }

  const face = scene.add.graphics();
  const drawFace = () => {
    face.clear();
    if (isPrimary) {
      face.fillStyle(COLORS.magenta, 1);
      face.fillRoundedRect(-w / 2, -h / 2, w, h, r);
      face.lineStyle(2, 0xFF8CBB, 1);
      face.strokeRoundedRect(-w / 2, -h / 2, w, h, r);
    } else {
      face.lineStyle(2, 0x3A6A66, 1);
      face.strokeRoundedRect(-w / 2, -h / 2, w, h, r);
    }
  };
  drawFace();

  const container = scene.add.container(x, y, [shadow, face, text]);
  container.setSize(w, h + depth);
  container.setInteractive({ useHandCursor: true });

  const press = (down) => {
    const dy = down ? depth - 2 : 0;
    face.y = dy;
    text.y = dy;
    shadow.setAlpha(down ? 0 : 1);
  };

  container.on('pointerdown', () => press(true));
  container.on('pointerout', () => press(false));
  container.on('pointerup', () => {
    press(false);
    if (opts.onClick) opts.onClick();
  });

  return container;
}

// Tecla do teclado numérico. kind: 'num' | 'ok' | 'del'.
// Retorna { container, press } — press(true/false) anima o afundar.
export function makeKey(scene, x, y, w, h, label, kind, onTap) {
  const depth = 4;
  const isOk = kind === 'ok';
  const isDel = kind === 'del';

  const faceColor = isOk ? COLORS.teal : COLORS.panelPurple;
  const faceAlpha = isOk ? 1 : 0.82;
  const borderColor = isDel ? COLORS.magenta : COLORS.keyBorder;
  const textColor = isOk ? CSS.outline : (isDel ? CSS.magenta : CSS.white);

  const shadow = scene.add.graphics();
  shadow.fillStyle(COLORS.outline, 1);
  shadow.fillRoundedRect(-w / 2, -h / 2 + depth, w, h, 11);

  const face = scene.add.graphics();
  face.fillStyle(faceColor, faceAlpha);
  face.fillRoundedRect(-w / 2, -h / 2, w, h, 11);
  face.lineStyle(2, borderColor, 1);
  face.strokeRoundedRect(-w / 2, -h / 2, w, h, 11);

  const text = scene.add.text(0, 0, label, {
    fontFamily: FONTS.body, fontStyle: '700', fontSize: '23px', color: textColor,
  }).setOrigin(0.5);

  const container = scene.add.container(x, y, [shadow, face, text]);
  container.setSize(w, h + depth);
  container.setInteractive({ useHandCursor: true });

  const press = (down) => {
    const dy = down ? depth - 2 : 0;
    face.y = dy;
    text.y = dy;
    text.setTint(down ? COLORS.gold : 0xffffff);
    if (down) text.setTint(COLORS.gold); else text.clearTint();
    shadow.setAlpha(down ? 0.4 : 1);
  };

  container.on('pointerdown', () => { press(true); if (onTap) onTap(); });
  container.on('pointerup', () => press(false));
  container.on('pointerout', () => press(false));

  return { container, press, text };
}
