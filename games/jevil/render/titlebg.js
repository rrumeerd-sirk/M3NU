

import { drawJokerbg } from './jokerbg.js';
import { jokerbgFields, jokerbgAdvance } from '../sim/jokerbg.js';
import { drawSpriteExt } from './draw/gm.js';

const HORSES = 10;
const RADIUS = 250;
const SPEED = 0.35;
const GRAY = [128, 128, 128];

let t = 0;
const bg = jokerbgFields(1);

export function drawTitleBackground(ctx, sprites, advance = true) {
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, 640, 480);
  if (!sprites) { ctx.restore(); return; }
  if (advance) jokerbgAdvance(bg);
  drawJokerbg(ctx, sprites, bg.drawn);
  if (advance) t += 1;

  const horse = sprites.get('spr_carousel');
  if (horse) {
    const riders = [];
    for (let k = 0; k < HORSES; k++) {

      const siner = t * SPEED + (k * 40 * Math.PI) / HORSES;
      const s0 = Math.sin((siner - SPEED) / 20);
      const s1 = Math.sin(siner / 20);
      const sinsign = s1 - s0;
      const far = sinsign > 0;
      const xs = Math.max(-2, Math.min(2, (sinsign / SPEED) * 50));
      const depthCos = Math.cos(siner / 20);
      const vsin = t + k * 9;
      riders.push({
        far,
        z: far ? -Math.abs(depthCos) : Math.abs(depthCos),
        x: 320 - s1 * RADIUS,
        y: 330 + (far ? -40 : 30) * Math.abs(depthCos) + Math.sin(vsin / 10) * 12,
        xs: Math.abs(xs) < 0.15 ? 0.15 * Math.sign(xs || 1) : xs,
        frame: k % 3,
      });
    }
    riders.sort((a, b) => a.z - b.z);
    for (const r of riders) {
      drawSpriteExt(ctx, horse, r.frame, r.x, r.y, r.xs, 2, 0, r.far ? GRAY : null, r.far ? 0.4 : 0.6);
    }
  }
  ctx.restore();
}
