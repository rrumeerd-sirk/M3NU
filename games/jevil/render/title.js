

import { drawSpriteExt, rgb, c_white } from './draw/gm.js';
import { loadFont, drawText, textWidth, textHeight } from './font.js';
import {
  MODES, SETTINGS_PAGES, TITLE_EXTRAS, CREDITS, ITEM_PICKER, INVENTORY_SIZE,
  controlRows, graphicsRows, gearChoices,
} from '../sim/modes.js';
import { WEAPONS, ARMOR, statsOf, cloneGear } from '../sim/equipment.js';
import { ITEMS } from '../sim/items.js';

const DIM = [128, 128, 138];
const HILITE = [255, 255, 0];
const W = 640;

function centred(ctx, font, text, y, color, scale = 1) {
  const w = textWidth(font, text) * scale;
  drawText(ctx, font, text, (W - w) / 2, y, { color: rgb(color), xscale: scale, yscale: scale });
}

const WORDMARK = [['JOKER', [0xb8, 0x6c, 0xff]], [' SIMULATOR', c_white]];

function centredSegments(ctx, font, segs, y, scale = 1) {
  let total = 0;
  for (const seg of segs) total += textWidth(font, seg[0]) * scale;
  let x = (W - total) / 2;
  for (const [text, color] of segs) {
    drawText(ctx, font, text, x, y, { color: rgb(color), xscale: scale, yscale: scale });
    x += textWidth(font, text) * scale;
  }
}

export function drawTitle(ctx, title, sprites, attacks) {
  const font = loadFont();
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);

  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  if (!font?.ready) {
    ctx.restore();
    return;
  }

  if (title.settings) {
    drawSettings(ctx, title, sprites, font);
    ctx.restore();
    return;
  }

  const heart = sprites?.get('spr_heart');
  let rows;
  let index;
  if (title.pickingAttack) {
    rows = attacks.map((a) => ({ name: a.name.toUpperCase() }));
    index = title.attackIndex;
  } else {
    rows = MODES.map((m) => ({ name: m.name }));
    index = title.index;
  }

  const WINDOW = 8;
  const pitch = rows.length > 6 ? 30 : 34;
  const top = 150;

  let first = 0;
  if (rows.length > WINDOW) {
    first = Math.min(Math.max(0, index - Math.floor(WINDOW / 2)), rows.length - WINDOW);
  }
  const last = Math.min(rows.length, first + WINDOW);

  for (let i = first; i < last; i++) {
    const y = top + (i - first) * pitch;
    const on = i === index;
    if (on && heart) {
      const bob = 0;
      const tw = textWidth(font, rows[i].name);
      const hx = (W - tw) / 2 - 30 + bob;
      drawSpriteExt(ctx, heart, 0, hx, y + 4, 1, 1, 0, null, 1);
    }
    centred(ctx, font, rows[i].name, y, on ? HILITE : c_white);
  }

  if (title.pickingAttack) centred(ctx, font, 'SINGLE ATTACK', 110, DIM, 0.9);

  const arrow = sprites?.get('spr_morearrow');
  if (arrow && rows.length > WINDOW) {
    const bob = Math.sin(title.siner / 10) * 2;
    if (first > 0) drawSpriteExt(ctx, arrow, 0, 300, top - 22 - bob, 1, -1, 0, null, 1);
    if (last < rows.length) drawSpriteExt(ctx, arrow, 0, 300, top + WINDOW * pitch - 6 + bob, 1, 1, 0, null, 1);
  }

  if (!title.pickingAttack) {
    for (let i = 0; i < TITLE_EXTRAS.length; i++) {
      const y = top + MODES.length * pitch + 16 + i * 28;
      const on = title.index === MODES.length + i;
      if (on && heart) {
        const bob = 0;
        const tw = textWidth(font, TITLE_EXTRAS[i].name);
        const hx = (W - tw) / 2 - 30 + bob;
        drawSpriteExt(ctx, heart, 0, hx, y + 4, 1, 1, 0, null, 1);
      }
      centred(ctx, font, TITLE_EXTRAS[i].name, y, on ? HILITE : DIM);
    }
  }

  ctx.restore();
}

