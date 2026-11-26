

import { drawJokerbg } from '../jokerbg.js';
import { drawSpriteExt } from './gm.js';
import { loadFont, drawText } from '../font.js';

const MAINBIG = loadFont();
const SUSIE_FACES = { 0: 'spr_face_s0', 2: 'spr_face_s2', 3: 'spr_face_s3' };

function body(ctx, sprites, m, alpha = 1) {
  drawSpriteExt(ctx, sprites.get(m.sprite), Math.floor(m.index), m.x, m.y, 2, 2, m.angle || 0, null, alpha);
}

function darkbox(ctx, sprites, jewel) {
  const [x0, y0, x1, y1] = [24, 312, 616, 478];
  const w = x1 - x0 - 63;
  const h = y1 - y0 - 63;
  const top = sprites.get('spr_textbox_top');
  const left = sprites.get('spr_textbox_left');
  const corner = sprites.get('spr_textbox_topleft');
  drawSpriteExt(ctx, top, 0, x0 + 32, y0, w, 2, 0, null, 1);
  drawSpriteExt(ctx, top, 0, x0 + 32, y1 + 1, w, -2, 0, null, 1);
  drawSpriteExt(ctx, left, 0, x1 + 1, y0 + 32, -2, h, 0, null, 1);
  drawSpriteExt(ctx, left, 0, x0, y0 + 32, 2, h, 0, null, 1);
  const f = Math.floor(jewel / 10);
  drawSpriteExt(ctx, corner, f, x0, y0, 2, 2, 0, null, 1);
  drawSpriteExt(ctx, corner, f, x1 + 1, y0, -2, 2, 0, null, 1);
  drawSpriteExt(ctx, corner, f, x0, y1 + 1, 2, -2, 0, null, 1);
  drawSpriteExt(ctx, corner, f, x1 + 1, y1 + 1, -2, -2, 0, null, 1);
}

export function drawIntroScene(ctx, seq, sprites) {
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, 640, 480);
  if (!sprites) {
    ctx.restore();
    return;
  }
  drawJokerbg(ctx, sprites, seq.bg.drawn);

  const bodies = [...seq.party.filter((m) => m.visible)].sort((a, b) => a.y - b.y);
  if (seq.enc) bodies.push(...seq.enc.c);
  for (const a of seq.after) body(ctx, sprites, a, a.alpha);
  for (const m of bodies) body(ctx, sprites, m);
  for (const m of seq.sbul) body(ctx, sprites, m);
  if (seq.jevil.visible) body(ctx, sprites, seq.jevil);

  const d = seq.dlg;
  if (d?.active) {
    ctx.fillStyle = '#000';
    ctx.fillRect(38, 326, 565, 139);
    darkbox(ctx, sprites, d.jewel);
    const f = d.face?.draw;
    if (f?.fc === 1) {
      drawSpriteExt(ctx, sprites.get(SUSIE_FACES[f.fe] ?? 'spr_face_s0'), 0, d.face.x - 5, d.face.y, 2, 2, 0, null, 1);
    } else if (f?.fc === 2) {
      drawSpriteExt(ctx, sprites.get('spr_face_r_dark'), f.fe, d.face.x - 15, d.face.y - 10, 2, 2, 0, null, 1);
    }
    for (const g of d.writer?.glyphs ?? []) {
      drawText(ctx, MAINBIG, g.ch, g.x, g.y, { color: '#ffffff', special: 1 });
    }
  }
  ctx.restore();
}
