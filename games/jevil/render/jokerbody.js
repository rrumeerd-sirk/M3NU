

import { drawSpriteExt } from './draw/gm.js';

export function resetJokerBody() {}

function drawList(ctx, sprites, list, fog = false) {
  for (const [name, idx, x, y, xs, ys, a] of list) {
    drawSpriteExt(ctx, sprites.get(name), Math.floor(idx), x, y, xs, ys, 0, fog ? [255, 255, 255] : null, a, fog);
  }
}

export function drawJokerBody(ctx, sprites, state, e, simAdvanced) {
  drawList(ctx, sprites, e.drawList ?? []);
  if (e.shadow) {

    const [x1, y1, x2, y2] = e.shadow;
    ctx.fillStyle = '#000';
    ctx.fillRect(Math.round(x1), Math.round(y1), Math.round(x2) - Math.round(x1) + 1, Math.round(y2) - Math.round(y1) + 1);
  }
}

export function drawJokerFog(ctx, sprites, e) {
  if (e.fogDraw) drawList(ctx, sprites, [e.fogDraw], true);
}