function drawSettings(ctx, title, sprites, font) {
  const s = title.settings;
  const heart = sprites?.get('spr_heart');
  const bob = 0;
  const small = loadFont(undefined, 'fnt_main');
  const cursorAt = (x, y) => { if (heart) drawSpriteExt(ctx, heart, 0, x + bob, y + 4, 1, 1, 0, null, 1); };

  if (s.page === null) {
    centred(ctx, font, 'SETTINGS', 60, c_white, 1.4);
    for (let i = 0; i < SETTINGS_PAGES.length; i++) {
      const y = 170 + i * 40;
      const on = i === s.cursor;
      if (on) cursorAt(160, y);
      drawText(ctx, font, SETTINGS_PAGES[i].name, 190, y, { color: rgb(on ? HILITE : c_white) });
    }
    if (s.shared > 0 && small?.ready) {
      const row = SETTINGS_PAGES.findIndex((p) => p.id === 'share');
      drawText(ctx, small, 'link copied', 420, 170 + row * 40 + 6, { color: rgb(HILITE) });
    }
    centred(ctx, font, 'Z  open      X  back', 448, DIM, 0.75);
    return;
  }

  if (s.page === 'gear') {
    const g = s.gear;
    centred(ctx, font, 'GEAR', 26, c_white, 1.4);
    const NAMES = { 1: 'KRIS', 2: 'SUSIE', 3: 'RALSEI' };

    const HEADS = { 1: 'spr_headkris', 2: 'spr_headsusie', 3: 'spr_headralsei' };
    const TAB_X = { 1: 130, 2: 290, 3: 450 };
    for (const ch of [1, 2, 3]) {
      const on = ch === g.ch;
      const head = sprites?.get(HEADS[ch]);
      if (head) drawSpriteExt(ctx, head, 0, TAB_X[ch] - head.meta.w, 118 - head.meta.h * 2, 2, 2, 0, null, on ? 1 : 0.45);
      const w = textWidth(font, NAMES[ch]) * 0.8;
      drawText(ctx, font, NAMES[ch], TAB_X[ch] - w / 2, 124, {
        color: rgb(on ? HILITE : DIM), xscale: 0.8, yscale: 0.8,
      });
    }
    const pieceName = (row, id) => {
      const e = row === 0 ? WEAPONS[id] : ARMOR[id];
      return e ? e.name : '- - -';
    };
    const statLine = (st) => `AT ${st.at}   DF ${st.df}   MAG ${st.mag}`;
    const LABELS = ['WEAPON', 'ARMOR', 'ARMOR'];
    if (g.stage === 'slots') {
      for (let r = 0; r < 3; r++) {
        const y = 170 + r * 44;
        const on = r === g.row;
        if (on) cursorAt(60, y);
        drawText(ctx, font, LABELS[r], 90, y, { color: rgb(on ? HILITE : DIM) });
        const id = title.gear[g.ch][r];
        drawText(ctx, font, pieceName(r, id), 260, y, { color: rgb(on ? HILITE : (id ? c_white : DIM)) });
      }
      centred(ctx, font, statLine(statsOf(g.ch, title.gear)), 340, c_white, 0.9);
      centred(ctx, font, 'arrows  move      Z  change      X  back', 448, DIM, 0.75);
      return;
    }
    const list = gearChoices(title, g.ch, g.row);
    centred(ctx, font, LABELS[g.row], 148, DIM, 0.9);
    const WIN = 7;
    const first = Math.min(Math.max(0, g.pick - Math.floor(WIN / 2)), Math.max(0, list.length - WIN));
    for (let r = 0; r < WIN && first + r < list.length; r++) {
      const idx = first + r;
      const y = 180 + r * 32;
      const on = idx === g.pick;
      if (on) cursorAt(130, y);
      drawText(ctx, font, pieceName(g.row, list[idx]), 160, y, { color: rgb(on ? HILITE : c_white) });
    }
    const e = g.row === 0 ? WEAPONS[list[g.pick]] : ARMOR[list[g.pick]];
    if (e && small?.ready) {
      [['AT', e.at], ['DF', e.df], ['MAG', e.mag]].forEach(([k, v], i) => {
        drawText(ctx, small, `${k} ${v >= 0 ? '+' : ''}${v}`, 440, 180 + i * 24, { color: rgb(DIM) });
      });
    }
    const trial = cloneGear(title.gear);
    trial[g.ch][g.row] = list[g.pick];
    centred(ctx, font, statLine(statsOf(g.ch, trial)), 410, c_white, 0.8);
    centred(ctx, font, 'arrows  move      Z  set      X  back', 448, DIM, 0.75);
    return;
  }

  if (s.page === 'items') {
    const it = s.items;
    centred(ctx, font, 'ITEMS', 60, c_white, 1.4);
    const describe = (id, x, y) => {
      if (!small?.ready) return;
      const item = ITEMS[id];
      const lines = item ? item.desc.split('#') : ['empty slot'];
      lines.forEach((line, i) => drawText(ctx, small, line, x, y + i * 20, { color: rgb(DIM) }));
    };
    if (it.stage === 'slots') {
      const COL = [60, 340];
      for (let i = 0; i < INVENTORY_SIZE; i++) {
        const x = COL[i % 2];
        const y = 130 + Math.floor(i / 2) * 32;
        const on = i === it.slot;
        const item = ITEMS[title.bag[i] ?? 0];
        if (on) cursorAt(x - 30, y);
        drawText(ctx, font, item ? item.name : '- - -', x, y, { color: rgb(on ? HILITE : (item ? c_white : DIM)) });
      }
      describe(title.bag[it.slot] ?? 0, 60, 340);
      centred(ctx, font, 'arrows  move      Z  change      X  back', 448, DIM, 0.75);
      return;
    }
    centred(ctx, font, `SLOT ${it.slot + 1}`, 104, DIM, 0.9);
    const WIN = 9;
    const first = Math.min(Math.max(0, it.pick - Math.floor(WIN / 2)), Math.max(0, ITEM_PICKER.length - WIN));
    for (let r = 0; r < WIN && first + r < ITEM_PICKER.length; r++) {
      const idx = first + r;
      const entry = ITEMS[ITEM_PICKER[idx]];
      const y = 140 + r * 32;
      const on = idx === it.pick;
      if (on) cursorAt(130, y);
      drawText(ctx, font, entry ? entry.name : '- - -', 160, y, { color: rgb(on ? HILITE : c_white) });
    }
    describe(ITEM_PICKER[it.pick], 420, 140);
    const arrow = sprites?.get('spr_morearrow');
    if (arrow) {
      const abob = Math.sin(title.siner / 10) * 2;
      if (first > 0) drawSpriteExt(ctx, arrow, 0, 560, 150 - abob, 1, -1, 0, null, 1);
      if (first + WIN < ITEM_PICKER.length) drawSpriteExt(ctx, arrow, 0, 560, 140 + WIN * 32 - 8 + abob, 1, 1, 0, null, 1);
    }
    centred(ctx, font, 'arrows  move      Z  set      X  back', 448, DIM, 0.75);
    return;
  }

  if (s.page === 'credits') {
    centred(ctx, font, 'CREDITS', 60, c_white, 1.4);
    const PITCH = 78;
    for (let i = 0; i < CREDITS.length; i++) {
      const y = 150 + i * PITCH;
      const on = i === s.cursor;
      const row = CREDITS[i];
      const nameY = row.who ? y + 22 : y + 11;
      if (on) cursorAt(90, nameY);
      if (row.who && small?.ready) drawText(ctx, small, row.role, 120, y, { color: rgb(on ? HILITE : DIM) });
      drawText(ctx, font, row.who || row.role, 120, nameY, { color: rgb(on ? HILITE : c_white) });
      if (row.link && small?.ready) {
        drawText(ctx, small, on ? `Z    ${row.link}` : row.link, 120, nameY + 30, { color: rgb(on ? HILITE : DIM) });
      }
    }
    centred(ctx, font, 'arrows  move      X  back', 448, DIM, 0.75);
    return;
  }

  if (s.page === 'graphics' || s.page === 'controls') {
    centred(ctx, font, s.page === 'graphics' ? 'GRAPHICS' : 'CONTROLS', 60, c_white, 1.4);
    const rows = s.page === 'graphics' ? graphicsRows(title) : controlRows(title);
    for (let i = 0; i < rows.length; i++) {
      const y = 190 + i * 60;
      const on = i === s.cursor;
      if (on) cursorAt(110, y);
      drawText(ctx, font, rows[i].name, 140, y, { color: rgb(on ? HILITE : c_white) });
      drawText(ctx, font, rows[i].value, 420, y, { color: rgb(on ? HILITE : c_white) });
    }
    centred(ctx, font, 'arrows  toggle      X  back', 448, DIM, 0.75);
    return;
  }

  if (s.page === 'audio') {
    centred(ctx, font, 'MUSIC / SFX', 60, c_white, 1.4);
    const rows = [
      { name: 'MUSIC', value: title.volumes.music },
      { name: 'SFX', value: title.volumes.sfx },
    ];
    for (let i = 0; i < rows.length; i++) {
      const y = 190 + i * 60;
      const on = i === s.cursor;
      if (on) cursorAt(110, y);
      drawText(ctx, font, rows[i].name, 140, y, { color: rgb(on ? HILITE : c_white) });
      ctx.fillStyle = 'rgb(64,64,72)';
      ctx.fillRect(280, y + 4, 200, 14);
      ctx.fillStyle = on ? 'rgb(255,255,0)' : 'rgb(255,255,255)';
      ctx.fillRect(280, y + 4, rows[i].value * 2, 14);
      drawText(ctx, font, String(rows[i].value), 500, y, { color: rgb(on ? HILITE : c_white) });
    }
    centred(ctx, font, 'arrows  adjust      X  back', 448, DIM, 0.75);
  }
}

