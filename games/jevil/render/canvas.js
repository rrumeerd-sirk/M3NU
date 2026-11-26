

import { HEART_MASK, BATTLEBG_MASK, SPRITE_MASKS } from '../sim/masks.js';
import { spriteFor } from './sprites.js';
import { tinted, drawSpriteExt } from './draw/gm.js';
import { drawAttackpress, drawBattleUI, drawDmgWriter, drawTensionbar } from './battleui.js';
import { drawJokerbg } from './jokerbg.js';
import { drawJokerBody, drawJokerFog } from './jokerbody.js';
import { drawWriter } from './battlemsg.js';

const VIEW_W = 640;
const VIEW_H = 480;

const BLEND_NAMES = {
  c_white: null,
  c_gray: [128, 128, 128],
  c_ltgray: [192, 192, 192],
  c_red: [255, 0, 0],
  c_black: [0, 0, 0],
};

const maskCanvasCache = new Map();

function maskCanvas(mask, color) {
  const key = mask.name + '|' + color;
  let c = maskCanvasCache.get(key);
  if (!c) {
    c = document.createElement('canvas');
    c.width = mask.w;
    c.height = mask.h;
    const mctx = c.getContext('2d');
    mctx.fillStyle = color;
    for (let y = 0; y < mask.h; y++) {
      for (let x = 0; x < mask.w; x++) {
        if (mask.px[y][x]) mctx.fillRect(x, y, 1, 1);
      }
    }
    maskCanvasCache.set(key, c);
  }
  return c;
}