const FAILURE_AT = 150;
const RATE = 2;
const PAUSE_FRAMES = { 5: 30, 6: 40 };
const LINE_GAP = 30;
const ROOM = 2;

const LINES = {
  end: { x: 70, rows: [' IT APPEARS YOU', ' HAVE REACHED', ' ', '    AN END.'], pauses: { 28: 6 } },
  again: { x: 40, rows: [' WILL YOU TRY AGAIN?'], pauses: {} },
  yes: { x: 50, rows: [' THEN, THE FUTURE', ' IS IN YOUR HANDS.'], pauses: {} },
  no: { x: 60, rows: [' THEN THE WORLD ', ' WAS COVERED ', ' IN DARKNESS.'], pauses: { 15: 5, 28: 5 } },
};
const CHOICES = [{ name: 'YES', x: 110, y: 180 }, { name: 'NO', x: 190, y: 180 }];

function lineFrames(line, upto = Infinity) {
  const chars = line.rows.join('').length;
  let frames = 0;
  for (let i = 0; i < chars; i++) {
    if (frames > upto) return { shown: i, done: false };
    frames += RATE;
    if (line.pauses[i + 1]) frames += PAUSE_FRAMES[line.pauses[i + 1]];
  }
  return { shown: chars, done: frames <= upto, frames };
}

function revealRows(rows, shown) {
  let left = shown;
  return rows.map((r) => {
    if (left <= 0) return '';
    const out = r.slice(0, left);
    left -= r.length;
    return out;
  });
}

export function makeGameOver(shot, heartX, heartY) {
  return {
    t: 0, shot, x: heartX, y: heartY, broken: false, shards: [],
    fade: 0,
    stage: 'end', lineT: 0, gap: 0,
    choiceT: -1, cur: -1, heartX: 150, heartY: 180,
    whiteT: -1,
    held: { confirm: true, cancel: true, focus: true, left: true, right: true },
  };
}

export function stepGameOver(over, keys = {}) {
  const out = { cues: [] };
  const edge = (k) => { const d = !!keys[k]; const e = d && !over.held[k]; over.held[k] = d; return e; };
  over.t += 1;
  const t = over.t;
  if (t === 50) { out.cues.push({ name: 'snd_break1' }); over.broken = true; over.x -= 2; }
  if (t === 90) {
    out.cues.push({ name: 'snd_break2' });
    over.broken = 'gone';
    const offs = [[-2, 0], [0, 3], [2, 6], [8, 0], [10, 3], [12, 6]];
    over.shards = offs.map(([dx, dy]) => {
      const d = Math.random() * 2 * Math.PI;
      return { x: over.x + dx, y: over.y + dy, hs: Math.cos(d) * 7, vs: -Math.sin(d) * 7, idx: 0 };
    });
  }
  for (const s of over.shards) { s.vs += 0.2; s.x += s.hs; s.y += s.vs; s.idx += 0.2; }
  if (t >= 140 && t < FAILURE_AT) over.fade = Math.min(1, over.fade + 0.1);
  if (t === FAILURE_AT) out.cues.push({ name: 'audio_drone', loop: true });
  if (t < FAILURE_AT + 2) return out;

  const skip = !!(keys.cancel || keys.focus);
  const line = LINES[over.stage];

  if (over.whiteT >= 0) {
    over.whiteT += 1;
    if (over.stage === 'yes' && over.whiteT >= 120) out.retry = true;
    if (over.stage === 'no' && over.whiteT >= 60) out.quit = true;
    edge('confirm');
    return out;
  }

  if (over.choiceT < 0) {
    over.lineT += skip && over.stage !== 'yes' && over.stage !== 'no' ? 3 : 1;
    const { done } = lineFrames(line, over.lineT);
    const confirmEdge = edge('confirm');
    if (!done) return out;
    over.gap += 1;
    if (over.gap < LINE_GAP && !confirmEdge) return out;
    over.gap = 0;
    if (over.stage === 'end') { over.stage = 'again'; over.lineT = 0; return out; }
    if (over.stage === 'again') { over.choiceT = 0; return out; }

    over.whiteT = 0;
    if (over.stage === 'no') out.cues.push({ name: 'audio_drone', stop: true });
    return out;
  }

  over.choiceT += 1;
  let moved = false;
  if (edge('left')) { over.cur = over.cur < 0 ? 0 : (over.cur + 1) % 2; moved = true; }
  if (edge('right')) { over.cur = over.cur < 0 ? 1 : (over.cur + 1) % 2; moved = true; }
  if (moved) out.cues.push({ name: 'snd_menumove' });

  const font = loadFont(undefined, 'fnt_main');
  const idealX = over.cur < 0 ? 150 : CHOICES[over.cur].x + textWidth(font, CHOICES[over.cur].name) / 2 - 10;
  if (Math.abs(over.heartX - idealX) <= 2) over.heartX = idealX;
  over.heartX += (idealX - over.heartX) * 0.3;
  if (edge('confirm') && over.cur >= 0 && over.choiceT > 10) {
    out.cues.push({ name: 'snd_select' });
    over.stage = over.cur === 0 ? 'yes' : 'no';
    if (over.stage === 'yes') out.cues.push({ name: 'audio_drone', stop: true });
    over.choiceT = -1;
    over.lineT = 0;
  }
  return out;
}