function drawMasked(ctx, mask, e, color) {
  const alpha = Math.max(0, Math.min(1, e.image_alpha ?? 1));
  if (alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(e.x, e.y);
  ctx.rotate(-((e.image_angle ?? 0) * Math.PI) / 180);
  ctx.scale(e.image_xscale ?? 1, e.image_yscale ?? 1);
  ctx.drawImage(maskCanvas(mask, color), -mask.originX, -mask.originY);
  ctx.restore();
}

function colorFor(e) {
  if (e.active !== 1) return '#8a8a9a';
  if (e.image_blend === 'c_red') return '#ff4040';
  if (e.image_blend === 'c_gray') return '#8a8a9a';
  if (e.image_blend === 'c_ltgray') return '#c8c8d8';
  return '#ffffff';
}

export function createRenderer(canvas, sprites = null) {
  let lastSimFrame = -1;
  canvas.width = VIEW_W;
  canvas.height = VIEW_H;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  function blitSprite(e) {
    if (!sprites) return false;
    const entry = spriteFor(sprites, e);
    if (!entry || !entry.frames.length) return false;
    const alpha = Math.max(0, Math.min(1, e.image_alpha ?? 1));
    if (alpha <= 0) return true;
    const idx = Math.abs(Math.floor(e.image_index ?? 0)) % entry.frames.length;
    const img = entry.frames[idx];
    if (!img) return false;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(e.x, e.y);
    const ang = e.image_angle ?? 0;
    if (ang) ctx.rotate((-ang * Math.PI) / 180);
    ctx.scale(e.image_xscale ?? 1, e.image_yscale ?? 1);
    const blend = Array.isArray(e.image_blend) ? e.image_blend
      : (BLEND_NAMES[e.image_blend] ?? null);
    ctx.drawImage(blend ? tinted(img, blend) : img, -entry.meta.ox, -entry.meta.oy);
    ctx.restore();
    return true;
  }

  function draw(state) {

    const simAdvanced = state.frame !== lastSimFrame;
    lastSimFrame = state.frame;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);

    const vx = Math.round(state.view?.x ?? 0);
    const vy = Math.round(state.view?.y ?? 0);
    const room = () => ctx.setTransform(1, 0, 0, 1, -vx, -vy);
    const screen = () => ctx.setTransform(1, 0, 0, 1, 0, 0);
    room();

    const ents = state.entities
      .filter((e) => e.alive)
      .sort((a, b) => (b.depth ?? 0) - (a.depth ?? 0) || b.seq - a.seq);

    for (const e of ents) {

      if (e.type.name === 'obj_darkener') {
        if (e.darkamt > 0) {
          ctx.save();
          ctx.globalAlpha = e.darkamt / 20;
          ctx.fillStyle = '#000';
          ctx.fillRect(vx - 40, vy - 40, 720, 560);
          ctx.restore();
        }
        continue;
      }

      if (e.visible === 0) continue;
      const t = e.type.name;
      if (t === 'obj_growtangle') {

        const drew = blitSprite({ ...e, type: e.type, image_index: 1 })
          && blitSprite({ ...e, type: e.type, image_index: 0 });
        if (!drew) drawMasked(ctx, BATTLEBG_MASK, e, '#39c556');
        continue;
      }

      if (t === 'obj_heart') {
        if (!blitSprite({ ...e, image_angle: 0 })) {
          drawMasked(ctx, HEART_MASK, { ...pick(e), image_angle: 0 }, '#ff2040');
        }
        continue;
      }

      if (t === 'obj_grazebox') {
        const g = e.drawTimer ?? 0;
        const spr = sprites?.get('spr_grazeappear');
        if (g > 0 && spr) {
          drawSpriteExt(ctx, spr, 0, e.x, e.y, 1, 1, 0, null, g / 6);
          drawSpriteExt(ctx, spr, 3, e.x, e.y, 1, 1, 0, null, g / 6 - 0.2);
        }
        continue;
      }

      if (t === 'obj_dbullet_vert') {
        const spr = sprites?.get(e.sprite_index);
        if (spr) {
          for (const [sc, a] of e.drawn ?? []) drawSpriteExt(ctx, spr, 0, e.x, e.y, sc, sc, 0, null, a);
          continue;
        }
      }

      if (t === 'obj_laserscythe') {
        const body = sprites?.get('spr_joker_scythebody');
        if (body) {
          if ((e.explode ?? 0) < 2) {
            drawSpriteExt(ctx, body, Math.floor(e.image_index ?? 0), e.remx, e.remy, e.scale, e.scale, e.remrot, null, 1);
          }
          if ((e.explode ?? 0) >= 1) blitSprite(e);
          continue;
        }
      }

      if (t === 'obj_suitbomb' && (e.con ?? 0) >= 2) {
        const spr = sprites?.get(e.sprite_index);
        const w = (spr?.meta.w ?? 0) * (e.image_xscale ?? 1);
        const r = w / 2 + e.explodedraw * 2;
        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(1, 1.5 - e.explodedraw / 10));
        ctx.fillStyle = '#fff';
        ctx.beginPath();

        for (let k = 0; k < 24; k++) {
          const a = (k / 24) * Math.PI * 2;
          ctx.lineTo(e.x + Math.cos(a) * r, e.y + Math.sin(a) * r);
        }
        ctx.fill();
        ctx.restore();
        continue;
      }

      if (t === 'obj_marker' && e.sprite_index) {
        blitSprite(e);
        continue;
      }
      if (t === 'obj_marker') {

        const a = Math.max(0, Math.min(1, e.image_alpha ?? 0));
        if (a > 0) {
          ctx.save();
          ctx.globalAlpha = a;
          ctx.fillStyle = e.image_blend === 'c_black' ? '#000' : '#fff';
          const w = 2 * (e.image_xscale ?? 1);
          const h = 240 * (e.image_yscale ?? 1);
          ctx.fillRect(e.x - w / 2, e.y, w, h);
          ctx.restore();
        }
        continue;
      }

      if (t === 'obj_jokerbg_triangle_real') {
        if (sprites) drawJokerbg(ctx, sprites, e.drawn);
        continue;
      }
      if (t === 'obj_joker_body') {
        drawJokerBody(ctx, sprites ?? new Map(), state, e, simAdvanced);
        continue;
      }
      if (t === 'obj_joker') {
        drawJokerFog(ctx, sprites ?? new Map(), e);
        continue;
      }

      if (t === 'obj_oflash') {
        if (e.drawn) {
          const [name, idx, x, y, xs, ys, a] = e.drawn;
          drawSpriteExt(ctx, sprites?.get(name), Math.floor(idx), x, y, xs, ys, 0, [255, 255, 255], a, true);
        }
        continue;
      }

      if (t === 'obj_hypnofx') {
        for (const [x, y, sc, a] of e.drawList ?? []) {
          drawSpriteExt(ctx, sprites?.get('spr_hypnoring'), 0, x, y, sc, sc, 0, null, a);
        }
        continue;
      }

      if (t === 'obj_battlecontroller') {
        if (state.party) {
          screen();
          drawBattleUI(ctx, sprites, state, simAdvanced);
          room();
        }
        continue;
      }
      if (t === 'obj_writer') {
        drawWriter(ctx, e);
        continue;
      }

      if (t === 'obj_spareanim') {
        for (const [name, idx, x, y, xs, ys, a, fog] of e.drawList ?? []) {
          drawSpriteExt(ctx, sprites?.get(name), Math.floor(idx), x, y, xs, ys, 0, fog ? [255, 255, 255] : null, a, fog);
        }
        continue;
      }

      if (t === 'obj_face') continue;

      if (t === 'obj_pacifyspell') continue;

      if (t === 'obj_astream') continue;

      if (t === 'obj_dmgwriter') {
        if (e.drawn && sprites) drawDmgWriter(ctx, sprites, e.drawn);
        continue;
      }

      if (t === 'obj_heartburst') {
        for (const [name, idx, x, y, xs, ys, a] of e.drawList ?? []) {
          drawSpriteExt(ctx, sprites?.get(name), idx, x, y, xs, ys, 0, null, a);
        }
        continue;
      }
      if (e.type.objIndex >= 213 && e.type.objIndex <= 215) {

        const blend = Array.isArray(e.image_blend) ? e.image_blend : (BLEND_NAMES[e.image_blend] ?? null);
        const alpha = e.image_alpha ?? 1;
        if (e.mainDraw) {
          const spr = sprites?.get(e.thissprite);
          drawSpriteExt(ctx, spr, Math.floor(e.index), e.x, e.y, 2, 2, 0, blend, alpha);
          if (e.flashAlpha !== null && e.flashAlpha !== undefined) {
            drawSpriteExt(ctx, spr, Math.floor(e.index), e.x, e.y, 2, 2, 0, [255, 255, 255], e.flashAlpha, true);
          }
        }
        if (e.hurtDraw) {
          const [name, idx, hx] = e.hurtDraw;
          drawSpriteExt(ctx, sprites?.get(name), Math.floor(idx), hx, e.y, 2, 2, 0, blend, alpha);
        }
        if (e.targetDraw !== null && e.targetDraw !== undefined) {
          drawSpriteExt(ctx, sprites?.get('spr_chartarget'), Math.floor(e.targetDraw), e.x, e.y, 2, 2, 0, null, 1);
        }
        continue;
      }

      if (t === 'obj_tensionbar') {
        drawTensionbar(ctx, sprites, state, e);
        continue;
      }
      if (t === 'obj_attackpress') {
        drawAttackpress(ctx, sprites, e);
        continue;
      }
      if (blitSprite(e)) continue;
      const mask = SPRITE_MASKS[e.mask_index ?? e.sprite_index];
      if (mask) {
        drawMasked(ctx, mask, e, colorFor(e));
      } else if (e.isBullet) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(1, e.image_alpha ?? 1));
        ctx.strokeStyle = '#ffd23c';
        ctx.strokeRect(e.x - 6, e.y - 6, 12, 12);
        ctx.restore();
      }
    }

    screen();
  }

  function pick(s) {
    return { x: s.x, y: s.y, image_xscale: 1, image_yscale: 1, image_alpha: 1 };
  }

  return { ctx, draw, VIEW_W, VIEW_H, sprites };
}