export function drawGameOver(ctx, over, sprites) {
  const font = loadFont(undefined, 'fnt_main');
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  if (over.t < 30 && over.shot) {
    ctx.drawImage(over.shot, 0, 0);
  } else {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  }

  if (over.t < FAILURE_AT) {
    if (over.t >= 30 && !over.broken) drawSpriteExt(ctx, sprites?.get('spr_heart'), 0, over.x, over.y, 1, 1, 0, null, 1);
    if (over.broken === true) drawSpriteExt(ctx, sprites?.get('spr_heartbreak'), 0, over.x, over.y, 1, 1, 0, null, 1);
    const shard = sprites?.get('spr_heartshards');
    for (const s of over.shards) drawSpriteExt(ctx, shard, Math.floor(s.idx), s.x, s.y, 1, 1, 0, null, 1);
    if (over.fade > 0) {
      ctx.globalAlpha = over.fade;
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      ctx.globalAlpha = 1;
    }
    ctx.restore();
    return;
  }

  if (font?.ready) {
    const line = LINES[over.stage];
    if (over.choiceT < 0 || over.stage === 'again') {
      const { shown } = lineFrames(line, over.lineT);
      revealRows(line.rows, shown).forEach((s, i) => {
        drawText(ctx, font, s, line.x * ROOM, 80 * ROOM + i * 20 * ROOM, {
          color: rgb(c_white), advance: 12, xscale: ROOM, yscale: ROOM, special: 2, siner: over.t,
        });
      });
    }
    if (over.choiceT >= 0) {
      const xfade = Math.min(1, over.choiceT / 10);
      const heart = sprites?.get('spr_heart');

      if (heart) drawSpriteExt(ctx, heart, 0, (over.heartX + 2) * ROOM, (over.heartY + 2) * ROOM, ROOM, ROOM, 0, null, 0.6 * xfade);
      CHOICES.forEach((c, i) => {
        drawText(ctx, font, c.name, c.x * ROOM, c.y * ROOM, {
          color: rgb(over.cur === i ? HILITE : c_white), xscale: ROOM, yscale: ROOM, alpha: xfade,
        });
      });
    }
  }

  if (over.whiteT >= 0) {
    ctx.globalAlpha = over.stage === 'yes' ? Math.min(1, over.whiteT * 0.01) : Math.min(1, over.whiteT / 60);
    ctx.fillStyle = over.stage === 'yes' ? '#fff' : '#000';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}

export { textHeight };
